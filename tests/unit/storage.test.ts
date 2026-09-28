import { afterEach, expect, test } from 'vitest';
import { loadDraft, saveDraft } from '../../src/editor/storage';
afterEach(() => localStorage.clear());

test('restores valid source and ignores corrupt or incomplete drafts', () => {
  const source = {html:'<h1>Saved</h1>',css:'h1{color:red}',js:'console.log(1)'};
  expect(saveDraft(source)).toBe(true);
  expect(loadDraft()).toEqual(source);
  localStorage.setItem('html-to-figma:draft:v1','{"html":123}');
  expect(loadDraft()).toBeNull();
  localStorage.setItem('html-to-figma:draft:v1','not json');
  expect(loadDraft()).toBeNull();
});
