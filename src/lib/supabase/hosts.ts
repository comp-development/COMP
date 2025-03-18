import toast from "$lib/toast.svelte";
import { supabase } from "../supabaseClient";
import { isType, transferUser } from "./users";

export async function getAllHosts(select: string = "*") {
  const { data, error } = await supabase.from("hosts").select(select);
  if (error) throw error;
  return data;
}

export async function getAllPublicHosts(select: string = "*") {
  const { data, error } = await supabase
    .from("hosts")
    .select(`${select}, events!inner(*)`)
    .eq("events.published", true);

  if (error) throw error;

  const uniqueHosts = [
    ...new Map(data.map((host) => [host.host_id, host])).values(),
  ];
  console.log("UNIQUE HOSTS", uniqueHosts);
  return uniqueHosts;
}

export async function getCoachHosts(org_id: number) {
  const { data, error } = await supabase
    .from("org_events")
    .select(
      `
            event:events!inner (
                host:hosts(*)
            )
        `,
    )
    .eq("org_id", org_id);

  if (error) throw error;

  const hosts = data?.map((org_event) => org_event.event.host) ?? [];
  return [...new Map(hosts.map((host) => [host.host_id, host])).values()];
}

export async function getStudentHosts(user_id: string) {
  const { data, error } = await supabase
    .from("student_events")
    .select(
      `*, event:events!left (
                host:hosts!left(*)
            )
        `,
    )
    .eq("student_id", user_id);

  if (error) throw error;

  const hosts = data?.map((event) => event.event.host) ?? [];
  return [...new Map(hosts.map((host) => [host.host_id, host])).values()];
}

export async function getHostInformation(
  host_id: number,
  select: string = "*",
) {
  const { data, error } = await supabase
    .from("hosts")
    .select(select)
    .eq("host_id", host_id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAdminHosts(admin_id: string, select: string = "*") {
  const { data, error } = await supabase
    .from("hosts")
    .select(`${select}, host_admins!inner(*)`)
    .eq("host_admins.admin_id", admin_id);

  if (error) throw error;
  return data;
}

export async function updateHost(host_id: number, hostData: any) {
  const { error } = await supabase
    .from("hosts")
    .update(hostData)
    .eq("host_id", host_id);
  if (error) throw error;
}

export async function userJoinAsHostAdmin(user_id: string, host_id: number) {
  const isAdmin = await isType("admin", user_id);
  if (!isAdmin) {
    const isCoach = await isType("coach", user_id);
    await transferUser(user_id, isCoach ? "coach" : "student", "admin");
  }

  await addAdminToHost(user_id, host_id);
}

export async function inviteUserToHost(host_id: number, emails: string[]) {
  const { data, error } = await supabase
    .from("hosts")
    .select("invites")
    .eq("host_id", host_id)
    .single();

  if (error) throw error;

  let invites = data.invites;
  let newInvites = [];

  let allValid = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!invites) {
    invites = emails;
  } else {
    emails.forEach((email) => {
      const trimmed = email.trim();

      if (emailRegex.test(trimmed)) {
        if (!invites.includes(trimmed)) {
          invites.push(trimmed);
          newInvites.push(trimmed);
        }
      } else {
        allValid = false;
      }
    });
  }

  if (!allValid) {
    toast.error("One or more of the emails are invalid and were not added");
  }

  const { error: updateError } = await supabase
    .from("hosts")
    .update({ invites })
    .eq("host_id", host_id);

  if (updateError) throw updateError;

  return { newInvites, invites };
}

export async function removeUserInvitationFromHost(host_id: number, email: string) {
  const { data, error: fetchError } = await supabase
    .from("hosts")
    .select("invites")
    .eq("host_id", host_id)
    .single();

  if (fetchError) throw fetchError;

  let invites = data.invites;

  if (invites) {
    invites = invites.filter((invite: string) => invite !== email);
  }

  const { error: updateError } = await supabase
    .from("hosts")
    .update({ invites })
    .eq("host_id", host_id);

  if (updateError) throw updateError;
}

export async function checkUserInvitedToHost(host_id: number, email: string) {
  const { data, error } = await supabase
    .from("hosts")
    .select("invites")
    .eq("host_id", host_id)
    .single();
  if (error) throw error;
  
  return data.invites.includes(email);
}

export async function addAdminToHost(admin_id: string, host_id: number) {
  const { error } = await supabase.from("host_admins").insert({
    admin_id: admin_id,
    host_id: host_id,
  });

  if (error) throw error;
}

export async function removeAdminFromHost(admin_id: string, host_id: number) {
  const { error } = await supabase
    .from("host_admins")
    .delete()
    .eq("admin_id", admin_id)
    .eq("host_id", host_id);
  if (error) throw error;
}

export async function getHostAdmins(host_id: number) {
  const { data, error } = await supabase
    .from("host_admins")
    .select(
      `
            admin_id,
            admins (
                first_name,
                last_name,
                email
            )
        `,
    )
    .eq("host_id", host_id);

  if (error) throw error;

  return data.map((item) => ({
    person: {
      first_name: item.admins.first_name,
      last_name: item.admins.last_name,
      email: item.admins.email,
    },
    admin_id: item.admin_id,
  }));
}

export async function getAllAdminsOutsideHost(host_id: number) {
  // Get current host admins
  const { data: existingAdmins } = await supabase
    .from("host_admins")
    .select("admin_id")
    .eq("host_id", host_id);

  const excludedAdminIds = existingAdmins?.map((admin) => admin.admin_id) || [];

  // Get all admins not in the host
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .not("admin_id", "in", `(${excludedAdminIds.join(",")})`)
    .order("first_name");

  if (error) throw error;

  return data.map((admin) => ({
    person: {
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
    },
    admin_id: admin.admin_id,
  }));
}
