'use strict';
(() => {
  // Version labels follow the authenticated publisher's public catalog.
  // Download links remain the same first-party URLs on every release.
  let loading=false,lastLoaded=0;
  const loadReleases=()=>{
    if(loading||Date.now()-lastLoaded<5000)return;
    loading=true;
    fetch('/downloads.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
    for(const platform of ['android','windows']){
      const entry=data[platform];if(!entry||typeof entry.version!=='string')continue;
      const selector=platform==='windows'?'.platform-spec b':'[data-android-version]';
      document.querySelectorAll(selector).forEach(node=>{node.textContent=entry.version;});
      const bytes=Number(entry.bytes),size=Number.isSafeInteger(bytes)&&bytes>0?
        (bytes/1048576).toLocaleString('en-US',{maximumFractionDigits:1})+' MB':'';
      const details=platform==='android'?['الإصدار '+entry.version,'نسخة شاملة',size].filter(Boolean).join(' · '):size;
      document.querySelectorAll('[data-release-details="'+platform+'"]').forEach(node=>{node.textContent=details;});
      if(platform==='windows'){const button=document.querySelector('a[href="/download/wero-windows.exe"]');if(button){button.replaceChildren(document.createTextNode('تحميل ويندوز '+entry.version+' '));const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='↙';button.appendChild(arrow);}}
    }
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try{const graph=JSON.parse(script.textContent);const update=value=>{if(!value||typeof value!=='object')return;if(value['@type']==='SoftwareApplication'){const platform=/Windows/i.test(value.operatingSystem||'')?'windows':/Android/i.test(value.operatingSystem||'')?'android':null;if(platform&&data[platform]?.version)value.softwareVersion=data[platform].version;}for(const child of Object.values(value))if(typeof child==='object'){if(Array.isArray(child))child.forEach(update);else update(child);}};update(graph);script.textContent=JSON.stringify(graph);}catch{}
    });
    }).catch(()=>{}).finally(()=>{loading=false;lastLoaded=Date.now();});
  };
  loadReleases();
  window.addEventListener('pageshow',loadReleases);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadReleases();});
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
