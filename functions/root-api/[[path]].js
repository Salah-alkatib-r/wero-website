// Cloudflare Pages: configure WERO_ROOT_API_ORIGIN as the HTTPS Wero backend origin.
export async function onRequest({ request, env }) {
  const input = new URL(request.url);
  let upstream;
  try { upstream = new URL(env.WERO_ROOT_API_ORIGIN); } catch { return new Response('Root API is not configured', {status:503}); }
  if (upstream.protocol !== 'https:' || upstream.username || upstream.password || upstream.pathname !== '/' || upstream.search || upstream.hash) return new Response('Invalid API origin', {status:503});
  if (!input.pathname.startsWith('/root-api/')) return new Response('Not found', {status:404});
  if (typeof env.WERO_ROOT_PROXY_KEY !== 'string' || env.WERO_ROOT_PROXY_KEY.length < 32) return new Response('Root proxy key is not configured', {status:503});
  const headers = new Headers();
  headers.set('X-Wero-Root-Proxy',env.WERO_ROOT_PROXY_KEY);
  headers.set('X-Wero-Root-Client',request.headers.get('CF-Connecting-IP') || 'unknown');
  for (const key of ['content-type','cookie','x-wero-csrf','sec-fetch-site']) if(request.headers.has(key)) headers.set(key,request.headers.get(key));
  // Preserve only our own origin. A cross-origin caller never receives a trusted Origin.
  const origin = request.headers.get('Origin');
  if (origin && origin !== input.origin) return new Response('Forbidden', {status:403});
  if (origin) headers.set('Origin', origin);
  upstream.pathname = input.pathname; upstream.search = input.search;
  const response = await fetch(upstream, {method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,redirect:'manual'});
  const result = new Headers();
  for (const key of ['content-type','set-cookie']) if(response.headers.has(key))result.set(key,response.headers.get(key));
  result.set('Cache-Control','no-store');result.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers:result});
}
