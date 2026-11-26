import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditAgeGroup from './AddEditAgeGroup';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetAgeGroupsQuery,
  useAddAgeGroupMutation,
  useUpdateAgeGroupMutation,
  useDeleteAgeGroupMutation
} from '@/services/setup/ageGroupService';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString, conjureValueBasedOnIDFromList } from '@/utils';
import { AgeGroup } from '@/types/model-types-new';
import { newAgeGroup } from '@/types/model-types-constructor-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';

const AgeGroupSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // Core state
  const [ageGroup, setAgeGroup] = useState<AgeGroup>({ ...newAgeGroup });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { facilityId: '', ageGroup: '', fromAge: '', toAge: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);

  // Mutations
  const [addAgeGroup] = useAddAgeGroupMutation();
  const [updateAgeGroup] = useUpdateAgeGroupMutation();
  const [deleteAgeGroup] = useDeleteAgeGroupMutation();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  // Enums and facilities
  const ageGroupOptions = useEnumOptions('AgeGroupType');
  const {
    data: pageData,
    isFetching,
    refetch
  } = useGetAgeGroupsQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    ...appliedFilters
  });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  const totalCount = pageData?.totalCount ?? 0;
  const tableData = useMemo(() => pageData?.data ?? [], [pageData?.data]);

  // Open "Add new"
  const handleNew = () => {
    setAgeGroup({ ...newAgeGroup });
    setPopupOpen(true);
  };

  // Helper to coerce numbers
  const numberOrUndefined = (v: any) =>
    v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v);

  /**
   * Save (add or update) and refresh list correctly for current view (filtered/unfiltered).
   */
  const handleSave = async () => {
    setPopupOpen(false);
    const isUpdate = !!ageGroup.id;

    const effectiveFacilityId = ageGroup.facilityId;

    if (!effectiveFacilityId) {
      dispatch(notify({ msg: 'Please select a facility.', sev: 'warning' }));
      return;
    }

    const payload: any = {
      ...ageGroup,
      facilityId: effectiveFacilityId,
      fromAge: numberOrUndefined(ageGroup.fromAge),
      toAge: numberOrUndefined(ageGroup.toAge)
    };

    try {
      if (isUpdate) {
        const updated = await updateAgeGroup({
          id: ageGroup.id!,
          facilityId: effectiveFacilityId,
          ...payload
        }).unwrap();

        dispatch(notify({ msg: 'Age Group updated successfully', sev: 'success' }));
        setAgeGroup(prev => (prev?.id === updated?.id ? { ...prev, ...updated } : prev));
        refetch();
      } else {
        const created = await addAgeGroup({
          facilityId: effectiveFacilityId,
          ...payload
        }).unwrap();

        dispatch(notify({ msg: 'Age Group added successfully', sev: 'success' }));
        setAgeGroup(created);
        // Reload the list with the current filters
        refetch();
      }
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          ageGroup: 'Age Group',
          fromAge: 'From Age',
          toAge: 'To Age',
          fromAgeUnit: 'From Age Unit',
          toAgeUnit: 'To Age Unit',
          isActive: 'Active',
          facilityId: 'Facility'
        };
        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          if (m.includes('must be greater')) return 'value is too small';
          if (m.includes('must be less')) return 'value is too large';
          return msg || 'invalid value';
        };

        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });

        dispatch(
          notify({
            msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
            sev: 'error'
          })
        );
        return;
      }

      const messageProp: string = data?.message || '';
      const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;

      const keyMap: Record<string, string> = {
        facilityrequired: 'Facility id is required.',
        'payload.required': 'Age Group payload is required.',
        'unique.facility.ageGroup': 'Age Group label or age range already exists in this facility.',
        'facility.mismatch': 'Age Group does not belong to the selected facility.',
        'db.constraint': 'Database constraint violation.',
        notfound: 'Age Group not found.'
      };

      const humanMsg =
        (errorKey && keyMap[errorKey]) ||
        data?.detail ||
        data?.title ||
        data?.message ||
        'Unexpected error';

      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
    }
  };

  /**
   * Delete a row and refresh correctly in both modes.
   */
  const handleDelete = async () => {
    setOpenConfirm(false);
    if (!ageGroup?.id) return;
    try {
      await deleteAgeGroup({ id: ageGroup.id }).unwrap();
      dispatch(notify({ msg: 'Age Group deleted successfully', sev: 'success' }));
      refetch();
    } catch {
      dispatch(notify({ msg: 'Failed to delete age group', sev: 'error' }));
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
  };

  // Applying one header filter also applies whatever is typed in the others
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

  // Selected row helper
  const isSelected = (row: any) => (row?.id === ageGroup?.id ? 'selected-row' : '');

  // Row actions (edit/delete)
  const iconsForActions = (row: AgeGroup) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setAgeGroup(row);
          setPopupOpen(true);
        }}
      />
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setAgeGroup(row);
          setOpenConfirm(true);
        }}
      />
    </div>
  );

  // Table columns (with facility label)
  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      width: 200,
      ...headerSearch('facilityId'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        ...(facilityListResponse ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }))
      ],
      render: (row: any) => (
        <span>
          {conjureValueBasedOnIDFromList(facilityListResponse ?? [], row?.facilityId, 'name')}
        </span>
      )
    },
    {
      key: 'ageGroup',
      title: <Translate>Age Group</Translate>,
      width: 180,
      ...headerSearch('ageGroup'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(ageGroupOptions ?? [])],
      render: (row: any) => (row?.ageGroup ? formatEnumString(row?.ageGroup) : '')
    },
    {
      key: 'fromAge',
      title: <Translate>Age From Unit</Translate>,
      width: 140,
      ...headerSearch('fromAge', 'From age'),
      render: (row: any) => `${row?.fromAge ?? ''} ${row?.fromAgeUnit ?? ''}`
    },
    {
      key: 'toAge',
      title: <Translate>Age To Unit</Translate>,
      width: 140,
      ...headerSearch('toAge', 'To age'),
      render: (row: any) => `${row?.toAge ?? ''} ${row?.toAgeUnit ?? ''}`
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (row: any) => iconsForActions(row)
    }
  ];

  // Header setup and resize listener
  useEffect(() => {
    const divContent = 'Age Group';
    dispatch(setPageCode('Age_Group'));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={row => setAgeGroup(row)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />
      <AddEditAgeGroup
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        agegroups={ageGroup as any}
        setAgeGroups={setAgeGroup as any}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Age Group"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </Panel>
  );
};

export default AgeGroupSetup;
