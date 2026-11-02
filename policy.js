'use strict';
(() => {
  let data;
  const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
  function render(){
    if(!data)return;
    const key=location.hash==='#terms'?'terms':'safety';
    for(const name of ['terms','safety'])document.getElementById('policy-'+name).setAttribute('aria-current',String(name===key));
    const content=document.getElementById('policy-content');content.replaceChildren();
    for(const section of data[key]){
      const card=el('section','');card.className='policy-card';card.append(el('h2',section.title));
      for(const p of section.paragraphs||[])card.append(el('p',p));
      if(section.items){const list=el('ul','');for(const item of section.items)list.append(el('li',item));card.append(list);}content.append(card);
    }
  }
  fetch('/policies_ar.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{data=value;document.getElementById('policy-updated').textContent='آخر تحديث: '+data.updated;render();}).catch(()=>{const p=document.getElementById('policy-content');p.textContent='تعذّر تحميل المحتوى. أعد تحميل الصفحة، أو راسل support@werochat.app.';});
  window.addEventListener('hashchange',render);
})();
