import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetResourcesAvailabilityTimeQuery,
  useGetResourcesQuery
} from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { useGetEncountersQuery } from '@/services/encounterService';
import { useEnumOptions } from '@/services/enumsApi';
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
  const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
  const [filteredResourcesList, setFilteredResourcesList] = useState([]);
  const [resourcesListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 100
  });
  const [resourcesAvailabilityTimeListRequest] = useState<ListRequest>({ ...initialListRequest });
  const dayCaseDepartmentListResponse = useGetResourceTypeQuery('5433343011954425');
  // Fetches the list of resource availability times.
  const { data: resourceAvailabilityTimeListResponse } = useGetResourcesAvailabilityTimeQuery({
    ...resourcesAvailabilityTimeListRequest,
    pageSize: 10000
  });
  // Fetches the list of resources based on the provided request parameters
  const { data: resourcesListResponse } = useGetResourcesQuery(resourcesListRequest);

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
    if (localEncounter?.resourceTypeLkey) {
      const filtered = resourcesListResponse?.object?.filter(
        resource => resource?.resourceTypeLkey === localEncounter?.resourceTypeLkey
      );
      setFilteredResourcesList(filtered);
    }
  }, [resourcesListResponse, localEncounter?.resourceTypeLkey]);

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

  return (
    <Form fluid layout="inline" className="fields-container">
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
            ? filteredResourcesList?.length > 0
              ? filteredResourcesList
              : []
            : []
        }
        fieldType="select"
        selectDataLabel="resourceName"
        selectDataValue="key"
        fieldName="resourceKey"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={!localEncounter?.resourceTypeLkey || isReadOnly}
      />
      {/* // TODO update status to be a LOV value */}
      {localEncounter?.resourceTypeLkey == '2039534205961578' ? (
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="departmentKey"
          selectData={
            departmentListResponse?.object?.filter(dept =>
              uniqueDepartmentKeys.includes(dept.key)
            ) ?? []
          }
          selectDataLabel="name"
          selectDataValue="key"
          record={localEncounter}
          setRecord={setLocalEncounter}
          disabled={isReadOnly}
        />
      ) : null}
      {localEncounter?.resourceTypeLkey == '2039548173192779' ? (
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="departmentKey"
          selectData={dayCaseDepartmentListResponse?.data?.object ?? []}
          selectDataLabel="name"
          selectDataValue="key"
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
        disabled={isReadOnly}
        searchable={false}
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
      <MyInput
        column
        fieldLabel="Security Access Level"
        fieldName="securityAccessLevel"
        record={localEncounter}
        setRecord={setLocalEncounter}
      />
      <MyInput
        column
        fieldLabel="Follow-up"
        fieldName="state"
        fieldType="checkbox"
        checkedLabel="New"
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
    </Form>
  );
};

export default RegistrationEncounter;
