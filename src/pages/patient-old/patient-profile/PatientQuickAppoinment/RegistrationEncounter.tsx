import React, { useEffect, useState, useMemo } from 'react';
import MyInput from '@/components/MyInput';
import { Form, Tag } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetEncountersQuery } from '@/services/encounterService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import {
  useGetAppointableDepartmentsQuery,
  useGetAppointableDepartmentByTypeQuery,
  useGetAllDepartmentsWithoutPaginationQuery
} from '@/services/security/departmentService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useSelector } from 'react-redux';

const RegistrationEncounter = ({ localEncounter, setLocalEncounter, isReadOnly, localPatient }) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [validationResult] = useState({});
  // const [uniqueDepartmentKeys, setUniqueDepartmentKeys] = useState([]);
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
  const { data: visitSequenceEncountersResponse } = useGetEncountersQuery(
    visitSequenceListRequest,
    {
      skip:
        !localEncounter.resourceTypeLkey ||
        !localEncounter.resourceKey ||
        !localEncounter.facilityKey
    }
  );

  // customise item appears on the select visit list
  const modifiedData = (visiterHistoryResponse?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.visitId} , ${item?.plannedStartDate ?? ''} , ${
      item?.plannedEndDate ?? ''
    }`
  }));

  // Fetch LOV data for various fields
  // const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');

  const ResourceTypeEnum = useEnumOptions('ResourceType');
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
  const { data: visitTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
  const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');

  // Initialize List Request Filters
  const { data: departmentListResponse } = useGetAppointableDepartmentsQuery(
    {
      facilityId: localEncounter?.facilityKey,
      page: 0,
      size: 1000,
      sort: 'id,asc'
    },
    {
      skip: !localEncounter?.facilityKey
    }
  );
  // const [resourcesAvailabilityTimeListRequest] = useState<ListRequest>({ ...initialListRequest });
  // // Fetches the list of resource availability times.
  // const { data: resourceAvailabilityTimeListResponse } = useGetResourcesAvailabilityTimeQuery({
  //   ...resourcesAvailabilityTimeListRequest,
  //   pageSize: 10000
  // }, {
  //   skip: !localEncounter?.resourceKey
  // });
  const { data: dayCaseDepartmentListResponse } = useGetAppointableDepartmentByTypeQuery(
    {
      type: 'DAY_CASE',
      facilityId: localEncounter?.facilityKey,
      page: 0,
      size: 1000,
      sort: 'id,asc'
    },
    {
      skip: !localEncounter?.facilityKey
    }
  );
  // Fetches the list of resource availability times.
  // const { data: resourceAvailabilityTimeListResponse } = useGetResourcesAvailabilityTimeQuery({
  //   ...resourcesAvailabilityTimeListRequest,
  //   pageSize: 10000
  // }, {
  //   skip: !localEncounter?.resourceKey
  // });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  // Fetches the list of active resources based on the selected resource type from the new ResourceService
  const { data: resourcesByTypeResponse } = { data: { data: [] as unknown[] } };

  // Fetch all practitioners for lookup
  const { data: practitionersResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  // Fetch all departments for lookup
  const { data: allDepartments } = useGetAllDepartmentsWithoutPaginationQuery({});

  // Fetch all diagnostic tests for lookup
  const { data: diagnosticTestsResponse } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  // Create lookup maps
  const practitionerMap = useMemo(() => {
    if (!practitionersResponse?.data) return {};
    const map = {};
    practitionersResponse.data.forEach(practitioner => {
      if (practitioner.key) map[practitioner.key] = practitioner;
      if (practitioner.id) map[practitioner.id] = practitioner;
    });
    return map;
  }, [practitionersResponse]);

  const departmentMap = useMemo(() => {
    if (!allDepartments) return {};
    const map = {};
    allDepartments.forEach(dept => {
      if (dept.key) map[dept.key] = dept;
      if (dept.id) map[dept.id] = dept;
    });
    return map;
  }, [allDepartments]);

  const diagnosticTestMap = useMemo(() => {
    if (!diagnosticTestsResponse?.data) return {};
    const map = {};
    diagnosticTestsResponse.data.forEach(test => {
      if (test.key) map[test.key] = test;
      if (test.id) map[test.id] = test;
    });
    return map;
  }, [diagnosticTestsResponse]);

  // Transform resources to add display names based on resource type
  const transformedResources = useMemo(() => {
    if (!resourcesByTypeResponse?.data) return [];

    return resourcesByTypeResponse.data.map(resource => {
      let displayName = resource.resourceKey || '';
      const resourceType = resource.resourceType;
      const lookupKey = resource.resourceKey;
      // Based on resource type, look up the appropriate name
      if (resourceType === 'PRACTITIONER') {
        // For PRACTITIONER resources, look up in practitioner map
        // Try multiple possible key fields - resourceKey is the reference to the practitioner ID

        const practitioner = lookupKey ? practitionerMap[lookupKey] : null;

        if (practitioner) {
          displayName =
            practitioner.practitionerFullName ||
            `${practitioner.firstName || ''} ${practitioner.lastName || ''}`.trim();
        }
      } else if (
        ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(resourceType)
      ) {
        // For department-based resources, look up in department map
        // resourceKey contains the reference to the department ID

        const department = lookupKey ? departmentMap[lookupKey] : null;

        if (department) {
          displayName = department.name;
        }
      } else if (['MEDICAL_TEST'].includes(resourceType)) {
        // For diagnostic test resources, look up in diagnostic test map
        // resourceKey contains the reference to the diagnostic test ID
        const diagnosticTest = lookupKey ? diagnosticTestMap[lookupKey] : null;

        if (diagnosticTest) {
          displayName = diagnosticTest.name;
        }
      }

      // Final fallback - only use if absolutely no display name found
      if (!displayName) {
        displayName = resource.resourceKey || 'Unknown Resource';
      }

      return {
        ...resource,
        displayName
      };
    });
  }, [resourcesByTypeResponse, practitionerMap, departmentMap, diagnosticTestMap]);

  // Get active filter tags
  const activeFilters = useMemo(() => {
    const filters = [];

    if (localEncounter?.resourceTypeLkey) {
      const resourceTypeLabel =
        ResourceTypeEnum?.find(rt => rt.value === localEncounter.resourceTypeLkey)?.label ||
        localEncounter.resourceTypeLkey;
      filters.push({
        type: 'resourceType',
        label: 'Resource Type',
        value: resourceTypeLabel,
        valueKey: localEncounter.resourceTypeLkey
      });
    }

    if (localEncounter?.resourceKey && resourcesByTypeResponse?.data) {
      const selectedResource = resourcesByTypeResponse.data.find(
        r => r.id === localEncounter.resourceKey
      );
      if (selectedResource) {
        filters.push({
          type: 'resource',
          label: 'Resource',
          value: selectedResource.resourceKey || localEncounter.resourceKey,
          valueKey: localEncounter.resourceKey
        });
      }
    }

    return filters;
  }, [
    localEncounter?.resourceTypeLkey,
    localEncounter?.resourceKey,
    ResourceTypeEnum,
    resourcesByTypeResponse
  ]);

  // Handle removing filter
  const handleRemoveFilter = (filterType: string) => {
    if (filterType === 'resourceType') {
      setLocalEncounter(prev => ({
        ...prev,
        resourceTypeLkey: null,
        resourceKey: null // Also clear resource when resource type is removed
      }));
    } else if (filterType === 'resource') {
      setLocalEncounter(prev => ({
        ...prev,
        resourceKey: null
      }));
    }
  };

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

  // useEffect(() => {
  //   if (!localEncounter?.resourceKey || !resourceAvailabilityTimeListResponse) return;
  //   const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  //   const filteredList = resourceAvailabilityTimeListResponse.object.filter(
  //     item =>
  //       item.resourceKey === localEncounter.resourceKey &&
  //       item.departmentKey &&
  //       item.dayLvalue?.lovDisplayVale === today //Day match
  //   );
  //   const departmentKeys = filteredList.map(item => item.departmentKey?.toString().trim());
  //   const uniqueDepartmentKeys = Array.from(new Set(departmentKeys));
  //   setUniqueDepartmentKeys(uniqueDepartmentKeys);
  // }, [localEncounter, resourceAvailabilityTimeListResponse]);

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
          fieldName: 'encounter_status_lkey',
          operator: 'not_match',
          value: '91098528988200' // Exclude cancelled encounters
        }
      ],
      pageSize: 10000
    });
  }, [
    localEncounter.resourceTypeLkey,
    localEncounter.resourceKey,
    localEncounter.facilityKey,
    todayDate
  ]);

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
      {/* Active Filters Tags */}
      {/* {activeFilters.length > 0 && (
        <div style={{ 
          width: '100%', 
          marginBottom: '16px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          padding: '8px',
          backgroundColor: mode === 'light' ? '#f8f9fa' : '#434343ff',
          borderRadius: '12px',
          border: '1px solid var(--rs-border-primary)'
        }}>
          {activeFilters.map((filter, index) => (
            <Tag
              key={`${filter.type}-${index}`}
              closable
              onClose={() => handleRemoveFilter(filter.type)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                backgroundColor: mode === 'light' ? '#e9ecef' : '#5a5a5a',
                color: mode === 'light' ? '#495057' : '#ffffff',
                border: '1px solid var(--rs-border-primary)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <strong>{filter.label}:</strong> {filter.value}
            </Tag>
          ))}
        </div>
      )} */}

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
        selectData={
          facilityListResponse
            ? facilityListResponse.map(fac => ({ facilityName: fac.name, key: fac.id }))
            : []
        }
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
        selectData={localEncounter?.resourceTypeLkey ? transformedResources : []}
        fieldType="select"
        selectDataLabel="displayName"
        selectDataValue="id"
        fieldName="resourceKey"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={!localEncounter?.resourceTypeLkey || isReadOnly}
        required
      />
      {/* // TODO update status to be a LOV value */}
      {localEncounter?.resourceTypeLkey == '2039534205961578' ||
      localEncounter?.resourceTypeLkey == 'PRACTITIONER' ? (
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="departmentKey"
          selectData={departmentListResponse?.data ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={localEncounter}
          setRecord={setLocalEncounter}
          disabled={isReadOnly}
          required
        />
      ) : null}
      {localEncounter?.resourceTypeLkey == '2039548173192779' ||
      localEncounter?.resourceTypeLkey == 'PROCEDURE' ? (
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
          required
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
 disableByField='isValid'

        selectDataValue="key"
        record={localEncounter}
        setRecord={() => {}} // No updates allowed
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
 disableByField='isValid'

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
 disableByField='isValid'

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
 disableByField='isValid'

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
