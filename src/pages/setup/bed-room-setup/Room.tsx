import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { FaUndo, FaBed, FaConciergeBell } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyModal from '@/components/MyModal/MyModal';
import PolicyAssignmentManager from '@/components/PolicyAssignment';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import AddEditRoom from './AddEditRoom';
import AddBed from './AddBed';
import AddService from './AddService';
import './styles.less';

import { Room } from '@/types/model-types-new';
import { newRoom } from '@/types/model-types-constructor-new';

import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import {
  useGetRoomsQuery,
  useChangeRoomActivationStatusMutation,
  ROOM_NOT_GENDER_SPECIFIC
} from '@/services/setup/room/roomService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';

// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to one endpoint and combined with AND.
const emptyHeaderFilters = {
  name: '',
  facilityId: '',
  floor: '',
  departmentId: '',
  type: '',
  gender: '',
  parallelCapacityValue: ''
};
type HeaderFilterField = keyof typeof emptyHeaderFilters;

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
  const [openPolicyAssignmentModal, setOpenPolicyAssignmentModal] = useState(false);
  const [selectedRoomForPolicyAssignment, setSelectedRoomForPolicyAssignment] = useState<Room | null>(null);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  const [roomPagination, setRoomPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const { data: departmentsList } = useGetAllDepartmentsWithoutPaginationQuery({});
  const { data: facilitiesResponse } = useGetAllFacilitiesQuery({});
  const roomTypeOptions = useEnumOptions('RoomType');
  const genderEnumOptions = useEnumOptions('Gender');
  const genderFilterOptions = useMemo(
    () => [{ label: 'Not Gender Specific', value: ROOM_NOT_GENDER_SPECIFIC }, ...(genderEnumOptions ?? [])],
    [genderEnumOptions]
  );

  const roomsQuery = useGetRoomsQuery({
    page: roomPagination.page,
    size: roomPagination.size,
    sort: roomPagination.sort,
    isActive: activeFilter,
    ...appliedFilters
  });

  const [changeRoomActivationStatus] = useChangeRoomActivationStatusMutation();

  const isFetching = roomsQuery.isFetching;
  const tableData = useMemo(() => roomsQuery.data?.data ?? [], [roomsQuery.data?.data]);
  const totalCount = roomsQuery.data?.totalCount ?? 0;
  const pageIndex = roomPagination.page;
  const rowsPerPage = roomPagination.size;

  const refetchActiveList = async () => {
    await roomsQuery.refetch();
  };

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setRoomPagination(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options]
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setRoomPagination(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

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

  const isSelected = (rowData: Room) => {
    if (rowData && room && room.id === rowData.id) {
      return 'selected-row';
    }
    return '';
  };

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

      <FontAwesomeIcon
        icon={faClipboardList}
        className="icons-style"
        title="Policy Assignment"
        size="lg"
        color="var(--primary-gray)"
        onClick={(e) => {
          e.stopPropagation();
          console.log('rowData', rowData);
          setSelectedRoomForPolicyAssignment(rowData);
          setOpenPolicyAssignmentModal(true);
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
      width: 180,
      ...headerSearch('name', 'Search name')
    },
    {
      key: 'facilityId',
      title: <Translate>Facility</Translate>,
      width: 180,
      ...headerSelect(
        'facilityId',
        (facilitiesResponse ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }))
      ),
      render: (rowData: any) => <span>{rowData.facility?.name ?? 'N/A'}</span>
    },
    {
      key: 'floor',
      title: <Translate>Floor</Translate>,
      width: 110,
      ...headerSearch('floor', 'Floor')
    },
    {
      key: 'departmentId',
      title: <Translate>Department</Translate>,
      width: 190,
      ...headerSelect(
        'departmentId',
        (departmentsList ?? []).map((d: any) => ({ label: d.name ?? '', value: String(d.id) }))
      ),
      render: (rowData: any) => <span>{rowData.department?.name ?? 'N/A'}</span>
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      width: 150,
      ...headerSelect('type', roomTypeOptions ?? []),
      render: (rowData: Room) => formatEnumString(rowData.type) ?? 'N/A'
    },
    {
      key: 'gender',
      title: <Translate>Gender Specific</Translate>,
      width: 160,
      ...headerSelect('gender', genderFilterOptions),
      render: (rowData: Room) => (rowData.isSpecificGender ? rowData.gender || 'Yes' : 'No')
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
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
      width: 130,
      ...headerSearch('parallelCapacityValue', 'Capacity'),
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

      <MyModal
        open={openPolicyAssignmentModal}
        setOpen={(value) => {
          setOpenPolicyAssignmentModal(value);
          if (!value) {
            setSelectedRoomForPolicyAssignment(null);
          }
        }}
        title="Policy Assignment"
        bodyheight="55vh"
        size="60vw"
        content={
          selectedRoomForPolicyAssignment ? (
            <PolicyAssignmentManager
              resourceType="ROOM"
              resourceId={selectedRoomForPolicyAssignment.id ?? 0}
              facilityId={selectedRoomForPolicyAssignment.facility?.id ?? 0}
              showHeader={false}

            />
          ) : null
        }
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