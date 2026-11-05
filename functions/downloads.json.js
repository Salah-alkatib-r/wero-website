const defaults={
 android:{url:'/download/wero-android.apk',bytes:85252492,sha256:'3d1f1dbad4ad56fab8351a78a1ce13656dc69df4b4d399156f8f5da6e4e21a77',version:'1.0.6 (6041)'},
 windows:{url:'/download/wero-windows.exe',bytes:35387943,sha256:'c279fdd622b121cdf4c60db61a0bf17abebff25fb9c7de8c0216245488a8be2c',version:'1.0.11'}
};
export async function onRequest({request}){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Wero-Publisher':'v1','X-Content-Type-Options':'nosniff'};
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 try{
  const response=await fetch('https://wero-test.159.195.11.245.nip.io/api/v1/app/releases',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  const result=JSON.parse(JSON.stringify(defaults));
  if(response.status!==404){
   if(!response.ok)throw Error('catalog-unavailable');
   const data=await response.json();if(data.ok!==true||data.schema!=='wero-app-releases-v1')throw Error('invalid-catalog');
   for(const platform of ['android','windows']){const entry=data.platforms?.[platform];if(!entry)continue;
    if(!/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isSafeInteger(entry.bytes)||entry.bytes<1||entry.bytes>536870912||typeof entry.version!=='string'||entry.version.length>80||/[\u0000-\u001f<>]/.test(entry.version))throw Error('invalid-catalog');
    result[platform]={url:defaults[platform].url,bytes:entry.bytes,sha256:entry.sha256,version:entry.version};
   }
  }else response.body?.cancel().catch(()=>{});
  return new Response(request.method==='HEAD'?null:JSON.stringify(result),{headers});
 }catch{return new Response(request.method==='HEAD'?null:JSON.stringify({ok:false,error:'release-catalog-unavailable'}),{status:503,headers});}
}
