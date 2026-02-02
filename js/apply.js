import { supabase } from "./supabaseClient.js";

const form = document.getElementById("applyForm");
const msg = document.getElementById("applyMsg");
const banned12 = document.getElementById("banned12");
const banWrap = document.getElementById("banDetailsWrap");
const banDetails = document.getElementById("banDetails");

banned12.addEventListener("change", () => {
  const yes = banned12.value === "true";
  banWrap.style.display = yes ? "block" : "none";
  banDetails.required = yes;
  if (!yes) banDetails.value = "";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Submitting...";

  const fd = new FormData(form);

  const payload = {
    tmp_username: fd.get("tmp_username"),
    tmp_profile: fd.get("tmp_profile"),
    steam_profile: fd.get("steam_profile"),
    timezone: fd.get("timezone") || null,
    account_age_months: Number(fd.get("account_age_months")),
    hours_bucket: Number(fd.get("hours_bucket")),
    banned_last_12_months: fd.get("banned_last_12_months") === "true",
    ban_details: (fd.get("ban_details") || "").toString().trim() || null,
    why: fd.get("why")
  };

  // Basic polished checks (no annoying “must look like …” text)
  if (payload.account_age_months < 1) {
    msg.textContent = "Account age requirement is 1+ month. If you’re close, still apply—but select 1 month if you meet it.";
    return;
  }
  if (payload.hours_bucket < 30) {
    msg.textContent = "Hours requirement is 30+. If you’re close, apply anyway—staff will review.";
    return;
  }
  if (payload.banned_last_12_months && (!payload.ban_details || payload.ban_details.length < 15)) {
    msg.textContent = "Please add a short ban explanation (at least 15 characters).";
    return;
  }

  const { data, error } = await supabase.rpc("submit_application", payload);
  if (error) {
    msg.textContent = error.message;
    return;
  }

  form.reset();
  banWrap.style.display = "none";
  banDetails.required = false;
  msg.textContent = `Application submitted (ID: ${data}). Staff will review it in the Admin panel.`;
});
