export const isEducationCategory = (category) => {
  if (!category) return false;
  const lowerCat = category.toLowerCase();
  const eduKeywords = ['education', 'school', 'coaching', 'tuition', 'academy', 'training', 'teacher'];
  return eduKeywords.some(keyword => lowerCat.includes(keyword));
};
