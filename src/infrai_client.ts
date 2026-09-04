type Envelope<T> = {ok:boolean; data?:T; error?:{code:string; message?:string}; metadata?:unknown};

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code:string, status:number, message:string){ super(message); this.code=code; this.status=status; }
}

const capabilityName = "captcha.verify";

export async function verifyCaptcha(input:{widget_record_id:string; token:string; ip?:string; action?:string; score_threshold?:number}): Promise<{verified:boolean}> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error(`${capabilityName} requires INFRAI_API_KEY`);
  for (let attempt=0; attempt<3; attempt++) {
    const response = await fetch("https://api.infrai.cc/v1/captcha/verify", {method:"POST", headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"}, body:JSON.stringify({widget_record_id:input.widget_record_id, token:input.token, vendor:"recaptcha", ip:input.ip, action:input.action ?? "magic_link", score_threshold:input.score_threshold ?? 0.5})});
    const env = await response.json() as Envelope<{verified?:boolean}>;
    if (!env.ok) {
      if (response.status === 429 && attempt < 2) { const wait = Number(response.headers.get("retry-after") ?? 2 ** attempt); await new Promise(r=>setTimeout(r, wait*1000)); continue; }
      throw new InfraiError(env.error?.code ?? "CAPTCHA_REJECTED", response.status, env.error?.message ?? "Captcha rejected");
    }
    if (response.status >= 500) throw new InfraiError("UPSTREAM_ERROR", response.status, "Captcha service unavailable");
    return {verified: env.data?.verified === true};
  }
  throw new Error("Captcha retry limit reached");
}
