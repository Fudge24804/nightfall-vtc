import { supabase } from "./supabaseClient.js";
import { requireAuth, signOut, isStaff } from "./auth.js";

const meEl = document.getElementById("me");
const adminLink = document.getElementById("adminLink");
const logoutBtn = document.getElementById("logoutBtn");
const tbody = document.querySelector("#membersTable tbody");
const msg = document.getElementById("membersMsg");

logoutBtn.addEventListener("click", async () => {
  await signOut();
  location.href = "/login.html";
});

(async () => {
  const profile = await requireAuth();
  meEl.textContent = `Logged in as ${profile.username} · Role: ${profile.vtc_role.toUpperCase()}`;
  if (isStaff(profile.vtc_role)) adminLink.style.display = "inline-flex";

  msg.textContent = "Loading roster...";
  const { data, error } = await supabase.rpc("list_members");
  if (error) {
    msg.textContent = error.message;
    return;
  }

  tbody.innerHTML = "";
  for (const m of data) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.06);">${m.username}</td>
      <td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.06);">${m.vtc_role}</td>
      <td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.06);">${new Date(m.created_at).toLocaleDateString()}</td>
    `;
    tbody.appendChild(tr);
  }
  msg.textContent = `${data.length} active members`;
})();
