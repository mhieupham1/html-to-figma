import { buildDocument } from './document';
import { previewBootstrap } from './bootstrap';
import { prepareCapture } from './prepareCapture';
import { isSource } from '../shared/protocol';

const params = new URLSearchParams(location.hash.slice(1));
const session = params.get('session');
const parentOrigin = params.get('parent');
if (session && parentOrigin && parentOrigin !== location.origin && window.parent !== window) {
  const boot = () => parent.postMessage({channel:'html-to-figma',session,type:'boot'}, parentOrigin);
  const timer = setInterval(boot, 300);
  const initialize = (event: MessageEvent) => {
    if (event.source !== parent || event.origin !== parentOrigin) return;
    const data = event.data;
    if (!data || data.channel !== 'html-to-figma' || data.session !== session || data.type !== 'init' || !isSource(data.source)) return;
    clearInterval(timer);
    window.removeEventListener('message', initialize);
    const bootstrap = `(config) => (${previewBootstrap.toString()})(config, ${prepareCapture.toString()})`;
    const built = buildDocument(data.source, {session,parentOrigin}, bootstrap);
    document.open();
    document.write(built.html);
    document.close();
    window.addEventListener('pagehide', built.dispose, {once:true});
  };
  window.addEventListener('message', initialize);
  boot();
} else document.body.textContent = 'Open the editor to use this isolated preview.';
