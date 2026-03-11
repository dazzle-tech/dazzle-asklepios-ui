import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { newApEncounterAssignToBed } from '@/types/model-types-constructor';
import { useSaveAssignToBedMutation } from '@/services/encounterService';
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';
import { useGetRoomListQuery, useGetBedListQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import { ApEncounterAssignToBed } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';

const BedAssignmentModal = ({
  open,
  setOpen,
  encounter,
  refetchEncounter,
  departmentKey
}: any) => {
  const dispatch = useAppDispatch();

  const [object, setObject] = useState<ApEncounterAssignToBed>({
    ...newApEncounterAssignToBed
  });

  const [saveDayCase] = useSaveAssignToBedMutation();
  const [updateEncounter] = useUpdateEncounterMutation();

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'department_key',
        operator: 'match',
        value: encounter?.departmentId
      }
    ],
    pageSize: 100
  });

  const [bedListRequest, setBedListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 100,
    filters: [
      {
        fieldName: 'room_key',
        operator: 'match',
        value: object?.roomKey
      },
      {
        fieldName: 'status_lkey',
        operator: 'match',
        value: '5258243122289092'
      }
    ]
  });

  const { data: roomListResponseLoading } = useGetRoomListQuery(listRequest);

  const { data: fetchBedsListQueryResponce } = useGetBedListQuery(bedListRequest, {
    skip: !object?.roomKey
  });
  const handleSave = async () => {
    try {
      await saveDayCase({
        ...object,
        encounterKey: encounter?.id,
        patientKey: encounter?.patientObject?.id,
        departmentKey: departmentKey
      }).unwrap();

      await updateEncounter({
        id: encounter?.id,
        body: {
          id: encounter?.id,
          patientId: encounter?.patientId ?? encounter?.patient?.id ?? encounter?.patientObject?.id,
          encounterNumber: encounter?.encounterNumber ?? null,
          facilityId: encounter?.facilityId ?? null,
          departmentId: encounter?.departmentId ?? null,
          practitionerId: encounter?.practitionerId ?? null,
          encounterType: encounter?.encounterType ?? null,
          encounterReason: encounter?.encounterReason ?? null,
          followUpEncounterId: encounter?.followUpEncounterId ?? null,
          priorityLevel: encounter?.priorityLevel ?? null,
          originType: encounter?.originType ?? null,
          originName: encounter?.originName ?? null,
          notes: encounter?.notes ?? null,
          departmentDailySequenceNumber: encounter?.departmentDailySequenceNumber ?? null,
          encounterDate: encounter?.encounterDate ?? null,
          status: 'NEW',
          chiefComplaint: encounter?.chiefComplaint ?? null,
          hasPrescription: encounter?.hasPrescription ?? false,
          hasOrder: encounter?.hasOrder ?? false,
          isObserved: encounter?.isObserved ?? false
        }
      }).unwrap();

      refetchEncounter?.();
      dispatch(notify({ msg: 'Admit Successfully', sev: 'success' }));
      setOpen(false);
      setObject({ ...newApEncounterAssignToBed });
    } catch (error) {
      dispatch(notify({ msg: 'Error while assigning bed', sev: 'error' }));
    }
  };

  useEffect(() => {
    setListRequest(prev => {
      let updatedFilters = [...(prev.filters || [])];
      updatedFilters = updatedFilters.filter(f => f.fieldName !== 'department_key');

      if (encounter) {
        updatedFilters.push({
          fieldName: 'department_key',
          operator: 'match',
          value: departmentKey
        });
      }

      return {
        ...prev,
        filters: updatedFilters
      };
    });
  }, [encounter, departmentKey]);

  useEffect(() => {
    setBedListRequest(prev => {
      let updatedFilters = [...(prev.filters || [])];
      updatedFilters = updatedFilters.filter(f => f.fieldName !== 'room_key');

      if (object?.roomKey) {
        updatedFilters.push({
          fieldName: 'room_key',
          operator: 'match',
          value: object.roomKey
        });
      }

      return {
        ...prev,
        filters: updatedFilters
      };
    });
  }, [object?.roomKey]);

  const modalContent = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        required
        column
        fieldLabel="Select Room"
        fieldType="select"
        fieldName="roomKey"
        selectData={roomListResponseLoading?.object ?? []}
        selectDataLabel="name"
        selectDataValue="key"
        record={object}
        setRecord={setObject}
        width={250}
        searchable={false}
      />

      <MyInput
        required
        column
        fieldLabel="Select Bed"
        fieldType="select"
        fieldName="bedKey"
        selectData={fetchBedsListQueryResponce?.object ?? []}
        selectDataLabel="name"
        selectDataValue="key"
        record={object}
        setRecord={setObject}
        searchable={false}
        width={250}
      />

      <MyInput
        column
        fieldType="textarea"
        fieldLabel="Admission Reason"
        fieldName="admissionReason"
        record={object}
        setRecord={setObject}
        width={500}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Assign to Bed"
      steps={[{ title: 'Assign to Bed', icon: <FontAwesomeIcon icon={faBed} /> }]}
      size="38vw"
      bodyheight="60vh"
      actionButtonFunction={handleSave}
      content={modalContent}
    />
  );
};

export default BedAssignmentModal;