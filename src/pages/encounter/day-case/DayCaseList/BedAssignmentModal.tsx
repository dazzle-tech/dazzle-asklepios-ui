import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { EncounterAssignToBed } from '@/types/model-types-new';
import { newEncounterAssignToBed } from '@/types/model-types-constructor-new';

import { useAddEncounterAssignToBedMutation } from '@/services/patients/emergency/encounterAssignToBedService';


import { useGetAvailableRoomsByDepartmentAndGenderQuery } from '@/services/setup/room/roomService';
import {
  useLazyGetActiveBedsByRoomIdQuery,
  useOccupyBedMutation
} from '@/services/setup/room/bedService';
import { useMoveWaitingListToNewMutation } from '@/services/encounters/patientEncounterService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

type Id = number | string;

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  encounter: any;
  refetchEncounter?: () => void;
  departmentId?: Id;
};

const ASSIGN_TO_BED_ERROR_MAP: Record<string, string> = {
  'encounter.activeAssignment.exists': 'Encounter already has an active bed assignment.',
  'bed.alreadyAssigned': 'Bed is already assigned to another active encounter.',
  'encounter.notfound': 'Encounter not found.',
  'patient.notfound': 'Patient not found.',
  'room.notfound': 'Room not found.',
  'bed.notfound': 'Bed not found.',
  'department.notfound': 'Department not found.',
  'release.logic.invalid': 'Invalid release state.',
  'db.constraint': 'Database constraint violation while saving assignment.',
  'patient.encounter.mismatch': 'The selected patient does not belong to the selected encounter.',
  'activeAssignment.notfound': 'Active assignment not found.',
  'invalid.status.transition': 'This action is only allowed for encounters in Waiting List or Triage Started status.'
};

const normalizeFieldMessage = (msg: string) => {
  const m = (msg || '').toLowerCase();

  if (m.includes('must not be null')) return 'is required';
  if (m.includes('must not be blank')) return 'must not be blank';
  if (m.includes('size must be between')) return 'length is out of range';
  if (m.includes('must be greater')) return 'value is too small';
  if (m.includes('must be less')) return 'value is too large';

  return msg || 'invalid value';
};

const handleCrudError = (
  err: any,
  dispatch: any,
  keyMap: Record<string, string>
) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map(
      (fe: any) => `• ${fe.field}: ${normalizeFieldMessage(fe.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}${suffix}`,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey =
    messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: `${humanMsg}${suffix}`,
      sev: 'error'
    })
  );
};

const BedAssignmentModal: React.FC<Props> = ({
  open,
  setOpen,
  encounter,
  refetchEncounter,
  departmentId
}) => {
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<EncounterAssignToBed>({
    ...newEncounterAssignToBed
  });

  const resolvedDepartmentId = Number(departmentId ?? encounter?.departmentId ?? 0) || null;
  const patientGender = encounter?.patientObject?.sexAtBirth?.toUpperCase() ?? null;

  const [addEncounterAssignToBed, { isLoading: isSavingAssignment }] =
    useAddEncounterAssignToBedMutation();

  const [occupyBed, { isLoading: isOccupyingBed }] = useOccupyBedMutation();
  const [moveWaitingListToNew, { isLoading: isMovingEncounterStatus }] =
    useMoveWaitingListToNewMutation();
  const [loadBedsByRoom, { isFetching: isFetchingBeds }] = useLazyGetActiveBedsByRoomIdQuery();
  const [bedOptions, setBedOptions] = useState<any[]>([]);
  const [bedsNextLink, setBedsNextLink] = useState<string | null>(null);

  const {
    data: roomsResponse,
    isFetching: isFetchingRooms
  } = useGetAvailableRoomsByDepartmentAndGenderQuery(
    {
      departmentId: resolvedDepartmentId as Id,
      gender: patientGender,
      page: 0,
      size: 10,
      sort: 'id,asc'
    },
    {
      skip: !open || !resolvedDepartmentId 
    }
  );

  const roomOptions = useMemo(() => roomsResponse?.data ?? [], [roomsResponse]);
  useEffect(() => {
    if (open) {
      setRecord({
        ...newEncounterAssignToBed,
        departmentId: resolvedDepartmentId
      });
    }
  }, [open, resolvedDepartmentId]);

  useEffect(() => {
    if (!open || !record.roomId) {
      setBedOptions([]);
      setBedsNextLink(null);
      return;
    }

    const roomId = record.roomId;
    loadBedsByRoom(
      {
        roomId: roomId as Id,
        page: 0,
        size: 10,
        sort: 'id,asc'
      },
      false
    )
      .unwrap()
      .then(response => {
        setBedOptions(response?.data ?? []);
        setBedsNextLink(response?.links?.next ?? null);
      })
      .catch(() => {
        setBedOptions([]);
        setBedsNextLink(null);
      });
  }, [open, record.roomId, loadBedsByRoom]);

  const handleFetchMoreBeds = async () => {
    if (!bedsNextLink || !record.roomId || isFetchingBeds) return;

    const { page } = extractPaginationFromLink(bedsNextLink);
    if (page == null || Number.isNaN(page)) return;

    try {
      const response = await loadBedsByRoom(
        {
          roomId: record.roomId as Id,
          page,
          size: 10,
          sort: 'id,asc'
        },
        false
      ).unwrap();

      const incoming = response?.data ?? [];
      setBedOptions(prev => {
        const seen = new Set(prev.map((item: any) => String(item?.id)));
        const merged = [...prev];
        incoming.forEach((item: any) => {
          const key = String(item?.id);
          if (!seen.has(key)) merged.push(item);
        });
        return merged;
      });

      setBedsNextLink(response?.links?.next ?? null);
    } catch {
      setBedsNextLink(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRecord({ ...newEncounterAssignToBed });
  };

  const handleSave = async () => {
    const encounterId = encounter?.id;
    const patientId =
      encounter?.patientId ??
      encounter?.patient?.id ??
      encounter?.patientObject?.id ??
      null;

    if (!resolvedDepartmentId) {
      dispatch(notify({ msg: 'Department is required.', sev: 'error' }));
      return;
    }

    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'error' }));
      return;
    }

    if (!patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'error' }));
      return;
    }

    if (!record.roomId) {
      dispatch(notify({ msg: 'Please select a room.', sev: 'error' }));
      return;
    }

    if (!record.bedId) {
      dispatch(notify({ msg: 'Please select a bed.', sev: 'error' }));
      return;
    }

    try {
      const payload: EncounterAssignToBed = {
        ...record,
        encounter: { id: encounterId },
        patient: { id: patientId },
        departmentId: resolvedDepartmentId,
        isActive: true
      };

      try {
        await addEncounterAssignToBed(payload).unwrap();
      } catch (err) {
        console.error('assign error', err);
        throw err;
      }

      try {
        await occupyBed({ id: record.bedId }).unwrap();
      } catch (err) {
        console.error('occupy bed error', err);
        throw err;
      }


      dispatch(
        notify({
          msg: 'Bed assigned successfully.',
          sev: 'success'
        })
      );

      refetchEncounter?.();
      handleClose();
    } catch (err: any) {
      handleCrudError(err, dispatch, ASSIGN_TO_BED_ERROR_MAP);
    }
  };

  const modalContent = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        required
        column
        fieldLabel="Select Room"
        fieldType="selectPagination"
        fieldName="roomId"
        selectData={roomOptions}
        selectDataLabel="name"
        selectDataValue="id"
        record={record}
        setRecord={setRecord}
        width={250}
        searchable={false}
        loading={isFetchingRooms}
        hasMore={roomsResponse?.links?.next != null}
        onFetchMore={async () => { }}
        onSelectItem={(item: any) => {
          setRecord(prev => ({
            ...prev,
            roomId: item?.id ?? null,
            bedId: null
          }));
        }}
      />

      <MyInput
        required
        column
        fieldLabel="Select Bed"
        fieldType="selectPagination"
        fieldName="bedId"
        selectData={bedOptions}
        selectDataLabel="name"
        selectDataValue="id"
        record={record}
        setRecord={setRecord}
        width={250}
        searchable={false}
        loading={isFetchingBeds}
        hasMore={bedsNextLink != null}
        onFetchMore={handleFetchMoreBeds}
      />

      <MyInput
        column
        fieldType="textarea"
        fieldLabel="Admission Reason"
        fieldName="admissionReason"
        record={record}
        setRecord={setRecord}
        width={500}
      />
    </Form>
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Assign to Bed"
      steps={[{ title: 'Assign to Bed', icon: <FontAwesomeIcon icon={faBed} /> }]}
      size="38vw"
      bodyheight="60vh"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={
        isSavingAssignment || isOccupyingBed || isMovingEncounterStatus
      }
      content={<div dir={dir}>{modalContent}</div>}
    />
  );
};

export default BedAssignmentModal;