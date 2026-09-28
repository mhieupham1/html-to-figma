import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { acceptPreviewMessage, resolvePreviewOrigin, type Source } from '../shared/protocol';
import { startClipboardCapture, type CaptureTransaction } from './capture';

export type PreviewStatus = {kind:'loading'|'ready'|'copying'|'copied'|'error';message:string};
export type PreviewHandle = {copy: () => void};
export const Preview = forwardRef<PreviewHandle, {source:Source; revision:number; width:number; onStatus:(s:PreviewStatus)=>void; onDiagnostic:(message:string)=>void}>(function Preview({source, revision, width, onStatus, onDiagnostic}, ref) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const transaction = useRef<CaptureTransaction | null>(null);
  const ready = useRef(false);
  const callbacks = useRef({onStatus,onDiagnostic});
  callbacks.current = {onStatus,onDiagnostic};
  const [availableWidth, setAvailableWidth] = useState(900);
  const container = useRef<HTMLDivElement>(null);
  const origin = useMemo(() => {
    try { return {value:resolvePreviewOrigin(location.origin,import.meta.env.VITE_PREVIEW_ORIGIN),error:''}; }
    catch(error) { return {value:'',error:error instanceof Error?error.message:'Preview configuration is invalid.'}; }
  }, []);
  const session = useMemo(() => { void revision; return crypto.randomUUID(); }, [revision]);
  const send = (data: Record<string,unknown>) => iframe.current?.contentWindow?.postMessage({channel:'html-to-figma',session,...data},origin.value);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setAvailableWidth(Math.max(240, entries[0].contentRect.width - 64)));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    ready.current = false;
    callbacks.current.onStatus({kind:origin.error?'error':'loading',message:origin.error || 'Loading preview…'});
    if (origin.error) return;
    let initialized = false;
    let active = true;
    const timeout = setTimeout(() => {
      if (!ready.current && active) callbacks.current.onStatus({kind:'error',message:'Preview did not load. Check your code or external scripts, then Run again.'});
    }, 20000);
    const handler = (event:MessageEvent) => {
      const message = acceptPreviewMessage(event,{source:iframe.current?.contentWindow ?? null,origin:origin.value,session});
      if (!message) return;
      if (message.type === 'boot' && !initialized) { initialized = true; send({type:'init',source}); }
      if (message.type === 'ready') {
        ready.current = true;
        clearTimeout(timeout);
        callbacks.current.onStatus({kind:'ready',message:'Preview is up to date'});
      }
      if (message.type === 'diagnostic') callbacks.current.onDiagnostic(message.message);
      if (message.type === 'progress' && message.requestId === transaction.current?.requestId) callbacks.current.onStatus({kind:'copying',message:message.message});
      transaction.current?.receive(message);
    };
    window.addEventListener('message',handler);
    return () => {
      active = false;
      ready.current = false;
      clearTimeout(timeout);
      window.removeEventListener('message',handler);
      transaction.current?.cancel();
      transaction.current = null;
    };
    // Source changes are applied only through an explicit revision (Run).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session,origin]);
  useImperativeHandle(ref, () => ({copy() {
    if (!ready.current || transaction.current || origin.error) return;
    iframe.current?.contentWindow?.focus();
    callbacks.current.onStatus({kind:'copying',message:'Preparing your design…'});
    const tx = startClipboardCapture(send);
    transaction.current = tx;
    void tx.done.then(() => {
      if (transaction.current === tx) callbacks.current.onStatus({kind:'copied',message:'Copied! Paste into Figma with ⌘V or Ctrl+V.'});
    }).catch(error => {
      if (transaction.current === tx) callbacks.current.onStatus({kind:'error',message:error.message});
    }).finally(() => { if (transaction.current === tx) transaction.current = null; });
  }}));
  const scale = Math.min(1,availableWidth/width);
  return <div className="preview-stage" ref={container}>
    {origin.error ? <div className="preview-config-error">{origin.error}</div> : <div className="preview-position" style={{width:width*scale,height:760*scale}}>
      <div className="preview-paper" style={{width,height:760,transform:`scale(${scale})`,transformOrigin:'top left'}}>
        <iframe key={session} ref={iframe} title="Live preview" style={{width:'100%',height:'100%',border:0,display:'block'}} sandbox="allow-scripts allow-same-origin" allow="clipboard-write 'none'; clipboard-read 'none'" referrerPolicy="no-referrer"
          src={`${origin.value}/preview.html#${new URLSearchParams({session,parent:location.origin})}`} />
      </div>
      <span className="canvas-dimensions">{width} × 760 <span>·</span> {Math.round(scale*100)}%</span>
    </div>}
  </div>;
});
