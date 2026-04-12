import MyModal from '@/components/MyModal/MyModal';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaComment } from 'react-icons/fa';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useAppSelector } from '@/hooks';
import { useLazyGetActiveAppointableDepartmentsQuery } from '@/services/security/departmentService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

const AddEditReferralRequest = ({
  open,
  setOpen,
  width,
  referral,
  setReferral,
  handleSave
}) => {
  const referralTypeOptions = useEnumOptions('ReferralType');
  const priorityOptions = useEnumOptions('ReferralPriority');

  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);
  const selectedDepartment = useAppSelector(state => state.auth?.selectedDepartment);

  const { data: facilityResponse } = useGetActiveFacilitiesQuery({});

  const facilityOptions =
    facilityResponse?.map(f => ({ label: f.name ?? '', value: f.id })) ?? [];

  // ─── Departments ────────────────────────────────────────────────────────────

  const deptSize = 20;
  const [deptPage, setDeptPage] = useState(0);
  const [allDepartments, setAllDepartments] = useState([]);
  const [deptHasMore, setDeptHasMore] = useState(false);
  const [deptNextLink, setDeptNextLink] = useState(null);
  const [modalSession, setModalSession] = useState(0);

  const [triggerDepartments, { isFetching: isDeptLoading }] =
    useLazyGetActiveAppointableDepartmentsQuery();

  const prevToFacilityId = useRef(undefined);

  const resetDepartmentsState = useCallback(() => {
    setDeptPage(0);
    setAllDepartments([]);
    setDeptHasMore(false);
    setDeptNextLink(null);
  }, []);

  const loadDepartments = useCallback(
    async ({ facilityId, page = 0, append = false }) => {
      if (!facilityId) return;

      try {
        const response = await triggerDepartments({
          facilityId,
          page,
          size: deptSize,
          sort: 'id,asc'
        }).unwrap();

        const rows = response?.data ?? [];
        const nextLink = response?.links?.next ?? null;

        setDeptHasMore(Boolean(nextLink));
        setDeptNextLink(nextLink);

        if (append) {
          setAllDepartments(prev => {
            const seenIds = new Set(prev.map(d => Number(d.id)));
            const merged = [...prev];

            rows.forEach(d => {
              if (!seenIds.has(Number(d.id))) {
                merged.push(d);
              }
            });

            return merged;
          });
        } else {
          setAllDepartments(rows);
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
        setAllDepartments([]);
        setDeptHasMore(false);
        setDeptNextLink(null);
      }
    },
    [triggerDepartments]
  );

  useEffect(() => {
    if (!selectedFacility?.id || !open) return;

    setReferral(prev => ({
      ...prev,
      fromFacilityId: Number(selectedFacility.id),
      fromDepartmentId: selectedDepartment?.departmentId ?? null,
      toFacilityId:
        prev?.referralType === 'INTERNAL'
          ? Number(selectedFacility.id)
          : prev?.toFacilityId ?? null
    }));
  }, [
    open,
    referral?.referralType,
    selectedFacility?.id,
    selectedDepartment?.departmentId,
    setReferral
  ]);

  useEffect(() => {
    if (open) {
      setModalSession(prev => prev + 1);
      return;
    }

    prevToFacilityId.current = undefined;
    resetDepartmentsState();

    setReferral(prev => ({
      ...prev,
      toDepartmentId: null
    }));
  }, [open, resetDepartmentsState, setReferral]);

  useEffect(() => {
    if (!open) return;

    const currentToFacilityId = referral?.toFacilityId ?? null;

    if (prevToFacilityId.current === undefined) {
      prevToFacilityId.current = currentToFacilityId;
      return;
    }

    if (prevToFacilityId.current === currentToFacilityId) return;

    prevToFacilityId.current = currentToFacilityId;

    resetDepartmentsState();

    setReferral(prev => ({
      ...prev,
      toDepartmentId: null
    }));
  }, [open, referral?.toFacilityId, resetDepartmentsState, setReferral]);

  useEffect(() => {
    if (!open || !referral?.toFacilityId) return;

    resetDepartmentsState();
    loadDepartments({
      facilityId: referral.toFacilityId,
      page: 0,
      append: false
    });
  }, [open, referral?.toFacilityId, resetDepartmentsState, loadDepartments]);

  const toDepartmentOptions = allDepartments.map(d => ({
    label: d.name ?? '',
    value: d.id
  }));

  const conjureFormContent = () => (
    <Form fluid>
      <MyInput
        width="100%"
        fieldName="referralType"
        fieldLabel="Referral Type"
        fieldType="select"
        selectData={referralTypeOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={referral}
        setRecord={setReferral}
        required
      />

      {referral?.referralType === 'INTERNAL' ? (
        <div style={{ width: '100%' }}>
          <label className="my-label">To Facility</label>
          <input
            className="rs-input rs-input-disabled"
            style={{ width: '100%' }}
            value={selectedFacility?.name || ''}
            disabled
          />
        </div>
      ) : (
        <MyInput
          width="100%"
          fieldName="toFacilityId"
          fieldLabel="To Facility"
          fieldType="select"
          selectData={facilityOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={referral}
          setRecord={setReferral}
          required
        />
      )}

      <MyInput
        key={`to-department-${modalSession}-${referral?.toFacilityId ?? 'none'}`}
        width="100%"
        fieldName="toDepartmentId"
        fieldLabel="To Department"
        fieldType="selectPagination"
        selectData={toDepartmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={referral}
        setRecord={setReferral}
        loading={isDeptLoading}
        searchable
        disabled={!referral?.toFacilityId}
        hasMore={deptHasMore}
        onFetchMore={async () => {
          if (!deptNextLink || !referral?.toFacilityId) return;

          const { page } = extractPaginationFromLink(deptNextLink);
          setDeptPage(page);

          await loadDepartments({
            facilityId: referral.toFacilityId,
            page,
            append: true
          });
        }}
        required
      />

      <MyInput
        width="100%"
        fieldName="priority"
        fieldLabel="Priority"
        fieldType="select"
        selectData={priorityOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={referral}
        setRecord={setReferral}
        required
      />

      <MyInput
        width="100%"
        fieldName="referralReason"
        fieldLabel="Referral Reason"
        fieldType="textarea"
        record={referral}
        setRecord={setReferral}
        required
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
      title={referral?.id ? 'Edit Referral Request' : 'New Referral Request'}
      position="right"
      content={    <div dir={dir}>
        {conjureFormContent()}
        </div>}
      actionButtonLabel={referral?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Referral Request Info', icon: <FaComment /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
    
  );
};

export default AddEditReferralRequest;