import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital, faBedPulse } from '@fortawesome/free-solid-svg-icons';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import ChildModal from '@/components/ChildModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Bed, Room } from '@/types/model-types-new';
import { newBed } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetBedsByRoomIdQuery,
  useAddBedMutation,
  useUpdateBedMutation,
  useChangeBedActivationStatusMutation
} from '@/services/setup/room/bedService';

import './styles.less';
import { formatEnumString } from '@/utils';

const BED_ERROR_MAP: Record<string, string> = {
  notfound: 'Bed not found.',
  'room.notfound': 'Room not found.',
  'room.invalid': 'Invalid room reference.',
  'unique.bed.name.room': 'A bed with the same name already exists.',
  'status.invalid': 'Invalid bed status value.',
  'bed.occupied': 'Cannot deactivate an occupied bed.',
  'db.constraint': 'Database constraint violation while saving bed.'
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

  dispatch(
    notify({
      msg: humanMsg + suffix,
      sev: 'warn'
    })
  );
};

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  room: Room;
  setRoom: React.Dispatch<React.SetStateAction<Room>>;
  refetchRoom: () => void | Promise<any>;
};

const AddBed: React.FC<Props> = ({ open, setOpen, room, setRoom, refetchRoom }) => {
  const dispatch = useAppDispatch();

  const [bed, setBed] = useState<Bed>({ ...newBed });
  const [openChildModal, setOpenChildModal] = useState(false);
  const [openConfirmDeleteBedModal, setOpenConfirmDeleteBedModal] = useState(false);
  const [stateOfDeleteBedModal, setStateOfDeleteBedModal] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );

  const [bedPagination, setBedPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const bedTypeOptions = useEnumOptions('BedType');

  const {
    data: bedsResponse,
    isFetching,
    refetch
  } = useGetBedsByRoomIdQuery(
    {
      roomId: Number(room?.id),
      page: bedPagination.page,
      size: bedPagination.size,
      sort: bedPagination.sort
    },
    {
      skip: !room?.id
    }
  );

  const [addBed, { isLoading: isAdding }] = useAddBedMutation();
  const [updateBed, { isLoading: isUpdating }] = useUpdateBedMutation();
  const [changeBedActivationStatus] = useChangeBedActivationStatusMutation();

  useEffect(() => {
    if (!open) {
      setBed({ ...newBed });
      setOpenChildModal(false);
      setBedPagination(prev => ({ ...prev, page: 0 }));
    }
  }, [open]);

  const validateBeforeSave = (payload: Bed, currentRows: Bed[]) => {
    const trimmedName = payload.name?.trim();

    if (!payload.roomId) {
      dispatch(notify({ msg: 'Room is required', sev: 'error' }));
      return false;
    }

    if (!trimmedName) {
      dispatch(notify({ msg: 'Bed name cannot be empty', sev: 'error' }));
      return false;
    }

    if (!payload.type) {
      dispatch(notify({ msg: 'Bed type is required', sev: 'error' }));
      return false;
    }

    const isDuplicatedName = currentRows.some(
      b =>
        b.name?.trim().toLowerCase() === trimmedName.toLowerCase() &&
        Number(b.id) !== Number(payload.id)
    );

    if (isDuplicatedName) {
      dispatch(notify({ msg: 'Bed name already exists', sev: 'error' }));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    const payload: Bed = {
      ...bed,
      roomId: room?.id ? Number(room.id) : null,
      name: bed.name?.trim() || '',
      locationDetails: bed.locationDetails?.trim() || null,
      type: bed.type ?? null,
      status: bed.status ?? null,
      isActive: bed.isActive ?? true
    };

    const currentRows = bedsResponse?.data ?? [];

    if (!validateBeforeSave(payload, currentRows)) return;

    try {
      if (payload.id) {
        await updateBed(payload).unwrap();
        dispatch(notify({ msg: 'Bed updated successfully', sev: 'success' }));
      } else {
        await addBed(payload).unwrap();
        dispatch(notify({ msg: 'Bed added successfully', sev: 'success' }));
      }

      await refetchRoom();
      await refetch();
      setBed({ ...newBed, roomId: room?.id ?? null });
      setOpenChildModal(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, BED_ERROR_MAP);
    }
  };

  const handleDeactiveReactivateBed = async () => {
    if (!bed?.id) return;

    try {
      const active = !bed.isActive;

      await changeBedActivationStatus({ id: bed.id, active }).unwrap();

      dispatch(
        notify({
          msg: active ? 'Bed activated successfully' : 'Bed deactivated successfully',
          sev: 'success'
        })
      );

      await refetch();
      await refetchRoom();
      setBed({ ...newBed });
    } catch (err: any) {
      handleCrudError(err, dispatch, BED_ERROR_MAP);
    } finally {
      setOpenConfirmDeleteBedModal(false);
    }
  };

  const isSelectedBed = (rowData: Bed) =>
    rowData && bed && Number(bed.id) === Number(rowData.id) ? 'selected-row' : '';

  const iconsForBeds = (rowData: Bed) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={(e) => {
          e.stopPropagation();
          setBed(rowData);
          setOpenChildModal(true);
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
            setBed(rowData);
            setStateOfDeleteBedModal('deactivate');
            setOpenConfirmDeleteBedModal(true);
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
            setBed(rowData);
            setStateOfDeleteBedModal('reactivate');
            setOpenConfirmDeleteBedModal(true);
          }}
        />
      )}
    </div>
  );

  const tableBedsColumns = [
    { key: 'name', title: <Translate>Bed Name</Translate>, flexGrow: 3 },
    { key: 'locationDetails', title: <Translate>Location Details</Translate>, flexGrow: 3 },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: (rowData: Bed) => <span>{formatEnumString(rowData.type)}</span>
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      render: (rowData: Bed) => <span>{formatEnumString(rowData.status)}</span>
    },
    {
      key: 'isActive',
      title: <Translate>Active</Translate>,
      flexGrow: 2,
      render: (rowData: Bed) => (rowData.isActive ? 'Active' : 'Inactive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: Bed) => iconsForBeds(rowData)
    }
  ];

  const conjureFormContentOfMainModal = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <div className="container-of-room-info">
              <MyInput
                width={140}
                fieldLabel="Room Name"
                fieldName="name"
                record={room}
                setRecord={setRoom}
                disabled
              />

              <MyInput
                width={140}
                fieldLabel="Facility"
                fieldName="name"
                record={room?.facility}
                setRecord={() => {}}
                disabled
              />

              <MyInput
                width={140}
                fieldLabel="Department"
                fieldName="name"
                record={room?.department}
                setRecord={() => {}}
                disabled
              />

              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setBed({
                    ...newBed,
                    roomId: room?.id ?? null,
                    isActive: true
                  });
                  setOpenChildModal(true);
                }}
                width="90px"
              >
                Add
              </MyButton>
            </div>

            <MyTable
              height={400}
              data={bedsResponse?.data ?? []}
              loading={isFetching}
              columns={tableBedsColumns}
              rowClassName={isSelectedBed}
              onRowClick={(rowData: Bed) => setBed(rowData)}
              page={bedPagination.page}
              rowsPerPage={bedPagination.size}
              totalCount={bedsResponse?.totalCount ?? 0}
              onPageChange={(_: unknown, newPage: number) => {
                setBedPagination(prev => ({
                  ...prev,
                  page: newPage
                }));
              }}
              onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setBedPagination(prev => ({
                  ...prev,
                  size: parseInt(event.target.value, 10),
                  page: 0
                }));
              }}
            />
          </Form>
        );
      default:
        return null;
    }
  };

  const conjureFormContentOfChildModal = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              required
              width={350}
              fieldLabel="Bed Name"
              fieldName="name"
              record={bed}
              setRecord={setBed}
            />

            <MyInput
              required
              column
              width={350}
              fieldLabel="Bed Type"
              fieldType="select"
              fieldName="type"
              selectData={bedTypeOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={bed}
              setRecord={setBed}
            />

            <MyInput
              width={350}
              fieldType="textarea"
              fieldLabel="Location"
              fieldName="locationDetails"
              record={bed}
              setRecord={setBed}
            />
          </Form>
        );
      default:
        return null;
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <>
      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Beds"
        mainContent={(stepNumber) => <div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>}
        childStep={[{ title: 'Bed', icon: <FontAwesomeIcon icon={faBedPulse} /> }]}
        mainStep={[{ title: 'Beds', icon: <FontAwesomeIcon icon={faHospital} /> }]}
        childTitle={bed?.id ? 'Edit Bed Info' : 'Add Bed'}
        childContent={(stepNumber) => <div dir={dir}>{conjureFormContentOfChildModal(stepNumber)}</div>}
        mainSize="sm"
        actionChildButtonFunction={handleSave}
        hideActionBtn={false}
        actionChildButtonDisabled={isAdding || isUpdating}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteBedModal}
        setOpen={setOpenConfirmDeleteBedModal}
        itemToDelete="Bed"
        actionButtonFunction={handleDeactiveReactivateBed}
        actionType={stateOfDeleteBedModal}
      />
    </>
  );
};

export default AddBed;