import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WorkoutNote {
  id: string;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkoutNoteService {
  getNote(date: string, userId?: string): Promise<WorkoutNote | null>;
  saveNote(date: string, note: string, userId?: string): Promise<WorkoutNote>;
  deleteNote(date: string, userId?: string): Promise<boolean>;
  getAllNotes(userId?: string): Promise<WorkoutNote[]>;
}

const STORAGE_KEY_PREFIX = '@unifit_workout_notes_';

class LocalWorkoutNoteService implements IWorkoutNoteService {
  private cache: Map<string, WorkoutNote> = new Map();

  private getStorageKey(userId?: string): string {
    return `${STORAGE_KEY_PREFIX}${userId || 'default_user'}`;
  }

  private async loadCache(userId?: string): Promise<void> {
    try {
      const key = this.getStorageKey(userId);
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const notes: WorkoutNote[] = JSON.parse(raw);
        notes.forEach((n) => {
          this.cache.set(`${userId || 'default'}_${n.date}`, n);
        });
      }
    } catch {
      // Fail silently and rely on in-memory cache
    }
  }

  private async persist(userId?: string): Promise<void> {
    try {
      const key = this.getStorageKey(userId);
      const userPrefix = `${userId || 'default'}_`;
      const notes: WorkoutNote[] = [];
      for (const [k, v] of this.cache.entries()) {
        if (k.startsWith(userPrefix)) {
          notes.push(v);
        }
      }
      await AsyncStorage.setItem(key, JSON.stringify(notes));
    } catch {
      // Memory persistence will continue to function
    }
  }

  async getNote(date: string, userId?: string): Promise<WorkoutNote | null> {
    const cacheKey = `${userId || 'default'}_${date}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }

    await this.loadCache(userId);
    return this.cache.get(cacheKey) || null;
  }

  async saveNote(date: string, noteText: string, userId?: string): Promise<WorkoutNote> {
    await this.loadCache(userId);
    const cacheKey = `${userId || 'default'}_${date}`;
    const now = new Date().toISOString();

    const existing = this.cache.get(cacheKey);
    const updated: WorkoutNote = {
      id: existing?.id || `note_${date}_${Date.now()}`,
      date,
      note: noteText,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.cache.set(cacheKey, updated);
    await this.persist(userId);
    return updated;
  }

  async deleteNote(date: string, userId?: string): Promise<boolean> {
    await this.loadCache(userId);
    const cacheKey = `${userId || 'default'}_${date}`;
    const existed = this.cache.delete(cacheKey);
    if (existed) {
      await this.persist(userId);
    }
    return existed;
  }

  async getAllNotes(userId?: string): Promise<WorkoutNote[]> {
    await this.loadCache(userId);
    const userPrefix = `${userId || 'default'}_`;
    const notes: WorkoutNote[] = [];
    for (const [k, v] of this.cache.entries()) {
      if (k.startsWith(userPrefix)) {
        notes.push(v);
      }
    }
    return notes.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export const workoutNoteService = new LocalWorkoutNoteService();
