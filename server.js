const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const KEY = process.env.OPENAI_API_KEY;
const ROOT = path.join(__dirname, 'public');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.svg':'image/svg+xml'};
function send(res,status,body,headers={}){res.writeHead(status,headers);res.end(body)}
const server=http.createServer(async(req,res)=>{
 if(req.method==='POST' && req.url==='/api/generate'){
  if(!KEY)return send(res,503,JSON.stringify({error:'OPENAI_API_KEY belum disetel. Lihat README untuk cara menjalankan server.'}),{'Content-Type':'application/json'});
  let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>100000){req.destroy()}});req.on('end',async()=>{
   try{const body=JSON.parse(raw);const prompt=String(body.prompt||'').slice(0,10000);const size=['1024x1024','1024x1536','1536x1024'].includes(body.size)?body.size:'1024x1024';const quality=['low','medium','high'].includes(body.quality)?body.quality:'medium';const n=Math.max(1,Math.min(4,Number(body.n)||1));if(!prompt.trim())return send(res,400,JSON.stringify({error:'Prompt kosong.'}),{'Content-Type':'application/json'});
    const api=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{'Authorization':`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-image-2',prompt,size,quality,n,output_format:'png'})});
    const json=await api.json();if(!api.ok){const msg=json?.error?.message||`OpenAI API error (${api.status})`;return send(res,api.status,JSON.stringify({error:msg}),{'Content-Type':'application/json'});}
    const images=(json.data||[]).map(x=>x.b64_json).filter(Boolean).map(b64=>'data:image/png;base64,'+b64);send(res,200,JSON.stringify({images}),{'Content-Type':'application/json'});
   }catch(err){send(res,500,JSON.stringify({error:err.message||'Server error'}),{'Content-Type':'application/json'})}
  });return;
 }
 let reqPath=decodeURIComponent(req.url.split('?')[0]);if(reqPath==='/')reqPath='/index.html';const file=path.join(ROOT,reqPath.replace(/^\/+/,''));if(!file.startsWith(ROOT))return send(res,403,'Forbidden');fs.readFile(file,(err,data)=>{if(err)return send(res,404,'Not found');send(res,200,data,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'})});
});server.listen(PORT,()=>console.log(`Keyrus Studio V4 running at http://localhost:${PORT}`));
