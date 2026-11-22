import React, { useEffect, useMemo, useState } from 'react';
import { Form, InputNumber } from 'rsuite';
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
import {
  PackageItemLookup,
  PackageItemType,
  PackageSetupItem,
  useAddPackageMutation,
  useGetPackageQuery,
  useLookupPackageItemsQuery,
  useUpdatePackageMutation
} from '@/services/setup/packageSetupService';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** null = new package */
  packageId: number | null;
}

const LOOKUP_PAGE_SIZE = 30;

const emptyHeader = { code: '', name: '', price: '', description: '', isActive: true };

/**
 * One screen for the whole package: the header (code, name, price) on top and its items with
 * quantities below. Everything is saved together with one Save.
 */
const PackageSetupEditor: React.FC<Props> = ({ open, setOpen, packageId }) => {
  const dispatch = useAppDispatch();
  const isEdit = packageId != null;

  const [header, setHeader] = useState<any>({ ...emptyHeader });
  const [items, setItems] = useState<PackageSetupItem[]>([]);

  // "Add item" row
  const [draft, setDraft] = useState<any>({ itemType: '', sourceId: null, quantity: 1 });
  const [selected, setSelected] = useState<PackageItemLookup | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lookupPage, setLookupPage] = useState(0);
  const [lookupOptions, setLookupOptions] = useState<PackageItemLookup[]>([]);

  const typeOptions = useEnumOptions('PriceListItemType');

  const { data: existing, isFetching: isLoadingExisting } = useGetPackageQuery(packageId as number, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true
  });
  const [addPackage, { isLoading: isAdding }] = useAddPackageMutation();
  const [updatePackage, { isLoading: isUpdating }] = useUpdatePackageMutation();
  const isSaving = isAdding || isUpdating;

  // Fill the screen when editing
  useEffect(() => {
    if (isEdit && existing) {
      setHeader({
        code: existing.code ?? '',
        name: existing.name ?? '',
        price: existing.price ?? '',
        description: existing.description ?? '',
        isActive: existing.isActive ?? true
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
    { skip: !draft.itemType }
  );

  useEffect(() => {
    if (!lookupData) return;
    setLookupOptions(prev => (lookupPage === 0 ? lookupData.data : [...prev, ...lookupData.data]));
  }, [lookupData, lookupPage]);

  const lookupHasMore = lookupData ? (lookupPage + 1) * LOOKUP_PAGE_SIZE < lookupData.totalCount : false;

  // Items already in the package are greyed out in the picker
  const alreadyAdded = useMemo(
    () => new Set(items.map(i => `${i.itemType}:${i.sourceId}`)),
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
    if (value.itemType !== draft.itemType) {
      // another type: the picked item no longer applies
      setSelected(null);
      setSearch('');
      setLookupOptions([]);
      setDraft({ ...value, sourceId: null });
      return;
    }
    setDraft(value);
  };

  const addItem = () => {
    const quantity = Number(draft.quantity);
    if (!draft.itemType || !selected) {
      dispatch(notify({ msg: 'Choose the item type and the item', sev: 'warning' }));
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      dispatch(notify({ msg: 'Quantity must be a whole number of at least 1', sev: 'warning' }));
      return;
    }
    if (alreadyAdded.has(`${selected.itemType}:${selected.sourceId}`)) {
      dispatch(notify({ msg: 'This item is already in the package', sev: 'warning' }));
      return;
    }
    setItems(prev => [
      ...prev,
      {
        itemType: selected.itemType,
        sourceId: selected.sourceId,
        itemCode: selected.code,
        itemName: selected.name,
        quantity
      }
    ]);
    setSelected(null);
    setDraft((prev: any) => ({ ...prev, sourceId: null, quantity: 1 }));
  };

  const updateQuantity = (index: number, value: number | string | null) => {
    const quantity = Math.max(1, Math.floor(Number(value) || 1));
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, quantity } : item)));
  };

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const code = String(header.code ?? '').trim();
    const name = String(header.name ?? '').trim();
    const price = Number(header.price);
    if (!code || !name || header.price === '' || header.price == null) {
      dispatch(notify({ msg: 'Code, name and package price are required', sev: 'warning' }));
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      dispatch(notify({ msg: 'Package price must be a valid number', sev: 'warning' }));
      return;
    }
    if (items.length === 0) {
      dispatch(notify({ msg: 'Add at least one item to the package', sev: 'warning' }));
      return;
    }

    const payload = {
      code,
      name,
      price,
      description: String(header.description ?? '').trim() || null,
      isActive: !!header.isActive,
      items: items.map(i => ({ itemType: i.itemType, sourceId: i.sourceId, quantity: i.quantity }))
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
      width: 130,
      render: (row: PackageSetupItem) => formatEnumString(row.itemType)
    },
    { key: 'itemCode', title: 'Code', dataKey: 'itemCode', width: 140 },
    { key: 'itemName', title: 'Item', dataKey: 'itemName', width: 340 },
    {
      key: 'quantity',
      title: 'Qty',
      width: 120,
      render: (row: PackageSetupItem, index?: number) => (
        <InputNumber
          size="sm"
          min={1}
          step={1}
          value={row.quantity}
          onChange={value => updateQuantity(index ?? 0, value)}
          className="package-item-qty"
        />
      )
    },
    {
      key: 'actions',
      title: '',
      width: 60,
      render: (_row: PackageSetupItem, index?: number) => (
        <div className="container-of-icons">
          <MdDelete
            className="icons-style"
            title="Remove"
            size={22}
            fill="var(--primary-pink)"
            onClick={() => removeItem(index ?? 0)}
          />
        </div>
      )
    }
  ];

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';
  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Package' : 'New Package'}
      steps={[{ title: 'Package', icon: <FontAwesomeIcon icon={faBoxesStacked} /> }]}
      size="70vw"
      actionButtonLabel={isSaving ? 'Saving...' : 'Save'}
      actionButtonLoading={isSaving}
      isDisabledActionBtn={isSaving || isLoadingExisting}
      actionButtonFunction={handleSave}
      content={
        <Form fluid layout="vertical" className="package-setup-editor" dir={dir}>
          <div className="package-header-row">
            <MyInput width={180} fieldName="code" fieldLabel="Code" record={header} setRecord={setHeader} required />
            <MyInput width={320} fieldName="name" fieldLabel="Name" record={header} setRecord={setHeader} required />
            <MyInput
              width={160}
              fieldName="price"
              fieldLabel="Package Price"
              fieldType="number"
              allowDecimal
              min={0}
              record={header}
              setRecord={setHeader}
              required
            />
            <MyInput
              fieldName="isActive"
              fieldLabel="Active"
              fieldType="check"
              showLabel={false}
              record={header}
              setRecord={setHeader}
            />
          </div>
          <div className="package-header-row">
            <MyInput
              width="100%"
              fieldName="description"
              fieldLabel="Description"
              fieldType="textarea"
              record={header}
              setRecord={setHeader}
            />
          </div>

          <div className="package-items-section">
            <div className="package-items-title">
              <Translate>Package Items</Translate>
              <span className="package-items-total">
                {items.length} <Translate>items</Translate> / {totalUnits} <Translate>units</Translate>
              </span>
            </div>

            <div className="package-item-add-row">
              <MyInput
                width={170}
                fieldName="itemType"
                fieldLabel="Item Type"
                fieldType="select"
                selectData={typeOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={draft}
                setRecord={changeDraft}
              />
              <MyInput
                key={`item-${draft.itemType}`}
                width={380}
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
              <MyInput
                width={100}
                fieldName="quantity"
                fieldLabel="Qty"
                fieldType="number"
                min={1}
                record={draft}
                setRecord={changeDraft}
              />
              <MyButton prefixIcon={() => <PlusIcon />} onClick={addItem} disabled={!selected}>
                Add Item
              </MyButton>
            </div>

            <MyTable data={items} columns={itemColumns} height={260} loading={isLoadingExisting} />
          </div>
        </Form>
      }
    />
  );
};

export default PackageSetupEditor;
