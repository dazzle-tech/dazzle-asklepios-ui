import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetDepartmentByTypeAndFacilityQuery } from '@/services/security/departmentService';
import {
  useAddRoomMutation,
  useUpdateRoomMutation
} from '@/services/setup/room/roomService';

import { Room } from '@/types/model-types-new';
import { newRoom } from '@/types/model-types-constructor-new';

const PAGE_SIZE = 20;

const ROOM_ERROR_MAP: Record<string, string> = {
  'facility.required': 'Facility is required.',
  'department.required': 'Department is required.',
  'departmentType.required': 'Department type is required.',
  'type.required': 'Room type is required.',
  'id.required': 'Room id is required.',
  'id.invalid': 'Invalid room id.',
  'facility.notfound': 'Selected facility was not found.',
  'department.notfound': 'Selected department was not found.',
  notfound: 'Room not found.',
  'unique.room.name.department': 'A room with the same name already exists in this department.',
  'gender.required': 'Gender is required when the room is gender-specific.',
  'defaultDurationMinutes.invalid':
    'Default duration minutes must be greater than zero when room is appointable.',
  'defaultBufferBeforeMinutes.invalid':
    'Default buffer before minutes must be zero or greater when room is appointable.',
  'defaultBufferAfterMinutes.invalid':
    'Default buffer after minutes must be zero or greater when room is appointable.',
  'appointable.requirements.invalid':
    'Appointable room requires valid duration and buffer values.',
  'db.constraint': 'Database constraint violation while saving room.'
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

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  room: Room;
  setRoom: React.Dispatch<React.SetStateAction<Room>>;
  refetch: () => void | Promise<any>;
};

const AddEditRoom: React.FC<Props> = ({
  open,
  setOpen,
  room,
  setRoom,
  refetch
}) => {
  const dispatch = useAppDispatch();

  const roomTypes = useEnumOptions('RoomType');
  const genders = useEnumOptions('Gender');
  const departmentTypeOptions = useEnumOptions('DepartmentType', {
    exclude: [
      'OUTPATIENT_CLINIC',
      'REGISTRATION',
      'LABORATORY',
      'RADIOLOGY',
      'PATHOLOGY',
      'GENETIC_LAB',
      'OPTIC_LAB',
      'PHARMACY',
      'BLOOD_BANK',
      'DIALYSIS_ROOM',
      'PHYSIOTHERAPY_ROOM',
      'STERILIZATION_ROOM',
      'MAINTENANCE',
      'LAUNDRY',
      'KITCHEN',
      'MORGUE'
    ]
  });

  const { data: facilitiesResponse } = useGetAllFacilitiesQuery({});
  const [triggerDepartments, { isFetching: isDeptLoading }] =
    useLazyGetDepartmentByTypeAndFacilityQuery();

  const [addRoom] = useAddRoomMutation();
  const [updateRoom] = useUpdateRoomMutation();

  const isEdit = !!room?.id;

  const normalizedFacilities = useMemo(
    () =>
      (facilitiesResponse ?? []).map((f: any) => ({
        ...f,
        id: String(f.id)
      })),
    [facilitiesResponse]
  );

  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [deptHasMore, setDeptHasMore] = useState(false);
  const [deptNextLink, setDeptNextLink] = useState<string | null>(null);
  const [modalSession, setModalSession] = useState(0);

  const prevFacilityId = useRef<number | string | null | undefined>(undefined);
  const prevDepartmentType = useRef<string | null | undefined>(undefined);
  const didNormalizeRef = useRef(false);
  const skipDepartmentResetRef = useRef(false);

  const resetDepartmentsState = useCallback(() => {
    setAllDepartments([]);
    setDeptHasMore(false);
    setDeptNextLink(null);
  }, []);

  const loadDepartments = useCallback(
    async ({
      facilityId,
      departmentType,
      page = 0,
      append = false
    }: {
      facilityId: number;
      departmentType: string;
      page?: number;
      append?: boolean;
    }) => {
      if (!facilityId || !departmentType) return;

      try {
        const response = await triggerDepartments({
          facilityId,
          type: departmentType,
          page,
          size: PAGE_SIZE,
          sort: 'name,asc'
        }).unwrap();

        const rows = response?.data ?? [];
        const nextLink = response?.links?.next ?? null;

        setDeptHasMore(Boolean(nextLink));
        setDeptNextLink(nextLink);

        if (append) {
          setAllDepartments(prev => {
            const seenIds = new Set(prev.map((d: any) => Number(d.id)));
            const merged = [...prev];

            rows.forEach((d: any) => {
              if (!seenIds.has(Number(d.id))) {
                merged.push(d);
              }
            });

            return merged;
          });
        } else {
          setAllDepartments(rows);
        }
      } catch {
        setAllDepartments([]);
        setDeptHasMore(false);
        setDeptNextLink(null);
      }
    },
    [triggerDepartments]
  );

  // normalize edit data once when modal opens
  useEffect(() => {
    if (!open) {
      didNormalizeRef.current = false;
      skipDepartmentResetRef.current = false;
      return;
    }

    if (didNormalizeRef.current) return;

    didNormalizeRef.current = true;

    const normalizedFacilityId =
      room?.facilityId != null
        ? String(room.facilityId)
        : room?.facility?.id != null
          ? String(room.facility.id)
          : null;

    const normalizedDepartmentId =
      room?.departmentId != null
        ? String(room.departmentId)
        : room?.department?.id != null
          ? String(room.department.id)
          : null;

    const normalizedDepartmentType = room?.departmentType ?? null;
    prevFacilityId.current = normalizedFacilityId;
    prevDepartmentType.current = normalizedDepartmentType;
    skipDepartmentResetRef.current = true;

    setRoom(prev => ({
      ...prev,
      facilityId: normalizedFacilityId,
      departmentId: normalizedDepartmentId
    }));
  }, [open, room?.facilityId, room?.facility?.id, room?.departmentId, room?.department?.id, room?.departmentType, setRoom]);

  // open/close session reset
  useEffect(() => {
    if (open) {
      setModalSession(prev => prev + 1);
      return;
    }

    prevFacilityId.current = undefined;
    prevDepartmentType.current = undefined;
    resetDepartmentsState();
  }, [open, resetDepartmentsState]);

  // when facility or department type changes => reset department
  useEffect(() => {
    if (!open) return;

    const currentFacilityId = room?.facilityId ?? null;
    const currentDepartmentType = room?.departmentType ?? null;

    // تخطّي أول reset بعد normalize
    if (skipDepartmentResetRef.current) {
      skipDepartmentResetRef.current = false;
      return;
    }

    const facilityChanged = prevFacilityId.current !== currentFacilityId;
    const typeChanged = prevDepartmentType.current !== currentDepartmentType;

    if (prevFacilityId.current === undefined && prevDepartmentType.current === undefined) {
      prevFacilityId.current = currentFacilityId;
      prevDepartmentType.current = currentDepartmentType;
      return;
    }

    if (!facilityChanged && !typeChanged) return;

    prevFacilityId.current = currentFacilityId;
    prevDepartmentType.current = currentDepartmentType;

    resetDepartmentsState();

    setRoom(prev => ({
      ...prev,
      departmentId: null,
      department: null
    }));
  }, [open, room?.facilityId, room?.departmentType, resetDepartmentsState, setRoom]);

  // initial load whenever facility + type are ready
  useEffect(() => {
    if (!open || !room?.facilityId || !room?.departmentType) return;

    resetDepartmentsState();
    loadDepartments({
      facilityId: Number(room.facilityId),
      departmentType: room.departmentType,
      page: 0,
      append: false
    });
  }, [open, room?.facilityId, room?.departmentType, loadDepartments, resetDepartmentsState]);

  const departmentOptions = useMemo(() => {
    const mappedDepartments = allDepartments.map((d: any) => ({
      label: d.name ?? '',
      value: String(d.id)
    }));

    const currentDepartmentOption =
      room?.department?.id != null
        ? {
            label: room.department.name ?? '',
            value: String(room.department.id)
          }
        : room?.departmentId != null
          ? {
              label: room?.department?.name ?? '',
              value: String(room.departmentId)
            }
          : null;

    if (
      currentDepartmentOption &&
      !mappedDepartments.some(opt => opt.value === currentDepartmentOption.value)
    ) {
      return [currentDepartmentOption, ...mappedDepartments];
    }

    return mappedDepartments;
  }, [allDepartments, room?.department, room?.departmentId]);

  const validateBeforeSave = (payload: Room) => {
    if (!payload.facilityId) {
      dispatch(notify({ msg: 'Facility is required', sev: 'error' }));
      return false;
    }

    if (!payload.departmentType) {
      dispatch(notify({ msg: 'Department type is required', sev: 'error' }));
      return false;
    }

    if (!payload.departmentId) {
      dispatch(notify({ msg: 'Department is required', sev: 'error' }));
      return false;
    }

    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'Room name is required', sev: 'error' }));
      return false;
    }

    if (!payload.type) {
      dispatch(notify({ msg: 'Room type is required', sev: 'error' }));
      return false;
    }

    if (payload.isSpecificGender && !payload.gender) {
      dispatch(
        notify({
          msg: 'Gender is required when the room is gender-specific',
          sev: 'error'
        })
      );
      return false;
    }

    if (payload.appointable) {
      if (!payload.defaultDurationMinutes || payload.defaultDurationMinutes <= 0) {
        dispatch(
          notify({
            msg: 'Default duration minutes must be greater than zero when room is appointable',
            sev: 'error'
          })
        );
        return false;
      }

      if (
        payload.defaultBufferBeforeMinutes == null ||
        payload.defaultBufferBeforeMinutes < 0
      ) {
        dispatch(
          notify({
            msg: 'Default buffer before minutes must be zero or greater when room is appointable',
            sev: 'error'
          })
        );
        return false;
      }

      if (
        payload.defaultBufferAfterMinutes == null ||
        payload.defaultBufferAfterMinutes < 0
      ) {
        dispatch(
          notify({
            msg: 'Default buffer after minutes must be zero or greater when room is appointable',
            sev: 'error'
          })
        );
        return false;
      }
    }

    return true;
  };

  const handleClearField = () => {
    setRoom({ ...newRoom });
    resetDepartmentsState();
  };

  const handleSave = async () => {
    const payload: Room = {
      ...room,
      facilityId: room.facilityId ? Number(room.facilityId) : null,
      departmentId: room.departmentId ? Number(room.departmentId) : null,
      departmentType: room.departmentType ?? null,
      type: room.type ?? null,
      gender: room.isSpecificGender ? room.gender ?? null : null,
      parallelCapacityValue:
        room.parallelCapacityValue == null ? 1 : Number(room.parallelCapacityValue),
      defaultDurationMinutes:
        room.appointable && room.defaultDurationMinutes != null
          ? Number(room.defaultDurationMinutes)
          : room.defaultDurationMinutes ?? null,
      defaultBufferBeforeMinutes:
        room.appointable && room.defaultBufferBeforeMinutes != null
          ? Number(room.defaultBufferBeforeMinutes)
          : room.defaultBufferBeforeMinutes ?? null,
      defaultBufferAfterMinutes:
        room.appointable && room.defaultBufferAfterMinutes != null
          ? Number(room.defaultBufferAfterMinutes)
          : room.defaultBufferAfterMinutes ?? null
    };

    if (!validateBeforeSave(payload)) return;

    try {
      if (payload.id) {
        await updateRoom(payload).unwrap();
        dispatch(notify({ msg: 'Room Updated Successfully', sev: 'success' }));
      } else {
        await addRoom(payload).unwrap();
        dispatch(notify({ msg: 'Room Added Successfully', sev: 'success' }));
      }

      await refetch();
      setOpen(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, ROOM_ERROR_MAP);
    }
  };

  const content = (
    <Form fluid layout="inline">
      <MyInput
        width="13vw"
        column
        fieldLabel="Facility"
        fieldName="facilityId"
        required
        fieldType="select"
        selectData={normalizedFacilities}
        selectDataLabel="name"
        selectDataValue="id"
        record={room}
        setRecord={(updated: any) => {
          setRoom((prev: Room) => {
            const next = typeof updated === 'function' ? updated(prev) : updated;
            return {
              ...next,
              facilityId: next?.facilityId ?? null,
              departmentId: null,
              department: null
            };
          });
        }}
      />

      <MyInput
        required
        width="13vw"
        column
        fieldLabel="Department Type"
        fieldName="departmentType"
        fieldType="select"
        selectData={departmentTypeOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={room}
        setRecord={(updated: any) => {
          setRoom((prev: Room) => {
            const next = typeof updated === 'function' ? updated(prev) : updated;
            return {
              ...next,
              departmentType: next?.departmentType ?? null,
              departmentId: null,
              department: null
            };
          });
        }}
        searchable={false}
        menuMaxHeight={220}
      />

      <MyInput
        required
        key={`department-${modalSession}-${room?.facilityId ?? 'none'}-${room?.departmentType ?? 'none'}-${room?.departmentId ?? 'none'}`}
        width="13vw"
        column
        fieldName="departmentId"
        fieldLabel="Department"
        fieldType="selectPagination"
        selectData={departmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={room}
        setRecord={(updated: any) => {
          setRoom((prev: Room) => {
            const next = typeof updated === 'function' ? updated(prev) : updated;
            const selectedDepartment = departmentOptions.find(
              opt => opt.value === String(next?.departmentId ?? '')
            );

            return {
              ...next,
              departmentId: next?.departmentId ?? null,
              department: selectedDepartment
                ? {
                    ...(prev as any)?.department,
                    id: Number(selectedDepartment.value),
                    name: selectedDepartment.label
                  }
                : prev?.department ?? null
            };
          });
        }}
        loading={isDeptLoading}
        searchable
        disabled={!room?.facilityId || !room?.departmentType}
        hasMore={deptHasMore}
        onFetchMore={async () => {
          if (!deptNextLink || !room?.facilityId || !room?.departmentType) return;

          const { page } = extractPaginationFromLink(deptNextLink);

          await loadDepartments({
            facilityId: Number(room.facilityId),
            departmentType: room.departmentType,
            page,
            append: true
          });
        }}
      />

      <MyInput
        required
        width="13vw"
        fieldLabel="Name"
        column
        fieldName="name"
        record={room}
        setRecord={setRoom}
      />

      <MyInput
        width="13vw"
        fieldLabel="Floor"
        column
        fieldName="floor"
        record={room}
        setRecord={setRoom}
      />

      <MyInput
        width="13vw"
        column
        fieldLabel="Type"
        fieldType="select"
        fieldName="type"
        selectData={roomTypes ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={room}
        setRecord={setRoom}
        required
      />

      <MyInput
        width="13vw"
        column
        fieldLabel="Gender Specific"
        fieldType="checkbox"
        fieldName="isSpecificGender"
        record={room}
        setRecord={(updated: any) => {
          setRoom((prev: Room) => {
            const next = typeof updated === 'function' ? updated(prev) : updated;
            return next?.isSpecificGender ? next : { ...next, gender: null };
          });
        }}
      />

      {room?.isSpecificGender && (
        <MyInput
          required
          width="13vw"
          column
          fieldLabel="Gender"
          fieldType="select"
          fieldName="gender"
          selectData={genders ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={room}
          setRecord={setRoom}
          disabled={!room?.isSpecificGender}
        />
      )}

      <MyInput
        width="13vw"
        fieldLabel="Parallel Capacity"
        column
        fieldName="parallelCapacityValue"
        fieldType="number"
        record={room}
        setRecord={setRoom}
      />

      <MyInput
        width="13vw"
        column
        fieldLabel="Appointable"
        fieldType="checkbox"
        fieldName="appointable"
        record={room}
        setRecord={(updated: any) => {
          setRoom((prev: Room) => {
            const next = typeof updated === 'function' ? updated(prev) : updated;
            return next?.appointable
              ? next
              : {
                  ...next,
                  defaultDurationMinutes: null,
                  defaultBufferBeforeMinutes: null,
                  defaultBufferAfterMinutes: null
                };
          });
        }}
      />

      {room?.appointable && (
        <>
          <MyInput
            width="13vw"
            fieldLabel="Default Duration (min)"
            column
            fieldName="defaultDurationMinutes"
            fieldType="number"
            record={room}
            setRecord={setRoom}
            disabled={!room?.appointable}
            showZero
            required
          />

          <MyInput
            width="13vw"
            fieldLabel="Buffer Before (min)"
            column
            fieldName="defaultBufferBeforeMinutes"
            fieldType="number"
            record={room}
            setRecord={setRoom}
            disabled={!room?.appointable}
            showZero
            required
          />

          <MyInput
            width="13vw"
            fieldLabel="Buffer After (min)"
            column
            fieldName="defaultBufferAfterMinutes"
            fieldType="number"
            record={room}
            setRecord={setRoom}
            disabled={!room?.appointable}
            showZero
            required
          />
        </>
      )}
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Room Information' : 'Add New Room'}
      actionButtonFunction={handleSave}
      position="right"
      size="38vw"
      steps={[
        {
          title: 'Room',
          icon: <FontAwesomeIcon icon={faDoorOpen} />,
          footer: (
            <MyButton appearance="ghost" onClick={handleClearField}>
              Clear
            </MyButton>
          )
        }
      ]}
      content={content}
    />
  );
};

export default AddEditRoom;