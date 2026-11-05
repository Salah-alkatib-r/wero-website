// Fixed public release allowlist: never forwards user-supplied URLs or credentials.
const release = 'android-6041';
const androidFile = 'Wero-1.0.6-6041.apk';
const files = {
  'wero-android.apk': { release, file: androidFile, type: 'application/vnd.android.package-archive' },
  'wero-alternative.apk': { release, file: androidFile, type: 'application/vnd.android.package-archive' },
  'wero-universal.apk': { release, file: androidFile, type: 'application/vnd.android.package-archive' },
  'wero-windows.zip': { release: 'windows-1.0.2', file: 'Wero-Windows-1.0.2.zip', type: 'application/zip' },
  'wero-windows.exe': { release: 'windows-1.0.11', file: 'Wero-Setup-1.0.11.exe', type: 'application/vnd.microsoft.portable-executable' },
};

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const name = url.pathname.slice('/download/'.length);
  if (!Object.hasOwn(files, name)) return new Response('Not found', { status: 404 });
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  let asset = files[name];
  const platform=name==='wero-windows.exe'?'windows':['wero-android.apk','wero-alternative.apk','wero-universal.apk'].includes(name)?'android':null;
  let expectedSha='';
  if(platform){
    try{
      const catalog=await fetch('https://wero-test.159.195.11.245.nip.io/api/v1/app/releases',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});
      if(catalog.status!==404){
        if(!catalog.ok)throw Error('catalog-unavailable');
        const data=await catalog.json();if(data.schema!=='wero-app-releases-v1'||data.ok!==true)throw Error('invalid-catalog');
        const entry=data.platforms?.[platform];
        if(entry){if(!/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isSafeInteger(entry.bytes)||entry.bytes<1||entry.bytes>536870912)throw Error('invalid-catalog');
          expectedSha=entry.sha256;asset={...asset,url:`https://wero-test.159.195.11.245.nip.io/api/v1/app/download/${platform}/${entry.sha256}`};}
      }
      catalog.body?.cancel().catch(()=>{});
    }catch{return new Response('تعذر التحقق من النسخة المتاحة. حاول مجددًا بعد قليل.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Wero-Publisher':'v1'}});}
  }
  const headers = new Headers({ Accept: 'application/octet-stream', 'Accept-Encoding':'identity', 'User-Agent': 'Wero-Official-Downloads' });
  for (const name of ['Range', 'If-Range']) if (request.headers.has(name)) headers.set(name, request.headers.get(name));
  try {
    const upstream = await fetch(asset.url||`https://github.com/Salah-alkatib-r/wero-website/releases/download/${asset.release}/${asset.file}`, {
      method: request.method, headers, redirect: 'follow',
    });
    if (![200, 206, 416].includes(upstream.status)) {
      upstream.body?.cancel();
      return new Response('تعذّر بدء التنزيل. أعد المحاولة بعد قليل.', { status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store','X-Wero-Publisher':'v1' } });
    }
    const result = new Headers({
      'Content-Type': asset.type,
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
      'X-Wero-Publisher': 'v1',
    });
    if(expectedSha)result.set('X-Wero-Release-Sha256',expectedSha);
    for (const name of ['Content-Length', 'Content-Range', 'ETag', 'Last-Modified']) {
      if (upstream.headers.has(name)) result.set(name, upstream.headers.get(name));
    }
    // Stream the APK. Buffering it would exceed worker memory on the universal APK.
    return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers: result });
  } catch (_) {
    return new Response('تعذّر الاتصال بخادم التنزيل. حاول مجددًا.', { status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store','X-Wero-Publisher':'v1' } });
  }
}
