const HTML = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RGB Anti-filter</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0b0d12;color:#f3f5f7;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:560px;margin:8vh auto;padding:24px}.card{background:#151923;border:1px solid #292f3d;border-radius:18px;padding:22px;box-shadow:0 15px 50px #0005}
h1{margin:0 0 8px;font-size:25px}.muted{color:#9da6b5;font-size:14px;line-height:1.8}
label{display:block;margin:18px 0 7px;font-size:14px}input{width:100%;padding:13px 14px;border-radius:12px;border:1px solid #343b4b;background:#0e1118;color:#fff;outline:none}
input:focus{border-color:#7184ff}button{width:100%;margin-top:20px;padding:13px;border:0;border-radius:12px;background:#6678ff;color:#fff;font-weight:700;font-size:15px;cursor:pointer}
button:disabled{opacity:.55}.result{margin-top:18px;display:none}.box{background:#0c0f15;border:1px solid #2d3442;border-radius:12px;padding:12px;word-break:break-all;font-size:13px;line-height:1.7}
.err{color:#ff8792;margin-top:14px}.ok{color:#79e2a8;margin-top:14px}.small{font-size:12px;color:#87909f;margin-top:10px}
</style>
</head>
<body>
<main><section class="card">
<h1>RGB Anti-filter</h1>
<div class="muted">نسخه‌ی مینیمال مکانیزم ساخت لینک اشتراک.</div>
<label>نام کاربری</label>
<input id="user" autocomplete="username" placeholder="مثلاً mahan">
<label>Cloudflare API Token</label>
<input id="token" type="password" autocomplete="off" placeholder="توکن را اینجا وارد کن">
<button id="go">ساخت لینک اشتراک</button>
<div id="msg"></div>
<div id="result" class="result">
  <div class="muted">لینک اشتراک:</div>
  <div id="link" class="box"></div>
  <button id="copy">کپی لینک</button>
  <div class="small">توکن در URL لینک قرار داده نمی‌شود؛ لینک با یک شناسه‌ی اشتراک جداگانه کار می‌کند.</div>
</div>
</section></main>
<script>
const $=x=>document.querySelector(x);
$("#go").onclick=async()=>{
  const user=$("#user").value.trim(), token=$("#token").value.trim();
  $("#msg").className=""; $("#msg").textContent="";
  $("#result").style.display="none";
  if(!user||!token){$("#msg").className="err";$("#msg").textContent="نام کاربری و توکن را وارد کن.";return}
  $("#go").disabled=true; $("#go").textContent="در حال بررسی...";
  try{
    const r=await fetch("/api/generate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:user,cloudflareToken:token})});
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||"خطای ناشناخته");
    $("#msg").className="ok";$("#msg").textContent="لینک ساخته شد.";
    $("#link").textContent=d.subscriptionUrl;
    $("#result").style.display="block";
    $("#copy").onclick=()=>navigator.clipboard.writeText(d.subscriptionUrl);
  }catch(e){$("#msg").className="err";$("#msg").textContent=e.message}
  finally{$("#go").disabled=false;$("#go").textContent="ساخت لینک اشتراک"}
};
</script>
</body>
</html>`;

function json(data, status=200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {"content-type":"application/json; charset=utf-8",
              "cache-control":"no-store"}
  });
}

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return [...bytes].map(x=>x.toString(16).padStart(2,"0")).join("");
}

async function verifyCloudflareToken(token) {
  const r = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
    headers: {Authorization: `Bearer ${token}`}
  });
  if (!r.ok) return {ok:false};
  const d = await r.json().catch(()=>null);
  return {ok: !!d?.success, status: d?.result?.status || null};
}

function subUrl(request, id) {
  const u = new URL(request.url);
  return `${u.origin}/sub/${encodeURIComponent(id)}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML, {headers: {"content-type":"text/html; charset=utf-8"}});
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ok:true, service:"rgb-anti-filter", version:"0.1.0"});
    }

    if (request.method === "POST" && url.pathname === "/api/generate") {
      let body;
      try { body = await request.json(); }
      catch { return json({error:"JSON نامعتبر است."},400); }

      const username = String(body?.username || "").trim();
      const cfToken = String(body?.cloudflareToken || "").trim();

      if (!/^[a-zA-Z0-9_.-]{2,32}$/.test(username))
        return json({error:"نام کاربری باید ۲ تا ۳۲ کاراکتر و فقط شامل حروف، عدد، نقطه، خط تیره یا زیرخط باشد."},400);

      if (cfToken.length < 10)
        return json({error:"Cloudflare API Token معتبر به نظر نمی‌رسد."},400);

      const verification = await verifyCloudflareToken(cfToken);
      if (!verification.ok)
        return json({error:"Cloudflare API Token معتبر نیست یا اجازه‌ی Verify ندارد."},401);

      // Prototype only: the actual subscription record is represented by
      // an opaque ID. A real persistent store (D1/KV) should be added next.
      const id = `${username}-${randomId()}`;

      return json({
        ok:true,
        username,
        cloudflareTokenStatus: verification.status,
        subscriptionId:id,
        subscriptionUrl:subUrl(request,id),
        note:"این لینک فعلاً endpoint مکانیزم اشتراک است؛ برای کانفیگ قابل اتصال باید node/backend واقعی به generator وصل شود."
      });
    }

    if (request.method === "GET" && url.pathname.startsWith("/sub/")) {
      const id = decodeURIComponent(url.pathname.slice("/sub/".length));
      if (!id) return new Response("missing subscription id", {status:400});

      // Placeholder output. Replace this generator with the real node data source.
      const payload = {
        version: 1,
        type: "subscription",
        id,
        configs: [],
        message: "No proxy node configured yet."
      };

      return new Response(JSON.stringify(payload, null, 2), {
        headers:{
          "content-type":"application/json; charset=utf-8",
          "cache-control":"no-store"
        }
      });
    }

    return new Response("Not Found", {status:404});
  }
};
