'use strict';
(() => {
 document.getElementById('year').textContent=String(new Date().getFullYear());
 const nav=document.getElementById('nav-toggle'),links=document.getElementById('nav-links');
 nav.addEventListener('click',()=>{const open=links.classList.toggle('open');nav.setAttribute('aria-expanded',String(open));});
 links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');nav.setAttribute('aria-expanded','false');}));
})();
