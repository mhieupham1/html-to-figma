import type { PreviewMessage } from '../shared/protocol';

type CaptureCommand = { type: 'capture'; requestId: string } | { type: 'capture-result'; requestId: string; ok: boolean; message?: string };
export type CaptureTransaction = ReturnType<typeof startClipboardCapture>;

function writeClipboard(html: Promise<Blob>): Promise<void> {
  if (!window.isSecureContext || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Copy needs Chrome or Edge on localhost or HTTPS.');
  }
  // Start during the click, before capture/network awaits consume user activation.
  return navigator.clipboard.write([new ClipboardItem({ 'text/html': html })]);
}

export function startClipboardCapture(send: (command: CaptureCommand) => void, options: {
  writeHtml?: (html: Promise<Blob>) => Promise<void>; timeoutMs?: number;
} = {}) {
  const requestId = crypto.randomUUID();
  let resolveBlob!: (blob: Blob) => void;
  let rejectBlob!: (error: Error) => void;
  let rejectDone!: (error: Error) => void;
  let resolveDone!: () => void;
  let settled = false;
  let received = false;
  const payload = new Promise<Blob>((resolve, reject) => { resolveBlob = resolve; rejectBlob = reject; });
  // A denied native write may never consume the deferred Blob.
  void payload.catch(() => {});
  const done = new Promise<void>((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
  const fail = (error: Error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    rejectBlob(error);
    send({ type: 'capture-result', requestId, ok: false, message: error.message });
    rejectDone(error);
  };
  const timer = setTimeout(() => fail(new Error('Capture timed out. Click Run to reset the preview, then try again.')), options.timeoutMs ?? 35000);
  try {
    const write = (options.writeHtml ?? writeClipboard)(payload);
    void Promise.all([write, payload]).then(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      send({ type: 'capture-result', requestId, ok: true });
      resolveDone();
    }).catch(error => fail(new Error(error?.name === 'NotAllowedError'
      ? 'Clipboard access was blocked. Allow clipboard access for this site, keep this tab focused, and try again.'
      : error instanceof Error ? error.message : 'Could not write to the clipboard.')));
    send({ type: 'capture', requestId });
  } catch (error) {
    fail(error instanceof Error ? error : new Error('Clipboard is unavailable.'));
  }
  return {
    requestId, done,
    receive(message: PreviewMessage) {
      if (settled || !('requestId' in message) || message.requestId !== requestId) return;
      if (message.type === 'capture-error') fail(new Error(message.message));
      if (message.type === 'payload' && !received) {
        if (!message.html.includes('<!--(figh2d)')) { fail(new Error('Capture did not return a Figma design. Try again.')); return; }
        received = true;
        resolveBlob(new Blob([message.html], { type: 'text/html' }));
      }
    },
    cancel: () => fail(new Error('Capture cancelled.')),
  };
}
