import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdDelete, MdModeEdit } from 'react-icons/md';

import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import SectionContainer from '@/components/SectionsoContainer';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { extractPaginationFromLink } from '@/utils/paginationHelper';

import { DistrictCommunity } from '@/types/model-types-new';

import {
  useAddCommunityMutation,
  useGetCommunitiesByDistrictQuery,
  useLazyGetCommunitiesByDistrictQuery,
  useToggleCommunityActiveMutation,
  useUpdateCommunityMutation
} from '@/services/setup/country/districtCommunityService';
import TranslationModal from '@/components/TranslationModal';

type Props = {
  districtId: number;
  onSelect: (c: DistrictCommunity | null) => void;
  selectedCommunity: DistrictCommunity | null;
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      if (m.includes('must be greater')) return 'value is too small';
      if (m.includes('must be less')) return 'value is too large';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
};
const COMMUNITY_ERROR_MAP: Record<string, string> = {
  'district.required': 'District is required.',
  'payload.required': 'Community payload is required.',
  'id.required': 'Community id is required.',

  'unique.community.name':
    'Community name already exists for this district.',

  'db.constraint':
    'Unable to save the community due to a database constraint.',

  'db.duplicate.primarykey':
    'A system configuration issue was detected. Please contact support.',

  notfound: 'Community not found.'
};

const CommunitySection: React.FC<Props> = ({ districtId, onSelect, selectedCommunity }) => {
  const dispatch = useAppDispatch();

  const [communityForEdit, setCommunityForEdit] = useState<DistrictCommunity>({
    id: undefined,
    districtId: Number(districtId),
    name: '',
    isActive: true
  });

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [selectedForToggle, setSelectedForToggle] = useState<DistrictCommunity | null>(null);
  const [showTranslationModal, setShowTranslationModal] = useState<boolean>(false);
    const [translationFields, setTranslationFields] = useState<
      { fieldName: string; value: string }[]
    >([]);
  // Filter state
  const [recordOfCommunityFilter, setRecordOfCommunityFilter] = useState<{
    filter: string;
    value: any;
  }>({
    filter: '',
    value: ''
  });
  const [isCommunityFiltered, setIsCommunityFiltered] = useState(false);
  const [filteredCommunities, setFilteredCommunities] = useState<DistrictCommunity[]>([]);
  const [filteredCommunityTotal, setFilteredCommunityTotal] = useState<number>(0);

  // Unfiltered pagination
  const [communityPaginationParams, setCommunityPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Filtered pagination
  const [communityFilterPagination, setCommunityFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const communityFilterFields = [{ label: 'Community Name', value: 'name' }];

  // Main data query
  const {
    data: communitiesResp,
    isFetching: communitiesFetching,
    refetch: refetchCommunities
  } = useGetCommunitiesByDistrictQuery(
    {
      districtId: Number(districtId),
      page: communityPaginationParams.page,
      size: communityPaginationParams.size,
      sort: communityPaginationParams.sort
    },
    { skip: Number(districtId) === 0 }
  );

  // Lazy query for filtering
  const [fetchCommunitiesByDistrict, { isFetching: filterFetching }] =
    useLazyGetCommunitiesByDistrictQuery();

  const [addCommunity] = useAddCommunityMutation();
  const [updateCommunity] = useUpdateCommunityMutation();
  const [toggleCommunityActive] = useToggleCommunityActiveMutation();

  // Derived values
  const communityTotalCount = useMemo(
    () => (isCommunityFiltered ? filteredCommunityTotal : communitiesResp?.totalCount ?? 0),
    [isCommunityFiltered, filteredCommunityTotal, communitiesResp?.totalCount]
  );

  const communityLinks = communitiesResp?.links || {};

  const communityTableData = useMemo(() => {
    if (!isCommunityFiltered) return communitiesResp?.data ?? [];
    const start = communityFilterPagination.page * communityFilterPagination.size;
    const end = start + communityFilterPagination.size;
    return filteredCommunities.slice(start, end);
  }, [
    isCommunityFiltered,
    communitiesResp?.data,
    filteredCommunities,
    communityFilterPagination.page,
    communityFilterPagination.size
  ]);

  // Centralized reset to unfiltered
  const resetCommunityToUnfiltered = () => {
    setIsCommunityFiltered(false);
    setFilteredCommunities([]);
    setFilteredCommunityTotal(0);

    setCommunityFilterPagination(prev => ({ ...prev, page: 0, sort: 'id,desc' }));
    setCommunityPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: 'id,asc',
      timestamp: Date.now()
    }));

    refetchCommunities();
  };

  // Unified refetch respecting current mode
  const refetchList = async () => {
    if (isCommunityFiltered) {
      await handleCommunityFilterChange(
        recordOfCommunityFilter.filter,
        recordOfCommunityFilter.value,
        communityFilterPagination.page,
        communityFilterPagination.size,
        communityFilterPagination.sort
      );
    } else {
      setCommunityPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      await refetchCommunities();
    }
  };

  // Run filter query
  const runCommunityFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = communityFilterPagination.size,
    sort?: string
  ) => {
    if (!value) return undefined;

    const effectiveSort = sort ?? 'id,desc';

    // NOTE: append dummy ts to break RTK Query cache
    const resp = await fetchCommunitiesByDistrict({
      districtId: Number(districtId),
      page: 0,
      size: 1000, // جيب كل البيانات
      sort: effectiveSort,
      ts: Date.now() // عشان نكسر الـ cache
    } as any).unwrap();

    const all = resp?.data ?? [];
    const term = String(value).toLowerCase();

    let filtered: DistrictCommunity[] = all;
    if (fieldName === 'name') {
      filtered = all.filter(c => (c.name ?? '').toString().toLowerCase().includes(term));
    }

    return { data: filtered, totalCount: filtered.length };
  };

  // Apply/clear filter
  const handleCommunityFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = communityFilterPagination.size,
    sort = communityFilterPagination.sort
  ) => {
    if (!value) {
      resetCommunityToUnfiltered();
      return;
    }

    try {
      const resp = await runCommunityFilterQuery(fieldName, value, page, size, sort);
      const list = resp?.data ?? [];
      setFilteredCommunities(list);
      setFilteredCommunityTotal(resp?.totalCount ?? list.length);
      setIsCommunityFiltered(true);
      setCommunityFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      dispatch(notify({ msg: 'Failed to filter communities', sev: 'error' }));
      resetCommunityToUnfiltered();
    }
  };

  const handleCommunityPageChange = (_: unknown, newPage: number) => {
    if (isCommunityFiltered) {
      setCommunityFilterPagination(prev => ({ ...prev, page: newPage }));
      return;
    }

    const currentPage = communityPaginationParams.page;
    const linksMap = communityLinks || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setCommunityPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  const handleCommunityRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isCommunityFiltered) {
      setCommunityFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
    } else {
      setCommunityPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  // Auto revert when value cleared
  useEffect(() => {
    if (!recordOfCommunityFilter.value && isCommunityFiltered) {
      resetCommunityToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfCommunityFilter.value]);

  useEffect(() => {
    setCommunityForEdit({
      id: undefined,
      districtId: Number(districtId),
      name: '',
      isActive: true
    });
  }, [districtId]);

  const handleSaveCommunity = async (payload: DistrictCommunity) => {
    if (!districtId) return;

    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'Community name is required', sev: 'error' }));
      return;
    }

    try {
      const body: DistrictCommunity = {
        ...payload,
        districtId: Number(districtId),
        isActive: payload.isActive ?? true
      };

      if (body.id) {
        await updateCommunity({ districtId: Number(districtId), id: body.id, body }).unwrap();
        dispatch(notify({ msg: 'Community updated successfully', sev: 'success' }));
         setTranslationFields([
                  {
                    fieldName: 'name',
                    value: body.name
                  }
                ]);
                setShowTranslationModal(true);
      } else {
        await addCommunity({ districtId: Number(districtId), ...body }).unwrap();
        dispatch(notify({ msg: 'Community added successfully', sev: 'success' }));
         setTranslationFields([
                  {
                    fieldName: 'name',
                    value: body.name
                  }
                ]);
                setShowTranslationModal(true);
      }

      setCommunityForEdit({
        id: undefined,
        districtId: Number(districtId),
        name: '',
        isActive: true
      });
      await refetchList();
    } catch (err: any) {
      handleCrudError(err, dispatch, COMMUNITY_ERROR_MAP);
    }
  };

  const handleConfirmToggle = async () => {
    if (!selectedForToggle?.id) return;
    try {
      await toggleCommunityActive({ id: selectedForToggle.id }).unwrap();

      // Refresh بنفس طريقة Vaccine
      if (isCommunityFiltered) {
        await handleCommunityFilterChange(
          recordOfCommunityFilter.filter,
          recordOfCommunityFilter.value,
          communityFilterPagination.page,
          communityFilterPagination.size,
          communityFilterPagination.sort
        );
      } else {
        await refetchCommunities();
      }

      dispatch(
        notify({
          msg: deleteMode === 'deactivate' ? 'Deactivated successfully' : 'Activated successfully',
          sev: 'success'
        })
      );
    } catch {
      dispatch(
        notify({
          msg: deleteMode === 'deactivate' ? 'Failed to deactivate' : 'Failed to activate',
          sev: 'error'
        })
      );
    } finally {
      setOpenDeleteConfirm(false);
    }
  };

  const communityFiltersUI = () => {
    const selectedFilter = recordOfCommunityFilter.filter;

    const dynamicInput = (
      <MyInput
        fieldType="text"
        fieldName="value"
        column
        showLabel={false}
        placeholder={selectedFilter === 'name' ? 'Enter Community Name' : 'Enter Value'}
        record={recordOfCommunityFilter}
        setRecord={setRecordOfCommunityFilter}
        width={170}
      />
    );

    return (
      <Form layout="inline" fluid className="flex-dis-row">
        <MyInput
          fieldType="select"
          fieldName="filter"
          column
          showLabel={false}
          selectData={communityFilterFields}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfCommunityFilter}
          setRecord={(v: any) => setRecordOfCommunityFilter({ filter: v.filter, value: '' })}
          placeholder="Select Filter"
          searchable={false}
          width={170}
        />
        {dynamicInput}
        <div className="margin-top-25">
          <MyButton
            color="var(--deep-blue)"
            width="80px"
            onClick={() => {
              if (!recordOfCommunityFilter.value) {
                resetCommunityToUnfiltered();
              } else {
                handleCommunityFilterChange(
                  recordOfCommunityFilter.filter,
                  recordOfCommunityFilter.value,
                  0,
                  communityFilterPagination.size,
                  communityFilterPagination.sort || 'id,desc'
                );
              }
            }}
          >
            Search
          </MyButton>
        </div>
      </Form>
    );
  };

  const communityColumns = [
    { key: 'name', title: <Translate>Community Name</Translate>, flexGrow: 3 },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      width: 90,
      render: (row: DistrictCommunity) =>
        row.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 1,
      render: (row: DistrictCommunity) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => setCommunityForEdit(row)}
          />
          {row.isActive ? (
            <MdDelete
              className="icons-style"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setSelectedForToggle(row);
                setDeleteMode('deactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setSelectedForToggle(row);
                setDeleteMode('reactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <SectionContainer
        title={<Translate>Communities</Translate>}
        content={
          <>
            <div className="inputs-dis-flex">
              <div className="geo-inline-form">
                <Form fluid layout="inline" className="form-of-filters-set-up">
                  <MyInput
                    fieldName="name"
                    fieldType="text"
                    column
                    fieldLabel="Community Name"
                    record={communityForEdit}
                    setRecord={setCommunityForEdit}
                    width={220}
                    required
                  />
                  <div className="margin-top-37">
                    <MyButton
                      color="var(--deep-blue)"
                      width="80px"
                      onClick={() => handleSaveCommunity(communityForEdit)}
                    >
                      Save
                    </MyButton>
                  </div>
                  <div className="margin-top-37">
                    <MyButton
                      color="var(--primary-gray)"
                      width="80px"
                      onClick={() =>
                        setCommunityForEdit({
                          id: undefined,
                          districtId: Number(districtId),
                          name: '',
                          isActive: true
                        })
                      }
                    >
                      Clear
                    </MyButton>
                  </div>
                </Form>
              </div>

              {communityFiltersUI()}
            </div>

            <MyTable
              data={communityTableData}
              columns={communityColumns}
              totalCount={communityTotalCount}
              page={
                isCommunityFiltered
                  ? communityFilterPagination.page
                  : communityPaginationParams.page
              }
              rowsPerPage={
                isCommunityFiltered
                  ? communityFilterPagination.size
                  : communityPaginationParams.size
              }
              onPageChange={handleCommunityPageChange}
              onRowsPerPageChange={handleCommunityRowsPerPageChange}
              loading={communitiesFetching || filterFetching}
              filters={null}
              onRowClick={row => onSelect(row as DistrictCommunity)}
              rowClassName={row =>
                selectedCommunity && row.id === selectedCommunity.id ? 'selected-row' : ''
              }
              dontTranslateData 
            />
          </>
        }
      />
      
      <TranslationModal
              open={showTranslationModal}
              setOpen={setShowTranslationModal}
              fields={translationFields}
            />

      <DeletionConfirmationModal
        open={openDeleteConfirm}
        setOpen={setOpenDeleteConfirm}
        itemToDelete="Community"
        actionButtonFunction={handleConfirmToggle}
        actionType={deleteMode}
      />
    </>
  );
};

export default CommunitySection;
