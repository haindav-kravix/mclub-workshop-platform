import Registration from '../models/Registration.js';

const clean = (value, max = 180) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
const labelFor = (field = {}) => clean(`${field.label || ''} ${field.fieldId || ''}`).toLowerCase();
const valueFor = (formData, fieldId) => {
  if (!formData || !fieldId) return '';
  return clean(formData instanceof Map ? formData.get(fieldId) : formData[fieldId]);
};

const classifyPosition = (label) => {
  if (/leader|captain/.test(label)) return 0;
  const memberNumber = label.match(/(?:member|teammate)\s*(?:no\.?\s*)?([1-3])/i)?.[1];
  if (memberNumber) return Number(memberNumber);
  const participantNumber = label.match(/(?:participant|student)\s*(?:no\.?\s*)?([1-4])/i)?.[1];
  if (participantNumber) return Number(participantNumber) - 1;
  return null;
};

export const extractHackathonTeamMembers = (formData, formFields = [], leaderUser = {}) => {
  const members = Array.from({ length: 4 }, () => ({ name: '', email: '', rollNumber: '', college: '' }));
  const structured = [
    ['__hackathonLeaderName', '__hackathonLeaderEmail'],
    ['__hackathonMember1Name', '__hackathonMember1Email'],
    ['__hackathonMember2Name', '__hackathonMember2Email'],
    ['__hackathonMember3Name', '__hackathonMember3Email']
  ];
  structured.forEach(([nameKey, emailKey], index) => {
    members[index].name = valueFor(formData, nameKey);
    members[index].email = valueFor(formData, emailKey);
  });

  const looseNames = [];
  for (const field of formFields) {
    const label = labelFor(field);
    const value = valueFor(formData, field.fieldId);
    if (!value) continue;
    const position = classifyPosition(label);
    const isPersonField = /leader|captain|member|teammate|participant|student/.test(label);
    const isName = /name/.test(label) && !/team\s*name|college|university|institution|project/.test(label);
    const isEmail = /email|e-mail/.test(label);
    const isRoll = /roll|registration\s*(?:no|number)|student\s*id/.test(label);
    const isCollege = /college|university|institution/.test(label);
    if (position !== null && isEmail) members[position].email ||= value;
    else if (position !== null && isRoll) members[position].rollNumber ||= value;
    else if (position !== null && isCollege) members[position].college ||= value;
    else if (position !== null && (isName || (isPersonField && field.type === 'text'))) members[position].name ||= value;
    else if (isName && isPersonField) looseNames.push(value);

    if (/team\s*members?|members?\s*names?/.test(label) && /textarea|text/.test(field.type || '')) {
      value.split(/[,;\n]+/).map(clean).filter(Boolean).forEach(name => looseNames.push(name));
    }
  }

  members[0].name ||= clean(leaderUser.name);
  members[0].email ||= clean(leaderUser.email);
  for (const name of [...new Set(looseNames)]) {
    const slot = members.find(member => !member.name);
    if (slot) slot.name = name;
  }
  const sharedCollege = formFields.map(field => (/college|university|institution/.test(labelFor(field)) ? valueFor(formData, field.fieldId) : '')).find(Boolean) || '';
  members.forEach(member => { member.college ||= sharedCollege; });
  return members;
};

export const createUniqueMemberPin = async (workshopId, reserved = new Set()) => {
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    if (reserved.has(pin)) continue;
    const exists = await Registration.exists({ workshopId, 'teamMembers.pin': pin });
    if (!exists) {
      reserved.add(pin);
      return pin;
    }
  }
  throw new Error('Unable to generate a unique member PIN');
};

export const buildHackathonTeamMembers = async ({ workshopId, formData, formFields, leaderUser, existingMembers = [] }) => {
  const extracted = extractHackathonTeamMembers(formData, formFields, leaderUser);
  if (extracted.some(member => !member.name)) return [];
  const reserved = new Set();
  const result = [];
  for (let index = 0; index < 4; index += 1) {
    const existing = existingMembers[index];
    let pin = existing?.pin;
    if (!/^\d{4}$/.test(pin || '') || reserved.has(pin)) pin = await createUniqueMemberPin(workshopId, reserved);
    else reserved.add(pin);
    result.push({
      _id: existing?._id,
      ...extracted[index],
      pin
    });
  }
  return result;
};

export const ensureHackathonTeamMembers = async (registration, workshop = registration.workshopId) => {
  if (!registration || workshop?.eventType !== 'hackathon' || registration.teamMembers?.length === 4) return registration;
  const members = await buildHackathonTeamMembers({
    workshopId: workshop._id || workshop,
    formData: registration.formData,
    formFields: workshop.registrationFormFields || [],
    leaderUser: registration.userId || {},
    existingMembers: registration.teamMembers || []
  });
  if (members.length === 4) {
    registration.teamMembers = members;
    registration.updatedAt = new Date();
    await registration.save();
  }
  return registration;
};
