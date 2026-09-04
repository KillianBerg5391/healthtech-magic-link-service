import test from "node:test";
import assert from "node:assert/strict";
import { requestMagicLink } from "./magic_link.ts";

test("a valid appointment request reaches the pending state after captcha approval", async ()=>{
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init)=>{
    assert.deepEqual(JSON.parse(String(init?.body)), {widget_record_id:"widget-42",token:"token",vendor:"recaptcha",action:"appointment_sign_in",score_threshold:0.5});
    return new Response(JSON.stringify({ok:true,data:{verified:true},metadata:{}}),{status:200});
  };
  const result = await requestMagicLink({email:"patient@example.com",appointmentId:"apt-42",captchaWidgetRecordId:"widget-42",captchaToken:"token"});
  assert.equal(result.status,202); assert.equal(result.body.appointmentId,"apt-42");
  globalThis.fetch = original;
});

test("an invalid email is rejected before an upstream call", async ()=>{
  const result = await requestMagicLink({email:"not-an-email",appointmentId:"apt-42",captchaWidgetRecordId:"widget-42",captchaToken:"token"});
  assert.equal(result.status,400);
});
