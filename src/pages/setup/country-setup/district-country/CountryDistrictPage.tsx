import Translate from '@/components/Translate';
import React, { useState, useEffect, useMemo } from 'react';
import { Form, Panel } from 'rsuite';
import { FaUndo, FaRegWindowRestore } from 'react-icons/fa';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../styles.less';
import BackButton from '@/components/BackButton/BackButton';
import {
  useGetDistrictsByCountryQuery,
  useLazyGetDistrictsByCountryQuery,
  useAddDistrictMutation,
  useUpdateDistrictMutation,
  useToggleDistrictActiveMutation
} from '@/services/setup/country/countryDistrictService';

import { CountryDistrict } from '@/types/model-types-new';
import { newCountryDistrict } from '@/types/model-types-constructor-new';

import DistrictCommunityChildPanel from '../Community/DistrictCommunityChildPanel';
import ChildModal from '@/components/ChildModal/ChildModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import AddEditCountryDistrictModal from './AddEditCountryDistrictModal';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const CountryDistrictPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();
  const location = useLocation();

  const countryFromState = (location.state as any)?.country;
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const [district, setDistrict] = useState<CountryDistrict>({ ...newCountryDistrict });

  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] = useState<
    'delete' | 'deactivate' | 'reactivate'
  >('delete');

  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);

  const [openChildModal, setOpenChildModal] = useState(false);
  const [showChild, setShowChild] = useState(false);
  const [childTitle, setChildTitle] = useState<string>('');
  const [childContent, setChildContent] = useState<JSX.Element | null>(null);

  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<CountryDistrict[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);

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

  const {
    data: pageData,
    isFetching,
    refetch
  } = useGetDistrictsByCountryQuery(
    {
      countryId: Number(countryId),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    { skip: !countryId }
  );

  const [fetchDistrictsByCountry] = useLazyGetDistrictsByCountryQuery();

  const [addDistrict] = useAddDistrictMutation();
  const [updateDistrict] = useUpdateDistrictMutation();
  const [toggleDistrictActive] = useToggleDistrictActiveMutation();

  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : pageData?.totalCount ?? 0),
    [isFiltered, filteredTotal, pageData?.totalCount]
  );

  const links = pageData?.links || {};

  const tableData = useMemo(() => {
    if (!isFiltered) return pageData?.data ?? [];

    const start = filterPagination.page * filterPagination.size;
    const end = start + filterPagination.size;
    return filteredData.slice(start, end);
  }, [isFiltered, filteredData, pageData?.data, filterPagination.page, filterPagination.size]);

  const filterFields = [
    { label: 'District Name', value: 'name' },
    { label: 'Code', value: 'code' }
  ];

  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);

    setFilterPagination(prev => ({
      ...prev,
      page: 0,
      sort: 'id,desc'
    }));

    setPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: 'id,asc',
      timestamp: Date.now()
    }));

    refetch();
  };

  const runFilterQuery = async (fieldName: string, value: any, sort?: string) => {
    if (!value) return undefined;

    const effectiveSort = sort ?? 'id,desc';

    const totalFromServer = pageData?.totalCount ?? 1000;
    const bigSize = totalFromServer || 1000;

    const resp = await fetchDistrictsByCountry({
      countryId: Number(countryId),
      page: 0,
      size: bigSize,
      sort: effectiveSort
    }).unwrap();

    const all = resp?.data ?? [];
    const term = String(value).toLowerCase();

    let filtered: CountryDistrict[] = all;

    if (fieldName === 'name') {
      filtered = all.filter(d => (d.name ?? '').toString().toLowerCase().includes(term));
    } else if (fieldName === 'code') {
      filtered = all.filter(d => (d.code ?? '').toString().toLowerCase().includes(term));
    }

    return {
      data: filtered,
      totalCount: filtered.length
    };
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
      const resp = await runFilterQuery(fieldName, value, sort);

      const list = resp?.data ?? [];
      setFilteredData(list);
      setFilteredTotal(resp?.totalCount ?? list.length);
      setIsFiltered(true);

      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetToUnfiltered();
    }
  };

  const handleSaveDistrict = async (districtData: CountryDistrict) => {
    const payload: CountryDistrict = {
      ...districtData,
      id: districtData.id ?? district.id,
      countryId: Number(countryId),
      name: (districtData.name || '').trim(),
      code: (districtData.code || '').trim(),
      isActive: districtData.isActive ?? true
    };

    const isUpdate = !!payload.id;

    try {
      if (isUpdate) {
        const updated = await updateDistrict({
          countryId: payload.countryId,
          id: payload.id!,
          ...payload
        }).unwrap();

        dispatch(notify({ msg: 'District updated successfully', sev: 'success' }));

        if (isFiltered) {
          setFilteredData(prev => prev.map(row => (row.id === updated.id ? updated : row)));
        } else {
          refetch();
        }
      } else {
        const created = await addDistrict({ countryId: payload.countryId, ...payload }).unwrap();
        dispatch(notify({ msg: 'District added successfully', sev: 'success' }));

        if (isFiltered) {
          const filterField = recordOfFilter.filter;
          const filterValue = String(recordOfFilter.value).toLowerCase();
          let matchesFilter = false;

          if (filterField === 'name') {
            matchesFilter = (created.name ?? '').toString().toLowerCase().includes(filterValue);
          } else if (filterField === 'code') {
            matchesFilter = (created.code ?? '').toString().toLowerCase().includes(filterValue);
          }

          if (matchesFilter) {
            setFilteredData(prev => [created, ...prev]);
            setFilteredTotal(prev => prev + 1);
            setFilterPagination(prev => ({ ...prev, page: 0 }));
          } else {
            dispatch(
              notify({
                msg: 'District added but does not match current filter',
                sev: 'info'
              })
            );
          }
        } else {
          setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
          refetch();
        }
      }

      setOpenAddEditPopup(false);
      setDistrict({ ...newCountryDistrict });
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          id: 'Id',
          name: 'District Name',
          code: 'Code',
          isActive: 'Active',
          countryId: 'Country'
        };

        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
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
        'payload.required': 'District payload is required.',
        'country.required': 'Country id is required.',
        'name.required': 'District name is required.',
        'code.required': 'District code is required.',
        'unique.countryDistrict.namecode':
          'A district with the same name or code already exists for this country.',
        notfound: 'District not found.',
        'id.mismatch': 'Path id and body id mismatch.'
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

  const handleToggleDistrictActive = async () => {
    if (!district?.id) return;

    try {
      const res = await toggleDistrictActive({ id: district.id }).unwrap();
      const newIsActive = res?.isActive ?? !district.isActive;

      if (isFiltered) {
        setFilteredData(prev =>
          prev.map(row => (row.id === district.id ? { ...row, isActive: newIsActive } : row))
        );
      } else {
        refetch();
      }

      dispatch(
        notify({
          msg: newIsActive ? 'District Activated' : 'District Deactivated',
          sev: 'success'
        })
      );
      setDistrict({ ...newCountryDistrict });
      setOpenConfirmDeleteModal(false);
    } catch {
      dispatch(notify({ msg: 'Failed to change district status', sev: 'error' }));
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, page: newPage }));
      return;
    }

    const currentPage = paginationParams.page;
    const linksMap = links || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
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
    const selectedFilter = recordOfFilter.filter;
    let dynamicInput: React.ReactNode;

    if (selectedFilter === 'name') {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          placeholder="Enter District Name"
          width={170}
          showLabel={false}
        />
      );
    } else if (selectedFilter === 'code') {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          placeholder="Enter District Code"
          width={170}
          showLabel={false}
        />
      );
    } else {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          placeholder="Enter Value"
          width={170}
          showLabel={false}
        />
      );
    }

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfFilter}
          setRecord={(updated: any) => setRecordOfFilter({ filter: updated.filter, value: '' })}
          placeholder="Select Filter"
          searchable={false}
          width={170}
          showLabel={false}
        />

        {dynamicInput}

        <MyButton
          color="var(--deep-blue)"
          width="80px"
          onClick={() => {
            if (!recordOfFilter.value) {
              resetToUnfiltered();
            } else {
              handleFilterChange(
                recordOfFilter.filter,
                recordOfFilter.value,
                0,
                filterPagination.size,
                filterPagination.sort || 'id,desc'
              );
            }
          }}
        >
          Search
        </MyButton>
      </Form>
    );
  };

  useEffect(() => {
    dispatch(setPageCode('CountryDistrict'));
    dispatch(setDivContent('Country Districts'));
  }, [dispatch]);

  useEffect(() => {
    if (!recordOfFilter.value && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value]); // eslint-disable-line

  const isSelected = (rowData: CountryDistrict) =>
    district && rowData.id === district.id ? 'selected-row' : '';

  const iconsForActions = (rowData: CountryDistrict) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setDistrict(rowData);
          setOpenAddEditPopup(true);
        }}
      />

      <FaRegWindowRestore
        className="icons-style"
        size={24}
        fill="var(--deep-blue)"
        onClick={() => {
          setDistrict(rowData);
          setOpenChildModal(true);
          setShowChild(false);
          setChildTitle('');
          setChildContent(null);
        }}
      />

      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setDistrict(rowData);
            setStateOfDeleteModal('deactivate');
            setOpenConfirmDeleteModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setDistrict(rowData);
            setStateOfDeleteModal('reactivate');
            setOpenConfirmDeleteModal(true);
          }}
        />
      )}
    </div>
  );

  const handleAddDistrict = () => {
    setDistrict({ ...newCountryDistrict, countryId: Number(countryId) });
    setOpenAddEditPopup(true);
  };

  return (
    <Panel>
      <div className="country-district-header">
        <h6>
          {`${conjureValueBasedOnKeyFromList(
            countryLovQueryResponse?.object ?? [],
            countryFromState?.name,
            'lovDisplayVale'
          )}`}
          <Translate> Districts</Translate>
        </h6>

        <div className="modal-footer-2">
          <BackButton text="Back" onClick={() => navigate(-1)} appearance="default" />

          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            width="109px"
            onClick={handleAddDistrict}
          >
            Add New
          </MyButton>
        </div>
      </div>

      {openAddEditPopup && (
        <AddEditCountryDistrictModal
          open={openAddEditPopup}
          onClose={() => setOpenAddEditPopup(false)}
          district={district}
          onSave={handleSaveDistrict}
        />
      )}

      <MyTable
        height={450}
        data={tableData}
        loading={isFetching}
        columns={[
          { key: 'name', title: <Translate>District Name</Translate> },
          { key: 'code', title: <Translate>Code</Translate> },
          {
            key: 'isActive',
            title: <Translate>Status</Translate>,
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
            render: r => iconsForActions(r)
          }
        ]}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={r => setDistrict(r as CountryDistrict)}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteModal}
        setOpen={setOpenConfirmDeleteModal}
        itemToDelete="District"
        actionButtonFunction={handleToggleDistrictActive}
        actionType={stateOfDeleteModal}
      />

      <ChildModal
        open={openChildModal}
        setOpen={val => {
          setOpenChildModal(val);
          if (!val) {
            setShowChild(false);
            setChildTitle('');
            setChildContent(null);
          }
        }}
        showChild={showChild}
        setShowChild={setShowChild}
        title={`${district?.name ?? ''} Communities`}
        mainSize="sm"
        childSize="sm"
        mainContent={
          <DistrictCommunityChildPanel
            district={district}
            setShowChild={setShowChild}
            setChildContent={setChildContent}
            setChildTitle={setChildTitle}
          />
        }
        childTitle={childTitle}
        childContent={childContent}
        hideActionBtn
        hideActionChildBtn
      />
    </Panel>
  );
};

export default CountryDistrictPage;
