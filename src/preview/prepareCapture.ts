// Serialized alongside the bridge: keep this function free of module dependencies.
// Adapt only known lossy cases; never silently substitute a user's text fonts.
export function prepareCapture() {
  const undo: (()=>void)[] = [];
  const warnings = new Set<string>();
  const restore = () => { for (const action of undo.splice(0).reverse()) action(); };
  try {
    const elements = [document.body,...document.body.querySelectorAll<HTMLElement>('*')];
    const localFonts = new Set<string>();
    for (const el of elements) {
      if (!(el instanceof HTMLElement) || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue;
      const text = Array.from(el.childNodes).filter((n):n is Text=>n.nodeType===Node.TEXT_NODE && !!n.textContent?.trim());
      if (!text.length) continue;
      const style = getComputedStyle(el);
      if (style.display==='contents' && text.some(node=>node.data.includes('↗'))) {
        warnings.add('Arrows inside display: contents are preserved as text and may render differently in Figma.');
      }
      if (!el.getClientRects().length) continue;
      const family = style.fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g,'');
      if (/^(Arial|Georgia|Times New Roman|Courier New|Helvetica|system-ui|sans-serif|serif|monospace)$/i.test(family)) localFonts.add(family);
      if (style.writingMode.startsWith('vertical')) {
        // Single-line, sideways Latin labels. CJK/upright/multiline/flow layout
        // require a different mapping and must not be flattened by this adapter.
        const range = document.createRange();
        range.selectNodeContents(el);
        const simple = el.children.length===0 && /^[\p{Script=Latin}\p{N}\p{P}\p{Z}\s]+$/u.test(el.textContent ?? '')
          && style.position==='absolute' && style.direction==='ltr' && style.textOrientation!=='upright'
          && style.transform==='none' && range.getClientRects().length===1
          && [style.paddingTop,style.paddingRight,style.paddingBottom,style.paddingLeft,style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth].every(v=>parseFloat(v)===0);
        if (simple) {
          const original = el.getAttribute('style');
          const width = el.offsetWidth, height = el.offsetHeight;
          const left = el.offsetLeft, top = el.offsetTop;
          undo.push(()=> { if(original===null) el.removeAttribute('style'); else el.setAttribute('style',original); });
          const values:Record<string,string> = {
            'writing-mode':'horizontal-tb','white-space':'nowrap',display:'block',margin:'0',
            left:`${left+width}px`,top:`${top}px`,right:'auto',bottom:'auto',
            width:`${height}px`,height:`${width}px`,'max-width':'none','max-height':'none','min-width':'0','min-height':'0',
            transform:'rotate(90deg)','transform-origin':'0 0',
          };
          for(const [name,value] of Object.entries(values)) el.style.setProperty(name,value,'important');
        } else warnings.add('Complex vertical text may differ in Figma; only single-line absolute Latin labels are normalized.');
        continue;
      }
      // Use explicit vector geometry for text-presentation NE arrows. Leave
      // emoji-presentation (VS16), editable inputs and script/style content alone.
      if (el.isContentEditable || /^(TEXTAREA|INPUT|SELECT|OPTION)$/.test(el.tagName)) continue;
      for (const node of text) {
        const matches = [...node.data.matchAll(/↗(?:\uFE0E)?(?!\uFE0F)/gu)];
        if (!matches.length) continue;
        const fragment = document.createDocumentFragment();
        const inserted:Node[] = [];
        let end=0;
        for(const match of matches) {
          const index=match.index!;
          fragment.append(document.createTextNode(node.data.slice(end,index)));
          const range=document.createRange();range.setStart(node,index);range.setEnd(node,index+match[0].length);
          const size=parseFloat(style.fontSize), width=range.getBoundingClientRect().width || size;
          const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
          svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width',String(width));svg.setAttribute('height',String(size));
          svg.setAttribute('aria-label','North east arrow');
          svg.style.cssText=`display:inline-block;width:${width}px;height:${size}px;vertical-align:-0.125em;flex:none`;
          const path=document.createElementNS(svg.namespaceURI,'path');
          path.setAttribute('d','M5 19 19 5M5 5h14v14');path.setAttribute('fill','none');
          path.setAttribute('stroke',style.color);path.setAttribute('stroke-width','1.6');
          path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);
          fragment.append(svg);end=index+match[0].length;
        }
        fragment.append(document.createTextNode(node.data.slice(end)));
        // A direct text node is one anonymous flex/grid item. Keep its text and
        // icon together so gap, alignment and grid placement do not change.
        if (/^(inline-)?(flex|grid)$/.test(style.display)) {
          const item=document.createElement('h2f-capture-text');
          item.style.setProperty('all','unset','important');
          item.style.setProperty('display','block','important');
          item.append(fragment);fragment.append(item);
        }
        inserted.push(...fragment.childNodes);
        node.replaceWith(fragment);
        undo.push(()=> { const first=inserted.find(n=>n.parentNode===el); if(first) el.insertBefore(node,first); for(const n of inserted) if(n.parentNode===el) el.removeChild(n); });
      }
    }
    if(localFonts.size) warnings.add(`Local/system fonts (${[...localFonts].join(', ')}) are not installed into Figma by copying. Make the same fonts available in Figma or choose shared web/Figma fonts. Your font choices were preserved.`);
    return {restore,warnings:[...warnings]};
  } catch(error) { restore(); throw error; }
}
