import { afterEach, expect, test, vi } from 'vitest';
import { startClipboardCapture } from '../../src/editor/capture';
import type { PreviewMessage } from '../../src/shared/protocol';

const html = '<span data-h2d="<!--(figh2d)ZXhhbXBsZQ==(/figh2d)-->"></span>';
const payload = (requestId: string, content = html) => ({channel:'html-to-figma',session:'x',type:'payload',requestId,html:content}) as PreviewMessage;
afterEach(() => vi.useRealTimers());

test('writes captured HTML and reports success only after clipboard completes', async () => {
  let finishWrite!: () => void;
  let written: Blob | undefined;
  const replies: unknown[] = [];
  const tx = startClipboardCapture(command => replies.push(command), {
    writeHtml: async blob => { written = await blob; await new Promise<void>(resolve => { finishWrite = resolve; }); },
  });
  let completed = false;
  void tx.done.then(() => { completed = true; });
  tx.receive(payload('old'));
  expect(written).toBeUndefined();
  tx.receive(payload(tx.requestId));
  await Promise.resolve();
  expect(written?.type).toBe('text/html');
  expect(written?.size).toBe(html.length);
  expect(completed).toBe(false);
  tx.receive(payload(tx.requestId, 'duplicate'));
  finishWrite();
  await tx.done;
  expect(completed).toBe(true);
  expect(replies).toContainEqual({type:'capture-result',requestId:tx.requestId,ok:true});
});

test('clipboard denial is reported and preview is released', async () => {
  const replies: unknown[] = [];
  const tx = startClipboardCapture(command => replies.push(command), {
    writeHtml: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); },
  });
  await expect(tx.done).rejects.toThrow(/clipboard/i);
  expect(replies).toContainEqual(expect.objectContaining({type:'capture-result',ok:false}));
});

test('capture timeout settles the transaction without false success', async () => {
  vi.useFakeTimers();
  const tx = startClipboardCapture(() => {}, { timeoutMs:100, writeHtml: async blob => { await blob; } });
  const assertion = expect(tx.done).rejects.toThrow(/timed out/i);
  await vi.advanceTimersByTimeAsync(101);
  await assertion;
});

test('rejects non-Figma HTML and cancelled captures', async () => {
  const tx = startClipboardCapture(() => {}, {writeHtml:async blob => {await blob;}});
  tx.receive(payload(tx.requestId, '<p>not a design</p>'));
  await expect(tx.done).rejects.toThrow(/Figma/i);
  const cancelled = startClipboardCapture(() => {}, {writeHtml:async blob => {await blob;}});
  cancelled.cancel();
  await expect(cancelled.done).rejects.toThrow(/cancelled/i);
});
