const ALLOWED_ORIGIN="https://roditiozz.github.io";
const cors=()=>({"Access-Control-Allow-Origin":ALLOWED_ORIGIN,"Access-Control-Allow-Methods":"GET,POST,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type,X-Zone,X-Place,X-Filename"});
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json",...cors()}});
const clean=(s,f)=>(s||f).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._ -]/g,"").trim().replace(/\s+/g,"-").slice(0,80)||f;
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors()});
 if(u.pathname==="/health") return reply({ok:true,service:"viaje-japon-fotos"});
 if(u.pathname==="/upload"&&request.method==="POST"){
  const type=request.headers.get("Content-Type")||"";
  if(!type.startsWith("image/") && !type.startsWith("video/")) return reply({error:"Solo imagenes o videos"},415);
  const zone=clean(request.headers.get("X-Zone"),"Sin-zona"), place=clean(request.headers.get("X-Place"),"Sin-lugar");
  const original=request.headers.get("X-Filename")||"foto.jpg";
  const ext=(original.match(/\.([a-zA-Z0-9]{2,5})$/)||[])[1]||"jpg";
  const key=`Japon-2026/${zone}/${place}/${new Date().toISOString().replace(/[:.]/g,"-")}_${crypto.randomUUID().slice(0,8)}.${ext.toLowerCase()}`;
  await env.FOTOS.put(key,request.body,{httpMetadata:{contentType:type},customMetadata:{zone,place,originalName:original}});
  return reply({ok:true,key,zone,place},201);
 }
 if(u.pathname==="/photo"&&request.method==="GET"){
  const key=u.searchParams.get("key"); if(!key)return reply({error:"Falta key"},400);
  const obj=await env.FOTOS.get(key); if(!obj)return reply({error:"No encontrada"},404);
  const h=new Headers(cors()); obj.writeHttpMetadata(h); h.set("ETag",obj.httpEtag); return new Response(obj.body,{headers:h});
 }
 if(u.pathname==="/delete"&&request.method==="DELETE"){
  const key=u.searchParams.get("key"); if(!key)return reply({error:"Falta key"},400);
  await env.FOTOS.delete(key); return reply({ok:true,deleted:key});
 }
 return reply({ok:true,message:"Worker fotos Viaje Japon"});
}};
