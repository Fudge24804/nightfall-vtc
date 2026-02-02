import { supabase } from "./supabaseClient.js";

const wrap = document.getElementById("teamWrap");

(async () => {
  const { data, error } = await supabase.rpc("get_site_content", { content_key: "team" });
  if (error) {
    wrap.innerHTML = `<div class="card">Failed to load team: ${error.message}</div>`;
    return;
  }

  const members = data?.members ?? [];
  wrap.innerHTML = "";
  for (const m of members) {
    const card = document.createElement("div");
    card.className = "card card--glass";
    card.innerHTML = `
      <h2 style="margin-top:0;">${m.name}</h2>
      <div class="muted"><strong>${m.role}</strong></div>
      <p class="muted">${m.bio || ""}</p>
    `;
    wrap.appendChild(card);
  }
})();
