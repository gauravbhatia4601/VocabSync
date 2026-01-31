
// A curated list of sophisticated vocabulary for daily learning
const VOCABULARY_POOL = [
  "Ephemeral", "Serendipity", "Quintessential", "Ineffable", "Languid",
  "Pervasive", "Eloquent", "Melancholy", "Paradigm", "Surreptitious",
  "Nefarious", "Fastidious", "Capricious", "Resilient", "Stoic",
  "Ubiquitous", "Pragmatic", "Benevolent", "Tenacious", "Altruistic",
  "Enigma", "Aesthetic", "Meticulous", "Placid", "Superfluous",
  "Venerable", "Zealous", "Quixotic", "Arcane", "Luminous",
  "Assiduous", "Clarity", "Euphoria", "Incendiary", "Mellifluous",
  "Petrichor", "Sonorous", "Vivid", "Wanderlust", "Zenith",
  "Abundant", "Bountiful", "Diligent", "Exuberant", "Fervent",
  "Gracious", "Harmonious", "Intrepid", "Jovial", "Kindred"
];

export const getRandomWords = (count: number = 5): string[] => {
  const shuffled = [...VOCABULARY_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
