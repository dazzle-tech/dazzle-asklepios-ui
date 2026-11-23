import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Form, Panel } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import { MdDelete, MdModeEdit, MdToggleOff, MdToggleOn } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  PackageSetup as PackageSetupModel,
  useDeletePackageMutation,
  useGetPackagesQuery,
  useTogglePackageActiveMutation
} from '@/services/setup/packageSetupService';
import PackageSetupEditor, { packageItemLabel } from './PackageSetupEditor';
import './style.less';

type SortType = 'asc' | 'desc';

const validityText = (row: { validFrom?: string | null; validTo?: string | null }) =>
  !row.validFrom && !row.validTo
    ? 'Always'
    : `${row.validFrom ? row.validFrom.split('-').reverse().join('-') : '…'} → ${
        row.validTo ? row.validTo.split('-').reverse().join('-') : '…'
      }`;

const formatPrice = (value: number | string | null | undefined) =>
  value == null || value === '' ? '' : Number(value).toFixed(2);

const PackageSetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<SortType>('desc');
  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 10, sort: 'id,desc' });

  // Header filters: typed values are applied on Enter / select change, all combined with AND
  const emptyHeaderFilters = { code: '', name: '', price: '', isActive: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);

  // One screen for add and edit: header and items together
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PackageSetupModel | null>(null);

  const { data: pageData, isLoading, isFetching } = useGetPackagesQuery({
    ...paginationParams,
    ...appliedFilters
  });
  const [togglePackageActive, { isLoading: isToggling }] = useTogglePackageActiveMutation();
  const [deletePackage, { isLoading: isDeleting }] = useDeletePackageMutation();

  const tableData: PackageSetupModel[] = useMemo(() => pageData?.data ?? [], [pageData?.data]);
  const totalCount = pageData?.totalCount ?? 0;

  useEffect(() => {
    dispatch(setPageCode('Package_Setup'));
    dispatch(setDivContent('Package Setup'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  const openAdd = () => {
    setEditingId(null);
    setEditorOpen(true);
  };

  const openEdit = (row: PackageSetupModel) => {
    setEditingId(row.id ?? null);
    setEditorOpen(true);
  };

  const handleToggle = async (row: PackageSetupModel) => {
    if (row.id == null) return;
    try {
      await togglePackageActive({ id: row.id }).unwrap();
      dispatch(notify({ msg: row.isActive ? 'Package deactivated' : 'Package activated', sev: 'success' }));
    } catch (err) {
      dispatch(notify({ msg: extractApiErrorMessage(err), sev: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (toDelete?.id == null) {
      setDeleteOpen(false);
      return;
    }
    try {
      await deletePackage({ id: toDelete.id }).unwrap();
      dispatch(notify({ msg: 'Package deleted', sev: 'success' }));
    } catch (err) {
      dispatch(notify({ msg: extractApiErrorMessage(err), sev: 'error' }));
    } finally {
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  const columns = [
    { key: 'code', title: 'Code', dataKey: 'code', width: 140, ...headerSearch('code') },
    { key: 'name', title: 'Name', dataKey: 'name', width: 260, ...headerSearch('name') },
    {
      key: 'price',
      title: 'Package Price',
      dataKey: 'price',
      width: 140,
      ...headerSearch('price', 'Price'),
      render: (row: PackageSetupModel) => formatPrice(row.price)
    },
    {
      key: 'validity',
      title: 'Valid',
      width: 190,
      exportValue: (row: PackageSetupModel) => validityText(row),
      render: (row: PackageSetupModel) => validityText(row)
    },
    {
      key: 'itemCount',
      title: 'Items',
      dataKey: 'itemCount',
      width: 90,
      render: (row: PackageSetupModel) => {
        const total = row.itemCount ?? row.items?.length ?? 0;
        const active = row.activeItemCount ?? total;
        return active === total ? total : <span title={`${total - active} inactive`}>{active} / {total}</span>;
      }
    },
    {
      key: 'contents',
      title: 'Contents',
      width: 360,
      exportValue: (row: PackageSetupModel) =>
        (row.items ?? []).filter(i => i.isActive !== false).map(i => `${packageItemLabel(i)} x${i.quantity}`).join(', '),
      render: (row: PackageSetupModel) => {
        const items = (row.items ?? []).filter(i => i.isActive !== false);
        const text = items.map(i => `${packageItemLabel(i)} ×${i.quantity}`).join(', ');
        return <span title={text}>{text}</span>;
      }
    },
    {
      key: 'isActive',
      title: 'Status',
      dataKey: 'isActive',
      width: 110,
      ...headerSearch('isActive'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ],
      render: (row: PackageSetupModel) => (row.isActive ? 'Active' : 'Inactive')
    },
    {
      key: 'actions',
      title: '',
      width: 130,
      exportable: false,
      render: (row: PackageSetupModel) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => openEdit(row)}
          />
          {row.isActive ? (
            <MdToggleOn
              className="icons-style"
              title="Deactivate"
              size={26}
              fill="var(--primary-green, #22a06b)"
              onClick={() => handleToggle(row)}
            />
          ) : (
            <MdToggleOff
              className="icons-style"
              title="Activate"
              size={26}
              fill="var(--primary-gray)"
              onClick={() => handleToggle(row)}
            />
          )}
          <MdDelete
            className="icons-style"
            title="Delete"
            size={22}
            fill="var(--primary-pink)"
            onClick={() => {
              setToDelete(row);
              setDeleteOpen(true);
            }}
          />
        </div>
      )
    }
  ];

  const handleSortChange = (column: string, type: SortType) => {
    setSortColumn(column);
    setSortType(type);
    setPaginationParams(prev => ({ ...prev, sort: `${column},${type}`, page: 0 }));
  };

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={tableData}
        columns={columns}
        tableButtons={
          <Form fluid>
            <div className="bt-div">
              <div className="bt-right">
                <MyButton prefixIcon={() => <PlusIcon />} onClick={openAdd}>
                  Add
                </MyButton>
              </div>
            </div>
          </Form>
        }
        height={470}
        loading={isLoading || isFetching || isToggling || isDeleting}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => handleSortChange(col, type as SortType)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        totalCount={totalCount}
        onPageChange={(_, newPage) => setPaginationParams(prev => ({ ...prev, page: newPage }))}
        onRowsPerPageChange={e =>
          setPaginationParams(prev => ({ ...prev, size: parseInt(e.target.value, 10), page: 0 }))
        }
        enableExport
        exportFileName="packages"
      />

      <DeletionConfirmationModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        itemToDelete="Package"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />

      {editorOpen && (
        <PackageSetupEditor open={editorOpen} setOpen={setEditorOpen} packageId={editingId} />
      )}
    </Panel>
  );
};

export default PackageSetup;
