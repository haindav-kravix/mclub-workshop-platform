export const getEventType = (event) => ['workshop', 'internship', 'hackathon'].includes(event?.eventType) ? event.eventType : 'workshop';

export const getEventLabel = (event, variant = 'title') => {
  const eventType = getEventType(event);
  const labelsByType = {
    internship: {
      title: 'Internship',
      lower: 'internship',
      plural: 'Internships',
      pluralLower: 'internships',
      setup: 'internship setup'
    },
    hackathon: {
      title: 'Hackathon',
      lower: 'hackathon',
      plural: 'Hackathons',
      pluralLower: 'hackathons',
      setup: 'hackathon setup'
    },
    workshop: {
      title: 'Workshop',
      lower: 'workshop',
      plural: 'Workshops',
      pluralLower: 'workshops',
      setup: 'workshop setup'
    }
  };
  const labels = labelsByType[eventType] || labelsByType.workshop;

  return labels[variant] || labels.title;
};

export const getEventLabelByType = (eventType, variant = 'title') => (
  getEventLabel({ eventType }, variant)
);
