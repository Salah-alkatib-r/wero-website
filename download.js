'use strict';
(() => {
  const $=id=>document.getElementById(id), api=window.WeroDevices;
  const dialog=$('download-dialog'), result=$('download-result');
  let releasePromise, detectionPromise;
  const element=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
  const say=text=>{result.replaceChildren(element('p',text));};
  function loadRelease(){
    if(!releasePromise)releasePromise=fetch('/downloads.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('manifest');return r.json();}).catch(e=>{releasePromise=null;throw e;});
    return releasePromise;
  }
  function detect(){
    if(!detectionPromise)detectionPromise=(async()=>{
      const data=navigator.userAgentData;
      if(data?.getHighEntropyValues){
        try {return await data.getHighEntropyValues(['architecture','bitness','model','platformVersion']);}catch(_){/* No permission or unavailable data: universal is safe. */}
      }
      return {platform:/Android/i.test(navigator.userAgent)?'Android':'',model:'',architecture:'',bitness:''};
    })();
    return detectionPromise;
  }
  async function offer(abi,label){
    say('جارٍ تجهيز رابط التحميل…');
    try{
      const manifest=await loadRelease();
      if(!manifest.published){say('ملفات الإصدار قيد التجهيز للنشر. يمكنك التواصل مع خدمة العملاء للحصول على النسخة.');return;}
      const file=manifest.files[abi] || manifest.files.universal;
      const url=new URL(file.url);
      if(url.protocol!=='https:' || !['github.com','objects.githubusercontent.com','downloads.werochat.app'].includes(url.hostname))throw Error('download host');
      result.replaceChildren(element('b',label || 'نسختك جاهزة'));
      result.append(element('p',abi==='universal'?'تعذّر تأكيد المعمارية. النسخة الشاملة تضم المعماريات المدعومة، وتناسب الأجهزة عند عدم معرفة نوع النظام.':'هذه النسخة اختيرت وفق معلومات النظام التي أتاحها متصفح أندرويد. يمكنك اختيار النسخة الشاملة إذا لم تتثبت.'));
      const link=element('a',`تحميل Wero · ${(file.bytes/1048576).toFixed(1)} MB`,'button');link.href=url.href;link.rel='noopener';link.download='Wero.apk';result.append(link);
      result.append(element('p',`متوافق مع Android ${manifest.minimumAndroid} وأحدث`));
      if(abi!=='universal'){
        const fallback=element('button','أحتاج النسخة الشاملة','inline-button');fallback.addEventListener('click',()=>offer('universal','النسخة الشاملة'));result.append(fallback);
      }
    }catch(_){say('تعذّر جلب رابط التنزيل. تأكد من اتصالك وأعد المحاولة.');const retry=element('button','إعادة المحاولة','inline-button');retry.addEventListener('click',()=>offer(abi,label));result.append(retry);}
  }
  function confirmDevice(label,abi){
    result.replaceChildren(element('b','هل هاتفك '+label+'؟'));
    const yes=element('button','نعم، هذا هاتفي','button');yes.addEventListener('click',()=>offer(abi,'نسخة Wero لهاتفك'));
    const no=element('button','لا، سأختار جهازًا آخر','button secondary');no.addEventListener('click',()=>{result.replaceChildren();$('device-search').focus();switchTab('search');});result.append(yes,no);result.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  async function selectModel(model){
    // Never infer OS bitness from a marketing name or the desktop used to search.
    const hints=await detect();let abi='universal';
    const matching=hints.model && api.search(hints.model).some(m=>m.id===model.id);
    if(matching)abi=api.chooseAbi(hints);
    confirmDevice(model.ar+' — '+model.en,abi);
  }
  function renderModels(target,models,empty){
    target.replaceChildren();
    if(!models.length){target.append(element('p',empty,'empty-results'));return;}
    for(const model of models.slice(0,150)){
      const b=element('button',undefined,'model-button');b.type='button';b.append(element('b',model.ar),element('small',model.en+(model.aliases.length?' · '+model.aliases.join(' / '):'')));
      b.addEventListener('click',()=>selectModel(model));target.append(b);
    }
  }
  function switchTab(name){
    for(const key of ['list','search']){
      const on=key===name;$('tab-'+key).setAttribute('aria-selected',String(on));$('tab-'+key).tabIndex=on?0:-1;$('panel-'+key).hidden=!on;
    }
  }
  $('year').textContent=String(new Date().getFullYear());
  for(const b of api.brands){const o=element('option',b.ar+' — '+b.en);o.value=b.id;$('brand-select').append(o);}
  const filter=()=>renderModels($('brand-models'),$('brand-select').value?api.search($('model-filter').value,$('brand-select').value):[],$('brand-select').value?'لم نجد هذا الطراز. جرّب البحث أو النسخة الشاملة.':'اختر الشركة لتظهر الطرازات.');
  $('brand-select').addEventListener('change',()=>{$('model-filter').value='';filter();});$('model-filter').addEventListener('input',filter);filter();
  const search=()=>{const q=$('device-search').value.trim();renderModels($('search-results'),q?api.search(q):[],q?'لا توجد مطابقة مؤكدة. تحقّق من الاسم في «حول الهاتف»، أو اختر النسخة الشاملة.':'اكتب اسم هاتفك أو رقم طرازه.');};
  $('search-form').addEventListener('submit',e=>{e.preventDefault();search();});$('device-search').addEventListener('input',search);
  for(const name of ['list','search']){
    $('tab-'+name).addEventListener('click',()=>switchTab(name));
    $('tab-'+name).addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();const next=name==='list'?'search':'list';switchTab(next);$('tab-'+next).focus();}});
  }
  document.querySelectorAll('[data-download]').forEach(b=>b.addEventListener('click',()=>{dialog.showModal();document.body.classList.add('dialog-open');}));
  $('close-download').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)dialog.close();}});
  $('detect-device').addEventListener('click',async()=>{
    say('جارٍ قراءة معلومات الهاتف المتاحة…');
    const hints=await detect();
    if(hints.platform!=='Android'){say('افتح هذه الصفحة من هاتف أندرويد للكشف التلقائي، أو اختر جهازك من القائمة.');return;}
    const found=hints.model?api.search(hints.model):[];
    const label=found.length===1?found[0].ar:(hints.model || 'أندرويد الذي تستخدمه الآن');confirmDevice(label,api.chooseAbi(hints));
  });
  $('universal-download').addEventListener('click',()=>offer('universal','النسخة الشاملة'));
  const nav=$('nav-toggle');nav.addEventListener('click',()=>{const open=$('nav-links').classList.toggle('open');nav.setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('#nav-links a').forEach(a=>a.addEventListener('click',()=>{$('nav-links').classList.remove('open');nav.setAttribute('aria-expanded','false');}));
  loadRelease().then(m=>{$('release-summary').textContent=m.published?`نسخة أندرويد الرسمية · Android ${m.minimumAndroid}+`:'نسخة أندرويد الرسمية · يجري تجهيز روابط النشر';}).catch(()=>{});
})();
