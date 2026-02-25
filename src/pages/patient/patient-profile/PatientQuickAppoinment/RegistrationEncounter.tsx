import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useSelector } from 'react-redux';

import type { PatientEncounter } from '@/types/model-types-new';
import { newPatientEncounter } from '@/types/model-types-constructor-new';

import { useEnumOptions } from '@/services/enumsApi';

import {
  useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery
} from '@/services/security/departmentService';

import {
  useLazyGetPractitionersByDepartmentQuery
} from '@/services/setup/practitioner/PractitionerDepartmentService';

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

  // =========================
  // Init localEncounter defaults
  // =========================
  useEffect(() => {
    if (!localEncounter) {
      setLocalEncounter({ ...newPatientEncounter });
      return;
    }

    setLocalEncounter((prev: PatientEncounter) => ({
      ...prev,
      patientId: prev.patientId || patientId,
      facilityId: prev.facilityId || Number(selectedFacilityId ?? 0)
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, selectedFacilityId]);

  // =========================
  // Count Today Encounters (Facility) => Daily Sequence
  // =========================
  const [triggerCountToday, { data: todayCount, isFetching: isTodayCountFetching }] =
    useLazyCountTodayEncountersByFacilityQuery();

  useEffect(() => {
    if (!selectedFacilityId) return;
    triggerCountToday({ facilityId: Number(selectedFacilityId) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacilityId]);

  const dailySequenceNumber = (todayCount ?? 0) + 1;
  console.log("triggerCountToday=====>", todayCount);

  // =========================
  // Departments: Pagination (merge pages)
  // =========================
const [deptPage, setDeptPage] = useState(0);
const deptSize = 20;
const [allDepartments, setAllDepartments] = useState<any[]>([]);

const [
  triggerDepartments,
  { data: deptList, isFetching: isDepartmentsFetching }
] = useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery();

const prevKeysRef = useRef<{ facilityId?: number; encounterType?: string }>({});

 useEffect(() => {
  if (!selectedFacilityId || !localEncounter?.encounterType) return;

  const facilityIdNum = Number(selectedFacilityId);
  const prev = prevKeysRef.current;

  const firstRun = prev.facilityId == null && prev.encounterType == null;
  const facilityChanged = !firstRun && prev.facilityId !== facilityIdNum;
  const typeChanged = !firstRun && prev.encounterType !== localEncounter.encounterType;

  prevKeysRef.current = { facilityId: facilityIdNum, encounterType: localEncounter.encounterType };

  if (facilityChanged || typeChanged) {
    setDeptPage(0);
    setAllDepartments([]);

    setLocalEncounter((p: PatientEncounter) => ({
      ...p,
      facilityId: facilityIdNum,
      departmentId: 0,
      practitionerId: null,
      followUpEncounterId: null
    }));
  } else {
    setLocalEncounter((p: PatientEncounter) => ({
      ...p,
      facilityId: p.facilityId || facilityIdNum
    }));
  }

  triggerDepartments({
    facilityId: facilityIdNum,
    encounterType: localEncounter.encounterType,
    page: 0,
    size: deptSize,
    sort: 'id,asc'
  });
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

  setAllDepartments(prev => {
    const seen = new Set(prev.map((x: any) => Number(x.id)));
    const merged = [...prev];
    rows.forEach((x: any) => {
      if (!seen.has(Number(x.id))) merged.push(x);
    });
    return merged;
  });
}, [deptList]);


  const deptHasMore = Boolean(deptList?.links?.next);

  // =========================
  // Practitioners by Department: Pagination
  // =========================
  const [practPage, setPractPage] = useState(0);
const practSize = 20;

const [
  triggerPractitionersByDept,
  { data: practitionersList, isFetching: isPractitionersFetching }
] = useLazyGetPractitionersByDepartmentQuery();

const practitionersData = practitionersList?.data ?? [];
const practHasMore = Boolean(practitionersList?.links?.next);

// بدل ما تصفري practitionerId على Back، صفريها فقط إذا تغير departmentId فعلاً
const prevDeptRef = useRef<number | null>(null);

useEffect(() => {
  const depId = Number(localEncounter?.departmentId ?? 0);
  if (!depId) return;

  const first = prevDeptRef.current == null;
  const changed = !first && prevDeptRef.current !== depId;
  prevDeptRef.current = depId;

  setPractPage(0);

  if (changed) {
    setLocalEncounter((p: PatientEncounter) => ({
      ...p,
      practitionerId: null,
      followUpEncounterId: null
    }));
  }

  triggerPractitionersByDept({
    departmentId: depId,
    page: 0,
    size: practSize,
    sort: 'id,asc'
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [localEncounter?.departmentId]);

useEffect(() => {
  const depId = Number(localEncounter?.departmentId ?? 0);
  if (!depId) return;
  if (practPage === 0) return;

  triggerPractitionersByDept({
    departmentId: depId,
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

  setAllPractitioners(prev => {
    const seen = new Set(prev.map((x: any) => Number(x.id)));
    const merged = [...prev];
    rows.forEach((x: any) => {
      if (!seen.has(Number(x.id))) merged.push(x);
    });
    return merged;
  });
}, [practitionersData]);

useEffect(() => {
  const pid = Number(localEncounter?.practitionerId ?? 0);
  if (!pid) return;

  setAllPractitioners(prev => {
    const exists = prev.some((x: any) => Number(x?.id) === pid);
    if (exists) return prev;

    const injected = {
      id: pid,
      firstName: (localEncounter as any)?.practitionerFirstName ?? '',
      lastName: (localEncounter as any)?.practitionerLastName ?? `#${pid}`
    };
    return [injected, ...prev];
  });
}, [localEncounter?.practitionerId]);



  // =========================
  // Previous Encounters (Follow-up): Pagination (merge pages)
  // =========================
  const [prevPage, setPrevPage] = useState(0);
  const prevSize = 15;
  const [allPrevEncounters, setAllPrevEncounters] = useState<any[]>([]);

  const [
    triggerPrevious,
    { data: prevList, isFetching: isPrevFetching }
  ] = useLazyGetPreviousEncountersSameDepartmentQuery();

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
  console.log("triggerPrevious======>", allPrevEncounters);
  console.log("triggerPrevious======>", allPrevEncounters);
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

    setAllPrevEncounters(prev => {
      const seen = new Set(prev.map((x: any) => x.id));
      const merged = [...prev];
      rows.forEach((x: any) => {
        if (!seen.has(x.id)) merged.push(x);
      });
      return merged;
    });
  }, [prevList]);

useEffect(() => {
  setLocalEncounter((prev: any) => {
    const raw = prev?.encounterDate;
    if (!raw) return prev; 

    if (raw instanceof Date) return prev;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? prev : { ...prev, encounterDate: parsed };
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
  useEffect(() => {
  if (!selectedFacilityId || !localEncounter?.encounterType) return;

  const facilityIdNum = Number(selectedFacilityId);
  const prev = prevKeysRef.current;

  const facilityChanged = prev.facilityId != null && prev.facilityId !== facilityIdNum;
  const typeChanged = prev.encounterType != null && prev.encounterType !== localEncounter.encounterType;

  prevKeysRef.current = { facilityId: facilityIdNum, encounterType: localEncounter.encounterType };

  if (facilityChanged || typeChanged) {
    setDeptPage(0);
    setAllDepartments([]);

    setLocalEncounter((p: PatientEncounter) => ({
      ...p,
      facilityId: facilityIdNum,
      departmentId: 0,
      practitionerId: null,
      followUpEncounterId: null
    }));
  } else {
    setLocalEncounter((p: PatientEncounter) => ({
      ...p,
      facilityId: p.facilityId || facilityIdNum
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
  const prevHasMore = Boolean(prevList?.links?.next);

  const modifiedPrevEncounters = useMemo(() => {
    return (allPrevEncounters ?? []).map((enc: any) => ({
      ...enc,
      combinedLabel: `${enc.id} , ${enc.encounterDate ?? ''} , ${enc.status ?? ''}`
    }));
  }, [allPrevEncounters]);

  // =========================
  // Render
  // =========================
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