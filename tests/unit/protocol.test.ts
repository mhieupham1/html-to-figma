import { expect, test } from 'vitest';
import { acceptPreviewMessage, resolvePreviewOrigin } from '../../src/shared/protocol';

test('rejects stale, foreign and malformed preview messages', () => {
  const source = {} as Window;
  const context = {source, origin:'http://localhost:5174', session:'current'};
  const event = {source, origin:context.origin, data:{channel:'html-to-figma',session:'current',type:'ready'}} as MessageEvent;
  expect(acceptPreviewMessage(event, context)?.type).toBe('ready');
  expect(acceptPreviewMessage({...event, origin:'https://elsewhere.test'} as MessageEvent, context)).toBeNull();
  expect(acceptPreviewMessage({...event, source:{}} as MessageEvent, context)).toBeNull();
  expect(acceptPreviewMessage({...event, data:{...event.data,session:'old'}} as MessageEvent, context)).toBeNull();
  expect(acceptPreviewMessage({...event, data:{...event.data,type:'payload',requestId:'x',html:42}} as MessageEvent, context)).toBeNull();
  expect(acceptPreviewMessage({...event, data:null} as MessageEvent, context)).toBeNull();
});

test('fails closed on same-origin preview and requires production configuration', () => {
  expect(resolvePreviewOrigin('http://localhost:5173')).toBe('http://localhost:5174');
  expect(() => resolvePreviewOrigin('https://app.test')).toThrow();
  expect(() => resolvePreviewOrigin('https://app.test','https://app.test')).toThrow();
  expect(resolvePreviewOrigin('https://app.test','https://preview.test')).toBe('https://preview.test');
});
