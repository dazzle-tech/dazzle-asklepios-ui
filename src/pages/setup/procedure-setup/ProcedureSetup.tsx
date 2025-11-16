import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete, MdLink, MdAttachMoney } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
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
import { conjureValueBasedOnIDFromList, formatEnumString } from '@/utils';
import {
  useGetProceduresQuery,
  useToggleProcedureIsActiveMutation,
  useLazyGetProceduresByCategoryQuery,
  useLazyGetProceduresByCodeQuery,
  useLazyGetProceduresByNameQuery,
  useLazyGetProceduresByFacilityQuery,
} from '@/services/setup/procedure/procedureService';
import type { Procedure } from '@/types/model-types-new';
import { newProcedure } from '@/types/model-types-constructor-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import AddEditProcedure from './AddEditProcedure';
import LinkProcedureCoding from './LinkProcedureCoding';
import LinkProcedurePriceList from './LinkProcedurePriceList';

const ProcedureSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // Facility context (used to default new procedure)
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  // Selected procedure and UI state
  const [procedure, setProcedure] = useState<Procedure>({ ...newProcedure, facilityId });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmToggleActive, setOpenConfirmToggleActive] = useState(false);
  const [toggleAction, setToggleAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const [linkCodingOpen, setLinkCodingOpen] = useState(false);
  const [linkCodingProcedureId, setLinkCodingProcedureId] = useState<number | null>(null);

  const [linkPriceOpen, setLinkPriceOpen] = useState(false);
  const [linkPriceProcedureId, setLinkPriceProcedureId] = useState<number | null>(null);

  // Filter state
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: '',
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // Pagination state when list is filtered
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
  });

  // Pagination state for main (unfiltered) list
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now(),
  });

  // Enum options for category
  const procedureCategoryOptions = useEnumOptions('ProcedureCategoryType');

  // Main list and facilities
  const { data: proceduresPage, isFetching, refetch } = useGetProceduresQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
  });

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  // Mutations and lazy filter queries
  const [toggleProcedureIsActive] = useToggleProcedureIsActiveMutation();
  const [fetchByCategory] = useLazyGetProceduresByCategoryQuery();
  const [fetchByCode] = useLazyGetProceduresByCodeQuery();
  const [fetchByName] = useLazyGetProceduresByNameQuery();
  const [fetchByFacility] = useLazyGetProceduresByFacilityQuery();

  // Derived data
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : proceduresPage?.totalCount ?? 0),
    [isFiltered, filteredTotal, proceduresPage?.totalCount]
  );

  const links = (isFiltered ? filteredLinks : proceduresPage?.links) || {};

  const tableData = useMemo(
    () => (isFiltered ? filteredData : proceduresPage?.data ?? []),
    [isFiltered, filteredData, proceduresPage?.data]
  );

  // Page header
  useEffect(() => {
    const header = 'Procedures';
    dispatch(setPageCode('Procedures'));
    dispatch(setDivContent(header));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Resize listener for modal width
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Available filters
  const filterFields = [
    { label: 'Facility', value: 'facilityId' },
    { label: 'Category', value: 'categoryType' },
    { label: 'Name', value: 'name' },
    { label: 'Code', value: 'code' },
  ];

  // Open modal for new procedure
  const handleNew = () => {
    setProcedure({ ...newProcedure, facilityId });
    setPopupOpen(true);
  };

  /**
   * Reset table to unfiltered mode and refetch main list.
   */
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);
    setFilterPagination(prev => ({ ...prev, page: 0 }));
    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
    refetch();
  };

  /**
   * Run filter query for given field and value.
   */
  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size
  ) => {
    if (value === null || value === undefined || value === '') return undefined;

    const common = { page, size, sort: paginationParams.sort };

    if (fieldName === 'categoryType') {
      return await fetchByCategory({
        categoryType: String(value).toUpperCase(),
        ...common,
      }).unwrap();
    } else if (fieldName === 'code') {
      return await fetchByCode({
        code: value,
        ...common,
      }).unwrap();
    } else if (fieldName === 'name') {
      return await fetchByName({
        name: value,
        ...common,
      }).unwrap();
    } else if (fieldName === 'facilityId') {
      return await fetchByFacility({
        facilityId: value,
        ...common,
      }).unwrap();
    }

    return undefined;
  };

  /**
   * Apply or clear filter.
   */
  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size
  ) => {
    if (value === null || value === undefined || value === '') {
      resetToUnfiltered();
      return;
    }

    try {
      const resp =
        (await runFilterQuery(fieldName, value, page, size)) as
          | { data: any[]; totalCount: number; links?: any }
          | undefined;

      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size }));
    } catch {
      resetToUnfiltered();
    }
  };

  /**
   * Called by AddEditProcedure after a successful save.
   * Clears filter and goes back to unfiltered mode.
   */
  const handleSaveSuccess = () => {
    setRecordOfFilter({ filter: '', value: '' });
    resetToUnfiltered();
  };

  /**
   * Update a row locally in filteredData to reflect toggle.
   * Uses String comparison for id to avoid type mismatches.
   */
  const applyToggleLocally = (toggledId: number | string, newIsActive: boolean) => {
    if (!isFiltered) return;

    setFilteredData(prev =>
      prev.map((row: any) =>
        String(row.id) === String(toggledId) ? { ...row, isActive: newIsActive } : row
      )
    );
  };

  /**
   * Deactivate selected procedure.
   */
  const handleDeactivate = () => {
    setOpenConfirmToggleActive(false);
    if (!procedure?.id) return;

    const id = procedure.id;

    toggleProcedureIsActive({ id })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Procedure deactivated successfully', sev: 'success' }));

        // Reflect immediately in state when filtered
        applyToggleLocally(id, false);

        if (!isFiltered) {
          refetch();
        } else {
          // Also update local selected procedure state
          setProcedure(prev =>
            prev && String(prev.id) === String(id) ? { ...prev, isActive: false } : prev
          );
        }
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to deactivate procedure', sev: 'error' }));
      });
  };

  /**
   * Reactivate selected procedure.
   */
  const handleReactivate = () => {
    setOpenConfirmToggleActive(false);
    if (!procedure?.id) return;

    const id = procedure.id;

    toggleProcedureIsActive({ id })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Procedure reactivated successfully', sev: 'success' }));

        // Reflect immediately in state when filtered
        applyToggleLocally(id, true);

        if (!isFiltered) {
          refetch();
        } else {
          setProcedure(prev =>
            prev && String(prev.id) === String(id) ? { ...prev, isActive: true } : prev
          );
        }
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to reactivate procedure', sev: 'error' }));
      });
  };

  /**
   * Pagination change handler.
   */
  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        newPage,
        filterPagination.size
      );
      return;
    }

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

  /**
   * Rows per page change handler.
   */
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isFiltered) {
      setFilterPagination(prev => ({
        ...prev,
        size: newSize,
        page: 0,
      }));
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
    } else {
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now(),
      }));
    }
  };

  // Selected row class
  const isSelected = (rowData: any) => (rowData?.id === procedure?.id ? 'selected-row' : '');

  // Table columns
  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 3,
      render: (row: any) => (
        <span>
          {conjureValueBasedOnIDFromList(
            facilityListResponse ?? [],
            row?.facilityId,
            'name'
          )}
        </span>
      ),
    },
    { key: 'name', title: <Translate>Procedure Name</Translate>, flexGrow: 4 },
    { key: 'code', title: <Translate>Code</Translate>, flexGrow: 3 },
    {
      key: 'categoryType',
      title: <Translate>Category</Translate>,
      flexGrow: 3,
      render: (row: any) =>
        row?.categoryType ? formatEnumString(row?.categoryType) : '',
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
      key: 'coding',
      title: <Translate>Coding</Translate>,
      width: 90,
      align: 'center' as const,
      render: (row: any) => (
        <MdLink
          className="icons-style"
          title="Link Codes"
          size={22}
          fill="var(--primary-gray)"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setLinkCodingProcedureId(Number(row?.id));
            setLinkCodingOpen(true);
          }}
        />
      ),
    },
    {
      key: 'priceList',
      title: <Translate>Price List</Translate>,
      width: 110,
      align: 'center' as const,
      render: (row: any) => (
        <MdAttachMoney
          className="icons-style"
          title="Link Prices"
          size={22}
          fill="var(--primary-gray)"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setLinkPriceProcedureId(Number(row?.id));
            setLinkPriceOpen(true);
          }}
        />
      ),
    },
    {
      key: 'actions',
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

  // Filters UI
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
      ) : recordOfFilter.filter === 'facilityId' ? (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={facilityListResponse ?? []}
          selectDataLabel="name"
          selectDataValue="id"
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
        onClick={() =>
          handleFilterChange(
            recordOfFilter.filter,
            recordOfFilter.value,
            0,
            filterPagination.size
          )
        }
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  // Auto reset when filter value is cleared
  useEffect(() => {
    if ((recordOfFilter.value === null || recordOfFilter.value === '') && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={row => setProcedure(row)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
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
        }
      />

      <AddEditProcedure
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        procedure={procedure}
        setProcedure={setProcedure}
        onSaveSuccess={handleSaveSuccess}
        actionLoading={isFetching}
      />

      <DeletionConfirmationModal
        open={openConfirmToggleActive}
        setOpen={setOpenConfirmToggleActive}
        itemToDelete="Procedure"
        actionButtonFunction={toggleAction === 'deactivate' ? handleDeactivate : handleReactivate}
        actionType={toggleAction}
      />

      <LinkProcedureCoding
        open={linkCodingOpen}
        setOpen={setLinkCodingOpen}
        procedureId={linkCodingProcedureId ?? 0}
      />

      <LinkProcedurePriceList
        open={linkPriceOpen}
        setOpen={setLinkPriceOpen}
        procedureId={linkPriceProcedureId ?? 0}
      />
    </Panel>
  );
};

export default ProcedureSetup;
