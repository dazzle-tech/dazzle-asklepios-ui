import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useSelector } from 'react-redux';

import type { PatientEncounter } from '@/types/model-types-new';
import { newPatientEncounter } from '@/types/model-types-constructor-new';

import { useEnumOptions } from '@/services/enumsApi';

import { useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery } from '@/services/security/departmentService';

import { useLazyGetPractitionersByDepartmentQuery } from '@/services/setup/practitioner/PractitionerDepartmentService';

import {
  useLazyCountTodayEncountersByFacilityQuery,
  useLazyGetPreviousEncountersSameDepartmentQuery
} from '@/services/encounters/patientEncounterService';

import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import './style.less';

const RegistrationEncounter = ({
  localEncounter,
  setLocalEncounter,
  isReadOnly,
  localPatient
}: {
  localEncounter: PatientEncounter;
  setLocalEncounter: (updater: any) => void;
  isReadOnly: boolean;
  localPatient: any;
}) => {
  const authSlice = useSelector((state: any) => state.auth);

  const selectedFacilityId =
    authSlice?.selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;

  const patientId = Number(localPatient?.id ?? localPatient?.key ?? 0);

  const [validationResult] = useState({});

  const EncounterTypeEnum = useEnumOptions('EncounterType', {
    exclude: ['DAYCASE', 'INPATIENT']
  });
  const EncounterReasonEnum = useEnumOptions('EncounterReason');
  const EncounterPriorityEnum = useEnumOptions('EncounterPriority');

  const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');

  useEffect(() => {
    if (!localEncounter) {
      setLocalEncounter({ ...newPatientEncounter });
      return;
    }

    setLocalEncounter((prevEncounter: PatientEncounter) => ({
      ...prevEncounter,
      patientId: prevEncounter.patientId || patientId,
      facilityId: prevEncounter.facilityId || Number(selectedFacilityId ?? 0)
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, selectedFacilityId]);

  const [triggerCountToday, { data: todayCount, isFetching: isTodayCountFetching }] =
    useLazyCountTodayEncountersByFacilityQuery();

  useEffect(() => {
    if (!selectedFacilityId) return;
    triggerCountToday({ facilityId: Number(selectedFacilityId) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacilityId]);

  const [deptPage, setDeptPage] = useState(0);
  const deptSize = 20;
  const [allDepartments, setAllDepartments] = useState<any[]>([]);

  const [triggerDepartments, { data: deptList, isFetching: isDepartmentsFetching }] =
    useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery();

  const prevKeysRef = useRef<{ facilityId?: number; encounterType?: string }>({});

  useEffect(() => {
    if (!selectedFacilityId || !localEncounter?.encounterType) return;

    const facilityIdNum = Number(selectedFacilityId);
    const previousKeys = prevKeysRef.current;

    const facilityChanged =
      previousKeys.facilityId != null && previousKeys.facilityId !== facilityIdNum;
    const typeChanged =
      previousKeys.encounterType != null &&
      previousKeys.encounterType !== localEncounter.encounterType;

    prevKeysRef.current = {
      facilityId: facilityIdNum,
      encounterType: localEncounter.encounterType
    };

    if (facilityChanged || typeChanged) {
      setDeptPage(0);
      setAllDepartments([]);

      setLocalEncounter((prevEncounter: PatientEncounter) => ({
        ...prevEncounter,
        facilityId: facilityIdNum,
        departmentId: 0,
        practitionerId: null,
        followUpEncounterId: null
      }));
    } else {
      setLocalEncounter((prevEncounter: PatientEncounter) => ({
        ...prevEncounter,
        facilityId: prevEncounter.facilityId || facilityIdNum
      }));
    }

    triggerDepartments({
      facilityId: facilityIdNum,
      encounterType: localEncounter.encounterType,
      page: 0,
      size: deptSize,
      sort: 'id,asc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacilityId, localEncounter?.encounterType]);

  useEffect(() => {
    if (!selectedFacilityId || !localEncounter?.encounterType) return;
    if (deptPage === 0) return;

    triggerDepartments({
      facilityId: Number(selectedFacilityId),
      encounterType: localEncounter.encounterType,
      page: deptPage,
      size: deptSize,
      sort: 'id,asc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptPage]);

  useEffect(() => {
    const rows = deptList?.data ?? [];
    if (!rows.length) return;

    setAllDepartments(previousDepartments => {
      const seenIds = new Set(previousDepartments.map((department: any) => Number(department.id)));
      const merged = [...previousDepartments];
      rows.forEach((department: any) => {
        if (!seenIds.has(Number(department.id))) merged.push(department);
      });
      return merged;
    });
  }, [deptList]);

  const deptHasMore = Boolean(deptList?.links?.next);

  const [practPage, setPractPage] = useState(0);
  const practSize = 20;

  const [
    triggerPractitionersByDept,
    { data: practitionersList, isFetching: isPractitionersFetching }
  ] = useLazyGetPractitionersByDepartmentQuery();

  const practitionersData = practitionersList?.data ?? [];
  const practHasMore = Boolean(practitionersList?.links?.next);

  const prevDeptRef = useRef<number | null>(null);

  useEffect(() => {
    const departmentId = Number(localEncounter?.departmentId ?? 0);
    if (!departmentId) return;

    const isFirstRun = prevDeptRef.current == null;
    const hasDepartmentChanged = !isFirstRun && prevDeptRef.current !== departmentId;
    prevDeptRef.current = departmentId;

    setPractPage(0);

    if (hasDepartmentChanged) {
      setLocalEncounter((prevEncounter: PatientEncounter) => ({
        ...prevEncounter,
        practitionerId: null,
        followUpEncounterId: null
      }));
    }

    triggerPractitionersByDept({
      departmentId,
      page: 0,
      size: practSize,
      sort: 'id,asc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localEncounter?.departmentId]);

  useEffect(() => {
    const departmentId = Number(localEncounter?.departmentId ?? 0);
    if (!departmentId) return;
    if (practPage === 0) return;

    triggerPractitionersByDept({
      departmentId,
      page: practPage,
      size: practSize,
      sort: 'id,asc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practPage]);

  const [allPractitioners, setAllPractitioners] = useState<any[]>([]);

  useEffect(() => {
    const rows = practitionersData ?? [];
    if (!rows.length) return;

    setAllPractitioners(previousPractitioners => {
      const seenIds = new Set(
        previousPractitioners.map((practitioner: any) => Number(practitioner.id))
      );
      const merged = [...previousPractitioners];
      rows.forEach((practitioner: any) => {
        if (!seenIds.has(Number(practitioner.id))) merged.push(practitioner);
      });
      return merged;
    });
  }, [practitionersData]);

  useEffect(() => {
    const practitionerId = Number(localEncounter?.practitionerId ?? 0);
    if (!practitionerId) return;

    setAllPractitioners(previousPractitioners => {
      const alreadyExists = previousPractitioners.some(
        (practitioner: any) => Number(practitioner?.id) === practitionerId
      );
      if (alreadyExists) return previousPractitioners;

      const injectedPractitioner = {
        id: practitionerId,
        firstName: (localEncounter as any)?.practitionerFirstName ?? '',
        lastName: (localEncounter as any)?.practitionerLastName ?? `#${practitionerId}`
      };
      return [injectedPractitioner, ...previousPractitioners];
    });
  }, [localEncounter?.practitionerId]);

  const [prevPage, setPrevPage] = useState(0);
  const prevSize = 15;
  const [allPrevEncounters, setAllPrevEncounters] = useState<any[]>([]);

  const [triggerPrevious, { data: prevList, isFetching: isPrevFetching }] =
    useLazyGetPreviousEncountersSameDepartmentQuery();

  useEffect(() => {
    if (localEncounter?.encounterReason !== 'FOLLOW_UP') return;
    if (!patientId || !localEncounter?.departmentId) return;

    setPrevPage(0);
    setAllPrevEncounters([]);

    triggerPrevious({
      patientId,
      departmentId: localEncounter.departmentId,
      page: 0,
      size: prevSize,
      sort: 'id,desc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localEncounter?.encounterReason, patientId, localEncounter?.departmentId]);

  useEffect(() => {
    if (localEncounter?.encounterReason !== 'FOLLOW_UP') return;
    if (!patientId || !localEncounter?.departmentId) return;
    if (prevPage === 0) return;

    triggerPrevious({
      patientId,
      departmentId: localEncounter.departmentId,
      page: prevPage,
      size: prevSize,
      sort: 'id,desc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevPage]);

  useEffect(() => {
    const rows = prevList?.data ?? [];
    if (!rows.length) return;

    setAllPrevEncounters(previousEncounters => {
      const seenIds = new Set(previousEncounters.map((encounter: any) => encounter.id));
      const merged = [...previousEncounters];
      rows.forEach((encounter: any) => {
        if (!seenIds.has(encounter.id)) merged.push(encounter);
      });
      return merged;
    });
  }, [prevList]);

  useEffect(() => {
    setLocalEncounter((prevEncounter: any) => {
      const rawDate = prevEncounter?.encounterDate;
      if (!rawDate) return prevEncounter;
      if (rawDate instanceof Date) return prevEncounter;

      const parsedDate = new Date(rawDate);
      return Number.isNaN(parsedDate.getTime())
        ? prevEncounter
        : { ...prevEncounter, encounterDate: parsedDate };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevHasMore = Boolean(prevList?.links?.next);

  const modifiedPrevEncounters = useMemo(() => {
    return (allPrevEncounters ?? []).map((encounter: any) => ({
      ...encounter,
      combinedLabel: `${encounter.id} , ${encounter.encounterDate ?? ''} , ${
        encounter.status ?? ''
      }`
    }));
  }, [allPrevEncounters]);

  return (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        vr={validationResult}
        column
        disabled={true}
        fieldLabel="Date"
        fieldType="date"
        fieldName="encounterDate"
        record={localEncounter}
        setRecord={setLocalEncounter}
      />

      <MyInput
        required
        vr={validationResult}
        column
        fieldLabel="Encounter Type"
        fieldType="select"
        fieldName="encounterType"
        selectData={EncounterTypeEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        searchable={false}
      />

      <MyInput
        required
        vr={validationResult}
        column
        fieldType="selectPagination"
        fieldLabel="Department"
        fieldName="departmentId"
        selectData={allDepartments}
        selectDataLabel="name"
        selectDataValue="id"
        record={localEncounter}
        setRecord={setLocalEncounter}
        searchable
        disabled={isReadOnly || !selectedFacilityId || !localEncounter?.encounterType}
        loading={isDepartmentsFetching}
        hasMore={deptHasMore}
        onFetchMore={() => {
          if (deptList?.links?.next) {
            const { page } = extractPaginationFromLink(deptList.links.next);
            setDeptPage(page);
          }
        }}
      />

      <MyInput
        vr={validationResult}
        column
        fieldType="selectPagination"
        fieldLabel="Practitioner"
        fieldName="practitionerId"
        selectData={practitionersData}
        selectDataLabel={['firstName', 'lastName']}
        selectDataValue="id"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly || !localEncounter?.departmentId}
        loading={isPractitionersFetching}
        searchable
        hasMore={practHasMore}
        onFetchMore={() => {
          if (practitionersList?.links?.next) {
            const { page } = extractPaginationFromLink(practitionersList.links.next);
            setPractPage(page);
          }
        }}
      />

      <MyInput
        vr={validationResult}
        column
        fieldType="select"
        fieldLabel="Priority"
        fieldName="priorityLevel"
        selectData={EncounterPriorityEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
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
        fieldType="select"
        fieldLabel="Reason"
        fieldName="encounterReason"
        selectData={EncounterReasonEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        searchable={false}
      />

      {localEncounter?.encounterReason === 'FOLLOW_UP' && (
        <MyInput
          column
          fieldLabel="Previous Encounters"
          fieldName="followUpEncounterId"
          fieldType="selectPagination"
          selectData={modifiedPrevEncounters}
          selectDataLabel="combinedLabel"
          selectDataValue="id"
          record={localEncounter}
          setRecord={setLocalEncounter}
          menuMaxHeight={200}
          loading={isPrevFetching}
          searchable={false}
          hasMore={prevHasMore}
          disabled={isReadOnly}
          required={localEncounter?.encounterReason === 'FOLLOW_UP'}
          onFetchMore={() => {
            if (prevList?.links?.next) {
              const { page } = extractPaginationFromLink(prevList.links.next);
              setPrevPage(page);
            }
          }}
        />
      )}

      <MyInput
        vr={validationResult}
        column
        fieldType="select"
        fieldLabel="Origin Type"
        fieldName="originType"
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
        fieldLabel="Origin Name"
        fieldName="originName"
        record={localEncounter}
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
      />

      <MyInput
        column
        fieldType="textarea"
        fieldLabel="Notes"
        fieldName="notes"
        setRecord={setLocalEncounter}
        disabled={isReadOnly}
        record={localEncounter}
      />

      <div className="encounter-info-wrapper">
        <div className="encounter-info-title">Encounter Information</div>

        <div className="encounter-info-fields">
          <MyInput
            vr={validationResult}
            column
            disabled={true}
            fieldLabel="Encounter Number"
            fieldName="encounterNumber"
            record={localEncounter}
            setRecord={setLocalEncounter}
          />

          <MyInput
            vr={validationResult}
            column
            fieldLabel="Daily Sequence"
            fieldName="dailySequence"
            fieldType="number"
            record={{ dailySequence: isTodayCountFetching ? '' : todayCount }}
            disabled
          />

          <MyInput
            vr={validationResult}
            column
            disabled={true}
            fieldLabel="Sequence Number"
            fieldName="departmentDailySequenceNumber"
            record={localEncounter}
            setRecord={setLocalEncounter}
          />
        </div>
      </div>
    </Form>
  );
};

export default RegistrationEncounter;
