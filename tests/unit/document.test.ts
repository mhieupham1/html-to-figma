import { afterEach, expect, test, vi } from 'vitest';
import { buildDocument } from '../../src/preview/document';

afterEach(() => vi.unstubAllGlobals());

test('preserves full HTML structure, embedded scripts and literal closing tags in separate source', async () => {
  const blobs: Blob[] = [];
  vi.stubGlobal('URL', { createObjectURL: (blob: Blob) => { blobs.push(blob); return `blob:test/${blobs.length}`; }, revokeObjectURL: vi.fn() });
  const result = buildDocument({
    html: '<!doctype html><html lang="vi"><head><title>Demo</title><style>h1 {color:red}</style></head><body><h1>Xin chào</h1><script>window.embedded = 1</script></body></html>',
    css: '.label::after { content: "</style>"; }', js: 'document.querySelector("h1").textContent = "</script>";',
  }, { session: 'session-a', parentOrigin: 'http://localhost:5173' }, 'function bootstrap() {}');
  const parsed = new DOMParser().parseFromString(result.html, 'text/html');
  expect(parsed.documentElement.lang).toBe('vi');
  expect(parsed.title).toBe('Demo');
  expect(parsed.querySelector('h1')?.textContent).toBe('Xin chào');
  expect(parsed.querySelector('script:not([data-h2f-bridge]):not([src])')?.textContent).toBe('window.embedded = 1');
  expect(parsed.querySelector('link[rel=stylesheet]')?.getAttribute('href')).toBe('blob:test/1');
  expect(parsed.body.lastElementChild?.getAttribute('src')).toBe('blob:test/2');
  expect(blobs).toHaveLength(2);
  result.dispose();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});

test('assembles a fragment and keeps bootstrap configuration out of HTML parsing', () => {
  const result = buildDocument({html: '<button>Click</button>', css:'', js:''},
    {session: '</script><img src=x>', parentOrigin:'http://localhost:5173'}, 'function bootstrap() {}');
  const parsed = new DOMParser().parseFromString(result.html, 'text/html');
  expect(parsed.querySelector('button')?.textContent).toBe('Click');
  expect(parsed.querySelector('img')).toBeNull();
  expect(parsed.head.firstElementChild?.tagName).toBe('SCRIPT');
});
