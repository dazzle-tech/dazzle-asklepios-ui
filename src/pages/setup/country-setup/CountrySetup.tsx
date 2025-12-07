import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo, FaMapMarkerAlt } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddEditCountryModal from './AddEditCountryModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import './styles.less';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';

import {
  useGetCountriesQuery,
  useLazyGetCountryByNameQuery,
  useLazyGetCountryByCodeQuery,
  useAddCountryMutation,
  useUpdateCountryMutation,
  useToggleCountryActiveMutation
} from '@/services/setup/country/countryService';

import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { Country } from '@/types/model-types-new';
import { newCountry } from '@/types/model-types-constructor-new';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const CountrySetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [country, setCountry] = useState<Country>({ ...newCountry });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'deactivate' | 'reactivate'>('deactivate');

  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<Country[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const { data: lovResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const {
    data: pageData,
    isFetching,
    refetch
  } = useGetCountriesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  });

  const [fetchByName] = useLazyGetCountryByNameQuery();
  const [fetchByCode] = useLazyGetCountryByCodeQuery();

  const [addCountry] = useAddCountryMutation();
  const [updateCountry] = useUpdateCountryMutation();
  const [toggleCountryActive] = useToggleCountryActiveMutation();

  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : pageData?.totalCount ?? 0),
    [isFiltered, filteredTotal, pageData?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : pageData?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : pageData?.data ?? []),
    [isFiltered, filteredData, pageData?.data]
  );

  const filterFields = [
    { label: 'Country Name', value: 'name' },
    { label: 'Code', value: 'code' }
  ];

  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);
    setFilterPagination(prev => ({ ...prev, page: 0 }));
    setPaginationParams(prev => ({ ...prev, page: 0, sort: 'id,asc', timestamp: Date.now() }));
    refetch();
  };

  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value && value !== 0) return undefined;

    if (fieldName === 'name') {
      return await fetchByName({ name: value, page, size, sort }).unwrap();
    } else if (fieldName === 'code') {
      return await fetchByCode({ code: value, page, size, sort }).unwrap();
    }
    return undefined;
  };

  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value) {
      resetToUnfiltered();
      return;
    }
    try {
      const resp = await runFilterQuery(fieldName, value, page, size, sort);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetToUnfiltered();
    }
  };


  const handleSave = async (payload: Country) => {
    setPopupOpen(false);
    setOpenAddEditPopup(false);
    const isUpdate = !!payload.id;

    try {
      if (isUpdate) {
        const updated = await updateCountry(payload).unwrap();
        dispatch(notify({ msg: 'Country updated successfully', sev: 'success' }));

        if (isFiltered) {
          setFilteredData(prev => prev.map(row => (row.id === updated.id ? updated : row)));
        } else {
          setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
          refetch();
        }
      } else {
        // Create
        const created = await addCountry(payload).unwrap();
        dispatch(notify({ msg: 'Country added successfully', sev: 'success' }));

        if (isFiltered) {
          const filterField = recordOfFilter.filter;
          const filterValue = recordOfFilter.value;
          let matchesFilter = false;

          if (filterField === 'name') {
            matchesFilter = created.name === filterValue;
          } else if (filterField === 'code') {
            matchesFilter = (created.code ?? '')
              .toString()
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          }

          if (matchesFilter) {
            setFilteredData(prev => [created, ...prev]);
            setFilteredTotal(prev => prev + 1);
            setFilterPagination(prev => ({ ...prev, page: 0 }));
          } else {
            dispatch(
              notify({
                msg: 'Country added but does not match current filter',
                sev: 'info'
              })
            );
          }
        } else {
          setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
          refetch();
        }
      }

      setCountry({ ...newCountry });
    } catch (error) {
      dispatch(notify({ msg: 'Failed to save country', sev: 'error' }));
    }
  };

  const doToggle = async () => {
    try {
      if (!country?.id) return;
      const toggledId = country.id as number;
      const res = await toggleCountryActive({ id: toggledId }).unwrap();
      const newIsActive =
        res && typeof (res as any).isActive === 'boolean'
          ? (res as any).isActive
          : !country.isActive;

      setCountry(prev =>
        prev && prev.id === toggledId ? { ...prev, isActive: newIsActive } : prev
      );

      if (isFiltered) {
        setFilteredData(prev =>
          prev.map(row => (row.id === toggledId ? { ...row, isActive: newIsActive } : row))
        );
      } else {
        refetch();
      }

      dispatch(
        notify({
          msg:
            deleteMode === 'deactivate'
              ? 'Country Deactivated successfully'
              : 'Country Activated successfully',
          sev: 'success'
        })
      );
    } catch {
      dispatch(
        notify({
          msg:
            deleteMode === 'deactivate'
              ? 'Failed to deactivate country'
              : 'Failed to activate country',
          sev: 'error'
        })
      );
    }
  };

  const handleDeactivate = () => {
    setOpenConfirm(false);
    setDeleteMode('deactivate');
    doToggle();
  };

  const handleReactivate = () => {
    setOpenConfirm(false);
    setDeleteMode('reactivate');
    doToggle();
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        newPage,
        filterPagination.size,
        filterPagination.sort
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
        timestamp: Date.now()
      }));
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        0,
        newSize,
        filterPagination.sort
      );
    } else {
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  const filters = () => {
    const selected = recordOfFilter.filter;

    const dynamicInput =
      selected === 'name' ? (
        <MyInput
          width={250}
          fieldLabel=""
          fieldType="select"
          fieldName="value"
          selectData={lovResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          menuMaxHeight={200}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder={selected === 'code' ? 'Enter Country Code' : 'Enter Value'}
          width={220}
        />
      );

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfFilter}
          setRecord={(updatedRecord: any) => {
            setRecordOfFilter({ filter: updatedRecord.filter, value: '' });
          }}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width="170px"
        />
        {dynamicInput}
        <MyButton
          color="var(--deep-blue)"
          onClick={() => {
            if (!recordOfFilter.value && recordOfFilter.value !== 0) {
              resetToUnfiltered();
            } else {
              handleFilterChange(
                recordOfFilter.filter,
                recordOfFilter.value,
                0,
                filterPagination.size,
                filterPagination.sort
              );
            }
          }}
          width="80px"
        >
          Search
        </MyButton>
      </Form>
    );
  };

  const columns = [
    {
      key: 'name',
      title: <Translate>Country Name</Translate>,
      flexGrow: 3,
      render: (row: Country) =>
        conjureValueBasedOnKeyFromList(lovResponse?.object ?? [], row.name, 'lovDisplayVale')
    },
    { key: 'code', title: <Translate>Code</Translate>, flexGrow: 3 },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      width: 60,
      render: rowData =>
        rowData.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: (rowData: Country) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setCountry(rowData);
              setPopupOpen(true);
            }}
          />

          <FaMapMarkerAlt
            className="icons-style"
            size={24}
            fill="var(--deep-blue)"
            onClick={() =>
              navigate(`/district-country/${rowData.id}`, {
                state: { country: rowData }
              })
            }
          />

          {rowData.isActive ? (
            <MdDelete
              className="icons-style"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setCountry(rowData);
                setDeleteMode('deactivate');
                setOpenConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setCountry(rowData);
                setDeleteMode('reactivate');
                setOpenConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  useEffect(() => {
    dispatch(setPageCode('Countries'));
    dispatch(setDivContent('Countries'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (!recordOfFilter.value && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel>
      <div className="container-of-add-new-button">
        {!openAddEditPopup && (
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setCountry({ ...newCountry });
              setOpenAddEditPopup(true);
            }}
            width="109px"
          >
            Add New
          </MyButton>
        )}
      </div>

      {openAddEditPopup && (
        <AddEditCountryModal
          open={openAddEditPopup}
          onClose={() => setOpenAddEditPopup(false)}
          country={country}
          onSave={handleSave}
        />
      )}

      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={columns}
        rowClassName={row => (row?.id === country?.id ? 'selected-row' : '')}
        onRowClick={row => setCountry(row)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Country"
        actionButtonFunction={deleteMode === 'deactivate' ? handleDeactivate : handleReactivate}
        actionType={deleteMode}
      />
    </Panel>
  );
};

export default CountrySetup;
