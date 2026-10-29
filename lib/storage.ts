import type { QuizResult, StudyDoc } from "./types";

export const DOCS_KEY = "zakerli:docs";
export const RESULTS_KEY = "zakerli:results";
// localStorage ما يطلق حدث "storage" في نفس التبويب، فنطلق حدثنا الخاص.
export const CHANGE_EVENT = "zakerli:change";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return true;
  } catch {
    // غالبًا امتلأت مساحة المتصفح.
    return false;
  }
}

export function listDocs(): StudyDoc[] {
  return read<StudyDoc[]>(DOCS_KEY, []).sort((a, b) => b.createdAt - a.createdAt);
}

export function getDoc(id: string): StudyDoc | undefined {
  return listDocs().find((d) => d.id === id);
}

export function saveDoc(doc: StudyDoc): boolean {
  const others = listDocs().filter((d) => d.id !== doc.id);
  return write(DOCS_KEY, [doc, ...others]);
}

export function updateDoc(id: string, patch: Partial<StudyDoc>): boolean {
  const doc = getDoc(id);
  return doc ? saveDoc({ ...doc, ...patch }) : false;
}

export function listResults(docId?: string): QuizResult[] {
  return read<QuizResult[]>(RESULTS_KEY, [])
    .filter((r) => !docId || r.docId === docId)
    .sort((a, b) => b.takenAt - a.takenAt);
}

export function saveResult(result: QuizResult): boolean {
  return write(RESULTS_KEY, [result, ...listResults().filter((r) => r.id !== result.id)]);
}

export function deleteDoc(id: string): void {
  write(DOCS_KEY, listDocs().filter((d) => d.id !== id));
  write(RESULTS_KEY, listResults().filter((r) => r.docId !== id));
}

export function newId(): string {
  return crypto.randomUUID();
}
