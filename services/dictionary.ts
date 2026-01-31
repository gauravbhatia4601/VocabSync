
import { WordEntry, DictionaryApiResponse } from '../types';

export const fetchWordDetails = async (word: string): Promise<WordEntry | null> => {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) return null;
    
    const data: DictionaryApiResponse[] = await response.json();
    if (!data || data.length === 0) return null;

    const entry = data[0];
    
    // Find first meaning with an example if possible
    let bestMeaning = entry.meanings[0];
    let bestDef = bestMeaning.definitions[0];
    
    for (const m of entry.meanings) {
      const found = m.definitions.find(d => d.example);
      if (found) {
        bestMeaning = m;
        bestDef = found;
        break;
      }
    }

    return {
      word: entry.word.charAt(0).toUpperCase() + entry.word.slice(1),
      phonetic: entry.phonetics[0]?.text || '',
      partOfSpeech: bestMeaning.partOfSpeech,
      definition: bestDef.definition,
      example: bestDef.example || `The ${bestMeaning.partOfSpeech} used in a common context.`
    };
  } catch (error) {
    console.error(`Error fetching dictionary for ${word}:`, error);
    return null;
  }
};
