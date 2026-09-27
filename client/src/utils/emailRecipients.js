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

export const splitEmailBatches = (emails, batchSize = 40) => {
  const batches = [];
  for (let index = 0; index < emails.length; index += batchSize) {
    batches.push(emails.slice(index, index + batchSize));
  }
  return batches;
};

export const openGmailCompose = ({ emails, subject, message }) => {
  const gmailUrl = new URL('https://mail.google.com/mail/');
  gmailUrl.searchParams.set('view', 'cm');
  gmailUrl.searchParams.set('fs', '1');
  gmailUrl.searchParams.set('bcc', emails.join(','));
  gmailUrl.searchParams.set('su', subject);
  gmailUrl.searchParams.set('body', message);
  window.open(gmailUrl.toString(), '_blank', 'noopener,noreferrer');
};
