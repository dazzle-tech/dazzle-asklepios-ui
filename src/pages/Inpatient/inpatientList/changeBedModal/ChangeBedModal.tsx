import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';

import { EncounterAssignToBed } from '@/types/model-types-new';
import { newEncounterAssignToBed } from '@/types/model-types-constructor-new';

import {
  useGetActiveAssignmentByEncounterIdQuery,
  useUpdateEncounterAssignToBedMutation
} from '@/services/patients/emergency/encounterAssignToBedService';

import { useGetAvailableRoomsByDepartmentAndGenderQuery } from '@/services/setup/room/roomService';
import {
  useGetActiveBedsByRoomIdQuery,
  useOccupyBedMutation,
  useMarkBedAsInCleaningMutation
} from '@/services/setup/room/bedService';

type Id = number | string;

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  localEncounter: any;
  refetchInpatientList?: () => void | Promise<any>;
};

const CHANGE_BED_ERROR_MAP: Record<string, string> = {
  'id.notfound': 'Active assignment not found.',
  'activeAssignment.notfound': 'Active bed assignment not found for this encounter.',
  'encounter.notfound': 'Encounter not found.',
  'patient.notfound': 'Patient not found.',
  'room.notfound': 'Room not found.',
  'bed.notfound': 'Bed not found.',
  'department.notfound': 'Department not found.',
  'bed.alreadyAssigned': 'Selected bed is already assigned.',
  'transfer.sameBed.notAllowed': 'Changing to the same bed is not allowed.',
  'patient.encounter.mismatch': 'Patient does not belong to encounter.',
  'update.onlyActiveAllowed': 'Only the active assignment can be updated.',
  'db.constraint': 'Database constraint violation while changing bed.',
  'invalid.status.transition': 'Invalid bed status transition.'
};

const normalizeFieldMessage = (message: string) => {
  const lowerMessage = (message || '').toLowerCase();

  if (lowerMessage.includes('must not be null')) return 'is required';
  if (lowerMessage.includes('must not be blank')) return 'must not be blank';
  if (lowerMessage.includes('size must be between')) return 'length is out of range';
  if (lowerMessage.includes('must be greater')) return 'value is too small';
  if (lowerMessage.includes('must be less')) return 'value is too large';

  return message || 'invalid value';
};

const handleCrudError = (
  error: any,
  dispatch: any,
  keyMap: Record<string, string>
) => {
  const responseData = error?.data ?? {};
  const traceId =
    responseData?.traceId || responseData?.requestId || responseData?.correlationId;
  const traceSuffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(responseData?.fieldErrors) && responseData.fieldErrors.length > 0) {
    const errorLines = responseData.fieldErrors.map(
      (fieldError: any) =>
        `• ${fieldError.field}: ${normalizeFieldMessage(fieldError.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${errorLines.join('\n')}${traceSuffix}`,
        sev: 'error'
      })
    );
    return;
  }

  const messageProperty: string = responseData?.message || '';
  const errorKey =
    messageProperty.startsWith('error.') ? messageProperty.substring(6) : responseData?.errorKey;

  const humanReadableMessage =
    (errorKey && keyMap[errorKey]) ||
    responseData?.detail ||
    responseData?.title ||
    responseData?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: `${humanReadableMessage}${traceSuffix}`,
      sev: 'error'
    })
  );
};

const ChangeBedModal: React.FC<Props> = ({
  open,
  setOpen,
  localEncounter,
  refetchInpatientList
}) => {
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<EncounterAssignToBed>({
    ...newEncounterAssignToBed
  });

  const encounterId = localEncounter?.id ?? null;
  const patientId =
    localEncounter?.patient?.id ??
    localEncounter?.patientId ??
    localEncounter?.patientObject?.id ??
    null;
  const departmentId = Number(localEncounter?.departmentId ?? 0) || null;
  const patientGender = localEncounter?.patientObject?.sexAtBirth?.toUpperCase() ?? null;

  const {
    data: activeAssignment,
    isFetching: isFetchingActiveAssignment
  } = useGetActiveAssignmentByEncounterIdQuery(
    { encounterId: encounterId as Id },
    { skip: !open || !encounterId }
  );

  const [updateEncounterAssignToBed, { isLoading: isUpdatingAssignment }] =
    useUpdateEncounterAssignToBedMutation();

  const [occupyBed, { isLoading: isOccupyingNewBed }] = useOccupyBedMutation();
  const [markBedAsInCleaning, { isLoading: isMarkingOldBedInCleaning }] =
    useMarkBedAsInCleaningMutation();

  const {
    data: roomsResponse,
    isFetching: isFetchingRooms
  } = useGetAvailableRoomsByDepartmentAndGenderQuery(
    {
      departmentId: departmentId as Id,
      gender: patientGender,
      page: 0,
      size: 50,
      sort: 'id,asc'
    },
    {
      skip: !open || !departmentId || !patientGender
    }
  );

  const {
    data: bedsResponse,
    isFetching: isFetchingBeds
  } = useGetActiveBedsByRoomIdQuery(
    {
      roomId: record.roomId as Id,
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    {
      skip: !open || !record.roomId
    }
  );

  const roomOptions = useMemo(() => roomsResponse?.data ?? [], [roomsResponse]);
  const bedOptions = useMemo(() => bedsResponse?.data ?? [], [bedsResponse]);

  useEffect(() => {
    if (!open) {
      setRecord({ ...newEncounterAssignToBed });
      return;
    }

    setRecord({
      ...newEncounterAssignToBed,
      departmentId
    });
  }, [open, departmentId]);

  useEffect(() => {
    setRecord(previousRecord => ({
      ...previousRecord,
      bedId: null
    }));
  }, [record.roomId]);

  const handleClose = () => {
    setOpen(false);
    setRecord({ ...newEncounterAssignToBed });
  };

  const handleSave = async () => {
    const currentActiveAssignmentId = activeAssignment?.id ?? null;
    const currentRoomId = Number(activeAssignment?.roomId ?? 0) || null;
    const currentBedId = Number(activeAssignment?.bedId ?? 0) || null;

    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'error' }));
      return;
    }

    if (!patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'error' }));
      return;
    }

    if (!departmentId) {
      dispatch(notify({ msg: 'Department is required.', sev: 'error' }));
      return;
    }

    if (!patientGender) {
      dispatch(notify({ msg: 'Patient gender is required.', sev: 'error' }));
      return;
    }

    if (!currentActiveAssignmentId) {
      dispatch(notify({ msg: 'Active assignment not found.', sev: 'error' }));
      return;
    }

    if (!currentBedId || !currentRoomId) {
      dispatch(notify({ msg: 'Current bed assignment is incomplete.', sev: 'error' }));
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

    if (Number(record.bedId) === Number(currentBedId)) {
      dispatch(
        notify({
          msg: 'Changing to the same bed is not allowed.',
          sev: 'error'
        })
      );
      return;
    }

    try {
      await updateEncounterAssignToBed({
        id: currentActiveAssignmentId,
        encounter: { id: encounterId },
        patient: { id: patientId },
        roomId: Number(record.roomId),
        bedId: Number(record.bedId),
        departmentId,
        admissionReason: record.admissionReason ?? activeAssignment?.admissionReason ?? null,
        isActive: true
      }).unwrap();

      await markBedAsInCleaning({ id: currentBedId }).unwrap();

      await occupyBed({ id: Number(record.bedId) }).unwrap();

      dispatch(
        notify({
          msg: 'Bed changed successfully.',
          sev: 'success'
        })
      );

      await refetchInpatientList?.();
      handleClose();
    } catch (error: any) {
      handleCrudError(error, dispatch, CHANGE_BED_ERROR_MAP);
    }
  };

  const modalContent = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        required
        column
        fieldLabel="Select New Room"
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
        onFetchMore={async () => {}}
      />

      <MyInput
        required
        column
        fieldLabel="Select New Bed"
        fieldType="selectPagination"
        fieldName="bedId"
        selectData={bedOptions}
        selectDataLabel="name"
        selectDataValue="id"
        record={record}
        setRecord={setRecord}
        width={250}
        searchable={false}
        disabled={!record.roomId}
        loading={isFetchingBeds}
        hasMore={bedsResponse?.links?.next != null}
        onFetchMore={async () => {}}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Change Bed"
      steps={[{ title: 'Change Bed', icon: <FontAwesomeIcon icon={faBed} /> }]}
      size="38vw"
      bodyheight="60vh"
      actionButtonFunction={handleSave}
      actionButtonLabel="Move"
      actionButtonLoading={
        isFetchingActiveAssignment ||
        isUpdatingAssignment ||
        isOccupyingNewBed ||
        isMarkingOldBedInCleaning
      }
      content={modalContent}
    />
  );
};

export default ChangeBedModal;