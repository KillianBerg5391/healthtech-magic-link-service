import { createServer } from "node:http";
import { requestMagicLink } from "./magic_link.ts";

const server = createServer(async (req,res)=>{
  if (req.method !== "POST" || req.url !== "/appointment/magic-link") { res.writeHead(404).end(); return; }
  let body=""; for await (const chunk of req) body += chunk;
  try { const result = await requestMagicLink(JSON.parse(body)); res.writeHead(result.status,{"content-type":"application/json"}).end(JSON.stringify(result.body)); }
  catch { res.writeHead(502,{"content-type":"application/json"}).end(JSON.stringify({ok:false,message:"Sign-in service unavailable"})); }
});
server.listen(Number(process.env.PORT ?? 3000), ()=>console.log("Listening on http://localhost:"+(process.env.PORT ?? 3000)));
