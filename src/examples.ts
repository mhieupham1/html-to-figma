import type { Source } from './shared/protocol';
const vase = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="620" viewBox="0 0 600 620"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#dbdfcf"/><stop offset="1" stop-color="#b6bfaa"/></linearGradient><linearGradient id="v" x2="1" y2=".3"><stop stop-color="#b7a58a"/><stop offset=".35" stop-color="#eee0c6"/><stop offset=".75" stop-color="#d9c9ad"/><stop offset="1" stop-color="#aa997e"/></linearGradient><radialGradient id="s"><stop stop-color="#3b422e" stop-opacity=".25"/><stop offset="1" stop-color="#3b422e" stop-opacity="0"/></radialGradient></defs><path fill="url(#bg)" d="M0 0h600v620H0z"/><path fill="#ece9da" d="M0 485h600v135H0z"/><ellipse cx="318" cy="532" rx="200" ry="40" fill="url(#s)"/><path d="M300 400C304 244 318 192 384 103M307 280C286 242 245 204 207 174M320 233C358 196 410 195 444 177" fill="none" stroke="#526a37" stroke-width="5"/><g fill="#526c3c"><path d="M351 155q-46-55-12-106 46 34 12 106"/><path d="M358 150q6-57 74-59-8 56-74 59"/><path d="M327 218q-71-17-65-75 67 11 65 75"/><path d="M331 210q41-54 82-31-21 49-82 31"/><path d="M275 235q-63 4-78-56 60-7 78 56"/><path d="M225 192q-67-15-74-59 60-3 74 59"/><path d="M399 198q15-54 70-44-7 43-70 44"/><path d="M298 292q-53-14-53-59 60 5 53 59"/></g><path d="M258 344h97l-9 43c-2 20 48 61 43 104-3 34-43 50-83 50s-80-16-83-50c-5-43 45-84 43-104z" fill="url(#v)"/><ellipse cx="306" cy="344" rx="49" ry="10" fill="#a4957a"/><ellipse cx="306" cy="345" rx="37" ry="5" fill="#5e5b46"/><path d="M300 366l5-31" stroke="#526a37" stroke-width="4"/><g opacity=".15" stroke="#806e53" fill="none"><path d="M246 449q61 17 121 0M235 469q71 18 143 0M236 490q70 20 142 0M246 510q62 17 122 0"/></g></svg>`;
export const examples: { id:string; name:string; source:Source }[] = [
  {id:'studio',name:'Studio landing page',source:{
    html:`<!-- A little inspiration. Make it your own. -->
<header class="nav">
  <a class="wordmark" href="#">form<span>&</span>field</a>
  <nav>
    <a href="#collection">Collection</a>
    <a href="#story">Our story</a>
    <a href="#contact">Get in touch ↗</a>
  </nav>
</header>

<main>
  <section class="hero">
    <div class="hero-copy">
      <span class="eyebrow">THOUGHTFULLY MADE. EVERY DAY.</span>
      <h1>A slower pace.<br>A better space.</h1>
      <p>Considered objects for the places we call home.
        Made with care, meant to stay.</p>
      <a class="button" href="#collection">Explore the collection <span>↗</span></a>
      <div class="small-note"><span class="note-line"></span> Less, but more meaningful.</div>
    </div>
    <figure class="hero-image">
      <img alt="A handcrafted ceramic vase with an olive branch"
        src="data:image/svg+xml,${encodeURIComponent(vase)}" />
      <figcaption><span>The everyday collection</span><span>01 / 03</span></figcaption>
      <span class="image-label">A NATURAL KIND OF BEAUTIFUL</span>
    </figure>
  </section>

  <section class="values" id="collection">
    <div><span>01</span><h2>Made with intention</h2><p>Every detail has a reason to be.</p></div>
    <div><span>02</span><h2>Rooted in nature</h2><p>Honest materials. A lighter footprint.</p></div>
    <div><span>03</span><h2>Here for the long run</h2><p>Good things only get better with time.</p></div>
  </section>
  <footer id="contact">Objects that belong. <span>EST. 2024 · MADE SLOWLY</span></footer>
</main>`,
    css:`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Lora:ital,wght@0,400;0,700;1,400;1,700&display=swap');
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: #f7f6f0; color: #29372c; font-family: Inter, sans-serif; }
a { color: inherit; text-decoration: none; }
.nav { height: 94px; padding: 0 5%; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dddfd3; }
.wordmark { font: bold 28px Lora, serif; letter-spacing: -1.5px; }
.wordmark span { color: #798568; font-style: italic; }
.nav nav { display: flex; gap: 30px; font-size: 12px; }
.hero { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; padding: 52px 5% 46px; align-items: center; }
.eyebrow { font-size: 9px; letter-spacing: 2px; color: #68745c; }
h1 { font: 60px/1.03 Lora, serif; font-weight: normal; letter-spacing: -2.5px; margin: 27px 0 24px; }
.hero-copy > p { max-width: 280px; font-size: 13px; line-height: 1.8; color: #78806f; }
.button { display: inline-flex; gap: 25px; align-items: center; margin-top: 17px; padding: 15px 18px; background: #344333; color: #fff; font-size: 11px; border-radius: 2px; }
.button:hover { background: #506349; }
.button span { font-size: 18px; }
.small-note { display: flex; align-items: center; gap: 12px; color: #838976; font-size: 10px; margin-top: 42px; }
.note-line { width: 28px; height: 1px; background: #adb6a0; }
.hero-image { position: relative; margin: 0; }
.hero-image img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 150px 150px 2px 2px; }
figcaption { display: flex; justify-content: space-between; margin-top: 14px; font-size: 10px; color: #78806f; }
.image-label { position: absolute; right: -11px; top: 130px; writing-mode: vertical-rl; font-size: 8px; letter-spacing: 1.5px; }
.values { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0 5%; border-top: 1px solid #d7dccf; padding: 26px 0; }
.values > div { padding: 0 18px; border-right: 1px solid #d7dccf; }
.values > div:first-child { padding-left: 0; }
.values > div:last-child { border: 0; }
.values span { font: 10px Inter, sans-serif; font-variant-numeric: tabular-nums; color: #919c85; }
h2 { font-size: 12px; font-weight: 500; margin: 12px 0 6px; }
.values p { color: #858e7b; font-size: 10px; margin: 0; line-height: 1.6; }
footer { display: flex; justify-content: space-between; margin: 0 5%; padding: 20px 0; border-top: 1px solid #d7dccf; font: italic 12px Lora, serif; }
footer span { font: 8px Inter, sans-serif; letter-spacing: 1.5px; color: #858e7b; }
@media (max-width: 600px) {
  .nav { height: 74px; }.nav nav { gap: 12px; font-size: 10px; }
  .wordmark { font-size: 22px; }.nav nav a:last-child { display: none; }
  .hero { grid-template-columns: 1fr; padding-top: 38px; gap: 32px; }
  h1 { font-size: 52px; }.small-note { margin-top: 24px; }
  .hero-image img { aspect-ratio: 1.15; }.values { gap: 8px; }
  .values > div { padding: 0 8px; } footer span { letter-spacing: .5px; }
}`,
    js:`// Your JavaScript runs when you click Run.
// Interact with the preview, then copy that exact state.

document.querySelector('.button').addEventListener('click', () => {
  document.querySelector('.small-note').textContent =
    'Good things take a little time. Welcome to the collection.';
});`,
  }},
  {id:'interactive',name:'Interactive card',source:{
    html:`<main class="card">
  <span class="tag">A LITTLE EXPERIMENT</span>
  <h1>Capture test</h1>
  <p>Click the button, then copy this design.<br>The updated text will travel with it.</p>
  <button id="update">Update text</button>
  <div class="box">Editable box <span>✳</span></div>
</main>`,
    css:`* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f3f1eb; color: #243328; font-family: Arial, sans-serif; }
.card { width: min(420px, 90%); padding: 36px; background: white; border: 1px solid #ddd; border-radius: 20px; box-shadow: 0 20px 60px #293d2010; }
.tag { font: 10px monospace; letter-spacing: 2px; color: #788577; }
h1 { font: 38px Georgia, serif; letter-spacing: -1px; }
p { color: #778075; font-size: 14px; line-height: 1.8; }
button { background: #243328; color: white; border: 0; padding: 14px 24px; border-radius: 8px; cursor: pointer; }
.box { display: flex; justify-content: space-between; margin-top: 24px; padding: 24px; border-radius: 12px; background: #dff0b7; }
.box span { font-size: 24px; }`,
    js:`document.querySelector('#update').addEventListener('click', () => {
  document.querySelector('h1').textContent = 'Updated from JavaScript';
});`,
  }},
  {id:'blank',name:'Blank canvas',source:{html:'<main>\n  <h1>Hello, Figma.</h1>\n  <p>Your next idea starts here.</p>\n</main>',css:'body {\n  margin: 0;\n  padding: 48px;\n  font-family: Arial, sans-serif;\n  background: #faf9f6;\n  color: #26372b;\n}\nh1 { font-size: 48px; letter-spacing: -2px; }',js:'// Bring your interface to life.\n'}},
];
export const starter = examples[0].source;
