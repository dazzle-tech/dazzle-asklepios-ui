import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital, faBellConcierge } from '@fortawesome/free-solid-svg-icons';
import AddOutlineIcon from '@rsuite/icons/AddOutline';

import ChildModal from '@/components/ChildModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

import { Room, Bed, BedRoomService, Service } from '@/types/model-types-new';
import {
  newBedRoomServiceUpdateDTO,
  newRoom,
  newService
} from '@/types/model-types-constructor-new';

import { useGetAllActiveBedsByRoomIdQuery } from '@/services/setup/room/bedService';
import {
  useGetBedRoomServicesQuery,
  useAddBedRoomServiceMutation,
  useUpdateBedRoomServiceMutation,
  useActivateBedRoomServiceMutation,
  useDeactivateBedRoomServiceMutation
} from '@/services/setup/room/bedRoomService';
import { useGetActiveServicesByFacilityQuery } from '@/services/setup/serviceService';

import './styles.less';

const BED_ROOM_SERVICE_ERROR_MAP: Record<string, string> = {
  notfound: 'Room service not found.',
  'room.notfound': 'Room not found.',
  'bed.notfound': 'Bed not found.',
  'service.notfound': 'Service not found.',
  'room.invalid': 'Invalid room reference.',
  'bed.invalid': 'Invalid bed reference.',
  'service.invalid': 'Invalid service reference.',
  'unique.room.service': 'This service already exists for the room.',
  'unique.room.service.bed': 'This service already exists for the selected bed.',
  duplicate: 'This service already exists.',
  'error.duplicate': 'This service already exists.',
  'db.constraint': 'Database constraint violation while saving room service.'
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data || err?.error || {};
  const traceId =
    data?.traceId || data?.requestId || data?.correlationId || err?.meta?.traceId;
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
        msg: `Please fix the following fields:\n${lines.join('\n')}${suffix}`,
        sev: 'warn'
      })
    );
    return;
  }

  const messageProp =
    data?.message ||
    data?.error ||
    data?.properties?.message ||
    '';
  const rawMessage =
    data?.errorKey ||
    messageProp ||
    data?.properties?.message ||
    '';

  const errorKey =
    typeof rawMessage === 'string' && rawMessage.startsWith('error.')
      ? rawMessage.substring(6)
      : rawMessage;

  const fallbackMessage =
    keyMap[errorKey] ||
    data?.detail ||
    data?.title ||
    messageProp ||
    err?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: `${fallbackMessage}${suffix}`,
      sev: 'error'
    })
  );
};

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  roomObj: Room;
  setRoomObj: React.Dispatch<React.SetStateAction<Room>>;
};

const AddService: React.FC<Props> = ({ open, setOpen, roomObj, setRoomObj }) => {
  const dispatch = useAppDispatch();

  const [room, setRoom] = useState<Room>({ ...newRoom });
  const [selectedService, setSelectedService] = useState<Service>({ ...newService });
  const [roomService, setRoomService] = useState<BedRoomService>({
    ...newBedRoomServiceUpdateDTO
  });
  const [hasBedSpecific, setHasBedSpecific] = useState({ bedSpecific: false });
  const [openChildModal, setOpenChildModal] = useState(false);
  const [openConfirmDeleteServiceModal, setOpenConfirmDeleteServiceModal] = useState(false);
  const [stateOfDeleteServiceModal, setStateOfDeleteServiceModal] = useState<
    'deactivate' | 'reactivate'
  >('deactivate');

  const [servicePagination, setServicePagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [bedPage, setBedPage] = useState(0);
  const [allActiveBeds, setAllActiveBeds] = useState<Bed[]>([]);
  const [bedHasMore, setBedHasMore] = useState(false);
  const [bedNextLink, setBedNextLink] = useState<string | null>(null);
  const [bedFilterSession, setBedFilterSession] = useState(0);

  const facilityId = room?.facility?.id ?? room?.facilityId ?? null;
  const roomId = room?.id ?? null;

  const {
    data: bedsResponse,
    isFetching: isBedsLoading
  } = useGetAllActiveBedsByRoomIdQuery(
    {
      roomId: roomId as number,
      page: bedPage,
      size: 20,
      sort: 'id,asc'
    },
    { skip: !roomId }
  );
  console.log('Beds Response:', bedsResponse);
  const {
    data: allRoomServicesResponse,
    isFetching: fetchingServicesList,
    refetch: refetchServices
  } = useGetBedRoomServicesQuery(
    {
      roomId: roomId as number,
      page: servicePagination.page,
      size: servicePagination.size,
      sort: servicePagination.sort
    },
    {
      skip: !roomId
    }
  );

  const [addBedRoomService, { isLoading: isAdding }] = useAddBedRoomServiceMutation();
  const [updateBedRoomService, { isLoading: isUpdating }] = useUpdateBedRoomServiceMutation();
  const [activateBedRoomService] = useActivateBedRoomServiceMutation();
  const [deactivateBedRoomService] = useDeactivateBedRoomServiceMutation();

  const { data: serviceListResponse } = useGetActiveServicesByFacilityQuery(
    {
      facilityId: facilityId as number,
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    {
      skip: !facilityId
    }
  );

  const servicesArray = useMemo(
    () =>
      serviceListResponse?.data?.map(service => ({
        key: service.id,
        name: service.name,
        object: service
      })) ?? [],
    [serviceListResponse?.data]
  );

  const mergedServicesArray = useMemo(() => {
    const map = new Map<number, { key: number; name: string; object: Service }>();

    servicesArray.forEach(item => {
      map.set(Number(item.key), item);
    });

    if (selectedService?.id) {
      map.set(Number(selectedService.id), {
        key: Number(selectedService.id),
        name: selectedService.name,
        object: selectedService
      });
    }

    if (roomService?.service?.id) {
      map.set(Number(roomService.service.id), {
        key: Number(roomService.service.id),
        name: roomService.service.name,
        object: roomService.service as Service
      });
    }

    return Array.from(map.values());
  }, [servicesArray, selectedService, roomService?.service]);

  const roomSpecificServices = useMemo(() => {
    return allRoomServicesResponse?.data ?? [];
  }, [allRoomServicesResponse?.data]);

  useEffect(() => {
    if (!bedsResponse) return;

    const rows = bedsResponse.data ?? [];
    const nextLink = bedsResponse.links?.next ?? null;

    setBedHasMore(Boolean(nextLink));
    setBedNextLink(nextLink);

    if (bedPage === 0) {
      setAllActiveBeds(rows);
    } else {
      setAllActiveBeds(prev => {
        const seenIds = new Set(prev.map(b => Number(b.id)));
        const merged = [...prev];
        rows.forEach((b: Bed) => {
          if (!seenIds.has(Number(b.id))) {
            merged.push(b);
          }
        });
        return merged;
      });
    }
  }, [bedsResponse, bedPage]);

  const activeBedOptions = useMemo(() => {
    return allActiveBeds.map((bed: Bed) => ({
      key: String(bed.id),
      name: bed.name,
      object: bed
    }));
  }, [allActiveBeds]);

  const mergedBedOptions = useMemo(() => {
    const map = new Map<number, { key: string; name: string; object: Bed }>();

    activeBedOptions.forEach(item => {
      map.set(Number(item.key), item);
    });

    if (roomService?.bed?.id) {
      map.set(Number(roomService.bed.id), {
        key: String(roomService.bed.id),
        name: roomService.bed.name,
        object: roomService.bed as Bed
      });
    }

    if (roomService?.bedId !== null && roomService?.bedId !== undefined && roomService?.bed?.name) {
      map.set(Number(roomService.bedId), {
        key: String(roomService.bedId),
        name: roomService.bed.name,
        object: roomService.bed as Bed
      });
    }

    return Array.from(map.values());
  }, [activeBedOptions, roomService?.bed, roomService?.bedId]);

  useEffect(() => {
    setRoom({ ...roomObj });
  }, [roomObj]);

  useEffect(() => {
    if (!open) {
      setRoomService({ ...newBedRoomServiceUpdateDTO });
      setSelectedService({ ...newService });
      setHasBedSpecific({ bedSpecific: false });
      setOpenChildModal(false);
      setBedPage(0);
      setAllActiveBeds([]);
      setBedHasMore(false);
      setBedNextLink(null);
      setBedFilterSession(prev => prev + 1);
    }
  }, [open]);

  useEffect(() => {
    if (room?.id) {
      setBedPage(0);
      setAllActiveBeds([]);
      setBedHasMore(false);
      setBedNextLink(null);
      setBedFilterSession(prev => prev + 1);
    }
  }, [room?.id]);

  useEffect(() => {
    if (!roomService?.serviceId) {
      if (selectedService?.id) {
        setSelectedService({ ...newService });
      }
      return;
    }

    const selectedServiceFromList = mergedServicesArray.find(
      service => Number(service.key) === Number(roomService.serviceId)
    );

    if (!selectedServiceFromList) {
      if (selectedService?.id) {
        setSelectedService({ ...newService });
      }
      return;
    }

    if (Number(selectedService?.id) !== Number(selectedServiceFromList.object?.id)) {
      setSelectedService(selectedServiceFromList.object);
    }
  }, [roomService?.serviceId, mergedServicesArray, selectedService?.id]);

  const validateBeforeSave = (payload: BedRoomService) => {
    if (!payload.roomId) {
      dispatch(notify({ msg: 'Room is required', sev: 'error' }));
      return false;
    }

    if (!payload.serviceId) {
      dispatch(notify({ msg: 'Please select a service before saving', sev: 'error' }));
      return false;
    }

    if (payload.bedSpecific && !payload.bedId) {
      dispatch(notify({ msg: 'Please select a bed when Bed Specific is enabled', sev: 'error' }));
      return false;
    }

    const duplicated = roomSpecificServices.some(item => {
      const sameService = Number(item.serviceId) === Number(payload.serviceId);
      if (!sameService) return false;

      if (!payload.bedSpecific && !item.bedSpecific) {
        return Number(item.id) !== Number(payload.id);
      }

      if (payload.bedSpecific && item.bedSpecific) {
        return (
          Number(item.bedId) === Number(payload.bedId) && Number(item.id) !== Number(payload.id)
        );
      }

      return false;
    });

    if (duplicated) {
      dispatch(
        notify({
          msg: payload.bedSpecific
            ? 'Same service cannot be added twice to the same bed'
            : 'Same service cannot be added twice to the same room without bed',
          sev: 'error'
        })
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    const payload: BedRoomService = {
      ...roomService,
      roomId: room?.id ? Number(room.id) : null,
      serviceId: roomService?.serviceId ? Number(roomService.serviceId) : null,
      bedSpecific: !!hasBedSpecific?.bedSpecific,
      bedId: hasBedSpecific?.bedSpecific
        ? roomService?.bedId !== null && roomService?.bedId !== undefined
          ? Number(roomService.bedId)
          : null
        : null,
      rule: roomService?.rule?.trim() || null,
      isActive: roomService?.isActive ?? true
    };

    if (!validateBeforeSave(payload)) return;

    try {
      if (payload.id) {
        await updateBedRoomService(payload).unwrap();
        dispatch(notify({ msg: 'Room service updated successfully', sev: 'success' }));
      } else {
        await addBedRoomService(payload).unwrap();
        dispatch(notify({ msg: 'Room service added successfully', sev: 'success' }));
      }

      await refetchServices();

      setRoomService({ ...newBedRoomServiceUpdateDTO, roomId: room?.id ?? null });
      setSelectedService({ ...newService });
      setHasBedSpecific({ bedSpecific: false });
      setOpenChildModal(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, BED_ROOM_SERVICE_ERROR_MAP);
    }
  };

  const handleDeactiveReactivateService = async () => {
    if (!roomService?.id) return;

    try {
      if (roomService.isActive) {
        await deactivateBedRoomService({ id: roomService.id }).unwrap();
        dispatch(notify({ msg: 'Room service deactivated successfully', sev: 'success' }));
      } else {
        await activateBedRoomService({ id: roomService.id }).unwrap();
        dispatch(notify({ msg: 'Room service activated successfully', sev: 'success' }));
      }

      await refetchServices();
      setRoomService({ ...newBedRoomServiceUpdateDTO });
    } catch (err: any) {
      handleCrudError(err, dispatch, BED_ROOM_SERVICE_ERROR_MAP);
    } finally {
      setOpenConfirmDeleteServiceModal(false);
    }
  };

  const isSelectedService = (rowData: BedRoomService) => {
    if (rowData && roomService && Number(roomService.id) === Number(rowData.id)) {
      return 'selected-row';
    }
    return '';
  };

  const handleEdit = (rowData: BedRoomService) => {
    setRoomService({
      ...rowData,
      serviceId: rowData?.serviceId ?? rowData?.service?.id ?? null,
      bedId: rowData?.bedId ?? rowData?.bed?.id ?? null
    });

    setHasBedSpecific({ bedSpecific: !!rowData?.bedSpecific });
    setOpenChildModal(true);

    if (rowData?.service) {
      setSelectedService(rowData.service as Service);
    } else {
      setSelectedService({ ...newService });
    }
  };

  const iconsForServices = (rowData: BedRoomService) => (
    <div className="container-of-icons">
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
            setRoomService(rowData);
            setStateOfDeleteServiceModal('deactivate');
            setOpenConfirmDeleteServiceModal(true);
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
            setRoomService(rowData);
            setStateOfDeleteServiceModal('reactivate');
            setOpenConfirmDeleteServiceModal(true);
          }}
        />
      )}
    </div>
  );

  const tableServicesColumns = [
    {
      key: 'serviceId',
      title: <Translate>Service Name</Translate>,
      flexGrow: 3,
      render: (rowData: BedRoomService) => (
        <span>{rowData?.service ? rowData.service.name : '-'}</span>
      )
    },
    {
      key: 'bedSpecific',
      title: <Translate>Bed Specific</Translate>,
      flexGrow: 3,
      render: (rowData: BedRoomService) => (rowData?.bedSpecific ? 'YES' : 'NO')
    },
    {
      key: 'bedId',
      title: <Translate>Bed Name</Translate>,
      flexGrow: 3,
      render: (rowData: BedRoomService) => (
        <span>{rowData?.bed ? rowData.bed.name : '-'}</span>
      )
    },
    {
      key: 'rule',
      title: <Translate>Rule</Translate>,
      flexGrow: 3
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: BedRoomService) => (rowData?.isActive ? 'Active' : 'Inactive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: BedRoomService) => iconsForServices(rowData)
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
                record={room?.facility ?? {}}
                setRecord={() => { }}
                disabled
              />

              <MyInput
                width={140}
                fieldLabel="Department"
                fieldName="name"
                record={room?.department ?? {}}
                setRecord={() => { }}
                disabled
              />

              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setRoomService({ ...newBedRoomServiceUpdateDTO, roomId: room?.id ?? null });
                  setSelectedService({ ...newService });
                  setHasBedSpecific({ bedSpecific: false });
                  setOpenChildModal(true);
                }}
                width="90px"
              >
                Add
              </MyButton>
            </div>

            <MyTable
              height={400}
              data={roomSpecificServices}
              loading={fetchingServicesList}
              columns={tableServicesColumns}
              rowClassName={isSelectedService}
              onRowClick={(rowData: BedRoomService) => {
                handleEdit(rowData);
              }}
              page={servicePagination.page}
              rowsPerPage={servicePagination.size}
              totalCount={allRoomServicesResponse?.totalCount ?? 0}
              onPageChange={(_: unknown, newPage: number) => {
                setServicePagination(prev => ({
                  ...prev,
                  page: newPage
                }));
              }}
              onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setServicePagination(prev => ({
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
          <Form fluid layout="inline">
            <MyInput
              required
              column
              width={350}
              fieldLabel="Service Name"
              fieldType="select"
              fieldName="serviceId"
              selectData={mergedServicesArray}
              selectDataLabel="name"
              selectDataValue="key"
              record={{
                ...roomService,
                serviceId: roomService?.serviceId ? Number(roomService.serviceId) : null
              }}
              setRecord={setRoomService}
            />

            <div className="container-of-multi-fields-form">
              <MyInput
                width={175}
                fieldLabel="Price"
                fieldName="price"
                fieldType="number"
                record={selectedService}
                setRecord={setSelectedService}
                disabled
              />

              <MyInput
                width={175}
                fieldLabel="Currency"
                fieldName="currency"
                fieldType="text"
                record={selectedService}
                setRecord={setSelectedService}
                disabled
              />
            </div>

            <div className="container-of-multi-fields-form">
              <MyInput
                column
                width={175}
                fieldLabel="Bed Specific"
                fieldType="checkbox"
                fieldName="bedSpecific"
                record={hasBedSpecific}
                setRecord={(updated: any) => {
                  setHasBedSpecific(updated);

                  if (!updated?.bedSpecific) {
                    setRoomService(prev => ({
                      ...prev,
                      bedId: null,
                      bedSpecific: false,
                      bed: null
                    }));
                  } else {
                    setRoomService(prev => ({
                      ...prev,
                      bedSpecific: true
                    }));
                  }
                }}
              />

              {hasBedSpecific?.bedSpecific && (
                <MyInput
                  required
                  key={`active-beds-${bedFilterSession}-${room?.id ?? 'none'}-${roomService?.bedId ?? 'none'}`}
                  column
                  width={175}
                  fieldLabel="Bed Name"
                  fieldType="selectPagination"
                  selectData={mergedBedOptions}
                  selectDataLabel="name"
                  selectDataValue="key"
                  fieldName="bedId"
                  record={{
                    ...roomService,
                    bedId:
                      roomService?.bedId !== null && roomService?.bedId !== undefined
                        ? String(roomService.bedId)
                        : null
                  }}
                  setRecord={(updated: any) => {
                    const next = typeof updated === 'function' ? updated(roomService) : updated;
                    const selectedBed = mergedBedOptions.find(
                      item => String(item.key) === String(next?.bedId ?? '')
                    );

                    setRoomService(prev => ({
                      ...prev,
                      ...next,
                      bedId: next?.bedId ?? null,
                      bed: selectedBed?.object ?? null
                    }));
                  }}
                  searchable={false}
                  disabled={!hasBedSpecific?.bedSpecific}
                  loading={isBedsLoading}
                  hasMore={bedHasMore}
                  onFetchMore={async () => {
                    if (!bedNextLink) return;
                    const { page } = extractPaginationFromLink(bedNextLink);
                    setBedPage(page);
                  }}
                />
              )}
            </div>

            <MyInput
              width={350}
              fieldLabel="Rule"
              fieldName="rule"
              record={roomService}
              setRecord={setRoomService}
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
        title="Services"
        mainContent={(stepNumber) => (<div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>)}
        childStep={[
          {
            title: 'Service',
            icon: <FontAwesomeIcon icon={faBellConcierge} />
          }
        ]}
        mainStep={[
          {
            title: 'Services',
            icon: <FontAwesomeIcon icon={faHospital} />
          }
        ]}
        childTitle={roomService?.id ? 'Edit Service Info' : 'Add Service'}
        childContent={(stepNumber) => (<div dir={dir}>{conjureFormContentOfChildModal(stepNumber)}</div>)}
        mainSize="sm"
        actionChildButtonFunction={handleSave}
        hideActionBtn={false}
        actionChildButtonDisabled={isAdding || isUpdating}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteServiceModal}
        setOpen={setOpenConfirmDeleteServiceModal}
        itemToDelete="Service"
        actionButtonFunction={handleDeactiveReactivateService}
        actionType={stateOfDeleteServiceModal}
      />
    </>
  );
};

export default AddService;