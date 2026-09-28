import { isSource, type Source } from '../shared/protocol';
const key = 'html-to-figma:draft:v1';
export function loadDraft(): Source | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || 'null');
    return isSource(value) ? {html:value.html,css:value.css,js:value.js} : null;
  } catch { return null; }
}
export function saveDraft(source: Source): boolean {
  try { localStorage.setItem(key,JSON.stringify(source)); return true; }
  catch { return false; }
}
