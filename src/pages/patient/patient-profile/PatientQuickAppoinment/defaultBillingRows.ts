import type {
  EncounterBillingItemSummary,
  PrepareDefaultProcedureItem,
  PrepareDefaultServiceItem,
  PreviewDefaultServicePricingResult
} from '@/types/model-types-new';

/**
 * Default items of a visit: the services and procedures linked to the visit
 * department + specialty. Both are listed in one table and billed together,
 * so every row is identified by its billing item type + catalog item id.
 */
export type DefaultBillingItemType = 'SERVICE' | 'PROCEDURE';

export type DefaultBillingRowIdentity = {
  billingItemType: DefaultBillingItemType;
  itemId: number;
};

type DefaultBillingRequestRow = DefaultBillingRowIdentity & {
  quantity: number;
  isExempted: boolean;
};

const toKey = (billingItemType: string, itemId: number | null | undefined) =>
  `${billingItemType}:${itemId}`;

export const defaultRowKey = (row: DefaultBillingRowIdentity): string =>
  toKey(row.billingItemType, row.itemId);

/**
 * Charge lines carry the catalog item id (service id / procedure id) as
 * their source id, so a billed line is matched to its row by type + id.
 */
export const summaryItemKey = (
  item: Pick<EncounterBillingItemSummary, 'billingItemType' | 'sourceId'>
): string | null =>
  item.sourceId == null ? null : toKey(item.billingItemType ?? '', item.sourceId);

export const isBilledItemOfRow = (
  item: Pick<EncounterBillingItemSummary, 'billingItemType' | 'sourceId'>,
  row: DefaultBillingRowIdentity
): boolean => summaryItemKey(item) === defaultRowKey(row);

export const pricedResultKey = (result: PreviewDefaultServicePricingResult): string =>
  result.procedureId != null
    ? toKey('PROCEDURE', result.procedureId)
    : toKey('SERVICE', result.serviceId);

/**
 * Splits the selected rows into the services and procedures lists of the
 * prepare / preview requests.
 */
export const toDefaultBillingRequestItems = (
  rows: DefaultBillingRequestRow[]
): {
  items: PrepareDefaultServiceItem[];
  procedures: PrepareDefaultProcedureItem[];
} => {
  const items: PrepareDefaultServiceItem[] = [];
  const procedures: PrepareDefaultProcedureItem[] = [];

  rows.forEach(row => {
    if (row.billingItemType === 'PROCEDURE') {
      procedures.push({
        procedureId: row.itemId,
        sequence: procedures.length + 1,
        isExempted: row.isExempted
      });
      return;
    }

    items.push({
      serviceId: row.itemId,
      quantity: row.quantity,
      sequence: items.length + 1,
      isExempted: row.isExempted
    });
  });

  return { items, procedures };
};
