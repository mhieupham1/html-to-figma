import type { Source } from '../shared/protocol';

export type PreviewConfig = { session: string; parentOrigin: string };
export function buildDocument(source: Source, config: PreviewConfig, bootstrapSource: string) {
  const doc = new DOMParser().parseFromString(source.html, 'text/html');
  const urls: string[] = [];
  const objectUrl = (text: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    urls.push(url);
    return url;
  };
  const bridge = doc.createElement('script');
  bridge.dataset.h2fBridge = '';
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  bridge.textContent = `(${bootstrapSource})(${json});`;
  doc.head.prepend(bridge);
  if (source.css) {
    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.href = objectUrl(source.css, 'text/css');
    doc.head.append(style);
  }
  if (source.js) {
    const script = doc.createElement('script');
    script.src = objectUrl(source.js, 'text/javascript');
    doc.body.append(script);
  }
  return { html: `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`, dispose: () => urls.forEach(url => URL.revokeObjectURL(url)) };
}
