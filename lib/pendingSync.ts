/**
 * Replays pending local operations against the backend once connectivity is
 * restored. Backend operation-id uniqueness makes replay safe.
 */

import { mealLogService, activityLogService } from '../services';
import { supabase } from './supabase';
import {
  PendingOperation,
  readPending,
  removePending,
} from './pendingQueue';

export async function syncPendingOperations(userId: string): Promise<void> {
  const pending = await readPending(userId);
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.id && data.session.user.id !== userId) {
    // Never replay one account's queue under a different signed-in user.
    return;
  }
  for (const operation of pending) {
    try {
      await replayOperation(userId, operation);
      await removePending(userId, operation.id);
    } catch {
      // Leave this entry queued and keep trying the remaining entries on the
      // next successful profile load.
    }
  }
}

async function replayOperation(
  userId: string,
  operation: PendingOperation
): Promise<void> {
  const payload = operation.payload || {};
  switch (operation.kind) {
    case 'meal_create':
      await mealLogService.create(payload as any);
      return;
    case 'meal_update':
      await mealLogService.update(operation.id, payload as any);
      return;
    case 'meal_delete':
      await mealLogService.remove(operation.id);
      return;
    case 'activity_create':
      await activityLogService.create(payload as any);
      return;
    case 'activity_delete':
      await activityLogService.remove(operation.id);
      return;
    default:
      return;
  }
}
