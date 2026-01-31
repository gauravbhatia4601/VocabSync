
export interface WordEntry {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example: string;
}

export interface DictionaryApiResponse {
  word: string;
  phonetics: { text: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
    }[];
  }[];
}

export enum Theme {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  MIDNIGHT = 'MIDNIGHT'
}
