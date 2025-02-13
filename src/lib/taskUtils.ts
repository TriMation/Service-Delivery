// taskUtils.ts
import type { Task } from '../types/database';

/**
 * Sum hours from *all* time entries on a task (from all users).
 */
export function getTaskHoursUsed(task: Task): number {
  if (!task.time_entries || !Array.isArray(task.time_entries)) return 0;

  return task.time_entries.reduce((sum, entry) => {
    const val = parseFloat(String(entry.hours));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
}

/**
 * Returns ratio of hours used to estimated hours (0-1 range, can exceed 1).
 */
export function getProgressRatio(task: Task): number {
  const estimated = task.estimated_hours || 0;
  if (estimated <= 0) return 0;
  return getTaskHoursUsed(task) / estimated;
}

/**
 * Returns a color class for progress bars (list pages).
 *  ratio < 0.8 => green
 *  0.8 <= ratio <= 1 => yellow
 *  ratio > 1 => red
 *  if no estimate => gray
 */
export function getProgressColorClass(task: Task): string {
  if (!task.estimated_hours) return 'bg-gray-200';
  const ratio = getProgressRatio(task);
  if (ratio > 1) return 'bg-red-500';
  if (ratio >= 0.8) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Returns a color class for Kanban cards (lighter shades).
 */
export function getKanbanColorClass(task: Task): string {
  if (!task.estimated_hours) return 'bg-white';
  const ratio = getProgressRatio(task);
  if (ratio > 1) return 'bg-red-50';
  if (ratio >= 0.8) return 'bg-yellow-50';
  return 'bg-green-50';
}

/**
 * Returns a string like "75%" for the progress bar width. Clamps at 100%.
 */
export function getProgressWidth(task: Task): string {
  if (!task.estimated_hours) return '0%';
  const ratio = getProgressRatio(task);
  const pct = Math.min(ratio * 100, 100);
  return `${pct.toFixed(0)}%`;
}
