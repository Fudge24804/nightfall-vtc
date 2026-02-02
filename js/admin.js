import { supabase } from "./supabaseClient.js";
import { requireStaff, requireOwner, isOwner } from "./auth.js";

const adminMe = document.getElementById("adminMe");
const membersWrap = document.getElementById("membersWrap");
const appsWrap = document.getElementById("appsWrap");

const contentKey = document.getElementById("contentKey");
const contentJson = document.getElementById("contentJson");
const saveContent = document.getElementById("saveContent");
const contentMsg = document.getElementById("contentMsg");

let myProfile = null;

function el(tag, attrs = {}, html = "") {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  n.innerHTML = html;
  return n;
}

async function loadMembers() {
  membersWrap.textContent = "Loading members...";
  const { data, error } = await supabase.rpc("admin_list_members", { include_banned: true });
  if (error) return (membersWrap.textContent = error.message);

  const box = el("div");
  for (const m of data) {
    const row = el("div", {}, `
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;
                  padding:10px;border-bottom:1px solid rgba(255,255,255,.06);">
        <div>
          <strong>${m.username}</strong>
          <div class="tiny muted">Role: ${m.vtc_role} · ${m.banned ? "BANNED" : "Active"}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button data-ban="${m.id}" class="btn btn--ghost">${m.banned ? "Unban" : "Ban"}</button>
          ${isOwner(myProfile.vtc_role) ? `
            <select data-role="${m.id}">
              <option ${m.vtc_role==="driver"?"selected":""} value="driver">driver</option>
              <option ${m.vtc_role==="mod"?"selected":""} value="mod">mod</option>
              <option ${m.vtc_role==="admin"?"selected":""} value="admin">admin</option>
              <option ${m.vtc_role==="owner"?"selected":""} value="owner">owner</option>
            </select>
          ` : ""}
        </div>
      </div>
    `);
    box.appendChild(row);
  }
  membersWrap.innerHTML = "";
  membersWrap.appendChild(box);

  // Ban buttons
  membersWrap.querySelectorAll("button[data-ban]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-ban");
      const makeBanned = btn.textContent.trim() === "Ban";
      const { error } = await supabase.rpc("staff_set_banned", { target_id: targetId, new_banned: makeBanned });
      if (error) alert(error.message);
      await loadMembers();
    });
  });

  // Role dropdowns (Owner only)
  membersWrap.querySelectorAll("select[data-role]").forEach(sel => {
    sel.addEventListener("change", async () => {
      const targetId = sel.getAttribute("data-role");
      const newRole = sel.value;
      const { error } = await supabase.rpc("owner_set_role", { target_id: targetId, new_role: newRole });
      if (error) alert(error.message);
      await loadMembers();
    });
  });
}

async function loadApps() {
  appsWrap.textContent = "Loading applications...";
  const { data, error } = await supabase.rpc("admin_list_applications", { status_filter: null });
  if (error) return (appsWrap.textContent = error.message);

  const box = el("div");
  for (const a of data.slice(0, 25)) {
    const row = el("div", {}, `
      <div style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06);">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div><strong>${a.tmp_username}</strong> <span class="tiny muted">(${a.status})</span></div>
          <select data-app="${a.id}">
            <option ${a.status==="pending"?"selected":""} value="pending">pending</option>
            <option ${a.status==="accepted"?"selected":""} value="accepted">accepted</option>
            <option ${a.status==="rejected"?"selected":""} value="rejected">rejected</option>
          </select>
        </div>
        <div class="tiny muted" style="margin-top:6px;">
          TMP: ${a.tmp_profile}<br/>
          Steam: ${a.steam_profile}<br/>
          Age months: ${a.account_age_months} · Hours bucket: ${a.hours_bucket}+<br/>
          Banned last 12mo: ${a.banned_last_12_months ? "Yes" : "No"}
        </div>
        ${a.banned_last_12_months ? `<div class="tiny muted" style="margin-top:6px;"><em>${a.ban_details}</em></div>` : ""}
        <div style="margin-top:8px;">${a.why}</div>
      </div>
    `);
    box.appendChild(row);
  }
  appsWrap.innerHTML = "";
  appsWrap.appendChild(box);

  appsWrap.querySelectorAll("select[data-app]").forEach(sel => {
    sel.addEventListener("change", async () => {
      const appId = Number(sel.getAttribute("data-app"));
      const newStatus = sel.value;
      const { error } = await supabase.rpc("admin_set_application_status", { app_id: appId, new_status: newStatus });
      if (error) alert(error.message);
      await loadApps();
    });
  });
}

async function loadContent() {
  // Anyone can read site content, but only owner can save via RPC
  const { data, error } = await supabase.rpc("get_site_content", { content_key: contentKey.value });
  if (error) {
    contentJson.value = "";
    contentMsg.textContent = error.message;
    return;
  }
  contentJson.value = JSON.stringify(data ?? {}, null, 2);
  contentMsg.textContent = "";
}

contentKey.addEventListener("change", loadContent);

saveContent.addEventListener("click", async () => {
  contentMsg.textContent = "Saving...";
  try {
    // owner only
    await requireOwner();

    const parsed = JSON.parse(contentJson.value || "{}");
    const { error } = await supabase.rpc("owner_set_site_content", {
      content_key: contentKey.value,
      content_value: parsed
    });
    if (error) throw error;

    contentMsg.textContent = "Saved.";
  } catch (e) {
    contentMsg.textContent = e.message || "Save failed.";
  }
});

(async () => {
  myProfile = await requireStaff();
  adminMe.textContent = `Logged in as ${myProfile.username} · Role: ${myProfile.vtc_role.toUpperCase()}`;
  await loadMembers();
  await loadApps();
  await loadContent();
})();
