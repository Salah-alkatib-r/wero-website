'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let csrf = '', model = null, view = 'rooms';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date = value => value ? new Date(value).toLocaleDateString('ar') : '—';
  function notice(text) { $('notice').textContent = text; $('notice').hidden = false; }
  const errors = { 'strong-password-required':'استخدم كلمة مرور من 14 حرفًا على الأقل تتضمن حرفًا ورقمًا أو رمزًا.', 'invalid-username':'اسم المستخدم غير مقبول.', 'future-expiry-required':'حدد تاريخ انتهاء في المستقبل.', 'name-owner-required':'يمكنك تعديل الأسماء التي أنشأتها فقط.', 'username-already-reserved':'اسم المستخدم محجوز.', 'invalid-panel-credentials':'اسم المستخدم أو كلمة المرور غير صحيحين، أو انتهت صلاحية اللوحة.', 'authentication-required':'انتهت الجلسة. سجّل الدخول مجددًا.', 'too-many-attempts':'محاولات كثيرة. انتظر 15 دقيقة.', 'origin-not-allowed':'لم يُضبط عنوان اللوحة في الخادم بعد.', 'room-scope-required':'لا توجد صلاحية لهذه الغرفة.', 'csrf-required':'حدّث الصفحة ثم أعد المحاولة.', 'request-already-pending':'يوجد طلب قيد الانتظار لهذه الغرفة.', 'root-name-required':'هذا الحساب غير مرتبط باسم روت فعال.' };
  async function api(path, body) {
    const response = await fetch(`/root-api/${path}`, { method: body ? 'POST':'GET', credentials:'same-origin', cache:'no-store',
      headers: body ? {'Content-Type':'application/json','X-Wero-CSRF':csrf} : {}, body: body ? JSON.stringify(body):undefined });
    let payload;
    try { payload = await response.json(); } catch { throw Error('خدمة لوحة الروت غير متاحة حاليًا.'); }
    if (!response.ok || payload.ok === false) {
      if (response.status === 401) { model = null; $('login').hidden=false; $('dashboard').hidden=true; }
      throw Error(errors[payload.error] || payload.error || 'تعذر تنفيذ الطلب');
    }
    if (payload.csrf) csrf = payload.csrf;
    return payload;
  }
  function table(head, rows) { return `<div class="table"><table><thead><tr>${head.map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody>${rows.join('') || '<tr><td>لا توجد بيانات</td></tr>'}</tbody></table></div>`; }
  async function load() {
    model = await api('me'); $('login').hidden=true; $('dashboard').hidden=false;
    $('identity').textContent = `${model.panel.username} · ${date(model.panel.expiresAt)}`; render();
  }
  function render() {
    if (view === 'rooms') {
      $('content').innerHTML = '<h2>الغرف</h2><div class="grid">' + model.rooms.map(r=>`<article class="room"><h3>${esc(r.name)}</h3><button data-room="${esc(r.key)}">إدارة الغرفة</button></article>`).join('')+'</div>';
    } else if (view === 'names') {
      $('content').innerHTML = '<h2>أسماء الروت</h2>'+table(['الاسم','الصلاحية','الحالة',''],model.names.map(n=>`<tr><td class="root-name">${esc(n.username)}</td><td>${date(n.expiresAt)}</td><td>${n.enabled&&n.expiresAt>Date.now()?'فعال':'متوقف'}</td><td>${n.issuedBy===model.panel.username.normalize('NFKC').trim().toLocaleLowerCase()?`<button data-edit-name="${esc(n.username)}">تعديل / تجديد</button> <button class="danger" data-delete-name="${esc(n.username)}">حذف</button>`:''}</td></tr>`))+
        '<h3>إضافة / تجديد اسم</h3><form id="nameForm"><label>اسم المستخدم<input name="username" maxlength="30" required></label><label>كلمة المرور<input name="password" type="password" autocomplete="new-password" placeholder="14 حرفًا على الأقل؛ اتركها فارغة عند التجديد"></label><label>تاريخ الانتهاء<input name="expiresAt" type="date" required></label><label>الحالة<select name="enabled"><option value="true">فعال</option><option value="false">متوقف</option></select></label><button>حفظ</button><button type="reset" class="secondary">مسح الحقول</button></form><p class="muted">لا تتجاوز صلاحية الأسماء التي تنشئها تاريخ انتهاء اشتراك اللوحة. إضافة الاسم لغرفة أخرى تحتاج موافقة مالكها.</p>'+table(['الاسم','الغرفة','الصلاحية',''],model.grants.map(g=>`<tr><td class="root-name">${esc(g.username)}</td><td>${esc(model.rooms.find(r=>r.key===g.roomKey)?.name || g.roomKey)}</td><td>${date(g.expiresAt)}</td><td>${model.panel.ownerRooms.includes(g.roomKey)?`<button class="danger" data-revoke="${esc(g.username)}" data-key="${esc(g.roomKey)}">إلغاء</button>`:''}</td></tr>`))+
        (model.panel.ownerRooms.length?`<h3>إضافة اسم إلى غرفتي</h3><form id="grantForm"><label>اسم الروت<select name="username">${model.names.map(n=>`<option>${esc(n.username)}</option>`).join('')}</select></label><label>الغرفة<select name="roomKey">${model.rooms.filter(r=>model.panel.ownerRooms.includes(r.key)).map(r=>`<option value="${esc(r.key)}">${esc(r.name)}</option>`).join('')}</select></label><label>تاريخ الانتهاء<input name="expiresAt" type="date" required></label><button>إضافة / تجديد</button></form>`:'');
    } else {
      $('content').innerHTML = '<h2>طلبات الروت</h2>' + `<form id="requestForm"><label>اسم الروت<select name="username">${model.names.filter(n=>n.issuedBy===model.panel.username.normalize('NFKC').trim().toLocaleLowerCase()||n.username===model.panel.rootUsername).map(n=>`<option>${esc(n.username)}</option>`).join('')}</select></label><label>الغرفة<select name="roomKey">${model.availableRooms.map(r=>`<option value="${esc(r.key)}">${esc(r.name)}</option>`).join('')}</select></label><button>طلب إضافة الروت</button></form>`+
        table(['الاسم','الغرفة','الحالة',''],model.requests.map(r=>`<tr><td class="root-name">${esc(r.username)}</td><td>${esc(model.availableRooms.find(x=>x.key===r.roomKey)?.name || r.roomKey)}</td><td>${esc({pending:'قيد الانتظار',approved:'مقبول',rejected:'مرفوض'}[r.status])}</td><td>${r.status==='pending'&&model.panel.ownerRooms.includes(r.roomKey)?`<input type="date" data-expiry="${esc(r.id)}" aria-label="تاريخ الانتهاء"><button data-approve="${esc(r.id)}">قبول</button> <button class="secondary" data-reject="${esc(r.id)}">رفض</button>`:''}</td></tr>`));
    }
  }
  async function room(key) {
    const data = await api(`rooms/${encodeURIComponent(key)}/manage`);
    const base = `rooms/${encodeURIComponent(key)}/`;
    $('content').innerHTML = `<button id="back" class="secondary">الغرف</button><h2>${esc(data.room?.name || data.name || '')}</h2><div class="actions"><button id="accounts">الحسابات</button><button id="bans">الحظر</button><button id="logs">السجلات</button></div><div id="roomDetail"></div>`;
    $('back').onclick = render;
    $('accounts').onclick = () => {
      $('roomDetail').innerHTML = '<h3>الحسابات</h3>'+table(['الاسم','الرتبة',''],(data.accounts||[]).map(a=>`<tr><td>${esc(a.username)}</td><td>${esc(a.roleCode)}</td><td>${a.protected?'':`<button class="danger" data-delete-account="${esc(a.username)}">حذف</button>`}</td></tr>`))+
        '<form id="accountForm"><label>اسم المستخدم<input name="username" required></label><label>كلمة المرور<input name="password" type="password" autocomplete="new-password" required></label><label>الرتبة<select name="roleCode"><option value="1">Member</option><option value="2">Administrator</option><option value="3">Super Admin</option><option value="4">Master</option><option value="5">Master (Girl)</option></select></label><button>إضافة حساب</button></form>';
      $('accountForm').onsubmit = async e => { e.preventDefault(); try { const b=Object.fromEntries(new FormData(e.target)); b.roleCode=Number(b.roleCode); await api(base+'manage/accounts',{...b,action:'add',flags:'',machineLock:false}); await room(key); $('accounts').click(); } catch(err) {notice(err.message);} };
      $('roomDetail').querySelectorAll('[data-delete-account]').forEach(el=>el.onclick=async()=>{if(!confirm('حذف الحساب؟'))return;try{await api(base+'manage/accounts',{action:'delete',username:el.dataset.deleteAccount});await room(key);$('accounts').click();}catch(err){notice(err.message);}});
    };
    $('bans').onclick=()=>{ $('roomDetail').innerHTML='<h3>الحظر</h3>'+table(['الاسم','العنوان'],(data.bannedUsers||[]).map(b=>`<tr><td>${esc(b.username)}</td><td>${esc(b.ip||b.clientId||'')}</td></tr>`)); };
    $('logs').onclick=()=>{ $('roomDetail').innerHTML='<h3>السجلات</h3><pre id="logData"></pre>'; $('logData').textContent=JSON.stringify({login:data.loginHistory,administration:data.adminHistory},null,2); };
  }
  $('loginForm').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{await api('login',Object.fromEntries(new FormData(e.target)));e.target.reset();$('notice').hidden=true;await load();}catch(err){notice(err.message);}finally{button.disabled=false;}};
  $('logout').onclick=async()=>{try{await api('logout',{});csrf='';model=null;$('login').hidden=false;$('dashboard').hidden=true;}catch(err){notice(err.message);}};
  document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{view=button.dataset.view;render();});
  $('content').addEventListener('submit',async e=>{
    const type=e.target.id;if(!['requestForm','nameForm','grantForm'].includes(type))return;
    e.preventDefault();try{const body=Object.fromEntries(new FormData(e.target));
      if(type==='requestForm')await api('requests',{command:'request',...body});
      else {body.expiresAt=Date.parse(body.expiresAt+'T23:59:59');if(type==='nameForm'){body.enabled=body.enabled==='true';await api('names',{...body,command:'save-name'});}else await api('grants',{...body,command:'grant'});}
      await load();notice('حُفظ التغيير.');
    }catch(err){notice(err.message);}
  });
  $('content').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;try{
    if(b.dataset.room){await room(b.dataset.room);return;}
    if(b.dataset.editName){const n=model.names.find(x=>x.username===b.dataset.editName);const form=$('nameForm');form.elements.username.value=n.username;form.elements.expiresAt.value=new Date(n.expiresAt).toISOString().slice(0,10);form.elements.enabled.value=String(n.enabled);form.elements.password.value='';form.scrollIntoView({behavior:'smooth'});return;}
    if(b.dataset.deleteName){if(!confirm('حذف اسم الروت ومنحه؟'))return;await api('names',{command:'delete-name',username:b.dataset.deleteName});await load();return;}
    if(b.dataset.revoke){if(!confirm('إلغاء الروت في هذه الغرفة؟'))return;await api('grants',{command:'revoke',username:b.dataset.revoke,roomKey:b.dataset.key});}
    else if(b.dataset.approve){const input=[...document.querySelectorAll('[data-expiry]')].find(el=>el.dataset.expiry===b.dataset.approve);if(!input.value)throw Error('حدد تاريخ انتهاء الصلاحية');await api('requests',{command:'approve',id:b.dataset.approve,expiresAt:Date.parse(input.value+'T23:59:59')});}
    else if(b.dataset.reject)await api('requests',{command:'reject',id:b.dataset.reject});else return;
    await load();
  }catch(err){notice(err.message);}});
  load().catch(err=>{if(!err.message.includes('انتهت الجلسة'))notice(err.message);});
})();
