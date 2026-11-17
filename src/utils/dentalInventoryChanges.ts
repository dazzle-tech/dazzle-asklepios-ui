import { counterpartToothId } from '@/utils/toothNumberingSystems';

export type InventoryChange = {
  action: 'ADD' | 'REMOVE' | 'REPLACE';
  toothNumber: string;
  replacementToothNumber?: string;
};

/**
 * Turns the edited inventory into explicit changes. A removed tooth whose primary/permanent
 * counterpart was added becomes one REPLACE; everything else is a plain ADD or REMOVE. Removing a
 * tooth is never an extraction; the clinical record is untouched and only the inventory changes.
 */
export const buildInventoryChanges = (before: string[], after: string[]): InventoryChange[] => {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const removed = before.filter(id => !afterSet.has(id));
  const added = after.filter(id => !beforeSet.has(id));
  const usedAdded = new Set<string>();
  const changes: InventoryChange[] = [];

  removed.forEach(id => {
    const counterpart = counterpartToothId(id);
    if (counterpart && added.includes(counterpart) && !usedAdded.has(counterpart)) {
      usedAdded.add(counterpart);
      changes.push({ action: 'REPLACE', toothNumber: id, replacementToothNumber: counterpart });
    } else {
      changes.push({ action: 'REMOVE', toothNumber: id });
    }
  });
  added
    .filter(id => !usedAdded.has(id))
    .forEach(id => changes.push({ action: 'ADD', toothNumber: id }));
  return changes;
};
