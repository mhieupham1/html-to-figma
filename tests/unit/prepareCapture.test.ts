import { afterEach, expect, test, vi } from 'vitest';
import { prepareCapture } from '../../src/preview/prepareCapture';

afterEach(()=> {vi.restoreAllMocks();document.body.innerHTML='';});

test('normalizes body text arrows, preserves explicit emoji and restores original text nodes',()=>{
  document.body.innerHTML='Hello ↗ / ↗️ <button>Keep listener</button>';
  const original=document.body.innerHTML;
  const node=document.body.firstChild;
  const button=document.querySelector('button')!;
  button.onclick=()=>button.textContent='Clicked';
  vi.spyOn(HTMLElement.prototype,'getClientRects').mockReturnValue([new DOMRect(0,0,200,20)] as unknown as DOMRectList);
  Object.defineProperty(Range.prototype,'getBoundingClientRect',{configurable:true,value:()=>new DOMRect(0,0,16,20)});
  const prepared=prepareCapture();
  expect(document.querySelectorAll('svg')).toHaveLength(1);
  expect(document.body.textContent).toContain('↗️');
  prepared.restore();prepared.restore();
  expect(document.body.innerHTML).toBe(original);
  expect(document.body.firstChild).toBe(node);
  button.click();expect(button.textContent).toBe('Clicked');
});

test('warns about local fonts without substituting font or text',()=>{
  document.body.innerHTML='<p style="font-family:Georgia">Xin chào</p>';
  vi.spyOn(HTMLElement.prototype,'getClientRects').mockReturnValue([new DOMRect(0,0,100,20)] as unknown as DOMRectList);
  const before=document.body.innerHTML;
  const prepared=prepareCapture();
  expect(prepared.warnings.join(' ')).toMatch(/Georgia.*Figma/);
  expect(document.body.innerHTML).toBe(before);
  prepared.restore();
});

test('reports unsupported display contents arrows without altering their layout',()=>{
  document.body.innerHTML='<span style="display:contents">Call ↗</span>';
  const before=document.body.innerHTML;
  const prepared=prepareCapture();
  expect(prepared.warnings.join(' ')).toContain('display: contents');
  expect(document.body.innerHTML).toBe(before);
  prepared.restore();
});
