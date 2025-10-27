import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';

import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

import './styles.less';

import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useEnumOptions } from '@/services/enumsApi';

// === RTK Query hooks for Procedures (same pattern as Services) ===
import {
  useGetProceduresQuery,
  useToggleProcedureIsActiveMutation,
  useLazyGetProceduresByCategoryQuery,
  useLazyGetProceduresByCodeQuery,
  useLazyGetProceduresByNameQuery,
} from '@/services/setup/procedureService';

// Types
import type { Procedure } from '@/types/model-types-new';
import { newProcedure } from '@/types/model-types-constructor-new';

// Dialog for create/edit (save logic stays inside this component)
import AddEditProcedure from './AddEditProcedure';

const ProcedureSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // ===== Facility context (kept identical to Services page) =====
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  // ===== Selected row / dialogs =====
  const [procedure, setProcedure] = useState<Procedure>({ ...newProcedure, facilityId });
  const [popupOpen, setPopupOpen] = useState(false);

  // Confirm modal for Active/Inactive toggle
  const [openConfirmToggleActive, setOpenConfirmToggleActive] = useState(false);
  const [toggleAction, setToggleAction] = useState<'deactivate' | 'reactivate'>('deactivate');


  // ===== Filtering state (same as Services) =====
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // ===== Pagination params (0-based page; same as Services) =====
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now(), // bump to re-trigger queries when needed
  });

  // Enum options for ProcedureCategoryType (used in category filter)
  const procedureCategoryOptions = useEnumOptions('ProcedureCategoryType');

  // ===== RTK Query: main list, lazy filters, toggle active =====
  const { data: proceduresPage, isFetching, refetch } = useGetProceduresQuery(
    {
      facilityId,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
    },
    { skip: !facilityId }
  );

  const [toggleProcedureIsActive] = useToggleProcedureIsActiveMutation();
  const [fetchByCategory] = useLazyGetProceduresByCategoryQuery();
  const [fetchByCode] = useLazyGetProceduresByCodeQuery();
  const [fetchByName] = useLazyGetProceduresByNameQuery();

  // ===== Derived totals/data/links (mirrors Services page) =====
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : proceduresPage?.totalCount ?? 0),
    [isFiltered, filteredTotal, proceduresPage?.totalCount]
  );

  const links = (isFiltered ? filteredLinks : proceduresPage?.links) || {};

  const tableData = useMemo(
    () => (isFiltered ? filteredData : proceduresPage?.data ?? []),
    [isFiltered, filteredData, proceduresPage?.data]
  );

  // ===== Page header (same pattern) =====
  useEffect(() => {
    const header = 'Procedure Setup';
    dispatch(setPageCode('Procedure_Setup'));
    dispatch(setDivContent(header));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // ===== Available filter fields =====
  const filterFields = [
    { label: 'Category', value: 'categoryType' },
    { label: 'Name', value: 'name' },
    { label: 'Code', value: 'code' },
  ];

  // ===== "Add New" handler (opens dialog; saving happens inside AddEditProcedure) =====
  const handleNew = () => {
    setProcedure({ ...newProcedure, facilityId });
    setPopupOpen(true);
  };

  // ===== Activate / Deactivate (identical to Services flow) =====
  const handleDeactivate = () => {
    setOpenConfirmToggleActive(false);
    if (!procedure?.id || !facilityId) return;
    toggleProcedureIsActive({ id: procedure.id, facilityId })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Procedure deactivated successfully', sev: 'success' }));
        refetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to deactivate procedure', sev: 'error' }));
      });
  };

  const handleReactivate = () => {
    setOpenConfirmToggleActive(false);
    if (!procedure?.id || !facilityId) return;
    toggleProcedureIsActive({ id: procedure.id, facilityId })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Procedure reactivated successfully', sev: 'success' }));
        refetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to reactivate procedure', sev: 'error' }));
      });
  };

  // ===== Filters (lazy queries + Link headers — same as Services) =====
  const handleFilterChange = async (fieldName: string, value: any) => {
    if (!facilityId) return;

    // Empty filter value → reset to base list
    if (!value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
      return;
    }

    try {
      let resp: { data: any[]; totalCount: number; links?: any } | undefined;

      if (fieldName === 'categoryType') {
        resp = await fetchByCategory({
          facilityId,
          categoryType: String(value).toUpperCase(),
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === 'code') {
        resp = await fetchByCode({
          facilityId,
          code: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === 'name') {
        resp = await fetchByName({
          facilityId,
          name: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      }

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

  // ===== Pagination using Link header (identical to Services) =====
  const handlePageChange = (_: unknown, newPage: number) => {
    const currentPage = paginationParams.page;
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && links.next) targetLink = links.next;
    else if (newPage < currentPage && links.prev) targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > currentPage + 1 && links.last) targetLink = links.last;

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

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0,
      timestamp: Date.now(),
    }));
  };

  // Reset filtered view when filter value cleared (same as Services)
  useEffect(() => {
    if (!recordOfFilter.value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      if (facilityId) refetch();
    }
  }, [recordOfFilter.value, facilityId, refetch]);

  // ===== Table columns (Status from isActive; actions identical to Services) =====
  const tableColumns = [
    { key: 'name', title: <Translate>Procedure Name</Translate>, flexGrow: 4 },
    { key: 'code', title: <Translate>Procedure Code</Translate>, flexGrow: 3 },
    {
      key: 'categoryType',
      title: <Translate>Category</Translate>,
      flexGrow: 3,
      render: (row: any) => row?.categoryType ?? row?.categoryLkey ?? '',
    },
    {
      key: 'isAppointable',
      title: <Translate>Appointable</Translate>,
      flexGrow: 2,
      render: (row: any) => (row?.isAppointable ? 'YES' : 'NO'),
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
      render: (row: any) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setProcedure(row);
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
                setProcedure(row);
                setToggleAction('deactivate');
                setOpenConfirmToggleActive(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setProcedure(row);
                setToggleAction('reactivate');
                setOpenConfirmToggleActive(true);
              }}
            />
          )}
        </div>
      ),
    },
  ];

  // ===== Filters UI (category uses enum options, same UX as Services) =====
  const filters = () => (
    <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={[
          { label: 'Category', value: 'categoryType' },
          { label: 'Name', value: 'name' },
          { label: 'Code', value: 'code' },
        ]}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: any) => setRecordOfFilter({ filter: updated.filter, value: '' })}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />
      {recordOfFilter.filter === 'categoryType' ? (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={procedureCategoryOptions ?? []}
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

  // Row selection style (same as Services)
  const rowClassName = (row: any) => (row?.id === procedure?.id ? 'selected-row' : '');

  return (
    <Panel>
      {/* Add New button */}
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

      {/* Data table */}
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={rowClassName}
        onRowClick={(row) => setProcedure(row)}
        filters={filters()}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={        <div className="container-of-add-new-button">
                <MyButton
                  prefixIcon={() => <AddOutlineIcon />}
                  color="var(--deep-blue)"
                  onClick={handleNew}
                  width="109px"
                >
                  Add New
                </MyButton>
              </div> }
      />

      {/* Add/Edit dialog — save logic REMAINS INSIDE AddEditProcedure (old backend logic) */}
      <AddEditProcedure
        open={popupOpen}
        setOpen={setPopupOpen}
        procedure={procedure}
        setProcedure={setProcedure}
        // No saving here. If needed, pass refetch so the child can refresh after save.
        profetch={refetch}
      />

      {/* Confirm Activate/Deactivate */}
      <DeletionConfirmationModal
        open={openConfirmToggleActive}
        setOpen={setOpenConfirmToggleActive}
        itemToDelete="Procedure"
        actionButtonFunction={toggleAction === 'deactivate' ? handleDeactivate : handleReactivate}
        actionType={toggleAction}
      />
    </Panel>
  );
};

export default ProcedureSetup;
