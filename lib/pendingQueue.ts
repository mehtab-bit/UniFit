/**
 * W05: per-user durable pending-operation queue.
 *
 * When an authenticated write cannot reach the backend, the operation is
 * stored locally (keyed by user) with the "pending sync" state. Retries reuse
 * stable operation ids so replay can never duplicate server records.
 */

import { SafeStorage } from './supabase';

export type PendingOperation =
  | {
      id: string;
      kind: 'meal_create' | 'meal_update' | 'meal_delete';
      createdAt: string;
      payload?: Record<string, any>;
    }
  | {
      id: string;
      kind: 'activity_create' | 'activity_delete';
      createdAt: string;
      payload?: Record<string, any>;
    }
  | {
      id: string;
      kind: 'workout_create';
      createdAt: string;
      payload?: Record<string, any>;
    };

function keyFor(userId: string): string {
  return `@unifit_pending_queue_${userId}`;
}

export async function enqueuePending(
  userId: string,
  operation: Omit<PendingOperation, 'createdAt'>
): Promise<void> {
  const current = await readPending(userId);
  current.push({ ...operation, createdAt: new Date().toISOString() });
  await writePending(userId, current);
}

export async function readPending(userId: string): Promise<PendingOperation[]> {
  try {
    const raw = await SafeStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as PendingOperation[]) : [];
  } catch {
    return [];
  }
}

export async function removePending(
  userId: string,
  operationId: string
): Promise<void> {
  const current = await readPending(userId);
  await writePending(
    userId,
    current.filter((operation) => operation.id !== operationId)
  );
}

export async function clearPending(userId: string): Promise<void> {
  await SafeStorage.removeItem(keyFor(userId));
}

async function writePending(userId: string, items: PendingOperation[]): Promise<void> {
  await SafeStorage.setItem(keyFor(userId), JSON.stringify(items));
}
