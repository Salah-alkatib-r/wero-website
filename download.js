'use strict';
(() => {
  const year=document.getElementById('year');
  if(year)year.textContent=String(new Date().getFullYear());
  const nav=document.getElementById('nav-toggle'),links=document.getElementById('nav-links');
  if(!nav||!links)return;
  const close=()=>{links.classList.remove('open');nav.setAttribute('aria-expanded','false');};
  nav.addEventListener('click',()=>{const open=links.classList.toggle('open');nav.setAttribute('aria-expanded',String(open));});
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&links.classList.contains('open')){close();nav.focus();}});
  document.addEventListener('click',event=>{if(!nav.contains(event.target)&&!links.contains(event.target))close();});
})();
