export type Source = { html: string; css: string; js: string };
export type PreviewMessage = { channel: 'html-to-figma'; session: string } & (
  | { type: 'boot' | 'ready' }
  | { type: 'diagnostic'; message: string }
  | { type: 'progress'; requestId: string; message: string }
  | { type: 'payload'; requestId: string; html: string }
  | { type: 'capture-error'; requestId: string; message: string }
);
export type PreviewCommand = { channel: 'html-to-figma'; session: string } & (
  | { type: 'init'; source: Source }
  | { type: 'capture'; requestId: string }
  | { type: 'capture-result'; requestId: string; ok: boolean; message?: string }
);
export function isSource(value: unknown): value is Source {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return ['html', 'css', 'js'].every(key => typeof s[key] === 'string');
}
export function acceptPreviewMessage(event: MessageEvent, context: {
  source: Window | null; origin: string; session: string;
}): PreviewMessage | null {
  if (!context.source || event.source !== context.source || event.origin !== context.origin) return null;
  const value = event.data;
  if (!value || typeof value !== 'object' || value.channel !== 'html-to-figma' || value.session !== context.session) return null;
  if (value.type === 'boot' || value.type === 'ready') return value;
  if (value.type === 'diagnostic' && typeof value.message === 'string' && value.message.length < 10000) return value;
  if (typeof value.requestId !== 'string') return null;
  if (value.type === 'payload' && typeof value.html === 'string' && value.html.length <= 32 * 1024 * 1024) return value;
  if (['progress', 'capture-error'].includes(value.type) && typeof value.message === 'string') return value;
  return null;
}
export function resolvePreviewOrigin(editorOrigin: string, configured?: string): string {
  const editor = new URL(editorOrigin);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(editor.hostname);
  if (!configured && !local) throw new Error('Set VITE_PREVIEW_ORIGIN to a separate HTTPS origin to enable the preview.');
  const preview = new URL(configured || `${editor.protocol}//${editor.hostname}:5174`);
  if (preview.origin === editor.origin) throw new Error('Preview must use a separate origin from the editor.');
  if (!['http:', 'https:'].includes(preview.protocol) || (editor.protocol === 'https:' && preview.protocol !== 'https:')) {
    throw new Error('Preview must use HTTPS when the editor uses HTTPS.');
  }
  return preview.origin;
}
