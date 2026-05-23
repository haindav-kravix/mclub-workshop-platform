export const getEventType = (event) => event?.eventType === 'internship' ? 'internship' : 'workshop';

export const getEventLabel = (event, variant = 'title') => {
  const isInternship = getEventType(event) === 'internship';
  const labels = isInternship
    ? {
      title: 'Internship',
      lower: 'internship',
      plural: 'Internships',
      pluralLower: 'internships',
      setup: 'internship setup'
    }
    : {
      title: 'Workshop',
      lower: 'workshop',
      plural: 'Workshops',
      pluralLower: 'workshops',
      setup: 'workshop setup'
    };

  return labels[variant] || labels.title;
};

export const getEventLabelByType = (eventType, variant = 'title') => (
  getEventLabel({ eventType }, variant)
);
