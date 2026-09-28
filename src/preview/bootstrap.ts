import type { PreviewConfig } from './document';
import type { prepareCapture as PrepareCapture } from './prepareCapture';

// Serialized into the preview document. Keep every runtime dependency inside
// this function; imports or outer-scope variables will not survive serialization.
export function previewBootstrap(config: PreviewConfig, prepareCapture:typeof PrepareCapture = ()=>({restore:()=>{},warnings:[]})) {
  const channel = 'html-to-figma';
  const host = window.parent;
  const notify = (data: Record<string, unknown>) => host.postMessage({ channel, session: config.session, ...data }, config.parentOrigin);
  const describe = (error: unknown) => error instanceof Error ? error.message : String(error);
  let pending: { requestId: string; resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | undefined;
  let current: string | undefined;
  let runtimeStarted = false;
  let invalidated = false;
  let intercepted = false;
  let runtime: Promise<void> | undefined;
  let preparation: {requestId:string;restore:()=>void} | undefined;
  const restore = (requestId:string) => {
    if(preparation?.requestId!==requestId) return;
    const previous=preparation;preparation=undefined;previous.restore();
  };
  const reportError = (requestId: string, error: unknown) => {
    if (current !== requestId) return;
    restore(requestId);
    notify({type:'capture-error',requestId,message:describe(error)});
    if (pending?.requestId === requestId) {
      const p = pending;
      pending = undefined;
      clearTimeout(p.timer);
      p.reject(new Error(describe(error)));
    }
    current = undefined;
    runtimeStarted = false;
  };
  const loadRuntime = () => {
    if (runtime) return runtime;
    runtime = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://mcp.figma.com/mcp/html-to-design/capture.js';
      const timer = setTimeout(() => { script.remove(); reject(new Error('Figma capture could not load. Check your internet connection and try again.')); }, 12000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Figma capture could not load. Check your internet connection and try again.')); };
      document.head.append(script);
    }).catch(error => { runtime = undefined; throw error; });
    return runtime;
  };
  async function waitForAssets() {
    const images = Array.from(document.images);
    images.forEach(img => { img.loading = 'eager'; });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const waits = [document.fonts.ready, ...images.map(img => img.decode().catch(() => {}))];
    const ready = await Promise.race([
      Promise.all(waits).then(() => true),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), 5000); }),
    ]);
    clearTimeout(timer);
    if (!ready || images.some(img => !img.complete || img.naturalWidth === 0) || Array.from(document.fonts).some(font=>font.status==='error')) {
      notify({type:'diagnostic',message:'Some images or fonts failed to load or are not ready. The copied design may use fallback fonts or be incomplete.'});
    }
  }
  async function capture(requestId: string) {
    if (invalidated) { notify({type:'capture-error',requestId,message:'The previous capture was interrupted. Click Run to reset the preview, then copy again.'}); return; }
    if (current) { notify({type:'capture-error',requestId,message:'A capture is already in progress.'}); return; }
    current = requestId;
    try {
      notify({type:'progress',requestId,message:'Preparing your design…'});
      await Promise.all([loadRuntime(), waitForAssets()]);
      if (current !== requestId) return;
      const figma = (window as Window & {figma?: { captureForDesign: (options: {selector: string}) => Promise<{success: boolean; error?: string}> }}).figma;
      if (!figma?.captureForDesign || !navigator.clipboard) throw new Error('Figma capture is unavailable in this browser. Use Chrome or Edge.');
      if (!intercepted) Object.defineProperty(navigator.clipboard, 'write', { configurable:true, value: async (items: ClipboardItem[]) => {
        const writingRequest = current;
        if (!writingRequest || invalidated || pending) throw new Error('No active capture request.');
        const item = items.find(item => item.types.includes('text/html'));
        if (!item) throw new Error('Figma capture did not provide HTML clipboard data.');
        const html = await (await item.getType('text/html')).text();
        restore(writingRequest);
        if (html.length > 32 * 1024 * 1024) throw new Error('This design is too large to copy. Try a smaller document.');
        if (current !== writingRequest || invalidated) throw new Error('Capture cancelled.');
        return new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reportError(writingRequest, new Error('Clipboard confirmation timed out.')), 30000);
          pending = {requestId:writingRequest,resolve,reject,timer};
          notify({type:'payload',requestId:writingRequest,html});
        });
      }});
      intercepted = true;
      // The app owns capture requests; suppress the runtime's separate recapture UI.
      if (!document.getElementById('h2f-capture-ui-style')) {
        const style = document.createElement('style');
        style.id = 'h2f-capture-ui-style';
        style.textContent = '#__figma_capture_toolbar_host__ { display: none !important; }';
        document.head.append(style);
      }
      notify({type:'progress',requestId,message:'Copying to Figma…'});
      // Figma waits for the document to have focus before producing its write.
      window.focus();
      const prepared = prepareCapture();
      preparation = {requestId,restore:prepared.restore};
      for(const message of prepared.warnings) notify({type:'diagnostic',message});
      runtimeStarted = true;
      void figma.captureForDesign({selector:'body'}).then(result => {
        if (!result.success) reportError(requestId, new Error(result.error || 'Figma capture failed.'));
      }).catch(error => reportError(requestId,error));
    } catch (error) { reportError(requestId,error); }
  }
  window.addEventListener('message', event => {
    if (event.source !== host || event.origin !== config.parentOrigin) return;
    const data = event.data;
    if (!data || data.channel !== channel || data.session !== config.session || typeof data.requestId !== 'string') return;
    if (data.type === 'capture') void capture(data.requestId);
    if (data.type === 'capture-result' && data.requestId === current) {
      restore(data.requestId);
      const p = pending;
      // No runtime cancellation API: unfinished old work must not feed a retry.
      if (runtimeStarted && !p && data.ok !== true) invalidated = true;
      pending = undefined;
      current = undefined;
      runtimeStarted = false;
      if (p) {
        clearTimeout(p.timer);
        if (data.ok === true) p.resolve();
        else p.reject(new Error(data.message || 'Capture cancelled.'));
      }
    }
  });
  window.addEventListener('error', event => {
    if (event.message) notify({type:'diagnostic',message:event.message.slice(0,2000)});
  });
  window.addEventListener('unhandledrejection', event => notify({type:'diagnostic',message:describe(event.reason).slice(0,2000)}));
  window.addEventListener('DOMContentLoaded', () => notify({type:'ready'}), {once:true});
}
