import { readFileSync, existsSync } from 'fs';
import { TasksSummary } from '../types.js';

export function parseTasks(tasksPath: string, maxItems: number = 10): TasksSummary {
  if (!existsSync(tasksPath)) {
    return { groups: [], items: [], hasMore: false };
  }

  const content: string = readFileSync(tasksPath, 'utf-8');
  return summarizeTasks(content, maxItems);
}

export function summarizeTasks(content: string, maxItems: number = 10): TasksSummary {
  const lines: string[] = content.split(/\r?\n/);
  const groups: string[] = [];
  const items: string[] = [];
  let currentGroup: string | null = null;
  let totalItems: number = 0;

  for (const line of lines) {
    const headingMatch: RegExpMatchArray | null = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      currentGroup = headingMatch[2].trim();
      if (!groups.includes(currentGroup)) {
        groups.push(currentGroup);
      }
      continue;
    }

    const taskMatch: RegExpMatchArray | null = line.match(/^-\s+(\[[ x]\])?\s*(.+)$/);
    if (taskMatch && !line.match(/^\s{2,}-/)) {
      totalItems++;
      if (items.length < maxItems) {
        const taskText: string = taskMatch[2].trim();
        items.push(taskText);
      }
    }
  }

  return {
    groups,
    items,
    hasMore: totalItems > maxItems
  };
}
