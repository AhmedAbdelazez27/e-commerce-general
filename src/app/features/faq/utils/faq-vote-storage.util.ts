const STORAGE_KEY = 'faq_voted_ids';

function readIds(): number[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is number => typeof id === 'number');
  } catch {
    return [];
  }
}

function writeIds(ids: number[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getFaqVotedIds(): Set<number> {
  return new Set(readIds());
}

export function hasVotedFaq(id: number): boolean {
  return getFaqVotedIds().has(id);
}

export function markFaqVoted(id: number): void {
  const ids = readIds();
  if (!ids.includes(id)) {
    writeIds([...ids, id]);
  }
}
