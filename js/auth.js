import { supabase } from "./supabaseClient.js";

export async function signUp(email, password, username) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } } // becomes raw_user_meta_data.username
  });
  if (error) throw error;
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getMyProfile() {
  const { data, error } = await supabase.rpc("get_my_profile");
  if (error) throw error;
  return data;
}

export async function requireAuth(redirectTo = "/login.html") {
  const session = await getSession();
  if (!session) {
    location.href = redirectTo;
    throw new Error("not authenticated");
  }
  const profile = await getMyProfile();
  if (profile?.banned) {
    await signOut();
    alert("Your account is currently banned from Nightfall Logistics.");
    location.href = "/login.html";
    throw new Error("banned");
  }
  return profile;
}

export function isStaff(role) {
  return ["owner", "admin", "mod"].includes(role);
}

export function isOwner(role) {
  return role === "owner";
}

export async function requireStaff() {
  const profile = await requireAuth();
  if (!isStaff(profile.vtc_role)) {
    location.href = "/dashboard.html";
    throw new Error("not staff");
  }
  return profile;
}

export async function requireOwner() {
  const profile = await requireAuth();
  if (!isOwner(profile.vtc_role)) {
    location.href = "/dashboard.html";
    throw new Error("not owner");
  }
  return profile;
}
