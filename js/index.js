import { supabase } from "./supabaseClient.js";
import { getSession } from "./auth.js";

document.getElementById("year").textContent = new Date().getFullYear();

async function loadContent() {
  const vtcName = document.getElementById("vtcName");
  const vtcTag = document.getElementById("vtcTag");
  const vtcSlogan = document.getElementById("vtcSlogan");
  const footerName = document.getElementById("footerName");

  const discordText = document.getElementById("discordText");
  const discordBtn = document.getElementById("discordBtn");

  const { data: vtc } = await supabase.rpc("get_site_content", { content_key: "vtc" });
  if (vtc?.name) {
    vtcName.textContent = vtc.name;
    footerName.textContent = vtc.name;
  }
  if (vtc?.tag) vtcTag.textContent = vtc.tag;
  if (vtc?.slogan) vtcSlogan.textContent = vtc.slogan;

  const { data: discord } = await supabase.rpc("get_site_content", { content_key: "discord" });
  const invite = discord?.invite || "https://discord.gg/YOURINVITE";
  discordText.textContent = invite;
  discordBtn.href = invite;
}

async function authButtons() {
  const session = await getSession();
  const dashBtn = document.getElementById("dashBtn");
  const loginBtn = document.getElementById("loginBtn");

  if (session) {
    dashBtn.style.display = "inline-flex";
    loginBtn.style.display = "none";
  }
}

await loadContent();
await authButtons();
