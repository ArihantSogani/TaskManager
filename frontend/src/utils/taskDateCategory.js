import { startOfDay, endOfDay, endOfWeek, isBefore, isAfter, isWithinInterval } from 'date-fns';

export function getTaskCategory(task, now = new Date()) {
  if (task.status === 'Completed' || !task.dueDate) return null;
  const due = new Date(task.dueDate);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  if (isBefore(due, todayStart)) return 'overdue';
  if (isWithinInterval(due, { start: todayStart, end: todayEnd })) return 'urgent';
  if (isAfter(due, todayEnd) && !isAfter(due, weekEnd)) return 'upcoming';
  if (isAfter(due, weekEnd)) return 'future';
  return null;
} 