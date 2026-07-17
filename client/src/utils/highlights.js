export const CATEGORY_RULES = [
  { label: 'Workshops', terms: ['workshop', 'session', 'bootcamp', 'training'] },
  { label: 'Internships', terms: ['internship', 'intern', 'placement'] },
  { label: 'Certifications', terms: ['certificate', 'certification', 'certified'] },
  { label: 'Events', terms: ['event', 'meetup', 'launch', 'orientation'] },
  { label: 'Community', terms: ['community', 'student', 'team', 'club'] },
  { label: 'Media', terms: ['media', 'poster', 'photo', 'gallery'] }
];

export const getHighlightCategory = (achievement) => {
  const text = `${achievement?.title || ''} ${achievement?.summary || ''}`.toLowerCase();
  return CATEGORY_RULES.find(category => category.terms.some(term => text.includes(term)))?.label || 'Highlights';
};

export const formatHighlightDate = (date) => new Date(date).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});
