import { z } from "zod";
import { verifyCaptcha } from "./infrai_client.ts";

export const MagicLinkRequest = z.object({email:z.string().email(), appointmentId:z.string().min(1), captchaWidgetRecordId:z.string().min(1), captchaToken:z.string().min(1), ip:z.string().optional()});
export type MagicLinkInput = z.infer<typeof MagicLinkRequest>;
export type LoginDecision = {status:number; body:{ok:boolean; message:string; appointmentId?:string}};

export async function requestMagicLink(raw:unknown): Promise<LoginDecision> {
  const parsed = MagicLinkRequest.safeParse(raw);
  if (!parsed.success) return {status:400, body:{ok:false, message:"Invalid request"}};
  const check = await verifyCaptcha({widget_record_id:parsed.data.captchaWidgetRecordId, token:parsed.data.captchaToken, ip:parsed.data.ip, action:"appointment_sign_in", score_threshold:0.5});
  if (!check.verified) return {status:422, body:{ok:false, message:"Captcha verification required"}};
  return {status:202, body:{ok:true, message:`Magic link queued for ${parsed.data.email}`, appointmentId:parsed.data.appointmentId}};
}
