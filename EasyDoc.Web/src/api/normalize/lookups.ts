import type { LookupItem } from '../contracts';
import { isRecord, read, recordsIn, text } from './values';

export function normalizeLookups(payload: unknown): LookupItem[] {
  return recordsIn(payload, [
    'items',
    'lookups',
    'departments',
    'cities',
    'governorates',
  ])
    .map((entry): LookupItem | null => {
      if (!isRecord(entry)) return null;
      const id = text(read(entry, 'id', 'value', 'key'));
      const name = text(
        read(entry, 'name', 'label', 'title', 'displayName', 'text'),
      );
      if (!id || !name) return null;
      return {
        id,
        name,
        governorateId: text(read(entry, 'governorateId', 'governorate_id')),
      };
    })
    .filter((entry): entry is LookupItem => entry !== null);
}
