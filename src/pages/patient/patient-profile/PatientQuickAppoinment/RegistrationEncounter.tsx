import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useSelector } from 'react-redux';

import type { PatientEncounter } from '@/types/model-types-new';
import { newPatientEncounter } from '@/types/model-types-constructor-new';
import { getEncounterTreatmentStatus } from '@/utils/encounterStatusHelpers';

import { useEnumOptions } from '@/services/enumsApi';

import {
  useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery,
  useLazyGetDepartmentByIdQuery
} from '@/services/security/departmentService';

import { useLazyGetPractitionersByDepartmentQuery } from '@/services/setup/practitioner/PractitionerDepartmentService';

import {
  useLazyCountTodayEncountersByFacilityQuery,
  useLazyGetPreviousEncountersSameDepartmentQuery
} from '@/services/encounters/patientEncounterService';

import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import './style.less';
import clsx from 'clsx';

const RegistrationEncounter = ({
  localEncounter,
  setLocalEncounter,
  isReadOnly,
  localPatient,
  localReferral,
  openedFromReferral = false
}: {
  localEncounter: PatientEncounter;
  setLocalEncounter: (updater: any) => void;
  isReadOnly: boolean;
  localPatient: any;
  localReferral?: any;
  openedFromReferral?: boolean;
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
      facilityId:
        prevEncounter.facilityId ||
        Number(localReferral?.toFacilityId ?? selectedFacilityId ?? 0)
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, selectedFacilityId, localReferral?.toFacilityId]);

  const [triggerCountToday, { data: todayCount, isFetching: isTodayCountFetching }] =
    useLazyCountTodayEncountersByFacilityQuery();

  useEffect(() => {
    const facilityToUse = Number(localReferral?.toFacilityId ?? selectedFacilityId ?? 0);
    if (!facilityToUse) return;

    triggerCountToday({ facilityId: facilityToUse });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacilityId, localReferral?.toFacilityId]);

  const [deptPage, setDeptPage] = useState(0);
  const deptSize = 20;
  const [allDepartments, setAllDepartments] = useState<any[]>([]);

  const mergeDepartments = (rows: any[]) => {
    if (!rows?.length) return;
    setAllDepartments(previousDepartments => {
      const seenIds = new Set(previousDepartments.map((department: any) => Number(department.id)));
      const merged = [...previousDepartments];
      rows.forEach((department: any) => {
        if (!seenIds.has(Number(department.id))) merged.push(department);
      });
      return merged;
    });
  };

  const [triggerDepartments, { data: deptList, isFetching: isDepartmentsFetching }] =
    useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery();

  const [triggerGetDepartmentById, { data: referralDepartment }] = useLazyGetDepartmentByIdQuery();

  const didApplyReferralPrefillRef = useRef(false);
useEffect(() => {
  if (!openedFromReferral) return;

  const referralDepartmentId = Number(localReferral?.toDepartmentId ?? 0);
  if (!referralDepartmentId) return;

  triggerGetDepartmentById(referralDepartmentId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [openedFromReferral, localReferral?.toDepartmentId]);

  useEffect(() => {
    if (!openedFromReferral) return;
    if (!referralDepartment) return;

    const encounterTypeFromDepartment =
      referralDepartment?.encounterType ??
      null;

    setAllDepartments(prevDepartments => {
      const exists = prevDepartments.some(
        (department: any) => Number(department?.id) === Number(referralDepartment?.id)
      );
      if (exists) return prevDepartments;
      return [referralDepartment, ...prevDepartments];
    });

    setLocalEncounter((prevEncounter: PatientEncounter) => ({
      ...prevEncounter,
      facilityId:
        prevEncounter.facilityId ||
        Number(localReferral?.toFacilityId ?? selectedFacilityId ?? 0),
      encounterType: prevEncounter.encounterType || encounterTypeFromDepartment || undefined
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedFromReferral, referralDepartment, localReferral?.toFacilityId, selectedFacilityId]);
  useEffect(() => {
    if (!openedFromReferral) return;
    if (!referralDepartment?.id) return;
    if (didApplyReferralPrefillRef.current) return;
    if (!localEncounter?.encounterType) return;

    setLocalEncounter((prevEncounter: PatientEncounter) => ({
      ...prevEncounter,
      facilityId:
        prevEncounter.facilityId ||
        Number(localReferral?.toFacilityId ?? selectedFacilityId ?? 0),
      departmentId: Number(prevEncounter.departmentId || referralDepartment.id),
      practitionerId: prevEncounter.practitionerId ?? null
    }));

    didApplyReferralPrefillRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openedFromReferral,
    referralDepartment?.id,
    localEncounter?.encounterType,
    localReferral?.toFacilityId,
    selectedFacilityId
  ]);

  const prevKeysRef = useRef<{ facilityId?: number; encounterType?: string }>({});

  useEffect(() => {
    const facilityIdNum = Number(localReferral?.toFacilityId ?? selectedFacilityId ?? 0);
    if (!facilityIdNum || !localEncounter?.encounterType) return;

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
        departmentId:
          openedFromReferral && Number(localReferral?.toDepartmentId ?? 0)
            ? Number(localReferral.toDepartmentId)
            : 0,
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
    })
      .unwrap()
      .then((res: any) => mergeDepartments(res?.data ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedFacilityId,
    localReferral?.toFacilityId,
    localReferral?.toDepartmentId,
    localEncounter?.encounterType,
    openedFromReferral
  ]);

  useEffect(() => {
    const facilityIdNum = Number(localReferral?.toFacilityId ?? selectedFacilityId ?? 0);
    if (!facilityIdNum || !localEncounter?.encounterType) return;
    if (deptPage === 0) return;

    triggerDepartments({
      facilityId: facilityIdNum,
      encounterType: localEncounter.encounterType,
      page: deptPage,
      size: deptSize,
      sort: 'id,asc'
    })
      .unwrap()
      .then((res: any) => mergeDepartments(res?.data ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptPage, selectedFacilityId, localReferral?.toFacilityId, localEncounter?.encounterType]);

  const deptHasMore = Boolean(deptList?.links?.next);

  const [practPage, setPractPage] = useState(0);
  const practSize = 20;

  const [
    triggerPractitionersByDept,
    { data: practitionersList, isFetching: isPractitionersFetching }
  ] = useLazyGetPractitionersByDepartmentQuery();

  const practHasMore = Boolean(practitionersList?.links?.next);

  const prevDeptRef = useRef<number | null>(null);

  const [allPractitioners, setAllPractitioners] = useState<any[]>([]);

  const mergePractitioners = (rows: any[]) => {
    if (!rows?.length) return;
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
  };

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
      setAllPractitioners([]);
    }

    triggerPractitionersByDept({
      departmentId,
      page: 0,
      size: practSize,
      sort: 'id,asc'
    })
      .unwrap()
      .then((res: any) => mergePractitioners(res?.data ?? []))
      .catch(() => {});
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
    })
      .unwrap()
      .then((res: any) => mergePractitioners(res?.data ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practPage, localEncounter?.departmentId]);

  useEffect(() => {
    if (localEncounter?.departmentId) return;

    setPractPage(0);
    setAllPractitioners([]);
    setPrevPage(0);
    setAllPrevEncounters([]);
    prevDeptRef.current = null;

    setLocalEncounter((prevEncounter: PatientEncounter) => {
      if (!prevEncounter?.practitionerId && !prevEncounter?.followUpEncounterId) {
        return prevEncounter;
      }
      return {
        ...prevEncounter,
        practitionerId: null,
        followUpEncounterId: null
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localEncounter?.departmentId]);

  useEffect(() => {
    if (localEncounter?.encounterType) return;

    setDeptPage(0);
    setAllDepartments([]);
    setPractPage(0);
    setAllPractitioners([]);
    setPrevPage(0);
    setAllPrevEncounters([]);

    setLocalEncounter((prevEncounter: PatientEncounter) => {
      if (
        !prevEncounter?.departmentId &&
        !prevEncounter?.practitionerId &&
        !prevEncounter?.followUpEncounterId
      ) {
        return prevEncounter;
      }
      return {
        ...prevEncounter,
        departmentId: 0,
        practitionerId: null,
        followUpEncounterId: null
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localEncounter?.encounterType]);

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
  }, [prevPage, localEncounter?.encounterReason, patientId, localEncounter?.departmentId]);

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
        getEncounterTreatmentStatus(encounter)
      }`
    }));
  }, [allPrevEncounters]);

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (<div dir={dir} className={clsx('', { 'disabled-panel': localPatient?.patientStatus === 'MERGED' })}>
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
        key={EncounterTypeEnum?.length || 0}
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
        searchable={true}
        disabled={
          isReadOnly ||
          !Number(localReferral?.toFacilityId ?? selectedFacilityId ?? 0) ||
          !localEncounter?.encounterType
        }
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
        required
        column
        fieldType="selectPagination"
        fieldLabel="Practitioner"
        fieldName="practitionerId"
        selectData={allPractitioners}
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
        fieldLabel="Service"
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
       <MyInput
        column
        fieldType="textarea"
        fieldLabel="Chief Complaint"
        fieldName="chiefComplaint"
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
  </div>
  );
};

export default RegistrationEncounter;