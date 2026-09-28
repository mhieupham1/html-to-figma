import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Code2, Copy, Figma, FileCode2, Hash, Layers, LoaderCircle, Monitor, Play, RotateCcw, Smartphone, Sparkles, Tablet, X } from 'lucide-react';
import { Preview, type PreviewHandle, type PreviewStatus } from './editor/Preview';
import { CodeEditor } from './editor/CodeEditor';
import { loadDraft, saveDraft } from './editor/storage';
import { examples, starter } from './examples';
import type { Source } from './shared/protocol';
import './styles.css';

export default function App() {
  const [source,setSource] = useState<Source>(() => loadDraft() ?? starter);
  const [running,setRunning] = useState<Source>(starter);
  const [revision,setRevision] = useState(0);
  const [language,setLanguage] = useState<keyof Source>('html');
  const [selectedExample,setSelectedExample] = useState('studio');
  const [width,setWidth] = useState(1024);
  const [widthInput,setWidthInput] = useState('1024');
  const [saved,setSaved] = useState('Draft saved');
  const [help,setHelp] = useState(false);
  const [diagnostics,setDiagnostics] = useState<string[]>([]);
  const [status,setStatus] = useState<PreviewStatus>({kind:'loading',message:'Loading preview…'});
  const preview = useRef<PreviewHandle>(null);
  const helpButton = useRef<HTMLButtonElement>(null);
  const closeHelp = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dirty = source.html!==running.html || source.css!==running.css || source.js!==running.js;
  const copying = status.kind==='copying';
  useEffect(() => {
    setSaved('Saving…');
    const timer = setTimeout(() => setSaved(saveDraft(source)?'Draft saved':'Draft could not be saved'),400);
    return () => clearTimeout(timer);
  }, [source]);
  const run = useCallback(() => {
    if (copying) return;
    setDiagnostics([]); setRunning({...source}); setRevision(n=>n+1);
  }, [source,copying]);
  useEffect(() => {
    const shortcut = (event:KeyboardEvent) => {
      if ((event.metaKey||event.ctrlKey) && event.key==='Enter') {event.preventDefault();run();}
    };
    window.addEventListener('keydown',shortcut);
    return () => window.removeEventListener('keydown',shortcut);
  }, [run]);
  useEffect(() => {
    if (help) {dialog.current?.showModal();closeHelp.current?.focus();}
    else if (dialog.current?.open) {dialog.current.close();helpButton.current?.focus();}
  }, [help]);
  const changeWidth = (value:number) => {const next=Math.min(1920,Math.max(320,Math.round(value)));setWidth(next);setWidthInput(String(next));};
  const onDiagnostic = useCallback((message:string) => setDiagnostics(old => old.includes(message)?old:[...old.slice(-4),message]),[]);
  const reset = () => setSource({...examples.find(example=>example.id===selectedExample)!.source});
  const copyDisabled = dirty || copying || status.kind==='loading';
  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href="/" aria-label="HTML to Figma home"><span className="brand-mark"><Code2 size={20}/></span><span>html<span className="brand-to">to</span>figma<span className="brand-dot">.</span></span></a>
      <span className="header-divider"/><span className="workspace-label">PLAYGROUND <span>beta</span></span>
      <div className="header-right"><span className="local-badge"><i/>Drafts saved in your browser</span><button className="help-button" ref={helpButton} onClick={()=>setHelp(true)}><CircleHelp size={15}/><span>How it works</span></button></div>
    </header>
    <main className="workspace">
      <div className="workspace-heading"><div><div className="eyebrow"><span/>LESS REBUILDING. MORE CREATING.</div><h1>From code to <span>canvas.</span></h1><p>Turn your HTML, CSS & JavaScript into editable Figma layers.</p></div><div className="flow-hint"><span><Code2 size={17}/></span><ArrowRight size={15}/><span><Figma size={17}/></span></div></div>
      <div className="workbench">
        <section className="editor-panel" aria-label="Code editor">
          <div className="panel-heading"><div className="panel-title"><Code2 size={16}/><h2>Source code</h2></div><div className="editor-actions"><button className="icon-button" title="Reset to selected example" aria-label="Reset to selected example" onClick={reset} disabled={copying}><RotateCcw size={14}/></button><button className="run-button" aria-label="Run code" onClick={run} disabled={copying}><Play size={12} fill="currentColor"/>Run<kbd>⌘ ↵</kbd></button></div></div>
          <div className="example-picker"><Sparkles size={13}/><select aria-label="Example" value={selectedExample} disabled={copying} onChange={event=>{const selected=examples.find(example=>example.id===event.target.value)!;setSelectedExample(selected.id);setSource({...selected.source});}}>{examples.map(example=><option key={example.id} value={example.id}>{example.name}</option>)}</select><ChevronDown size={13}/><span>EXAMPLE</span></div>
          <div className="code-tabs" role="tablist" aria-label="Code language">{(['html','css','js'] as const).map(tab=><button key={tab} role="tab" aria-label={tab.toUpperCase()} aria-selected={language===tab} aria-controls="code-panel" id={`tab-${tab}`} onClick={()=>setLanguage(tab)} className={language===tab?'active':''}><span className={`language-icon ${tab}`}>{tab==='html'?<Code2 size={14}/>:tab==='css'?<Hash size={14}/>:<span>JS</span>}</span>{tab.toUpperCase()}{source[tab].length>0&&<i/>}</button>)}<span className="tabs-tail">{language==='html'?'index.html':language==='css'?'style.css':'script.js'}</span></div>
          <div id="code-panel" role="tabpanel" aria-labelledby={`tab-${language}`} className="code-panel"><CodeEditor key={language} language={language} value={source[language]} onChange={value=>setSource(old=>({...old,[language]:value}))}/></div>
          <div className="editor-footer"><span><span className={`save-dot ${saved==='Draft saved'?'':'pending'}`}/>{saved}</span><span>{source[language].split('\n').length} lines<span className="footer-separator">·</span>UTF-8</span></div>
        </section>
        <section className="preview-panel" aria-label="Preview workspace">
          <div className="panel-heading preview-heading"><div className="panel-title"><span className="live-dot"/><h2>Live preview</h2></div><div className="viewport-controls"><div className="device-buttons">{[{name:'Desktop',value:1024,Icon:Monitor},{name:'Tablet',value:768,Icon:Tablet},{name:'Mobile',value:390,Icon:Smartphone}].map(({name,value,Icon})=><button key={name} disabled={copying} className={width===value?'selected':''} onClick={()=>changeWidth(value)} aria-label={`${name} viewport`} aria-pressed={width===value}><Icon size={15}/></button>)}</div><span className="viewport-divider"/><label className="width-control"><input type="number" min={320} max={1920} aria-label="Preview width" value={widthInput} disabled={copying} onChange={event=>setWidthInput(event.target.value)} onBlur={()=>changeWidth(Number(widthInput)||1024)} onKeyDown={event=>{if(event.key==='Enter') event.currentTarget.blur();}}/><span>px</span></label></div></div>
          <Preview ref={preview} source={running} revision={revision} width={width} onStatus={setStatus} onDiagnostic={onDiagnostic}/>
          {diagnostics.length>0&&<div className="diagnostics" aria-label="Preview messages"><span>Preview messages</span><button onClick={()=>setDiagnostics([])} aria-label="Dismiss preview messages"><X size={13}/></button>{diagnostics.map((message,index)=><p key={index}>{message}</p>)}</div>}
          <div className="preview-footer"><span><Layers size={13}/>Made for editable layers</span><span>Preview at {width}px<span className="footer-separator">·</span>Fit to canvas</span></div>
        </section>
      </div>
      <div className="export-bar"><div className="export-status"><span className={`status-icon ${status.kind==='error'?'error':''}`}>{copying?<LoaderCircle className="spin" size={18}/>:status.kind==='copied'?<Check size={18}/>:<Layers size={18}/>}</span><div><p role="status" className={status.kind==='error'?'status-error':''}>{dirty?'You have changes ready to run':status.message}</p><span>{dirty?'Click Run or press ⌘ / Ctrl + Enter to update your preview.':status.kind==='copied'?'Open a Figma design file and paste onto the canvas.':'Copy your preview, then paste it straight into Figma.'}</span></div></div><button className="copy-button" aria-label="Copy to Figma" onClick={()=>preview.current?.copy()} disabled={copyDisabled}>{copying?<LoaderCircle size={16} className="spin"/>:<Figma size={16}/>}<span>{copying?'Preparing…':status.kind==='copied'&&!dirty?'Copied to clipboard':'Copy to Figma'}</span>{status.kind==='copied'&&!dirty?<Check size={15}/>:<ArrowUpRight size={16}/>}</button></div>
      <footer className="workspace-footer"><span>A shorter path from browser to design.</span><span><span className="keyboard-key">⌘</span> + <span className="keyboard-key">V</span> in Figma<span className="footer-separator">/</span>No plugin needed</span></footer>
    </main>
    <dialog ref={dialog} className="help-dialog" onCancel={()=>setHelp(false)} onClick={event=>{if(event.target===event.currentTarget)setHelp(false);}} aria-labelledby="help-title"><div className="dialog-heading"><span className="brand-mark"><Copy size={18}/></span><button className="icon-button" ref={closeHelp} onClick={()=>setHelp(false)} aria-label="Close help"><X size={19}/></button></div><h2 id="help-title">Your code. On the canvas.</h2><p>Three small steps from a working interface to a Figma design.</p><ol><li><FileCode2 size={19}/><div><strong>Make something in code</strong><span>Paste HTML, CSS and JavaScript, or start with an example.</span></div></li><li><Play size={19}/><div><strong>Run it. Get it just right.</strong><span>Choose a screen size and interact with the preview. We capture its current state.</span></div></li><li><Figma size={19}/><div><strong>Copy. Switch. Paste.</strong><span>Click Copy to Figma, open your design file, and press Cmd+V or Ctrl+V on the canvas.</span></div></li></ol><div className="help-note"><ArrowDown size={16}/><p>Use Chrome or Edge. The first copy loads Figma’s capture tool and needs an internet connection. Fonts and complex effects may look different in Figma.</p></div><button className="copy-button full-width" onClick={()=>setHelp(false)}>Got it. Let’s create.<ArrowRight size={16}/></button></dialog>
  </div>;
}
