import { readFileSync, existsSync } from 'fs';

export function parseTasks(tasksPath, maxItems = 10) {
  if (!existsSync(tasksPath)) {
    return { groups: [], items: [], hasMore: false };
  }

  const content = readFileSync(tasksPath, 'utf-8');
  return summarizeTasks(content, maxItems);
}

export function summarizeTasks(content, maxItems = 10) {
  const lines = content.split('\n');
  const groups = [];
  const items = [];
  let currentGroup = null;
  let totalItems = 0;

  for (const line of lines) {
    // Match headings as groups
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      currentGroup = headingMatch[2].trim();
      if (!groups.includes(currentGroup)) {
        groups.push(currentGroup);
      }
      continue;
    }

    // Match top-level task items (- [ ] or - [x] or just -)
    const taskMatch = line.match(/^-\s+(\[[ x]\])?\s*(.+)$/);
    if (taskMatch && !line.match(/^\s{2,}-/)) {
      totalItems++;
      if (items.length < maxItems) {
        const taskText = taskMatch[2].trim();
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
