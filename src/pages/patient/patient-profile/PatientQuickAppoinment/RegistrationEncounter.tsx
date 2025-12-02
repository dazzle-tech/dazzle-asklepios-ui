import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetResourcesAvailabilityTimeQuery
} from '@/services/appointmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetEncountersQuery } from '@/services/encounterService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetResourcesByTypeQuery } from '@/services/setup/resource/ResourceService';
import { useGetAppointableDepartmentsQuery, useGetAppointableDepartmentByTypeQuery } from '@/services/security/departmentService';
const RegistrationEncounter = ({ localEncounter, setLocalEncounter, isReadOnly, localPatient }) => {
  const [validationResult] = useState({});
  const [uniqueDepartmentKeys, setUniqueDepartmentKeys] = useState([]);
  const [newOrFollowup, setNewOrFollowup] = useState({ state: true });
  const [visitHistoryListRequest, setVisitHistoryListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'plannedStartDate',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient.key || undefined
      },
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: localEncounter.resourceTypeLkey || undefined
      }
    ],
    pageSize: 15
  });
  // Fetch visit history list response
  const { data: visiterHistoryResponse, isFetching } =
    useGetEncountersQuery(visitHistoryListRequest);

  // Fetch today's encounters to calculate sequence daily number
  const todayDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  const [todayEncountersListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'planned_start_date',
        operator: 'match',
        value: todayDate
      }
    ],
    pageSize: 10000 // Get all encounters for today
  });
  const { data: todayEncountersResponse } = useGetEncountersQuery(todayEncountersListRequest);

  // Fetch encounters for visit sequence number calculation (by resource type, resource, and facility for today)
  const [visitSequenceListRequest, setVisitSequenceListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'planned_start_date',
        operator: 'match',
        value: todayDate
      },
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: localEncounter.resourceTypeLkey || undefined
      },
      {
        fieldName: 'resource_key',
        operator: 'match',
        value: localEncounter.resourceKey || undefined
      },
      {
        fieldName: 'facility_key',
        operator: 'match',
        value: localEncounter.facilityKey || undefined
      }
    ],
    pageSize: 10000
  });
  const { data: visitSequenceEncountersResponse } = useGetEncountersQuery(visitSequenceListRequest, {
    skip: !localEncounter.resourceTypeLkey || !localEncounter.resourceKey || !localEncounter.facilityKey
  });

  // customise item appears on the select visit list
  const modifiedData = (visiterHistoryResponse?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.visitId} , ${item?.plannedStartDate ?? ''} , ${item?.plannedEndDate ?? ''
      }`
  }));

  // Fetch LOV data for various fields
  // const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');

  const ResourceTypeEnum = useEnumOptions("ResourceType");
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
  const { data: visitTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
  const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');

  // Initialize List Request Filters
  const { data: departmentListResponse } = useGetAppointableDepartmentsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });
  const [resourcesAvailabilityTimeListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: dayCaseDepartmentListResponse } = useGetAppointableDepartmentByTypeQuery({
    type: 'DAY_CASE',
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });
  // Fetches the list of resource availability times.
  const { data: resourceAvailabilityTimeListResponse } = useGetResourcesAvailabilityTimeQuery({
    ...resourcesAvailabilityTimeListRequest,
    pageSize: 10000
  });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  // Fetches the list of resources based on the selected resource type from the new ResourceService
  const { data: resourcesByTypeResponse } = useGetResourcesByTypeQuery(
    {
      resourceType: localEncounter?.resourceTypeLkey,
      page: 0,
      size: 100
    },
    {
      skip: !localEncounter?.resourceTypeLkey
    }
  );

  // Effects
  useEffect(() => {
    setVisitHistoryListRequest({
      ...initialListRequest,
      sortBy: 'plannedStartDate',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient.key || undefined
        },
        {
          fieldName: 'resource_type_lkey',
          operator: 'match',
          value: localEncounter.resourceTypeLkey || undefined
        }
      ]
    });
  }, [localPatient, localEncounter]);

  useEffect(() => {
    if (!localEncounter?.resourceKey || !resourceAvailabilityTimeListResponse) return;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const filteredList = resourceAvailabilityTimeListResponse.object.filter(
      item =>
        item.resourceKey === localEncounter.resourceKey &&
        item.departmentKey &&
        item.dayLvalue?.lovDisplayVale === today //Day match
    );
    const departmentKeys = filteredList.map(item => item.departmentKey?.toString().trim());
    const uniqueDepartmentKeys = Array.from(new Set(departmentKeys));
    setUniqueDepartmentKeys(uniqueDepartmentKeys);
  }, [localEncounter, resourceAvailabilityTimeListResponse]);

  // Calculate and set sequence daily number based on today's encounter count
  useEffect(() => {
    if (todayEncountersResponse?.object) {
      const todayEncounterCount = todayEncountersResponse.object.length;
      const nextSequenceNumber = todayEncounterCount + 1;
      
      // Only update if the value is different to avoid unnecessary re-renders
      if (localEncounter.sequenceDailyNumber !== nextSequenceNumber) {
        setLocalEncounter(prev => ({
          ...prev,
          sequenceDailyNumber: nextSequenceNumber
        }));
      }
    }
  }, [todayEncountersResponse]);

  // Update visit sequence list request when resource type, resource, or facility changes
  useEffect(() => {
    setVisitSequenceListRequest({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'planned_start_date',
          operator: 'match',
          value: todayDate
        },
        {
          fieldName: 'resource_type_lkey',
          operator: 'match',
          value: localEncounter.resourceTypeLkey || undefined
        },
        {
          fieldName: 'resource_key',
          operator: 'match',
          value: localEncounter.resourceKey || undefined
        },
        {
          fieldName: 'facility_key',
          operator: 'match',
          value: localEncounter.facilityKey || undefined
        },
        {
          fieldName: 'status_lkey',
          operator: 'not_match',
          value: '91098528988200' // Exclude cancelled encounters
        }
      ],
      pageSize: 10000
    });
  }, [localEncounter.resourceTypeLkey, localEncounter.resourceKey, localEncounter.facilityKey, todayDate]);

  // Calculate and set visit sequence number based on resource type, resource, and facility for today
  useEffect(() => {
    if (visitSequenceEncountersResponse?.object) {
      const visitSequenceCount = visitSequenceEncountersResponse.object.length;
      const nextVisitSequenceNumber = visitSequenceCount + 1;
      
      // Only update if the value is different to avoid unnecessary re-renders
      if (localEncounter.visitSequenceNumber !== nextVisitSequenceNumber) {
        setLocalEncounter(prev => ({
          ...prev,
          visitSequenceNumber: nextVisitSequenceNumber
        }));
      }
    }
  }, [visitSequenceEncountersResponse]);

  return (
    <Form fluid layout="inline" className="fields-container">

      <MyInput
        vr={validationResult}
        column
        disabled={true}
        fieldLabel="Date"
        fieldType="date"
        fieldName="plannedStartDate"
        record={localEncounter}
        setRecord={setLocalEncounter}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Facility"
        fieldType="select"
        fieldName="facilityKey"
        selectData={facilityListResponse ? facilityListResponse.map(fac => ({ facilityName: fac.name, key: fac.id })) : []}
        selectDataLabel="facilityName"
        selectDataValue="key"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        searchable={false}
        required
      />
      <MyInput
        required
        vr={validationResult}
        column
        fieldLabel="Resource Type"
        fieldType="select"
        fieldName="resourceTypeLkey"
        selectData={ResourceTypeEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        searchable={false}
      />

      <MyInput
        column
        fieldLabel="Resources"
        selectData={
          localEncounter?.resourceTypeLkey
            ? resourcesByTypeResponse?.data ?? []
            : []
        }
        fieldType="select"
        selectDataLabel="resourceKey"
        selectDataValue="id"
        fieldName="resourceKey"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={!localEncounter?.resourceTypeLkey || isReadOnly}
        required
      />
      {/* // TODO update status to be a LOV value */}
      {localEncounter?.resourceTypeLkey == '2039534205961578' || localEncounter?.resourceTypeLkey == 'PRACTITIONER' ? (
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="departmentKey"
          selectData={
            departmentListResponse?.data ?? []
          }
          selectDataLabel="name"
          selectDataValue="id"
          record={localEncounter}
          setRecord={setLocalEncounter}
          disabled={isReadOnly}
        />
      ) : null}
      {localEncounter?.resourceTypeLkey == '2039548173192779' || localEncounter?.resourceTypeLkey == 'PROCEDURCE' ? (
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="departmentKey"
          selectData={dayCaseDepartmentListResponse?.data ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={localEncounter}
          setRecord={setLocalEncounter}
          disabled={isReadOnly}
        />
      ) : null}
      <MyInput
        vr={validationResult}
        column
        fieldType="select"
        fieldLabel="Visit Type"
        fieldName="visitTypeLkey"
        selectData={visitTypeLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localEncounter}
        setRecord={() => { }} // No updates allowed
        disabled={true}
        searchable={false}
        required
      />
      <MyInput
        vr={validationResult}
        column
        fieldType="select"
        fieldLabel="Priority"
        fieldName="encounterPriorityLkey"
        selectData={encounterPriorityLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldType="select"
        fieldName="reasonLkey"
        selectData={encounterReasonLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldType="select"
        fieldName="originLkey"
        selectData={patOriginLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        searchable={false}
      />
      <MyInput
        vr={validationResult}
        column
        fieldLabel="Source Name"
        fieldName="sourceName"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
      />

      {/* <MyInput
        column
        fieldLabel="Security Access Level"
        fieldName="securityAccessLevel"
        record={localEncounter}
        setRecord={setLocalEncounter}
      /> */}
      <MyInput
        column
        fieldLabel=""
        fieldName="state"
        fieldType="checkbox"
        checkedLabel="New Appointment"
        unCheckedLabel="Follow-up"
        record={newOrFollowup}
        setRecord={setNewOrFollowup}
      />
      {!newOrFollowup['state'] && (
        <MyInput
          column
          fieldLabel="Visits"
          fieldName="visitId"
          fieldType="select"
          selectData={modifiedData}
          selectDataLabel="combinedLabel"
          selectDataValue="visitId"
          record={localEncounter}
          setRecord={setLocalEncounter}
          menuMaxHeight={200}
          loading={isFetching}
          searchable={false}
        />
      )}
      <MyInput
        column
        fieldType="textarea"
        fieldLabel="Note"
        fieldName="encounterNotes"
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        record={localEncounter}
      />
      <div style={{ width: '100%', marginTop: '1rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Encounter Information</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <MyInput
            vr={validationResult}
            column
            disabled={true}
            fieldLabel="Visit ID"
            fieldName="visitId"
            record={localEncounter}
            setRecord={setLocalEncounter}
          />
          <MyInput
            column
            fieldLabel="Sequence Daily Number"
            fieldName="sequenceDailyNumber"
            record={localEncounter}
            setRecord={setLocalEncounter}
            disabled
          />
          <MyInput
            column
            fieldLabel="Visit Sequence Number"
            fieldName="visitSequenceNumber"
            record={localEncounter}
            setRecord={setLocalEncounter}
            disabled
          />
        </div>
      </div>
    </Form>
  );
};

export default RegistrationEncounter;
