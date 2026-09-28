import { useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Source } from '../shared/protocol';
const editorTheme = EditorView.theme({
  '&':{height:'100%',backgroundColor:'#141719',fontSize:'12px'},
  '.cm-scroller':{fontFamily:'"SFMono-Regular", Consolas, "Liberation Mono", monospace',lineHeight:'1.85',overflow:'auto'},
  '.cm-content':{padding:'18px 0',caretColor:'#b6f2a2'},
  '.cm-line':{paddingLeft:'12px',paddingRight:'24px'},
  '.cm-gutters':{backgroundColor:'#141719',color:'#545b62',border:'none',paddingLeft:'10px',minWidth:'42px'},
  '.cm-activeLine, .cm-activeLineGutter':{backgroundColor:'#1a1e21'},
  '&.cm-focused':{outline:'none'},
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground':{backgroundColor:'#354938'},
  '.cm-foldGutter':{width:'12px'},
});
export function CodeEditor({language,value,onChange}:{language:keyof Source;value:string;onChange:(value:string)=>void}) {
  const extensions = useMemo(() => [language==='html'?html():language==='css'?css():javascript(),editorTheme,
    EditorView.contentAttributes.of({'aria-label':`${language.toUpperCase()} code`})], [language]);
  return <CodeMirror className="code-editor" value={value} extensions={extensions} theme={oneDark} onChange={onChange}
    basicSetup={{lineNumbers:true,foldGutter:true,highlightActiveLine:true,autocompletion:true,bracketMatching:true}} indentWithTab />;
}
