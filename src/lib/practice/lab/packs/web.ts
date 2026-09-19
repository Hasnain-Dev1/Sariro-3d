import type { WebChallenge } from '../types';

/**
 * SARIRO — Code Lab: the HTML & CSS pack
 * ============================================================================
 * For Website Development Basics, Web Builder Pro and Design to Product. The
 * learner edits `index.html` and `style.css`, sees the page live, and "Run
 * checks" asks the page the browser actually built: is there an <h1>, does the
 * image have alt text, is the card's corner really rounded? Style checks use
 * COMPUTED values, so any way of writing the right colour counts.
 *
 * Checks name longhand properties (`padding-top`, not `padding`) where browsers
 * agree on them. Rounded corners and gaps are read as the shorthand the learner
 * writes (`border-radius`, `gap`): every browser reports that, and jsdom — which
 * the tests use — does not split those two into their longhands.
 */

type Web = Omit<WebChallenge, 'lang'>;

const PAGE = (body: string) => `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>My page</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;

const W: Web[] = [
  /* ── HTML: structure ─────────────────────────────────────────────────── */
  {
    id: 'lab:web:first-heading', tier: 1, topic: 'HTML basics', title: 'Your first heading',
    prompt: 'Give the page a main heading that says `Hello, Sariro!` — use an `<h1>` tag.',
    starter: { html: PAGE('  <!-- your heading here -->'), css: '' },
    solution: { html: PAGE('  <h1>Hello, Sariro!</h1>'), css: '' },
    checks: [
      { label: 'The page has an <h1>', selector: 'h1', expect: 'exists' },
      { label: 'The heading says "Hello, Sariro!"', selector: 'h1', expect: 'text', value: 'Hello, Sariro!' },
    ],
    hints: ['A tag has an opening and a closing part: `<h1>` … `</h1>`.', 'Put the text between them.'],
  },
  {
    id: 'lab:web:paragraph', tier: 1, topic: 'HTML basics', title: 'Paragraphs and bold',
    prompt: 'Under the heading, add a paragraph (`<p>`) that says `I am learning to code.` — and make the word `code` bold with `<strong>`.',
    starter: { html: PAGE('  <h1>About me</h1>'), css: '' },
    solution: { html: PAGE('  <h1>About me</h1>\n  <p>I am learning to <strong>code</strong>.</p>'), css: '' },
    checks: [
      { label: 'There is a paragraph', selector: 'p', expect: 'exists' },
      { label: 'The paragraph says "I am learning to code."', selector: 'p', expect: 'text', value: 'I am learning to code.' },
      { label: '"code" is inside <strong> in the paragraph', selector: 'p strong', expect: 'text', value: 'code' },
    ],
    hints: ['A paragraph is `<p>…</p>`.', 'Tags can go inside tags: `<p>… <strong>code</strong>.</p>`.'],
  },
  {
    id: 'lab:web:link', tier: 1, topic: 'HTML basics', title: 'A link',
    prompt: 'Add a link that says `Visit Sariro` and goes to `https://sariro.com`.',
    starter: { html: PAGE('  <h1>Links</h1>'), css: '' },
    solution: { html: PAGE('  <h1>Links</h1>\n  <a href="https://sariro.com">Visit Sariro</a>'), css: '' },
    checks: [
      { label: 'There is a link (<a>)', selector: 'a', expect: 'exists' },
      { label: 'It goes to https://sariro.com', selector: 'a', expect: 'attr', attr: 'href', value: 'https://sariro.com' },
      { label: 'Its text is "Visit Sariro"', selector: 'a', expect: 'text', value: 'Visit Sariro' },
    ],
    hints: ['Links use the `<a>` tag.', 'Where it goes lives in the `href` attribute: `<a href="https://sariro.com">…</a>`.'],
  },
  {
    id: 'lab:web:image', tier: 1, topic: 'HTML basics', title: 'An image with alt text',
    prompt: 'Add an image with `src="https://picsum.photos/300/200"`. Every image needs `alt` text describing it, for people who cannot see it — add one.',
    starter: { html: PAGE('  <h1>My photo</h1>'), css: '' },
    solution: { html: PAGE('  <h1>My photo</h1>\n  <img src="https://picsum.photos/300/200" alt="A random landscape photo">'), css: '' },
    checks: [
      { label: 'There is an <img>', selector: 'img', expect: 'exists' },
      { label: 'It has a src', selector: 'img', expect: 'attr', attr: 'src' },
      { label: 'It has alt text', selector: 'img', expect: 'attr', attr: 'alt' },
    ],
    hints: ['`<img>` has no closing tag.', 'Attributes go inside the tag: `<img src="…" alt="…">`.'],
  },
  {
    id: 'lab:web:list', tier: 1, topic: 'HTML basics', title: 'A shopping list',
    prompt: 'Make a bulleted list (`<ul>`) of three things to buy, each in its own `<li>`.',
    starter: { html: PAGE('  <h1>Shopping</h1>'), css: '' },
    solution: { html: PAGE('  <h1>Shopping</h1>\n  <ul>\n    <li>Milk</li>\n    <li>Bread</li>\n    <li>Mangoes</li>\n  </ul>'), css: '' },
    checks: [
      { label: 'There is a <ul>', selector: 'ul', expect: 'exists' },
      { label: 'It has exactly three <li> items', selector: 'ul > li', expect: 'count', value: 3 },
    ],
    hints: ['`<ul>` wraps the whole list.', 'Each item is `<li>…</li>` inside it.'],
  },
  {
    id: 'lab:web:title', tier: 1, topic: 'HTML basics', title: 'The tab title',
    prompt: 'The text on the browser tab comes from `<title>` in the `<head>`. Change it to `Asha\'s Portfolio`.',
    starter: { html: PAGE('  <h1>Welcome</h1>'), css: '' },
    solution: { html: PAGE('  <h1>Welcome</h1>').replace('<title>My page</title>', '<title>Asha\'s Portfolio</title>'), css: '' },
    checks: [
      { label: 'There is exactly one <title>', selector: 'title', expect: 'count', value: 1 },
      { label: 'The title is "Asha\'s Portfolio"', selector: 'title', expect: 'text', value: 'Asha\'s Portfolio' },
    ],
    hints: ['Find `<title>My page</title>` near the top.', 'Change only the words between the tags.'],
  },
  {
    id: 'lab:web:semantic', tier: 2, topic: 'HTML basics', title: 'Page layout tags',
    prompt: 'Real pages have parts. Give this page a `<header>` (with an `<h1>`), a `<main>` (with a paragraph) and a `<footer>`.',
    starter: { html: PAGE('  <!-- header, main and footer -->'), css: '' },
    solution: { html: PAGE('  <header><h1>My site</h1></header>\n  <main><p>Welcome to my site.</p></main>\n  <footer>© 2026</footer>'), css: '' },
    checks: [
      { label: 'There is a <header> with an <h1>', selector: 'header h1', expect: 'exists' },
      { label: 'There is a <main> with a paragraph', selector: 'main p', expect: 'exists' },
      { label: 'There is a <footer>', selector: 'footer', expect: 'exists' },
    ],
    hints: ['They are ordinary tags: `<header>…</header>`, `<main>…</main>`, `<footer>…</footer>`.', 'Put the heading inside the header, and the paragraph inside main.'],
  },
  {
    id: 'lab:web:form', tier: 2, topic: 'Forms', title: 'A sign-up form',
    prompt: 'Build a form with: a `<label>` "Email" joined to an `<input>` whose `type` is `email`, `id` is `email`, and which is `required`; and a submit `<button>`.',
    starter: { html: PAGE('  <h1>Join the club</h1>\n  <form>\n    \n  </form>'), css: '' },
    solution: { html: PAGE('  <h1>Join the club</h1>\n  <form>\n    <label for="email">Email</label>\n    <input type="email" id="email" required>\n    <button type="submit">Sign up</button>\n  </form>'), css: '' },
    checks: [
      { label: 'There is an email input', selector: 'form input[type="email"]', expect: 'exists' },
      { label: 'The input has id="email"', selector: 'form input[type="email"]', expect: 'attr', attr: 'id', value: 'email' },
      { label: 'The input is required', selector: 'form input[type="email"][required]', expect: 'exists' },
      { label: 'A <label> points at it (for="email")', selector: 'label[for="email"]', expect: 'exists' },
      { label: 'There is a submit button', selector: 'form button', expect: 'exists' },
    ],
    hints: ['`<label for="email">` joins the label to the input with `id="email"`.', '`required` is an attribute with no value: `<input … required>`.'],
  },
  {
    id: 'lab:web:table', tier: 2, topic: 'Forms', title: 'A table of scores',
    prompt: 'Make a `<table>` with a header row of two `<th>` cells (`Name`, `Score`) and three rows of data below it.',
    starter: { html: PAGE('  <h1>Scores</h1>'), css: '' },
    solution: { html: PAGE('  <h1>Scores</h1>\n  <table>\n    <tr><th>Name</th><th>Score</th></tr>\n    <tr><td>Asha</td><td>92</td></tr>\n    <tr><td>Kabir</td><td>88</td></tr>\n    <tr><td>Mia</td><td>95</td></tr>\n  </table>'), css: '' },
    checks: [
      { label: 'There is a <table>', selector: 'table', expect: 'exists' },
      { label: 'Two header cells', selector: 'table th', expect: 'count', value: 2 },
      { label: 'At least four rows (one header, three data)', selector: 'table tr', expect: 'count', value: '>=4' },
      { label: 'Data cells use <td>', selector: 'table td', expect: 'count', value: '>=6' },
    ],
    hints: ['Each row is `<tr>`; header cells are `<th>`, data cells are `<td>`.', 'Three data rows of two cells each is six `<td>`s.'],
  },

  /* ── CSS ─────────────────────────────────────────────────────────────── */
  {
    id: 'lab:web:colour', tier: 1, topic: 'CSS basics', title: 'Colour the heading',
    prompt: 'In `style.css`, make the `<h1>` text `tomato` coloured.',
    starter: { html: PAGE('  <h1>Colourful</h1>'), css: '/* style the h1 here */\n' },
    solution: { html: PAGE('  <h1>Colourful</h1>'), css: 'h1 {\n  color: tomato;\n}\n' },
    checks: [{ label: 'The heading is tomato', selector: 'h1', expect: 'style', prop: 'color', value: 'tomato' }],
    hints: ['A CSS rule is a selector and some properties: `h1 { … }`.', 'The text colour property is `color`.'],
  },
  {
    id: 'lab:web:center', tier: 1, topic: 'CSS basics', title: 'Centre the text',
    prompt: 'Centre the paragraph\'s text, and make it `20px` big.',
    starter: { html: PAGE('  <p class="intro">Welcome to my page!</p>'), css: '' },
    solution: { html: PAGE('  <p class="intro">Welcome to my page!</p>'), css: '.intro {\n  text-align: center;\n  font-size: 20px;\n}\n' },
    checks: [
      { label: 'The text is centred', selector: '.intro', expect: 'style', prop: 'text-align', value: 'center' },
      { label: 'The text is 20px', selector: '.intro', expect: 'style', prop: 'font-size', value: '20px' },
    ],
    hints: ['The paragraph has `class="intro"` — select it with `.intro`.', '`text-align: center;` and `font-size: 20px;`'],
  },
  {
    id: 'lab:web:card', tier: 2, topic: 'CSS basics', title: 'A card',
    prompt: 'Style `.card`: white background, `16px` of padding on every side, and corners rounded by `12px`.',
    starter: { html: PAGE('  <div class="card">\n    <h2>Asha</h2>\n    <p>Grade 6 · loves robots</p>\n  </div>'), css: 'body {\n  background: #f1f5f9;\n}\n' },
    solution: { html: PAGE('  <div class="card">\n    <h2>Asha</h2>\n    <p>Grade 6 · loves robots</p>\n  </div>'), css: 'body {\n  background: #f1f5f9;\n}\n.card {\n  background: white;\n  padding: 16px;\n  border-radius: 12px;\n}\n' },
    checks: [
      { label: 'The card is white', selector: '.card', expect: 'style', prop: 'background-color', value: 'white' },
      { label: '16px padding on top', selector: '.card', expect: 'style', prop: 'padding-top', value: '16px' },
      { label: '16px padding on the left', selector: '.card', expect: 'style', prop: 'padding-left', value: '16px' },
      { label: 'Corners rounded by 12px', selector: '.card', expect: 'style', prop: 'border-radius', value: '12px' },
    ],
    hints: ['`padding: 16px;` sets all four sides at once.', '`border-radius` rounds the corners.'],
  },
  {
    id: 'lab:web:button', tier: 2, topic: 'CSS basics', title: 'A good-looking button',
    prompt: 'Style `.btn`: background `#EA580C`, white text, no border, and a `10px` corner radius.',
    starter: { html: PAGE('  <button class="btn">Start learning</button>'), css: '' },
    solution: { html: PAGE('  <button class="btn">Start learning</button>'), css: '.btn {\n  background-color: #EA580C;\n  color: white;\n  border: none;\n  border-radius: 10px;\n  padding: 10px 16px;\n}\n' },
    checks: [
      { label: 'The background is #EA580C', selector: '.btn', expect: 'style', prop: 'background-color', value: '#EA580C' },
      { label: 'The text is white', selector: '.btn', expect: 'style', prop: 'color', value: 'white' },
      { label: 'There is no border', selector: '.btn', expect: 'style', prop: 'border-top-style', value: 'none' },
      { label: 'Corners rounded by 10px', selector: '.btn', expect: 'style', prop: 'border-radius', value: '10px' },
    ],
    hints: ['`background-color: #EA580C;` and `color: white;`', '`border: none;` removes the border.'],
  },
  {
    id: 'lab:web:flex-row', tier: 2, topic: 'Layout', title: 'Side by side',
    prompt: 'The three boxes stack on top of each other. Make `.row` a flexbox so they sit side by side, with a `12px` gap between them.',
    starter: { html: PAGE('  <div class="row">\n    <div class="box">1</div>\n    <div class="box">2</div>\n    <div class="box">3</div>\n  </div>'), css: '.box {\n  background: #fed7aa;\n  padding: 20px;\n}\n' },
    solution: { html: PAGE('  <div class="row">\n    <div class="box">1</div>\n    <div class="box">2</div>\n    <div class="box">3</div>\n  </div>'), css: '.box {\n  background: #fed7aa;\n  padding: 20px;\n}\n.row {\n  display: flex;\n  gap: 12px;\n}\n' },
    checks: [
      { label: '.row is a flexbox', selector: '.row', expect: 'style', prop: 'display', value: 'flex' },
      { label: '12px gap between the boxes', selector: '.row', expect: 'style', prop: 'gap', value: '12px' },
    ],
    hints: ['`display: flex;` on the parent lines up its children in a row.', '`gap: 12px;` spaces them out.'],
  },
  {
    id: 'lab:web:navbar', tier: 3, topic: 'Layout', title: 'A navigation bar',
    prompt: 'Build a `<nav>` with a logo (`<span class="logo">`) and three links. Make the nav a flexbox that pushes the logo and the links apart (`justify-content: space-between`) and centres them vertically.',
    starter: { html: PAGE('  <nav>\n    \n  </nav>'), css: '' },
    solution: { html: PAGE('  <nav>\n    <span class="logo">Sariro</span>\n    <div>\n      <a href="#">Home</a>\n      <a href="#">Courses</a>\n      <a href="#">Contact</a>\n    </div>\n  </nav>'), css: 'nav {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n' },
    checks: [
      { label: 'There is a logo in the nav', selector: 'nav .logo', expect: 'exists' },
      { label: 'The nav has three links', selector: 'nav a', expect: 'count', value: 3 },
      { label: 'The nav is a flexbox', selector: 'nav', expect: 'style', prop: 'display', value: 'flex' },
      { label: 'Items pushed apart', selector: 'nav', expect: 'style', prop: 'justify-content', value: 'space-between' },
      { label: 'Items centred vertically', selector: 'nav', expect: 'style', prop: 'align-items', value: 'center' },
    ],
    hints: ['Put the three links in their own `<div>`, so the nav has two children: the logo and that group.', '`justify-content: space-between;` pushes the two apart; `align-items: center;` lines them up in the middle.'],
  },
  {
    id: 'lab:web:grid', tier: 3, topic: 'Layout', title: 'A photo grid',
    prompt: 'Make `.gallery` a CSS grid with a `8px` gap. (Try `grid-template-columns: repeat(3, 1fr);` to get three columns.)',
    starter: { html: PAGE('  <div class="gallery">\n    <div class="tile">A</div><div class="tile">B</div><div class="tile">C</div>\n    <div class="tile">D</div><div class="tile">E</div><div class="tile">F</div>\n  </div>'), css: '.tile {\n  background: #bfdbfe;\n  padding: 30px;\n  text-align: center;\n}\n' },
    solution: { html: PAGE('  <div class="gallery">\n    <div class="tile">A</div><div class="tile">B</div><div class="tile">C</div>\n    <div class="tile">D</div><div class="tile">E</div><div class="tile">F</div>\n  </div>'), css: '.tile {\n  background: #bfdbfe;\n  padding: 30px;\n  text-align: center;\n}\n.gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 8px;\n}\n' },
    checks: [
      { label: '.gallery is a grid', selector: '.gallery', expect: 'style', prop: 'display', value: 'grid' },
      { label: '8px gap between the tiles', selector: '.gallery', expect: 'style', prop: 'gap', value: '8px' },
    ],
    hints: ['`display: grid;` turns it into a grid.', '`gap: 8px;` sets both the row and the column gap.'],
  },
  {
    id: 'lab:web:accessible', tier: 3, topic: 'Accessibility', title: 'A page everyone can use',
    prompt: 'Fix this page for screen readers: say the page\'s language (`lang="en"` on `<html>`), give the image alt text, and give the icon-only button an `aria-label` of `Close`.',
    starter: { html: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>Notice</title>\n</head>\n<body>\n  <img src="https://picsum.photos/120/80">\n  <p>Classes start on Sunday.</p>\n  <button>✕</button>\n</body>\n</html>\n', css: '' },
    solution: { html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Notice</title>\n</head>\n<body>\n  <img src="https://picsum.photos/120/80" alt="A classroom">\n  <p>Classes start on Sunday.</p>\n  <button aria-label="Close">✕</button>\n</body>\n</html>\n', css: '' },
    checks: [
      { label: 'The page says its language', selector: 'html', expect: 'attr', attr: 'lang' },
      { label: 'The image has alt text', selector: 'img', expect: 'attr', attr: 'alt' },
      { label: 'The button is labelled "Close"', selector: 'button', expect: 'attr', attr: 'aria-label', value: 'Close' },
    ],
    hints: ['`<html lang="en">`', 'A button with only a symbol needs words for screen readers: `aria-label="Close"`.'],
  },
];

export const WEB: WebChallenge[] = W.map((c) => ({ ...c, lang: 'web' }));
