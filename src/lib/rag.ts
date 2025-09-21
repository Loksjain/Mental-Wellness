import Papa from 'papaparse';
import bhagwadGitaCsvUrl from '../components/data/Bhagwad_Gita.csv?url';
import mentalHealthFaqCsvUrl from '../components/data/Mental_Health_FAQ.csv?url';
import mentalHealthPostsCsvUrl from '../components/data/mental_health.csv?url';
import studentMentalHealthCsvUrl from "../components/data/Student Mental health.csv?url";

interface RagEntry {
  source: string;
  title: string;
  text: string;
  tokens: Set<string>;
}

const MIN_KEYWORD_LENGTH = 4;
const MAX_COMMUNITY_ENTRIES = 400; // Large dataset; limit to keep bundle reasonable.
const MAX_STUDENT_ENTRIES = 200; // Student survey is smaller but still capped for performance.
const STOP_WORDS = new Set([
  'about', 'after', 'again', 'being', 'because', 'before', 'between', 'could', 'doing', 'from', 'have', 'into',
  'over', 'than', 'that', 'their', 'there', 'these', 'they', 'this', 'those', 'through', 'under', 'until', 'very',
  'were', 'what', 'when', 'where', 'which', 'while', 'with', 'would'
]);

const sanitize = (value?: string | null): string => (value ?? '').replace(/\s+/g, ' ').trim();

const tokenize = (text: string): Set<string> => {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= MIN_KEYWORD_LENGTH && !STOP_WORDS.has(token));

  return new Set(tokens);
};

const createEntry = (source: string, title: string, body: string): RagEntry | null => {
  const text = sanitize(body);
  if (!text) {
    return null;
  }

  const heading = sanitize(title);
  const combined = `${heading} ${text}`.trim();
  return {
    source,
    title: heading,
    text,
    tokens: tokenize(combined),
  };
};

const fetchCsvText = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load CSV asset: ${url}`);
  }
  return response.text();
};

const loadBhagwadGitaEntries = async (): Promise<RagEntry[]> => {
  const csvText = await fetchCsvText(bhagwadGitaCsvUrl);
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const entries: RagEntry[] = [];

  data.forEach((row) => {
    const englishMeaning = sanitize(row.EngMeaning);
    if (!englishMeaning) {
      return;
    }

    const chapter = sanitize(row.Chapter);
    const verse = sanitize(row.Verse);
    const titleParts = [chapter && `Chapter ${chapter}`, verse && `Verse ${verse}`].filter(Boolean);
    const title = titleParts.length ? titleParts.join(', ') : 'Bhagavad Gita Teaching';

    const shloka = sanitize(row.Shloka);
    const bodyParts = [englishMeaning];
    if (shloka) {
      bodyParts.push(`Original verse: ${shloka}`);
    }
    const entry = createEntry('Bhagavad Gita', title, bodyParts.join('\n'));
    if (entry) {
      entries.push(entry);
    }
  });

  return entries;
};

const loadMentalHealthFaqEntries = async (): Promise<RagEntry[]> => {
  const csvText = await fetchCsvText(mentalHealthFaqCsvUrl);
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const entries: RagEntry[] = [];

  data.forEach((row, index) => {
    const question = sanitize(row.Questions) || `FAQ entry ${index + 1}`;
    const answer = sanitize(row.Answers);
    if (!answer) {
      return;
    }

    const entry = createEntry('Mental Health FAQ', question, answer);
    if (entry) {
      entries.push(entry);
    }
  });

  return entries;
};

const loadMentalHealthCommunityEntries = async (): Promise<RagEntry[]> => {
  const csvText = await fetchCsvText(mentalHealthPostsCsvUrl);
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const entries: RagEntry[] = [];

  for (let index = 0; index < data.length && entries.length < MAX_COMMUNITY_ENTRIES; index += 1) {
    const row = data[index];
    if (!row) continue;
    const text = sanitize(row.text);
    if (!text) continue;

    const label = sanitize(row.label);
    const title = label ? `Community reflection (${label === '1' ? 'support request' : 'coping story'})` : 'Community reflection';
    const entry = createEntry('Community Voices', title, text);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};

const loadStudentMentalHealthEntries = async (): Promise<RagEntry[]> => {
  const csvText = await fetchCsvText(studentMentalHealthCsvUrl);
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const entries: RagEntry[] = [];

  for (let index = 0; index < data.length && entries.length < MAX_STUDENT_ENTRIES; index += 1) {
    const row = data[index];
    if (!row) continue;

    const gender = sanitize(row['Choose your gender']);
    const course = sanitize(row['What is your course?']);
    const year = sanitize(row['Your current year of Study']);
    const depression = sanitize(row['Do you have Depression?']);
    const anxiety = sanitize(row['Do you have Anxiety?']);
    const panic = sanitize(row['Do you have Panic attack?']);
    const treatment = sanitize(row['Did you seek any specialist for a treatment?']);

    const titleParts = [gender && `${gender} student`, course, year && `Year ${year}`].filter(Boolean);
    const title = titleParts.length ? titleParts.join(' • ') : 'Student well-being insight';

    const bulletPoints = [
      depression && `Depression: ${depression}`,
      anxiety && `Anxiety: ${anxiety}`,
      panic && `Panic attacks: ${panic}`,
      treatment && `Professional support: ${treatment}`,
    ].filter(Boolean);

    const body = bulletPoints.join('\n');
    const entry = createEntry('Student Mental Health Survey', title, body);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};

let ragEntriesPromise: Promise<RagEntry[]> | null = null;

const loadAllRagEntries = async (): Promise<RagEntry[]> => {
  const [gita, faq, community, student] = await Promise.all([
    loadBhagwadGitaEntries(),
    loadMentalHealthFaqEntries(),
    loadMentalHealthCommunityEntries(),
    loadStudentMentalHealthEntries(),
  ]);

  return [...gita, ...faq, ...community, ...student];
};

const getRagEntries = async (): Promise<RagEntry[]> => {
  if (!ragEntriesPromise) {
    ragEntriesPromise = loadAllRagEntries().catch((error) => {
      console.error('Failed to prepare RAG entries:', error);
      ragEntriesPromise = null;
      throw error;
    });
  }

  return ragEntriesPromise;
};

const extractKeywords = (prompt: string): string[] => {
  const tokens = tokenize(prompt);
  return Array.from(tokens);
};

export const buildDatasetContext = async (prompt: string, maxSections = 3): Promise<string | null> => {
  const keywords = extractKeywords(prompt);
  if (!keywords.length) {
    return null;
  }

  try {
    const entries = await getRagEntries();

    const scored = entries
      .map((entry) => {
        let score = 0;
        keywords.forEach((keyword) => {
          if (entry.tokens.has(keyword)) {
            score += 1;
          }
        });
        const density = score / Math.max(entry.tokens.size, 1);
        return { entry, score, density };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score === a.score) {
          return b.density - a.density;
        }
        return b.score - a.score;
      })
      .slice(0, maxSections);

    if (!scored.length) {
      return null;
    }

    return scored
      .map(({ entry }) => {
        const titleLine = entry.title ? `Title: ${entry.title}\n` : '';
        return `Source: ${entry.source}\n${titleLine}${entry.text}`;
      })
      .join('\n\n');
  } catch (error) {
    console.error('Error building dataset context:', error);
    return null;
  }
};
