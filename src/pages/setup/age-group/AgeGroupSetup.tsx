import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import ReactDOMServer from 'react-dom/server';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddEditAgeGroup from './AddEditAgeGroup';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetAgeGroupsQuery,
  useAddAgeGroupMutation,
  useUpdateAgeGroupMutation,
  useToggleAgeGroupIsActiveMutation,
  useLazyGetAgeGroupsByLabelQuery,
  useLazyGetAgeGroupsByFromAgeQuery,
  useLazyGetAgeGroupsByToAgeQuery,
} from '@/services/setup/ageGroupService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';

import { AgeGroup } from '@/types/model-types-new';
import { newAgeGroup } from '@/types/model-types-constructor-new';

const AgeGroupSetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  const [ageGroup, setAgeGroup] = useState<AgeGroup>({ ...newAgeGroup, facilityId });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  const [addAgeGroup] = useAddAgeGroupMutation();
  const [updateAgeGroup] = useUpdateAgeGroupMutation();
  const [toggleAgeGroupIsActive] = useToggleAgeGroupIsActiveMutation();
  const [fetchByLabel] = useLazyGetAgeGroupsByLabelQuery();
  const [fetchByFromAge] = useLazyGetAgeGroupsByFromAgeQuery();
  const [fetchByToAge] = useLazyGetAgeGroupsByToAgeQuery();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now(),
  });

  const ageGroupOptions = useEnumOptions('AgeGroupType');

  const { data: pageData, isFetching, refetch } = useGetAgeGroupsQuery(
    { facilityId, page: paginationParams.page, size: paginationParams.size, sort: paginationParams.sort },
    { skip: !facilityId }
  );

  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : pageData?.totalCount ?? 0),
    [isFiltered, filteredTotal, pageData?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : pageData?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : pageData?.data ?? []),
    [isFiltered, filteredData, pageData?.data]
  );
// Filter fields
  const filterFields = [
    { label: 'Age Group', value: 'ageGroup' },
    { label: 'From Age', value: 'fromAge' },
    { label: 'To Age', value: 'toAge' },
  ];
// Handle add new
  const handleNew = () => {
    setAgeGroup({ ...newAgeGroup, facilityId });
    setPopupOpen(true);
  };
// Helper to convert to number or undefined
  const numberOrUndefined = (v: any) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v));
// Save & Update handler
  const handleSave = async () => {
    setPopupOpen(false);
    const isUpdate = !!ageGroup.id;

    const payload: any = {
      ...ageGroup,
      facilityId,
      fromAge: numberOrUndefined(ageGroup.fromAge),
      toAge: numberOrUndefined(ageGroup.toAge),
    };

    try {
      if (isUpdate) {
        await updateAgeGroup({ facilityId, ...payload, id: ageGroup.id! }).unwrap();
        dispatch(notify({ msg: 'Age Group updated successfully', sev: 'success' }));
      } else {
        await addAgeGroup({ facilityId, ...payload }).unwrap();
        dispatch(notify({ msg: 'Age Group added successfully', sev: 'success' }));
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
          facilityId: 'Facility',
        };
        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          if (m.includes('must be greater than') || m.includes('must be greater than or equal to')) return 'value is too small';
          if (m.includes('must be less than') || m.includes('must be less than or equal to')) return 'value is too large';
          return msg || 'invalid value';
        };
        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });
        dispatch(notify({ msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix, sev: 'error' }));
        return;
      }

      const messageProp: string = data?.message || '';
      const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;
      const keyMap: Record<string, string> = {
        facilityrequired: 'Facility id is required.',
        'payload.required': 'Age Group payload is required.',
        'unique.facility.ageGroup': 'Age Group label already exists in this facility.',
        'unique.facility.ageRange': 'This age range already exists in this facility.',
        'fk.facility.notfound': 'Facility not found.',
        'db.constraint': 'Database constraint violation.',
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
// filter query runner
  const runFilterQuery = async (fieldName: string, value: any) => {
    if (!facilityId) return undefined;
    if (!value && value !== 0) return undefined;

    if (fieldName === 'ageGroup') {
      return await fetchByLabel({
        facilityId,
        label: String(value),
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();
    } else if (fieldName === 'fromAge') {
      return await fetchByFromAge({
        facilityId,
        fromAge: String(value),
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();
    } else if (fieldName === 'toAge') {
      return await fetchByToAge({
        facilityId,
        toAge: String(value),
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();
    }
    return undefined;
  };
// Handle filter change
  const handleFilterChange = async (fieldName: string, value: any) => {
    if (!facilityId) return;
    if (!value && value !== 0) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
      return;
    }
    try {
      const resp = await runFilterQuery(fieldName, value);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
    } catch {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
    }
  };

// Optimistic update for filtered data
  const optimisticFlipInFiltered = (id: number) => {
    const prev = filteredData;
    const next = prev.map((row: any) =>
      row?.id === id ? { ...row, isActive: !Boolean(row.isActive) } : row
    );
    setFilteredData(next);
    return () => setFilteredData(prev);
  };
// Deactivate handler
  const handleDeactivate = async () => {
    setOpenConfirm(false);
    if (!ageGroup?.id || !facilityId) return;
    const rollback = isFiltered ? optimisticFlipInFiltered(ageGroup.id as number) : undefined;
    try {
      await toggleAgeGroupIsActive({ id: ageGroup.id, facilityId }).unwrap();
      dispatch(notify({ msg: 'Age Group deactivated successfully', sev: 'success' }));
      if (!isFiltered) {
        refetch();
      }
    } catch {
      if (rollback) rollback();
      dispatch(notify({ msg: 'Failed to deactivate age group', sev: 'error' }));
    }
  };
// handle reactivate
  const handleReactivate = async () => {
    setOpenConfirm(false);
    if (!ageGroup?.id || !facilityId) return;

    const rollback = isFiltered ? optimisticFlipInFiltered(ageGroup.id as number) : undefined;
    try {
      await toggleAgeGroupIsActive({ id: ageGroup.id, facilityId }).unwrap();
      dispatch(notify({ msg: 'Age Group reactivated successfully', sev: 'success' }));
      if (!isFiltered) {
        refetch();
      }
    } catch {
      if (rollback) rollback();
      dispatch(notify({ msg: 'Failed to reactivate age group', sev: 'error' }));
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    const currentPage = paginationParams.page;
    const linksMap = links || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams(prev => ({
        ...prev,
        page,
        size,
        timestamp: Date.now(),
      }));
    }
  };
// Rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0,
      timestamp: Date.now(),
    }));
  };
// Selected row style
  const isSelected = (row: any) => (row?.id === ageGroup?.id ? 'selected-row' : '');
// Action icons
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
      {row?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setAgeGroup(row);
            setActionType('deactivate');
            setOpenConfirm(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setAgeGroup(row);
            setActionType('reactivate');
            setOpenConfirm(true);
          }}
        />
      )}
    </div>
  );
// Table columns
  const tableColumns = [
    {
      key: 'ageGroup',
      title: <Translate>Age Group</Translate>,
      flexGrow: 4,
      render: (row: any) => (row?.ageGroup ? formatEnumString(row?.ageGroup) : ''),
    },
    {
      key: 'fromAge',
      title: <Translate>Age From Unit</Translate>,
      flexGrow: 3,
      render: (row: any) => `${row?.fromAge ?? ''} ${row?.fromAgeUnit ?? ''}`,
    },
    {
      key: 'toAge',
      title: <Translate>Age To Unit</Translate>,
      flexGrow: 3,
      render: (row: any) => `${row?.toAge ?? ''} ${row?.toAgeUnit ?? ''}`,
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 100,
      render: (row: any) => (
        <MyBadgeStatus
          contant={row?.isActive ? 'Active' : 'Inactive'}
          color={row?.isActive ? '#415be7' : '#b1acacff'}
        />
      ),
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (row: any) => iconsForActions(row),
    },
  ];
// filters 
  const filters = () => (
    <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: any) => {
          setRecordOfFilter({ filter: updated.filter, value: '' });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />

      {recordOfFilter.filter === 'ageGroup' ? (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={ageGroupOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Enter Value"
          width={220}
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
        disabled={!facilityId}
      >
        Search
      </MyButton>
    </Form>
  );
// Effects
  useEffect(() => {
    if (!recordOfFilter.value && recordOfFilter.value !== 0) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      if (facilityId) refetch();
    }
  }, [recordOfFilter.value, facilityId]);

  useEffect(() => {
    const divContent = (
      <div className="page-title">
        <h5>Age Groups</h5>
      </div>
    );
    dispatch(setPageCode('Age_Groups'));
    dispatch(setDivContent(ReactDOMServer.renderToStaticMarkup(divContent)));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (addAgeGroup || updateAgeGroup) {
      refetch();
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
    }
  }, [addAgeGroup, updateAgeGroup]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
          disabled={!facilityId}
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row) => setAgeGroup(row)}
        filters={filters()}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
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
        actionButtonFunction={actionType === 'deactivate' ? handleDeactivate : handleReactivate}
        actionType={actionType}
      />
    </Panel>
  );
};

export default AgeGroupSetup;
