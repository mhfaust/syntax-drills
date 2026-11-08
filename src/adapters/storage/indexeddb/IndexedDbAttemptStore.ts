import type { Attempt } from '@/core/model/attempt';
import type { LanguageId, LearnerId } from '@/core/model/ids';
import type { AttemptStore } from '@/core/ports/stores';

const DB_NAME = 'syntax-drills';
const DB_VERSION = 1;
const STORE = 'attempts';
const BY_LEARNER = 'byLearner';

/** The attempt log in the browser's IndexedDB. Lives only in this browser profile. */
export class IndexedDbAttemptStore implements AttemptStore {
  private db: Promise<IDBDatabase> | null = null;

  async add(attempt: Attempt): Promise<void> {
    await this.write((store) => store.add(attempt));
  }

  async putMany(attempts: Attempt[]): Promise<void> {
    await this.write((store) => {
      for (const attempt of attempts) store.put(attempt);
    });
  }

  async list(learnerId: LearnerId, languageId: LanguageId): Promise<Attempt[]> {
    return (await this.listAll(learnerId)).filter((a) => a.languageId === languageId);
  }

  async listAll(learnerId: LearnerId): Promise<Attempt[]> {
    const db = await this.open();
    const attempts = await request<Attempt[]>(
      db.transaction(STORE).objectStore(STORE).index(BY_LEARNER).getAll(learnerId),
    );
    /* ULIDs sort by creation time; startedAt breaks ties from imported data. */
    return attempts.sort(
      (a, b) => a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id),
    );
  }

  private async write(fn: (store: IDBObjectStore) => void): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(STORE, 'readwrite');
    fn(tx.objectStore(STORE));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex(BY_LEARNER, 'learnerId');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.db;
  }
}

function request<T>(req: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}
