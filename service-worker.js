const CACHE_NAME='v37-home-group-lower';
const RUNTIME_CACHE='viaje-japon-runtime-v37-home-group-lower';
const APP_SHELL=[
 './','./index.html','./manifest.json','./manifest-rcoronel.json','./manifest-ldambra.json','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png','./splash-viaje-japon.png','./home-bg.png',
 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await Promise.allSettled(APP_SHELL.map(async url=>{
   try{
    const req=new Request(url,{cache:'reload'});
    const res=await fetch(req);
    if(res&&(res.ok||res.type==='opaque'))await cache.put(req,res.clone());
   }catch(e){}
  }));
  const index=await fetch('./index.html',{cache:'reload'});
  if(index.ok)await cache.put('./index.html',index.clone());
 })());
 self.skipWaiting();
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>![CACHE_NAME,RUNTIME_CACHE].includes(k)).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const req=event.request;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const res=await fetch(req);
    if(res&&res.ok){const c=await caches.open(CACHE_NAME);await c.put('./index.html',res.clone());}
    return res;
   }catch(e){return (await caches.match('./index.html'))||(await caches.match('./'))||Response.error();}
  })());
  return;
 }
 const u=new URL(req.url);
 const shell=u.origin===self.location.origin||u.hostname==='unpkg.com'||u.hostname==='cdn.jsdelivr.net';
 const runtime=req.destination==='image'||u.hostname.endsWith('tile.openstreetmap.org');
 if(shell){
  event.respondWith((async()=>{
   const cached=await caches.match(req);
   if(cached)return cached;
   try{
    const res=await fetch(req);
    if(res&&(res.ok||res.type==='opaque')){const c=await caches.open(CACHE_NAME);await c.put(req,res.clone());}
    return res;
   }catch(e){return cached||Response.error();}
  })());
 }else if(runtime){
  event.respondWith((async()=>{
   const c=await caches.open(RUNTIME_CACHE);
   const cached=await c.match(req);
   if(cached)return cached;
   try{
    const res=await fetch(req);
    if(res&&(res.ok||res.type==='opaque'))await c.put(req,res.clone());
    return res;
   }catch(e){return cached||Response.error();}
  })());
 }
});
