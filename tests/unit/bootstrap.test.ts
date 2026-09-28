import { expect, test, vi } from 'vitest';
import { previewBootstrap } from '../../src/preview/bootstrap';
import { prepareCapture } from '../../src/preview/prepareCapture';

test('interrupted runtime cannot write through or corrupt a later capture request',async () => {
  document.body.innerHTML='<button>Open ↗</button>';
  const original=document.body.innerHTML;
  vi.spyOn(HTMLElement.prototype,'getClientRects').mockReturnValue([new DOMRect(0,0,100,20)] as unknown as DOMRectList);
  Object.defineProperty(Range.prototype,'getBoundingClientRect',{configurable:true,value:()=>new DOMRect(0,0,16,20)});
  const nativeWrite = vi.fn(async () => {});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:nativeWrite}});
  Object.defineProperty(document,'fonts',{configurable:true,value:{ready:Promise.resolve()}});
  vi.spyOn(window,'focus').mockImplementation(() => {});
  const messages: Record<string,unknown>[] = [];
  vi.spyOn(window,'postMessage').mockImplementation(message => {messages.push(message);});
  const append = document.head.append.bind(document.head);
  vi.spyOn(document.head,'append').mockImplementation((...nodes) => {
    append(...nodes);
    for (const node of nodes) if (node instanceof HTMLScriptElement) queueMicrotask(() => node.dispatchEvent(new Event('load')));
  });
  let rejectOld!: (error:Error)=>void;
  const captureForDesign = vi.fn(() => new Promise<{success:boolean}>( (_resolve,reject) => {rejectOld=reject;} ));
  Object.assign(window,{figma:{captureForDesign}});
  previewBootstrap({session:'test',parentOrigin:'http://localhost:5173'},prepareCapture);
  const send = (data:Record<string,unknown>) => window.dispatchEvent(new MessageEvent('message',{
    source:window,origin:'http://localhost:5173',data:{channel:'html-to-figma',session:'test',...data},
  }));
  send({type:'capture',requestId:'A'});
  await vi.waitFor(() => expect(captureForDesign).toHaveBeenCalledTimes(1));
  expect(document.querySelector('svg')).not.toBeNull();
  send({type:'capture-result',requestId:'A',ok:false,message:'Timed out'});
  expect(document.body.innerHTML).toBe(original);
  send({type:'capture',requestId:'B'});
  await vi.waitFor(() => expect(messages).toContainEqual(expect.objectContaining({type:'capture-error',requestId:'B',message:expect.stringMatching(/Run/)})));
  rejectOld(new Error('Late failure from old capture'));
  await Promise.resolve();
  await Promise.resolve();
  expect(navigator.clipboard.write).not.toBe(nativeWrite);
  await expect(navigator.clipboard.write([])).rejects.toThrow();
  expect(nativeWrite).not.toHaveBeenCalled();
  expect(captureForDesign).toHaveBeenCalledTimes(1);
  expect(document.body.innerHTML).toBe(original);
  document.body.innerHTML='';
  vi.restoreAllMocks();
});
