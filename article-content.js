/* SNUDI-FO 30 — rendu sûr des articles enrichis (sans dépendances externes). */
(function () {
  'use strict';
  const TAGS = new Set(['P','DIV','BR','H2','H3','H4','B','STRONG','I','EM','U','UL','OL','LI','BLOCKQUOTE','FIGURE','FIGCAPTION','IMG','A']);
  const DISCARD = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON','VIDEO','AUDIO','TEMPLATE','META','LINK']);
  const MEDIA = /^\.?\/?media\/(?:actualites|outils)\/[a-zA-Z0-9_-]+\.(?:webp|jpe?g|png)$/;
  function validMediaPath(value) {
    if (typeof value !== 'string' || value.length > 260 || value.includes('..') || /[%?#\\]/.test(value)) return false;
    return MEDIA.test(value);
  }
  function asPath(value) {
    return validMediaPath(value) ? './' + value.replace(/^\.\//, '').replace(/^\//, '') : '';
  }
  function safeHref(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' || u.protocol === 'mailto:' ? u.href : '';
    } catch { return ''; }
  }
  function sanitize(markup, options = {}) {
    if (typeof markup !== 'string') return '';
    const input = document.createElement('template');
    input.innerHTML = markup.slice(0, 160000);
    const output = document.createElement('div');
    let count = 0;
    function clean(node, dest, depth) {
      if (++count > 14000 || depth > 45) return;
      if (node.nodeType === Node.TEXT_NODE) { dest.append(document.createTextNode(node.textContent)); return; }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (DISCARD.has(node.tagName)) return;
      if (!TAGS.has(node.tagName)) { for (const ch of Array.from(node.childNodes)) clean(ch, dest, depth + 1); return; }
      const tag = node.tagName.toLowerCase();
      if (tag === 'img') {
        const src = node.getAttribute('src') || '';
        const accepted = asPath(src) || (options.allowBlobs && /^blob:(?:https?:\/\/|null\/)/.test(src) ? src : '');
        if (!accepted) return;
        const img = document.createElement('img');
        img.src = accepted;
        img.alt = (node.getAttribute('alt') || 'Illustration de l’article').slice(0, 180);
        img.loading = 'lazy'; img.decoding = 'async';
        dest.append(img); return;
      }
      const el = document.createElement(tag);
      if (tag === 'a') {
        const href = safeHref(node.getAttribute('href') || '');
        if (href) { el.href = href; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
      }
      for (const ch of Array.from(node.childNodes)) clean(ch, el, depth + 1);
      dest.append(el);
    }
    for (const ch of Array.from(input.content.childNodes)) clean(ch, output, 0);
    return output.innerHTML;
  }
  function imagePaths(markup) {
    const root = document.createElement('div');
    root.innerHTML = sanitize(markup);
    return [...new Set(Array.from(root.querySelectorAll('img')).map(i => asPath(i.getAttribute('src') || '')).filter(Boolean))];
  }
  window.SnudiArticle = Object.freeze({sanitize, asPath, validMediaPath, imagePaths});
})();
