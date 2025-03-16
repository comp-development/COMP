export function generateEmail(type, params) {
  const {
    host, host_id, event_id, email, admin, coach, user, org, event_details, organizationDetails, team_information, team
  } = params;

  let title = '';
  let inviteText = '';
  let buttonUrl = '';
  let imageUrl = event_details?.logo ?? host.logo ?? null;

  switch (type) {
    case 'admin_invite':
      title = `You're Invited to <span style="color: ${host.styles.primary}">'${host.host_name}'</span> on COMP!`;
      inviteText = `You have been invited to become an admin on <strong><span style="color: ${host.styles.primary}">'${host.host_name}'</span></strong> on COMP by <strong>${admin.first_name} ${admin.last_name}</strong>!`;
      buttonUrl = `https://comp.mt/join-host?host_id=${host_id}&email=${email}`;
      break;

    case 'org_invite':
      title = `You're Invited to <span style="color: ${host.styles.primary}">'${org.name}'</span> on COMP!`;
      inviteText = `You have been invited to compete for <strong><span style="color: ${host.styles.primary}">'${org.name}'</span></strong> during <strong>${event_details?.event_name}</strong> by <strong>${coach.first_name} ${coach.last_name}</strong> on COMP!`;
      buttonUrl = `https://comp.mt/student/${host_id}/${event_id}/join-org/${organizationDetails.event.join_code}`;
      break;

    case 'team_invite':
      title = `You're Invited to <span style="color: ${host.styles.primary}">'${team_information.team_name}'</span> on COMP!`;
      inviteText = `You have been invited to compete for <strong><span style="color: ${host.styles.primary}">'${team_information.team_name}'</span></strong> during <strong>${event_details?.event_name}</strong> by <strong>${user.first_name} ${user.last_name}</strong> on COMP!`;
      buttonUrl = `https://comp.mt/student/${host_id}/${event_id}/join-team/${team.join_code}`;
      break;
  }

  return `
    <div style="position: relative; font-family: Arial, sans-serif; color: black; text-align: center; padding: 20px; border: 2px solid ${host.styles.primary}; border-radius: 10px;">
      <div style="--text-color: #FFF; --light-color: ${host.styles.primary}; --dark-color: ${host.styles.primary};">
        ${logo}
      </div>
      ${imageUrl ? `<div style="display: flex; align-items: center; justify-content: center;">
        <img src=${imageUrl} width="100px" style="border-radius: 50px; margin-left: auto; margin-right: auto;" />
      </div>` : ''}
      <h2 style="color: black;">${title}</h2>
      <p>${inviteText}</p>
      <p>To accept the invitation, click the button below:</p>
      <a href="${buttonUrl}" 
        style="display: inline-block; padding: 10px 20px; margin: 10px 0; color: white; background-color: ${host.styles.primary}; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Accept Invitation
      </a>
    </div>
    <p style="font-size: 10px">If the button doesn't work, you can also click <a href="${buttonUrl}" style="color: ${host.styles.primary};">this link</a>.</p>
  `;
}