const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getConfirmedParticipantEmails = (registrations = []) => {
  const emails = registrations
    .filter(registration => registration.status === 'confirmed')
    .flatMap(registration => [
      registration.userId?.email,
      ...(registration.teamMembers || []).map(member => member?.email)
    ])
    .map(email => String(email || '').trim().toLowerCase())
    .filter(email => EMAIL_PATTERN.test(email));

  return [...new Set(emails)];
};
