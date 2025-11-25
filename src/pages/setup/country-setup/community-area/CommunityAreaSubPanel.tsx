import React, { useState, useMemo, useEffect } from 'react';
import { Form } from 'rsuite';

import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';

import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';

import {
  useGetAreasByDistrictQuery,
  useLazyGetAreasByDistrictQuery,
  useAddAreaMutation,
  useUpdateAreaMutation,
  useToggleAreaActiveMutation
} from '@/services/setup/country/communityAreaService';

import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

import { CommunityArea, DistrictCommunity } from '@/types/model-types-new';
import { newCommunityArea } from '@/types/model-types-constructor-new';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import '../styles.less';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

interface Props {
  community: DistrictCommunity;
}

const CommunityAreaSubPanel: React.FC<Props> = ({ community }) => {
  const dispatch = useAppDispatch();

  const [area, setArea] = useState<CommunityArea>({
    ...newCommunityArea,
    communityId: community?.id ?? 0
  });

  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'deactivate' | 'reactivate'>('deactivate');

  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<CommunityArea[]>([]);
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

  const communityId = community?.id ?? 0;

  const { data, isFetching, refetch } = useGetAreasByDistrictQuery(
    {
      districtId: communityId,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    { skip: communityId === 0 }
  );

  const [fetchAreasByDistrict] = useLazyGetAreasByDistrictQuery();

  const [addArea] = useAddAreaMutation();
  const [updateArea] = useUpdateAreaMutation();
  const [toggleAreaActive] = useToggleAreaActiveMutation();

  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : data?.totalCount ?? 0),
    [isFiltered, filteredTotal, data?.totalCount]
  );

  const links = data?.links || {};

  const tableData = useMemo(() => {
    if (!isFiltered) return data?.data ?? [];

    const start = filterPagination.page * filterPagination.size;
    const end = start + filterPagination.size;
    return filteredData.slice(start, end);
  }, [isFiltered, data?.data, filteredData, filterPagination.page, filterPagination.size]);

  const filterFields = [{ label: 'Area Name', value: 'name' }];

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

    const totalFromServer = data?.totalCount ?? 1000;
    const bigSize = totalFromServer || 1000;

    const resp = await fetchAreasByDistrict({
      districtId: communityId,
      page: 0,
      size: bigSize,
      sort: effectiveSort
    }).unwrap();

    const all = resp?.data ?? [];
    const term = String(value).toLowerCase();

    let filtered: CommunityArea[] = all;

    if (fieldName === 'name') {
      filtered = all.filter(a => (a.name ?? '').toString().toLowerCase().includes(term));
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

  const handleAdd = () => {
    setArea({
      ...newCommunityArea,
      communityId
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!area.name?.trim()) {
      dispatch(notify({ msg: 'Area name is required', sev: 'error' }));
      return;
    }

    const payload: CommunityArea = {
      ...area,
      communityId,
      name: (area.name || '').trim(),
      isActive: area.isActive ?? true
    };

    const isUpdate = !!payload.id;

    try {
      if (isUpdate) {
        const updated = await updateArea({
          districtId: communityId,
          id: payload.id!,
          body: {
            id: payload.id!,
            communityId,
            name: payload.name,
            isActive: payload.isActive
          }
        }).unwrap();

        dispatch(notify({ msg: 'Area updated successfully', sev: 'success' }));

        if (isFiltered) {
          setFilteredData(prev => prev.map(row => (row.id === updated.id ? updated : row)));
        } else {
          refetch();
        }
      } else {
        const created = await addArea({
          districtId: communityId,
          ...payload
        }).unwrap();

        dispatch(notify({ msg: 'Area added successfully', sev: 'success' }));

        if (isFiltered) {
          const filterField = recordOfFilter.filter;
          const filterValue = String(recordOfFilter.value).toLowerCase();
          let matchesFilter = false;

          if (filterField === 'name') {
            matchesFilter = (created.name ?? '').toString().toLowerCase().includes(filterValue);
          }

          if (matchesFilter) {
            setFilteredData(prev => [created, ...prev]);
            setFilteredTotal(prev => prev + 1);
            setFilterPagination(prev => ({ ...prev, page: 0 }));
          } else {
            dispatch(
              notify({
                msg: 'Area added but does not match current filter',
                sev: 'info'
              })
            );
          }
        } else {
          setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
          refetch();
        }
      }

      setOpenModal(false);
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
          id: 'Id',
          name: 'Area Name',
          communityId: 'Community',
          isActive: 'Active'
        };

        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          if (m.includes('must be greater')) return 'value is too small';
          if (m.includes('must be less')) return 'value is too large';
          if (m.includes('not a valid enum')) return 'has invalid value';
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
        'payload.required': 'Area payload is required.',
        'community.required': 'Community id is required.',
        'name.required': 'Area name is required.',
        'unique.communityArea.name':
          'An area with the same name already exists for this community.',
        'db.constraint': 'Database constraint violation.',
        notfound: 'Area not found.',
        'id.required': 'Area id is required.',
        'id.mismatch': 'Path id and body id mismatch.'
      };

      const humanMsg =
        (errorKey && keyMap[errorKey]) ||
        data?.detail ||
        data?.title ||
        data?.message ||
        'Unexpected error';

      dispatch(
        notify({
          msg: humanMsg + suffix,
          sev: 'error'
        })
      );
    }
  };

  const handleToggleActive = async () => {
    if (!area.id) return;

    try {
      const updated = await toggleAreaActive({ id: area.id }).unwrap();

      dispatch(
        notify({
          msg: updated.isActive ? 'Area Reactivated' : 'Area Deactivated',
          sev: 'success'
        })
      );
      setOpenDeleteModal(false);

      if (isFiltered) {
        setFilteredData(prev =>
          prev.map(row => (row.id === updated.id ? { ...row, isActive: updated.isActive } : row))
        );
      } else {
        refetch();
      }
    } catch {
      dispatch(notify({ msg: 'Failed to change area status', sev: 'error' }));
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

  const iconsForActions = (r: CommunityArea) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        size={20}
        fill="var(--primary-gray)"
        onClick={() => {
          setArea(r);
          setOpenModal(true);
        }}
      />

      {r.isActive ? (
        <MdDelete
          className="icons-style"
          size={20}
          fill="var(--primary-pink)"
          onClick={() => {
            setArea(r);
            setDeleteMode('deactivate');
            setOpenDeleteModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          size={20}
          fill="var(--deep-blue)"
          onClick={() => {
            setArea(r);
            setDeleteMode('reactivate');
            setOpenDeleteModal(true);
          }}
        />
      )}
    </div>
  );

  const filters = () => {
    const selectedFilter = recordOfFilter.filter;
    let dynamicInput: React.ReactNode;

    if (selectedFilter === 'name') {
      dynamicInput = (
        <MyInput
          fieldType="text"
          fieldName="value"
          showLabel={false}
          placeholder="Enter Area Name"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          width={170}
        />
      );
    } else {
      dynamicInput = (
        <MyInput
          fieldType="text"
          fieldName="value"
          showLabel={false}
          placeholder="Enter Value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          width={170}
        />
      );
    }

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
        <MyInput
          fieldType="select"
          fieldName="filter"
          showLabel={false}
          selectData={filterFields}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={(v: any) => setRecordOfFilter({ filter: v.filter, value: '' })}
          placeholder="Select Filter"
          searchable={false}
          width={170}
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
    if (!recordOfFilter.value && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value]); // eslint-disable-line

  return (
    <div style={{ padding: 12 }}>
      <div className="container-of-add-new-button">
        <MyButton
          color="var(--deep-blue)"
          width="109px"
          prefixIcon={() => <AddOutlineIcon />}
          onClick={handleAdd}
        >
          Add New
        </MyButton>
      </div>

      {openModal && (
        <div className="simple-modal-backdrop">
          <Form fluid className="modal-body-2">
            <MyInput
              fieldName="name"
              fieldType="text"
              fieldLabel="Area Name"
              record={area}
              setRecord={setArea}
              placeholder="Enter area name"
              width={300}
            />
            <div className="modal-2635">
              <MyButton color="var(--deep-blue)" width="80px" onClick={handleSave}>
                Save
              </MyButton>
            </div>
            <div className="modal-2635">
              <MyButton
                color="var(--primary-gray)"
                width="80px"
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </MyButton>
            </div>
          </Form>
        </div>
      )}

      <DeletionConfirmationModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        itemToDelete="Area"
        actionButtonFunction={handleToggleActive}
        actionType={deleteMode}
      />

      <MyTable
        height={420}
        data={tableData}
        loading={isFetching}
        columns={[
          { key: 'name', title: 'Area Name' },
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
          { key: 'icons', title: '', render: r => iconsForActions(r) }
        ]}
        rowClassName={r => (r.id === area.id ? 'selected-row' : '')}
        filters={filters()}
        onRowClick={r => setArea(r as CommunityArea)}
        totalCount={totalCount}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
};

export default CommunityAreaSubPanel;
