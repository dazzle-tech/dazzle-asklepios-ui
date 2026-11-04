import { useState } from 'react';

import { useAppDispatch } from '@/hooks';
import {
  useAddPriceListSetupItemMutation,
  useLazyGetPriceListSetupItemsBySourceQuery,
  useLazyGetPriceListSetupsQuery
} from '@/services/setup/priceListSetup/priceListSetupService';
import { useLazyGetMappingByItemQuery } from '@/services/waseel-integration/waseelSbsSetupService';
import type {
  PriceListItemType,
  PriceListSetup,
  PriceListSetupItem,
  WaseelItemMapping
} from '@/types/model-types-new';
import { extractApiErrorMessage, PRICE_LIST_SETUP_ERROR_MAP } from '@/utils/apiErrorMessage';
import { notify } from '@/utils/uiReducerActions';

const CASH_LIST_TYPES = ['CASH', 'SELF_PAY'];
const INSURANCE_LIST_TYPE = 'INSURANCE';

// The saved catalog item the prompt is about
export type PriceListPromptItem = {
  itemType: PriceListItemType;
  sourceId: number | string;
  itemCode?: string | null;
  itemName?: string | null;
  unitPrice?: number | string | null;
  // Set for facility-level items: they are only linked while logged in to that facility
  facilityId?: number | string | null;
  // Shown only (a list's currency is its facility's currency)
  currency?: string | null;
};

// What the user typed for one selected list (undefined = use the item's value)
export type PriceListDraft = {
  itemCode?: string | null;
  nonStandardCode?: string | null;
  unitPrice?: number | string | null;
  discountPercentage?: number | string | null;
  requiresPreAuthorization?: boolean;
};

export type PriceListRow = {
  list: PriceListSetup;
  // Set when the item is already on this list (read-only in the prompt)
  existing?: PriceListSetupItem;
};

export const isInsuranceList = (list: PriceListSetup) => list.type === INSURANCE_LIST_TYPE;

const isBlank = (value: unknown) =>
  value === undefined || value === null || String(value).trim() === '';

const loggedInFacilityId = (): number | null => {
  try {
    const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
    return tenant?.selectedFacility?.id ?? null;
  } catch {
    return null;
  }
};

/**
 * The values sent for one list: what the user typed, else the item's own values.
 * Insurance lists take their code from the item's Waseel (SBS) mapping.
 */
export const resolveDraft = (
  draft: PriceListDraft,
  item: PriceListPromptItem | null,
  insurance: boolean,
  mapping: WaseelItemMapping | null
) => {
  const defaultCode = insurance ? mapping?.itemCode ?? item?.itemCode : item?.itemCode;
  return {
    itemCode: draft.itemCode !== undefined ? draft.itemCode : defaultCode ?? null,
    nonStandardCode: draft.nonStandardCode ?? null,
    unitPrice: draft.unitPrice !== undefined ? draft.unitPrice : item?.unitPrice ?? null,
    discountPercentage: draft.discountPercentage !== undefined ? draft.discountPercentage : 0,
    requiresPreAuthorization: insurance ? !!draft.requiresPreAuthorization : false
  };
};

const validateDraft = (
  values: ReturnType<typeof resolveDraft>,
  insurance: boolean,
  mapping: WaseelItemMapping | null
): string | null => {
  if (insurance && !mapping) return 'The item has no Waseel (SBS) mapping.';
  if (isBlank(values.unitPrice) || isNaN(Number(values.unitPrice)) || Number(values.unitPrice) < 0) {
    return 'Price must be zero or greater.';
  }
  const discount = Number(values.discountPercentage ?? 0);
  if (isBlank(values.discountPercentage) || isNaN(discount) || discount < 0 || discount > 100) {
    return 'Discount must be between 0 and 100.';
  }
  if (isBlank(values.itemCode)) return 'Item code is required.';
  return null;
};

/**
 * Links a catalog item to the cash and insurance price lists of the logged-in facility.
 * - prompt(): after a save, opens only if the item is missing from a list (cash lists pre-selected)
 * - view(): on demand, shows every list the item is on and the ones it can still be added to
 * Lists the item is already on are read-only: they are changed or removed from Price List Setup.
 */
export const usePriceListPrompt = () => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  // 'prompt': reminder after a save; 'manage': opened on demand to see (and complete) the links
  const [mode, setMode] = useState<'prompt' | 'manage'>('prompt');
  const [item, setItem] = useState<PriceListPromptItem | null>(null);
  const [rows, setRows] = useState<PriceListRow[]>([]);
  const [mapping, setMapping] = useState<WaseelItemMapping | null>(null);
  // Set when nothing can be added because the item belongs to another facility
  const [otherFacility, setOtherFacility] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, PriceListDraft>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  const [fetchLists] = useLazyGetPriceListSetupsQuery();
  const [fetchExisting] = useLazyGetPriceListSetupItemsBySourceQuery();
  const [fetchMapping] = useLazyGetMappingByItemQuery();
  const [addPriceListItem, { isLoading: isSaving }] = useAddPriceListSetupItemMutation();

  /**
   * Every list the item is on, from any facility (read-only), plus the active cash and insurance
   * lists of the logged-in facility it is missing from (the only ones that can be added here).
   */
  const loadRows = async (next: PriceListPromptItem) => {
    const facilityId = loggedInFacilityId();
    const itemOnOtherFacility =
      !isBlank(next.facilityId) && facilityId !== null && Number(next.facilityId) !== facilityId;

    const [listsPage, existingItems, itemMapping] = await Promise.all([
      // Not from cache: a list added a moment ago must show up
      fetchLists({ page: 0, size: 1000, sort: 'name,asc' }, false).unwrap(),
      fetchExisting({ itemType: next.itemType, sourceId: Number(next.sourceId) }).unwrap(),
      // No mapping answers 404: insurance lists then cannot be added
      fetchMapping({ itemType: next.itemType, sourceId: Number(next.sourceId) })
        .unwrap()
        .catch(() => null)
    ]);

    // Only active items come back: an inactive one does not count, a new item can be added
    const existingByList = new Map<number, PriceListSetupItem>();
    (existingItems ?? []).forEach(existing => {
      if (existing.priceListSetupId != null) {
        existingByList.set(Number(existing.priceListSetupId), existing);
      }
    });

    const canBeAdded = (list: PriceListSetup) =>
      !itemOnOtherFacility &&
      (CASH_LIST_TYPES.includes(String(list.type)) || isInsuranceList(list)) &&
      list.status === 'ACTIVE' &&
      list.isActive !== false &&
      (facilityId === null || Number(list.facilityId) === facilityId);

    const nextRows: PriceListRow[] = (listsPage?.data ?? [])
      .filter(list => list.id != null)
      .filter(list => existingByList.has(Number(list.id)) || canBeAdded(list))
      .map(list => ({ list, existing: existingByList.get(Number(list.id)) }));

    return { nextRows, itemMapping: itemMapping ?? null, itemOnOtherFacility };
  };

  // Cash first, then insurance
  const byListType = (a: PriceListRow, b: PriceListRow) =>
    Number(isInsuranceList(a.list)) - Number(isInsuranceList(b.list));

  const openWith = (
    next: PriceListPromptItem,
    nextMode: 'prompt' | 'manage',
    nextRows: PriceListRow[],
    itemMapping: WaseelItemMapping | null,
    itemOnOtherFacility: boolean,
    initialDrafts: Record<number, PriceListDraft>
  ) => {
    setRows(nextRows);
    setMapping(itemMapping);
    setOtherFacility(itemOnOtherFacility);
    setDrafts(initialDrafts);
    setErrors({});
    setItem(next);
    setMode(nextMode);
    setOpen(true);
  };

  /** Opens after a save if the item is missing from at least one list. */
  const prompt = async (next: PriceListPromptItem) => {
    if (!next.itemType || !next.sourceId) return;

    try {
      const { nextRows, itemMapping, itemOnOtherFacility } = await loadRows(next);
      const missing = nextRows.filter(row => !row.existing).sort(byListType);
      if (missing.length === 0) return;

      // Cash lists start selected; insurance lists (one per payer) are left to the user
      const initialDrafts: Record<number, PriceListDraft> = {};
      missing
        .filter(row => !isInsuranceList(row.list))
        .forEach(row => {
          initialDrafts[Number(row.list.id)] = {};
        });

      openWith(
        next,
        'prompt',
        [...missing, ...nextRows.filter(row => row.existing).sort(byListType)],
        itemMapping,
        itemOnOtherFacility,
        initialDrafts
      );
    } catch {
      // The prompt is only a reminder: never get in the way of the save that triggered it
    }
  };

  /** Opens on demand: the lists the item is on (read-only) and the ones it can be added to. */
  const view = async (next: PriceListPromptItem) => {
    if (!next.itemType || !next.sourceId) return;

    try {
      const { nextRows, itemMapping, itemOnOtherFacility } = await loadRows(next);
      openWith(
        next,
        'manage',
        [
          ...nextRows.filter(row => row.existing).sort(byListType),
          ...nextRows.filter(row => !row.existing).sort(byListType)
        ],
        itemMapping,
        itemOnOtherFacility,
        {}
      );
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error, PRICE_LIST_SETUP_ERROR_MAP) || 'Could not load the price lists.',
          sev: 'error'
        })
      );
    }
  };

  const clearError = (listId: number) =>
    setErrors(prev => {
      const next = { ...prev };
      delete next[listId];
      return next;
    });

  const toggleList = (listId: number, checked: boolean) => {
    setDrafts(prev => {
      const next = { ...prev };
      if (checked) next[listId] = prev[listId] ?? {};
      else delete next[listId];
      return next;
    });
    clearError(listId);
  };

  const updateDraft = (listId: number, patch: PriceListDraft) => {
    setDrafts(prev => ({ ...prev, [listId]: { ...prev[listId], ...patch } }));
    clearError(listId);
  };

  const selectedRows = rows.filter(row => !row.existing && drafts[Number(row.list.id)]);

  const submit = async () => {
    if (!item || selectedRows.length === 0) return;

    const validationErrors: Record<number, string> = {};
    selectedRows.forEach(row => {
      const listId = Number(row.list.id);
      const insurance = isInsuranceList(row.list);
      const message = validateDraft(
        resolveDraft(drafts[listId], item, insurance, mapping),
        insurance,
        mapping
      );
      if (message) validationErrors[listId] = message;
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const failures: Record<number, string> = {};
    const added: PriceListSetupItem[] = [];

    for (const row of selectedRows) {
      const listId = Number(row.list.id);
      const insurance = isInsuranceList(row.list);
      const values = resolveDraft(drafts[listId], item, insurance, mapping);
      try {
        const created = await addPriceListItem({
          priceListSetupId: listId,
          data: {
            waseelItemMappingId: insurance && mapping?.id ? Number(mapping.id) : null,
            sbsCatalogId: insurance && mapping?.sbsCatalogId ? Number(mapping.sbsCatalogId) : null,
            itemType: item.itemType,
            sourceId: Number(item.sourceId),
            itemCode: String(values.itemCode).trim(),
            nonStandardCode: isBlank(values.nonStandardCode)
              ? null
              : String(values.nonStandardCode).trim(),
            itemName: String(item.itemName ?? '').trim(),
            unitPrice: Number(values.unitPrice),
            discountPercentage: Number(values.discountPercentage ?? 0),
            isActive: true,
            requiresPreAuthorization: values.requiresPreAuthorization
          }
        }).unwrap();
        added.push({ ...created, priceListSetupId: listId });
      } catch (error: any) {
        failures[listId] =
          extractApiErrorMessage(error, PRICE_LIST_SETUP_ERROR_MAP) || 'Could not add the price.';
      }
    }

    // Added lists turn read-only, failed ones stay selected with their reason
    setRows(prev =>
      prev.map(row => {
        const created = added.find(a => Number(a.priceListSetupId) === Number(row.list.id));
        return created ? { ...row, existing: created } : row;
      })
    );
    setDrafts(prev => {
      const next = { ...prev };
      added.forEach(a => delete next[Number(a.priceListSetupId)]);
      return next;
    });
    setErrors(failures);

    if (added.length > 0) {
      dispatch(
        notify({
          msg: `Added to ${added.length} price list${added.length > 1 ? 's' : ''}`,
          sev: 'success'
        })
      );
    }
    if (Object.keys(failures).length === 0) setOpen(false);
  };

  return {
    open,
    setOpen,
    mode,
    item,
    rows,
    mapping,
    otherFacility,
    drafts,
    errors,
    selectedCount: selectedRows.length,
    isSaving,
    prompt,
    view,
    toggleList,
    updateDraft,
    submit
  };
};

export type PriceListPromptController = ReturnType<typeof usePriceListPrompt>;
