import React, { useEffect, useMemo, useState } from 'react';
import { Form, InputNumber, Toggle } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked } from '@fortawesome/free-solid-svg-icons';
import { MdDelete } from 'react-icons/md';
import PlusIcon from '@rsuite/icons/Plus';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import {
  PackageItemLookup,
  PackageItemType,
  PackageSetupItem,
  useAddPackageMutation,
  useGetPackageQuery,
  useLookupPackageItemsQuery,
  useUpdatePackageMutation
} from '@/services/setup/packageSetupService';
import { useGetActiveDiscountsByFacilityQuery } from '@/services/billing/discountService';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** null = new package */
  packageId: number | null;
}

const LOOKUP_PAGE_SIZE = 30;

const emptyHeader = {
  code: '',
  name: '',
  price: '',
  description: '',
  isActive: true,
  validFrom: null as string | null,
  validTo: null as string | null,
  discountId: null as number | null,
  allDepartments: true,
  departmentIds: [] as number[]
};

const emptyDraft = { itemType: '', sourceId: null, quantity: 1, isCategory: false, maxRepeat: null };

/** Display name of a line: the item, or "Any <type>" for a category line. */
export const packageItemLabel = (item: { isCategory?: boolean; itemType: string; itemName?: string | null }) =>
  item.isCategory ? `Any ${formatEnumString(item.itemType)}` : item.itemName ?? '';

/**
 * One screen for the whole package: details (code, name, optional price, validity, departments) on top
 * and its items below. An item is either one item, or a whole category (any item of a type) with
 * a quantity and an optional repeat limit for the same item. Everything is saved together.
 */
const PackageSetupEditor: React.FC<Props> = ({ open, setOpen, packageId }) => {
  const dispatch = useAppDispatch();
  const isEdit = packageId != null;

  const [header, setHeader] = useState<any>({ ...emptyHeader });
  const [items, setItems] = useState<PackageSetupItem[]>([]);

  // "Add item" row
  const [draft, setDraft] = useState<any>({ ...emptyDraft });
  const [selected, setSelected] = useState<PackageItemLookup | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lookupPage, setLookupPage] = useState(0);
  const [lookupOptions, setLookupOptions] = useState<PackageItemLookup[]>([]);

  const typeOptions = useEnumOptions('PriceListItemType');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const facilityId = tenant?.selectedFacility?.id as number | undefined;
  const { data: discountsPage, isFetching: discountsLoading } = useGetActiveDiscountsByFacilityQuery(
    { facilityId: facilityId as number, page: 0, size: 1000, sort: 'name,asc' },
    { skip: !open || !facilityId }
  );
  const discountOptions = useMemo(
    () =>
      (discountsPage?.data ?? [])
        .filter(discount => discount.id != null && discount.status !== 'EXPIRED')
        .map(discount => ({
          value: discount.id,
          label: [discount.code, discount.name].filter(Boolean).join(' - ')
        })),
    [discountsPage?.data]
  );
  const { data: departmentsPage } = useGetDepartmentsQuery({ page: 0, size: 10000, isActive: true });
  const departmentOptions = useMemo(
    () => (departmentsPage?.data ?? []).map((d: any) => ({ value: d.id, label: d.name })),
    [departmentsPage?.data]
  );

  const { data: existing, isFetching: isLoadingExisting } = useGetPackageQuery(packageId as number, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true
  });
  const [addPackage, { isLoading: isAdding }] = useAddPackageMutation();
  const [updatePackage, { isLoading: isUpdating }] = useUpdatePackageMutation();
  const isSaving = isAdding || isUpdating;

  const hasPrice = header.price !== '' && header.price != null;
  const packageDiscountId =
    header.discountId == null || header.discountId === '' ? null : Number(header.discountId);
  const packageHasDiscount = packageDiscountId != null && !Number.isNaN(packageDiscountId);

  useEffect(() => {
    if (!packageHasDiscount) {
      return;
    }

    setItems(previous => {
      if (!previous.some(item => item.discountId != null || Number(item.discountPercent) > 0)) {
        return previous;
      }

      return previous.map(item => ({ ...item, discountId: null, discountPercent: null }));
    });
  }, [packageHasDiscount]);

  // Fill the screen when editing
  useEffect(() => {
    if (isEdit && existing) {
      setHeader({
        code: existing.code ?? '',
        name: existing.name ?? '',
        price: existing.price ?? '',
        description: existing.description ?? '',
        isActive: existing.isActive ?? true,
        validFrom: existing.validFrom ?? null,
        validTo: existing.validTo ?? null,
        discountId: existing.discountId ?? null,
        allDepartments: existing.allDepartments ?? true,
        departmentIds: existing.departmentIds ?? []
      });
      setItems((existing.items ?? []).map(i => ({ ...i })));
    }
  }, [isEdit, existing]);

  // Search is sent to the server after a short pause
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // A new type or search text starts the list again
  useEffect(() => {
    setLookupPage(0);
  }, [draft.itemType, debouncedSearch]);

  const { data: lookupData, isFetching: isLookingUp } = useLookupPackageItemsQuery(
    {
      itemType: draft.itemType as PackageItemType,
      search: debouncedSearch,
      page: lookupPage,
      size: LOOKUP_PAGE_SIZE
    },
    { skip: !draft.itemType || draft.isCategory }
  );

  useEffect(() => {
    if (!lookupData) return;
    setLookupOptions(prev => (lookupPage === 0 ? lookupData.data : [...prev, ...lookupData.data]));
  }, [lookupData, lookupPage]);

  const lookupHasMore = lookupData ? (lookupPage + 1) * LOOKUP_PAGE_SIZE < lookupData.totalCount : false;

  // Items already in the package are greyed out in the picker
  const alreadyAdded = useMemo(
    () => new Set(items.map(i => (i.isCategory ? `${i.itemType}:ALL` : `${i.itemType}:${i.sourceId}`))),
    [items]
  );

  const pickerData = useMemo(
    () =>
      lookupOptions.map(o => ({
        ...o,
        value: o.sourceId,
        label: `${o.code ?? ''} - ${o.name ?? ''}`,
        disabled: alreadyAdded.has(`${o.itemType}:${o.sourceId}`)
      })),
    [lookupOptions, alreadyAdded]
  );

  const changeDraft = (next: any) => {
    const value = typeof next === 'function' ? next(draft) : next;
    if (value.itemType !== draft.itemType || value.isCategory !== draft.isCategory) {
      // another type or mode: the picked item no longer applies
      setSelected(null);
      setSearch('');
      setLookupOptions([]);
      setDraft({ ...value, sourceId: null, maxRepeat: value.isCategory ? value.maxRepeat : null });
      return;
    }
    setDraft(value);
  };

  const canAdd = !!draft.itemType && (draft.isCategory || !!selected);

  const addItem = () => {
    const quantity = Number(draft.quantity);
    if (!draft.itemType || (!draft.isCategory && !selected)) {
      dispatch(notify({ msg: 'Choose the item type and the item', sev: 'warning' }));
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      dispatch(notify({ msg: 'Quantity must be a whole number of at least 1', sev: 'warning' }));
      return;
    }
    const repeat = draft.maxRepeat === '' || draft.maxRepeat == null ? null : Number(draft.maxRepeat);
    if (repeat != null && (!Number.isInteger(repeat) || repeat < 1)) {
      dispatch(notify({ msg: 'Repeat must be a whole number of at least 1', sev: 'warning' }));
      return;
    }
    const key = draft.isCategory ? `${draft.itemType}:ALL` : `${selected!.itemType}:${selected!.sourceId}`;
    if (alreadyAdded.has(key)) {
      dispatch(
        notify({
          msg: draft.isCategory ? 'This category is already in the package' : 'This item is already in the package',
          sev: 'warning'
        })
      );
      return;
    }
    setItems(prev => [
      ...prev,
      draft.isCategory
        ? {
            itemType: draft.itemType,
            sourceId: null,
            quantity,
            isActive: true,
            isCategory: true,
            maxRepeat: repeat,
            discountPercent: null,
            discountId: null
          }
        : {
            itemType: selected!.itemType,
            sourceId: selected!.sourceId,
            itemCode: selected!.code,
            itemName: selected!.name,
            quantity,
            isActive: true,
            isCategory: false,
            maxRepeat: null,
            discountPercent: null,
            discountId: null
          }
    ]);
    setSelected(null);
    setDraft((prev: any) => ({ ...prev, sourceId: null, quantity: 1, maxRepeat: null }));
  };

  const updateItem = (index: number, patch: Partial<PackageSetupItem>) =>
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const code = String(header.code ?? '').trim();
    const name = String(header.name ?? '').trim();
    const price = hasPrice ? Number(header.price) : null;
    if (!code || !name) {
      dispatch(notify({ msg: 'Code and name are required', sev: 'warning' }));
      return;
    }
    if (price != null && (Number.isNaN(price) || price < 0)) {
      dispatch(notify({ msg: 'Package price must be a valid number', sev: 'warning' }));
      return;
    }
    if (header.validFrom && header.validTo && header.validTo < header.validFrom) {
      dispatch(notify({ msg: 'Valid To must be on or after Valid From', sev: 'warning' }));
      return;
    }
    if (!header.allDepartments && (header.departmentIds ?? []).length === 0) {
      dispatch(notify({ msg: 'Choose at least one department, or All Departments', sev: 'warning' }));
      return;
    }
    if (items.length === 0) {
      dispatch(notify({ msg: 'Add at least one item to the package', sev: 'warning' }));
      return;
    }
    if (!items.some(i => i.isActive !== false)) {
      dispatch(notify({ msg: 'At least one item must be active', sev: 'warning' }));
      return;
    }
    if (price != null && items.some(i => Number(i.discountPercent) > 0)) {
      dispatch(notify({ msg: 'A package with a fixed price cannot also have item discounts', sev: 'warning' }));
      return;
    }

    const payload = {
      code,
      name,
      price,
      description: String(header.description ?? '').trim() || null,
      isActive: !!header.isActive,
      validFrom: header.validFrom || null,
      validTo: header.validTo || null,
      discountId: header.discountId == null || header.discountId === '' ? null : Number(header.discountId),
      allDepartments: !!header.allDepartments,
      departmentIds: header.allDepartments ? [] : header.departmentIds ?? [],
      items: items.map(i => ({
        itemType: i.itemType,
        sourceId: i.isCategory ? null : i.sourceId,
        quantity: i.quantity,
        isActive: i.isActive !== false,
        isCategory: !!i.isCategory,
        maxRepeat: i.isCategory ? i.maxRepeat ?? null : null,
        discountPercent: packageHasDiscount ? null : i.discountPercent ?? null,
        discountId: packageHasDiscount || i.discountId == null || i.discountId === ('' as any)
          ? null
          : Number(i.discountId)
      }))
    };

    try {
      if (isEdit) {
        await updatePackage({ id: packageId as number, ...payload }).unwrap();
        dispatch(notify({ msg: 'Package updated successfully', sev: 'success' }));
      } else {
        await addPackage(payload).unwrap();
        dispatch(notify({ msg: 'Package added successfully', sev: 'success' }));
      }
      setOpen(false);
    } catch (err) {
      dispatch(notify({ msg: extractApiErrorMessage(err), sev: 'error' }));
    }
  };

  const itemColumns = [
    {
      key: 'itemType',
      title: 'Type',
      width: 120,
      render: (row: PackageSetupItem) => (
        <span className={`pkg-type pkg-type--${String(row.itemType).toLowerCase()}`}>
          {formatEnumString(row.itemType)}
        </span>
      )
    },
    {
      key: 'itemName',
      title: 'Item',
      width: 300,
      render: (row: PackageSetupItem) =>
        row.isCategory ? (
          <div className="pkg-item-cell">
            <span className="pkg-item-name">
              {packageItemLabel(row)} <span className="pkg-badge">Category</span>
            </span>
            <span className="pkg-muted">Any item of this type</span>
          </div>
        ) : (
          <div className="pkg-item-cell" title={`${row.itemCode ?? ''} - ${row.itemName ?? ''}`}>
            <span className="pkg-item-name">{row.itemName}</span>
            <span className="pkg-muted">{row.itemCode}</span>
          </div>
        )
    },
    {
      key: 'quantity',
      title: 'Qty',
      width: 100,
      render: (row: PackageSetupItem, index?: number) => (
        <InputNumber
          size="sm"
          min={1}
          step={1}
          value={row.quantity}
          onChange={value => updateItem(index ?? 0, { quantity: Math.max(1, Math.floor(Number(value) || 1)) })}
          className="pkg-num"
        />
      )
    },
    {
      key: 'maxRepeat',
      title: 'Repeat',
      width: 100,
      render: (row: PackageSetupItem, index?: number) =>
        row.isCategory ? (
          <InputNumber
            size="sm"
            min={1}
            step={1}
            value={row.maxRepeat ?? ''}
            placeholder="Any"
            onChange={value =>
              updateItem(index ?? 0, {
                maxRepeat: value === '' || value == null ? null : Math.max(1, Math.floor(Number(value) || 1))
              })
            }
            className="pkg-num"
          />
        ) : (
          <span className="pkg-muted">—</span>
        )
    },
    {
      key: 'discountId',
      title: 'Discount',
      width: 220,
      render: (row: PackageSetupItem, index?: number) => (
        <MyInput
          width="100%"
          fieldName="discountId"
          fieldType="select"
          selectData={discountOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={{ discountId: row.discountId ?? null }}
          setRecord={(value: { discountId?: number | string | null }) => {
            const selected = value?.discountId;
            updateItem(index ?? 0, {
              discountId: selected == null || selected === '' ? null : Number(selected)
            });
          }}
          showLabel={false}
          searchable
          placeholder={packageHasDiscount ? 'Uses package discount' : 'Optional'}
          disabled={packageHasDiscount}
          loading={discountsLoading}
        />
      )
    },
    {
      key: 'discountPercent',
      title: 'Discount %',
      width: 110,
      render: (row: PackageSetupItem, index?: number) => (
        <InputNumber
          size="sm"
          min={0}
          max={100}
          step={1}
          value={row.discountPercent ?? ''}
          placeholder={packageHasDiscount ? 'Package' : hasPrice ? 'Fixed price' : '0'}
          disabled={hasPrice || packageHasDiscount}
          onChange={value =>
            updateItem(index ?? 0, {
              discountPercent: value === '' || value == null ? null : Math.min(100, Math.max(0, Number(value) || 0))
            })
          }
          className="pkg-num"
        />
      )
    },
    {
      key: 'isActive',
      title: 'Active',
      width: 80,
      render: (row: PackageSetupItem, index?: number) => (
        <Toggle size="sm" checked={row.isActive !== false} onChange={checked => updateItem(index ?? 0, { isActive: checked })} />
      )
    },
    {
      key: 'actions',
      title: '',
      width: 50,
      render: (_row: PackageSetupItem, index?: number) => (
        <div className="container-of-icons">
          <MdDelete
            className="icons-style"
            title="Remove"
            size={20}
            fill="var(--primary-pink)"
            onClick={() => removeItem(index ?? 0)}
          />
        </div>
      )
    }
  ];

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';
  const activeItems = items.filter(i => i.isActive !== false);
  const totalUnits = activeItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const inactiveCount = items.length - activeItems.length;

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Package' : 'New Package'}
      steps={[{ title: 'Package', icon: <FontAwesomeIcon icon={faBoxesStacked} /> }]}
      size="75vw"
      actionButtonLabel={isSaving ? 'Saving...' : 'Save'}
      actionButtonLoading={isSaving}
      isDisabledActionBtn={isSaving || isLoadingExisting}
      actionButtonFunction={handleSave}
      content={
        <Form fluid layout="vertical" className="pkg-editor" dir={dir}>
          <section className="pkg-card">
            <div className="pkg-card-head">
              <span className="pkg-card-title">
                <Translate>Package Details</Translate>
              </span>
              <MyInput
                fieldName="isActive"
                fieldLabel="Active"
                fieldType="check"
                showLabel={false}
                record={header}
                setRecord={setHeader}
              />
            </div>
            <div className="pkg-details-grid">
              <MyInput width="100%" fieldName="code" fieldLabel="Code" record={header} setRecord={setHeader} required />
              <MyInput width="100%" fieldName="name" fieldLabel="Name" record={header} setRecord={setHeader} required />
              <MyInput
                width="100%"
                fieldName="price"
                fieldLabel="Package Price"
                fieldType="number"
                allowDecimal
                min={0}
                placeholder="Optional"
                record={header}
                setRecord={setHeader}
              />
              <MyInput
                width="100%"
                fieldName="discountId"
                fieldLabel="Discount"
                fieldType="select"
                selectData={discountOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={header}
                setRecord={setHeader}
                placeholder="Optional"
                searchable
                loading={discountsLoading}
                disabled={!facilityId}
              />
              <MyInput
                width="100%"
                fieldName="validFrom"
                fieldLabel="Valid From"
                fieldType="date"
                record={header}
                setRecord={setHeader}
              />
              <MyInput
                width="100%"
                fieldName="validTo"
                fieldLabel="Valid To"
                fieldType="date"
                record={header}
                setRecord={setHeader}
              />
              <div className="pkg-dept-cell">
                <MyInput
                  fieldName="allDepartments"
                  fieldLabel="All Departments"
                  fieldType="check"
                  showLabel={false}
                  record={header}
                  setRecord={setHeader}
                />
              </div>
              {!header.allDepartments && (
                <div className="pkg-span-all">
                  <MyInput
                    width="100%"
                    fieldName="departmentIds"
                    fieldLabel="Departments"
                    fieldType="multyPicker"
                    selectData={departmentOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={header}
                    setRecord={setHeader}
                    required
                  />
                </div>
              )}
              <div className="pkg-span-all">
                <MyInput
                  width="100%"
                  fieldName="description"
                  fieldLabel="Description"
                  fieldType="textarea"
                  record={header}
                  setRecord={setHeader}
                />
              </div>
            </div>
          </section>

          <section className="pkg-card">
            <div className="pkg-card-head">
              <span className="pkg-card-title">
                <Translate>Package Items</Translate>
              </span>
              <div className="pkg-stats">
                <span className="pkg-stat">
                  <b>{activeItems.length}</b> <Translate>active items</Translate>
                </span>
                <span className="pkg-stat">
                  <b>{totalUnits}</b> <Translate>units</Translate>
                </span>
                {inactiveCount > 0 && (
                  <span className="pkg-stat pkg-stat--muted">
                    <b>{inactiveCount}</b> <Translate>inactive</Translate>
                  </span>
                )}
              </div>
            </div>

            <div className={`pkg-add-bar${draft.isCategory ? ' is-category' : ''}`}>
              <MyInput
                width="100%"
                fieldName="itemType"
                fieldLabel="Item Type"
                fieldType="select"
                selectData={typeOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={draft}
                setRecord={changeDraft}
              />
              <div className="pkg-mode-cell">
                <MyInput
                  fieldName="isCategory"
                  fieldLabel="Whole category"
                  fieldType="check"
                  showLabel={false}
                  record={draft}
                  setRecord={changeDraft}
                />
              </div>
              {draft.isCategory ? (
                <MyInput
                  width="100%"
                  fieldName="maxRepeat"
                  fieldLabel="Repeat (same item)"
                  fieldType="number"
                  min={1}
                  placeholder="Any"
                  record={draft}
                  setRecord={changeDraft}
                />
              ) : (
                <MyInput
                  key={`item-${draft.itemType}`}
                  width="100%"
                  fieldName="sourceId"
                  fieldLabel="Item"
                  fieldType="selectPagination"
                  selectData={pickerData}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={draft}
                  setRecord={changeDraft}
                  disabled={!draft.itemType}
                  loading={isLookingUp}
                  searchKeyWard={search}
                  setSearchKeyWard={setSearch}
                  hasMore={lookupHasMore}
                  onFetchMore={() => {
                    if (lookupHasMore && !isLookingUp) setLookupPage(p => p + 1);
                  }}
                  onSelectItem={(item: any) => setSelected(item ?? null)}
                  placeholder={draft.itemType ? 'Search by name or code' : 'Choose the type first'}
                />
              )}
              <MyInput
                width="100%"
                fieldName="quantity"
                fieldLabel="Qty"
                fieldType="number"
                min={1}
                record={draft}
                setRecord={changeDraft}
              />
              <MyButton prefixIcon={() => <PlusIcon />} onClick={addItem} disabled={!canAdd}>
                Add
              </MyButton>
            </div>
            {draft.isCategory && draft.itemType && (
              <div className="pkg-hint">
                <Translate>
                  Any item of this type counts. Qty is how many are covered; Repeat is how many times the same item can be
                  counted (empty = no limit). Extra ones are charged as usual.
                </Translate>
              </div>
            )}

            {items.length === 0 && !isLoadingExisting ? (
              <div className="pkg-empty">
                <FontAwesomeIcon icon={faBoxesStacked} className="pkg-empty-icon" />
                <span>
                  <Translate>No items yet. Choose a type and an item (or a whole category) above, then press Add.</Translate>
                </span>
              </div>
            ) : (
              <MyTable
                data={items}
                columns={itemColumns}
                height={280}
                loading={isLoadingExisting}
                dontTranslateData
                rowClassName={(row: PackageSetupItem) => (row.isActive === false ? 'pkg-row-inactive' : '')}
              />
            )}
          </section>
        </Form>
      }
    />
  );
};

export default PackageSetupEditor;
