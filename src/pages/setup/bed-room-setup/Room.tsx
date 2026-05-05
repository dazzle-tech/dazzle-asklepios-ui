import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { FaUndo, FaBed, FaConciergeBell } from 'react-icons/fa';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import AddEditRoom from './AddEditRoom';
import AddBed from './AddBed';
import AddService from './AddService';
import './styles.less';

import { Room, Department } from '@/types/model-types-new';
import { newRoom } from '@/types/model-types-constructor-new';

import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import {
  useGetRoomsQuery,
  useGetRoomsByDepartmentIdQuery,
  useGetRoomsByNameQuery,
  useChangeRoomActivationStatusMutation
} from '@/services/setup/room/roomService';
import { formatEnumString } from '@/utils';

const PAGE_SIZE = 20;

type FilterCriteria = '' | 'department' | 'name';

const filterCriteriaOptions = [
  { label: 'Department', value: 'department' },
  { label: 'Room Name', value: 'name' }
];

const initialRoomFilter = {
  criteria: '' as FilterCriteria,
  departmentId: null as string | null,
  name: ''
};

const ROOM_ERROR_MAP: Record<string, string> = {
  notfound: 'Room not found.',
  'facility.notfound': 'Facility not found.',
  'department.notfound': 'Department not found.',
  'unique.room.name.department': 'A room with the same name already exists in this department.',
  'gender.required': 'Gender is required when the room is gender-specific.',
  'appointable.requirements.invalid': 'Appointable room requires valid duration and buffer values.',
  'room.has.occupied.beds': 'Cannot deactivate room because it has occupied beds.',
  'db.constraint': 'Database constraint violation while saving room.'
};

const handleRoomCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
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
        sev: 'warn'
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

  dispatch(
    notify({
      msg: humanMsg + suffix,
      sev: 'error'
    })
  );
};

const RoomSection = () => {
  const dispatch = useAppDispatch();

  const [room, setRoom] = useState<Room>({ ...newRoom });

  const [openAddBedModal, setAddBedModal] = useState(false);
  const [openConfirmDeleteRoomModal, setOpenConfirmDeleteRoomModal] = useState(false);
  const [stateOfDeleteRoomModal, setStateOfDeleteRoomModal] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [openAddServicePopup, setOpenAddServicePopup] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  const [roomPagination, setRoomPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [roomFilter, setRoomFilter] = useState<{
    criteria: FilterCriteria;
    departmentId: string | null;
    name: string;
  }>(initialRoomFilter);

  const [appliedRoomFilter, setAppliedRoomFilter] = useState<{
    criteria: FilterCriteria;
    departmentId: string | null;
    name: string;
  }>(initialRoomFilter);

  const [deptPage, setDeptPage] = useState(0);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [deptHasMore, setDeptHasMore] = useState(false);
  const [deptNextLink, setDeptNextLink] = useState<string | null>(null);
  const [filterSession, setFilterSession] = useState(0);

  const { data: departmentsResp, isFetching: isDeptLoading } = useGetDepartmentsQuery({
    page: deptPage,
    size: PAGE_SIZE,
    sort: 'name,asc'
  });

  const hasDepartmentFilter =
    appliedRoomFilter.criteria === 'department' && !!appliedRoomFilter.departmentId;
  const hasNameFilter =
    appliedRoomFilter.criteria === 'name' && !!appliedRoomFilter.name?.trim();

  const roomsQuery = useGetRoomsQuery(
    {
      page: roomPagination.page,
      size: roomPagination.size,
      sort: roomPagination.sort
    },
    {
      skip: hasDepartmentFilter || hasNameFilter
    }
  );

  const roomsByDepartmentQuery = useGetRoomsByDepartmentIdQuery(
    {
      departmentId: Number(appliedRoomFilter.departmentId),
      page: roomPagination.page,
      size: roomPagination.size,
      sort: roomPagination.sort
    },
    {
      skip: !hasDepartmentFilter
    }
  );

  const roomsByNameQuery = useGetRoomsByNameQuery(
    {
      name: appliedRoomFilter.name.trim(),
      page: roomPagination.page,
      size: roomPagination.size,
      sort: roomPagination.sort
    },
    {
      skip: !hasNameFilter
    }
  );

  const [changeRoomActivationStatus] = useChangeRoomActivationStatusMutation();

  useEffect(() => {
    if (!departmentsResp) return;

    const rows = departmentsResp.data ?? [];
    const nextLink = departmentsResp.links?.next ?? null;

    setDeptHasMore(Boolean(nextLink));
    setDeptNextLink(nextLink);

    if (deptPage === 0) {
      setAllDepartments(rows as Department[]);
    } else {
      setAllDepartments(prev => {
        const seenIds = new Set(prev.map(d => Number(d.id)));
        const merged = [...prev];

        rows.forEach((d: Department) => {
          if (!seenIds.has(Number(d.id))) {
            merged.push(d);
          }
        });

        return merged;
      });
    }
  }, [departmentsResp, deptPage]);

  const departmentFilterOptions = useMemo(
    () =>
      allDepartments.map((d: Department) => ({
        label: d.name ?? '',
        value: String(d.id)
      })),
    [allDepartments]
  );

  const activeRoomsResponse = hasDepartmentFilter
    ? roomsByDepartmentQuery.data
    : hasNameFilter
      ? roomsByNameQuery.data
      : roomsQuery.data;

  const isFetching =
    roomsQuery.isFetching || roomsByDepartmentQuery.isFetching || roomsByNameQuery.isFetching;

  const tableData = useMemo(() => {
    return activeRoomsResponse?.data ?? [];
  }, [activeRoomsResponse?.data]);

  const totalCount = activeRoomsResponse?.totalCount ?? 0;
  const pageIndex = roomPagination.page;
  const rowsPerPage = roomPagination.size;

  const refetchActiveList = async () => {
    if (hasDepartmentFilter) {
      await roomsByDepartmentQuery.refetch();
      return;
    }

    if (hasNameFilter) {
      await roomsByNameQuery.refetch();
      return;
    }

    await roomsQuery.refetch();
  };

  useEffect(() => {
    dispatch(setPageCode('Rooms'));
    dispatch(setDivContent('Rooms'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (roomToEdit) {
      setRoom(roomToEdit);
      setOpenAddEditPopup(true);
      setRoomToEdit(null);
    }
  }, [roomToEdit]);

  const handleEdit = (rowData: Room) => {
    setRoomToEdit(rowData);
  };

  const handleAddRoom = () => {
    setRoom({ ...newRoom });
    setOpenAddEditPopup(true);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setRoomPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoomPagination(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const handleToggleRoom = async () => {
    if (!room?.id) return;

    try {
      const active = !room.isActive;

      await changeRoomActivationStatus({ id: room.id, active }).unwrap();

      dispatch(
        notify({
          msg: active ? 'Room Activated Successfully' : 'Room Deactivated Successfully',
          sev: 'success'
        })
      );

      await refetchActiveList();
      setRoom({ ...newRoom });
    } catch (err: any) {
      handleRoomCrudError(err, dispatch, ROOM_ERROR_MAP);
    } finally {
      setOpenConfirmDeleteRoomModal(false);
    }
  };

  const handleResetFilter = () => {
    setRoomFilter({ ...initialRoomFilter });
    setAppliedRoomFilter({ ...initialRoomFilter });
    setRoomPagination(prev => ({ ...prev, page: 0 }));
    setDeptPage(0);
    setDeptNextLink(null);
    setDeptHasMore(false);
    setFilterSession(prev => prev + 1);
  };

  const isSelected = (rowData: Room) => {
    if (rowData && room && room.id === rowData.id) {
      return 'selected-row';
    }
    return '';
  };

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        width="180px"
        fieldName="criteria"
        fieldType="select"
        selectData={filterCriteriaOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={roomFilter}
        setRecord={(updated: any) => {
          const next = typeof updated === 'function' ? updated(roomFilter) : updated;
          const nextCriteria = (next?.criteria ?? '') as FilterCriteria;

          if (!nextCriteria) {
            handleResetFilter();
            return;
          }

          setRoomFilter({
            criteria: nextCriteria,
            departmentId: null,
            name: ''
          });

          setDeptPage(0);
          setDeptNextLink(null);
          setDeptHasMore(false);
          setFilterSession(prev => prev + 1);
        }}
        showLabel={false}
        placeholder="Select Criteria"
        searchable={false}
      />

      {roomFilter.criteria === 'department' && (
        <MyInput
          key={`department-filter-${filterSession}`}
          width="240px"
          fieldName="departmentId"
          fieldLabel=""
          fieldType="selectPagination"
          selectData={departmentFilterOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={roomFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(roomFilter) : updated;
            const nextDepartmentId = next?.departmentId ?? null;

            if (!nextDepartmentId) {
              handleResetFilter();
              return;
            }

            setRoomFilter(prev => ({
              ...prev,
              departmentId: nextDepartmentId
            }));
          }}
          loading={isDeptLoading}
          searchable
          showLabel={false}
          placeholder="Select Department"
          hasMore={deptHasMore}
          onFetchMore={async () => {
            if (!deptNextLink) return;
            const { page } = extractPaginationFromLink(deptNextLink);
            setDeptPage(page);
          }}
        />
      )}

      {roomFilter.criteria === 'name' && (
        <MyInput
          width="220px"
          fieldName="name"
          fieldType="text"
          record={roomFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(roomFilter) : updated;
            const nextName = next?.name ?? '';

            if (!nextName.trim()) {
              handleResetFilter();
              return;
            }

            setRoomFilter(prev => ({
              ...prev,
              name: nextName
            }));
          }}
          showLabel={false}
          placeholder="Search Room Name"
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        onClick={() => {
          if (
            !roomFilter.criteria ||
            (roomFilter.criteria === 'department' && !roomFilter.departmentId) ||
            (roomFilter.criteria === 'name' && !roomFilter.name.trim())
          ) {
            handleResetFilter();
            return;
          }

          setAppliedRoomFilter({
            criteria: roomFilter.criteria,
            departmentId: roomFilter.departmentId,
            name: roomFilter.name
          });

          setRoomPagination(prev => ({
            ...prev,
            page: 0
          }));
        }}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  const iconsForActions = (rowData: Room) => (
    <div className="container-of-icons">
      <FaConciergeBell
        className="icons-style"
        title="Add Service"
        size={24}
        fill="var(--primary-gray)"
        onClick={(e) => {
          e.stopPropagation();
          setRoom(rowData);
          setOpenAddServicePopup(true);
        }}
      />

      <FaBed
        className="icons-style"
        title="Add Bed"
        size={24}
        fill="var(--primary-gray)"
        onClick={(e) => {
          e.stopPropagation();
          setRoom(rowData);
          setAddBedModal(true);
        }}
      />

      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(rowData);
        }}
      />

      {rowData?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={(e) => {
            e.stopPropagation();
            setRoom(rowData);
            setStateOfDeleteRoomModal('deactivate');
            setOpenConfirmDeleteRoomModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={(e) => {
            e.stopPropagation();
            setRoom(rowData);
            setStateOfDeleteRoomModal('reactivate');
            setOpenConfirmDeleteRoomModal(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Room Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'facilityId',
      title: <Translate>Facility</Translate>,
      flexGrow: 4,
      render: (rowData: Room) => <span>{rowData.facility?.name ?? 'N/A'}</span>
    },
    {
      key: 'floor',
      title: <Translate>Floor</Translate>,
      flexGrow: 3
    },
    {
      key: 'departmentId',
      title: <Translate>Department</Translate>,
      flexGrow: 4,
      render: (rowData: Room) => <span>{rowData.department?.name ?? 'N/A'}</span>
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: (rowData: Room) => formatEnumString(rowData.type) ?? 'N/A'
    },
    {
      key: 'gender',
      title: <Translate>Gender Specific</Translate>,
      flexGrow: 3,
      render: (rowData: Room) => (rowData.isSpecificGender ? rowData.gender || 'Yes' : 'No')
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      render: (rowData: Room) =>
        rowData.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'parallelCapacityValue',
      title: <Translate>Parallel Capacity</Translate>,
      flexGrow: 3,
      render: (rowData: Room) => rowData.parallelCapacityValue ?? 1
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: Room) => iconsForActions(rowData)
    }
  ];

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={tableData}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={(rowData: Room) => {
          setRoom(rowData);
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleAddRoom}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteRoomModal}
        setOpen={setOpenConfirmDeleteRoomModal}
        itemToDelete="Room"
        actionButtonFunction={handleToggleRoom}
        actionType={stateOfDeleteRoomModal}
      />

      <AddEditRoom
        open={openAddEditPopup}
        setOpen={setOpenAddEditPopup}
        room={room}
        setRoom={setRoom}
        refetch={refetchActiveList}
      />

      <AddBed
        open={openAddBedModal}
        setOpen={setAddBedModal}
        room={room}
        setRoom={setRoom}
        refetchRoom={refetchActiveList}
      />

      <AddService
        open={openAddServicePopup}
        setOpen={setOpenAddServicePopup}
        roomObj={room}
        setRoomObj={setRoom}
      />
    </Panel>
  );
};

export default RoomSection;