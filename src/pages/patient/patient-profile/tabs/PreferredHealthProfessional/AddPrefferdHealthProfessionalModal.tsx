import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { notify } from '@/utils/uiReducerActions';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAllActivePractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import {
  newPractitioner,
  newPatientPreferredHealthProfessional
} from '@/types/model-types-constructor-new';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCreatePatientPreferredHealthProfessionalMutation,
  useUpdatePatientPreferredHealthProfessionalMutation
} from '@/services/patients/PatientPreferredHealthProfessional';

const toHumanBackendError = (err: any): string => {
  const data = err?.data ?? {};

  const rawKey = data?.errorKey ?? data?.message ?? data?.key ?? '';
  const errorKey = typeof rawKey === 'string' ? rawKey.replace(/^error\./, '') : '';

  const title = data?.title || '';
  const detail = data?.detail || '';
  const message = data?.message || '';

  const traceId =
    data?.traceId || data?.correlationId
      ? `\nTrace ID: ${data?.traceId || data?.correlationId}`
      : '';

  if (errorKey === 'unique.patient_practitioner')
    return 'A practitioner is already preferred.' + traceId;

  return detail || title || message || 'Failed to save Primary Care Provider.' + traceId;
};

const AddPrefferdHealthProfessionalModal = ({
  open,
  setOpen,
  patient,
  patientHP,
  setPatientHP,
  practitioner,
  setPractitioner,
  refetch,
  editable = false
}) => {
  const dispatch = useAppDispatch();

  const hpRecord = patientHP ?? { ...newPatientPreferredHealthProfessional };
  const practitionerRecord = practitioner ?? { ...newPractitioner };

  const specility = useEnumOptions('Specialty');
  const { data: facilityListResponse = [] } = useGetAllFacilitiesQuery({});

  // Pagination , search , cache , refresh
  const [practitionerPage, setPractitionerPage] = useState(0);
  const [practitionerSearch, setPractitionerSearch] = useState('');
  const [practitionerCache, setPractitionerCache] = useState<any[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  const { data: practitionersResponse, isFetching: loadingPractitioners } =
    useGetAllActivePractitionersQuery(
      {
        facilityId: hpRecord?.facilityId,
        page: practitionerPage,
        size: 5,
        search: practitionerSearch || undefined,
        refreshToken
      },
      {
        skip: !hpRecord?.facilityId
      }
    );

  // Reset pagination when modal opens
  useEffect(() => {
    if (open) {
      setPractitionerPage(0);
      setPractitionerCache([]);
      setPractitionerSearch('');
      setRefreshToken(prev => prev + 1);
    }
  }, [open]);

  // Cache management
  useEffect(() => {
    if (!practitionersResponse?.data) return;

    setPractitionerCache(prev =>
      practitionerPage === 0 ? practitionersResponse.data : [...prev, ...practitionersResponse.data]
    );
  }, [practitionersResponse, practitionerPage]);

  // Auto-select practitioner when editing
  useEffect(() => {
    if (hpRecord?.practitionerId && practitionerCache.length > 0) {
      const match = practitionerCache.find(p => p.id === hpRecord.practitionerId);
      if (match) setPractitioner(match);
    }
  }, [practitionerCache, hpRecord?.practitionerId]);

  const [createPreferredHP] = useCreatePatientPreferredHealthProfessionalMutation();
  const [updatePreferredHP] = useUpdatePatientPreferredHealthProfessionalMutation();

  const handleSave = async () => {
    try {
      if (!patient?.id) {
        dispatch(notify({ msg: 'No patient selected', sev: 'warning' }));
        return;
      }

      // if (!hpRecord.facilityId || !hpRecord.practitionerId) {
      //   dispatch(notify({ msg: 'CP Organization and CP Name are required', sev: 'warning' }));
      //   return;
      // }

      if (!hpRecord.facilityId) {
        dispatch(notify({ msg: 'CP Organization is required', sev: 'warning' }));
        return;
      }

      if (!hpRecord.practitionerId) {
        dispatch(notify({ msg: 'CP Name is required', sev: 'warning' }));
        return;
      }

      const body = { ...hpRecord };

      if (hpRecord.id) {
        await updatePreferredHP({
          id: hpRecord.id,
          patientId: patient.id,
          body
        }).unwrap();

        dispatch(notify({ msg: 'Primary Care Provider updated', sev: 'success' }));
      } else {
        await createPreferredHP({
          patientId: patient.id,
          body
        }).unwrap();

        dispatch(notify({ msg: 'Primary Care Provider added', sev: 'success' }));
      }

      setOpen(false);
      if (refetch) refetch();
    } catch (err: any) {
      dispatch(
        notify({
          msg: toHumanBackendError(err),
          sev: 'warning'
        })
      );
    }
  };

  const content = () => (
    <Form layout="inline" className="ph-main-container" fluid>
      <MyInput
        column
        required
        fieldLabel="CP Organization"
        fieldType="select"
        fieldName="facilityId"
        selectData={facilityListResponse ?? []}
        selectDataLabel="name"
        selectDataValue="id"
        record={hpRecord}
        setRecord={updatedHP => {
          const facilityId = updatedHP.facilityId ?? null;

          setPatientHP({
            ...updatedHP,
            facilityId,
            practitionerId: null
          });

          // Reset practitioner data
          setPractitioner({ ...newPractitioner });
          setPractitionerPage(0);
          setPractitionerCache([]);
          setPractitionerSearch('');
          setRefreshToken(prev => prev + 1);
        }}
      />

      <MyInput
        column
        required
        fieldLabel="CP Name"
        fieldType="selectPagination"
        fieldName="practitionerId"
        selectData={practitionerCache}
        selectDataLabel={['firstName', 'lastName']}
        selectDataValue="id"
        record={hpRecord}
        setRecord={updatedHP => {
          const selected = practitionerCache.find(p => p.id === updatedHP.practitionerId);

          setPatientHP({
            ...updatedHP,
            practitionerId: updatedHP.practitionerId
          });

          setPractitioner(selected ? selected : { ...newPractitioner });
        }}
        searchable
        searchKeyWard={practitionerSearch}
        setSearchKeyWard={setPractitionerSearch}
        loading={loadingPractitioners}
        hasMore={!!practitionersResponse?.links?.next}
        onFetchMore={() => {
          if (practitionersResponse?.links?.next) {
            const { page } = extractPaginationFromLink(practitionersResponse.links.next);
            setPractitionerPage(page);
          }
        }}
      />

      <MyInput
        disabled
        column
        fieldLabel="Speciality"
        fieldName="specialty"
        fieldType="select"
        selectData={specility}
        selectDataLabel="label"
        selectDataValue="value"
        record={practitionerRecord}
        setRecord={setPractitioner}
      />

      <MyInput
        column
        fieldLabel="Network Affiliation"
        fieldType="text"
        fieldName="networkAffiliation"
        record={hpRecord}
        setRecord={setPatientHP}
      />

      <MyInput
        column
        disabled
        fieldLabel="Email"
        fieldType="text"
        fieldName="email"
        record={practitionerRecord}
        setRecord={setPractitioner}
      />

      <MyInput
        column
        disabled
        fieldLabel="Telephone No."
        fieldType="text"
        fieldName="phoneNumber"
        record={practitionerRecord}
        setRecord={setPractitioner}
      />

      <MyInput
        column
        fieldLabel="Related with"
        fieldType="text"
        fieldName="relatedWith"
        record={hpRecord}
        setRecord={setPatientHP}
      />
    </Form>
  );

  useEffect(() => {
    if (!open || !editable) return;

    const derivedFacilityId =
      practitionerRecord?.facilityId ??
      practitionerRecord?.facility?.id ??
      practitionerRecord?.facility?.value;

    if (!hpRecord?.facilityId && derivedFacilityId) {
      setPatientHP((prev: any) => ({
        ...(prev ?? { ...newPatientPreferredHealthProfessional }),
        facilityId: derivedFacilityId
      }));
    }
  }, [open, editable, practitionerRecord]);

  return (
    <MyModal
      open={open}
      setOpen={isOpen => {
        setOpen(isOpen);
        if (!isOpen) {
          setPractitionerPage(0);
          setPractitionerCache([]);
        }
      }}
      title={editable ? 'Edit Patient Primary Care Provider' : 'New Patient Primary Care Provider'}
      actionButtonLabel={editable ? 'Update' : 'Save'}
      bodyheight="65vh"
      actionButtonFunction={handleSave}
      steps={[
        {
          title: 'Primary Care Provider',
          icon: <FontAwesomeIcon icon={faHospitalUser} />
        }
      ]}
      size="35vw"
      content={content}
    />
  );
};

export default AddPrefferdHealthProfessionalModal;
