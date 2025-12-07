import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { notify } from '@/utils/uiReducerActions';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetPractitionersByFacilityQuery } from '@/services/setup/practitioner/PractitionerService';
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

type AddPrefferdHealthProfessionalModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  patient: any;
  patientHP: any;
  setPatientHP: (val: any) => void;
  practitioner: any;
  setPractitioner: (val: any) => void;
  refetch?: () => void;
  editable?: boolean;
};

const AddPrefferdHealthProfessionalModal: React.FC<AddPrefferdHealthProfessionalModalProps> = ({
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

  const [practitionerPage, setPractitionerPage] = useState(0);
  const [practitionerList, setPractitionerList] = useState<any[]>([]);

  const {
    data: practitionersResponse,
    isFetching: loadingPractitioners,
    refetch: refetchPractitioners
  } = useGetPractitionersByFacilityQuery(
    {
      facilityId: hpRecord?.facilityId,
      page: practitionerPage,
      size: 10
    },
    {
      skip: !hpRecord?.facilityId,
      refetchOnMountOrArgChange: true
    }
  );

  useEffect(() => {
    if (open) {
      setPractitionerPage(0);
      setPractitionerList([]);

      if (hpRecord?.facilityId && refetchPractitioners) {
        refetchPractitioners();
      }
    }
  }, [open]);

  useEffect(() => {
    if (practitionersResponse?.data) {
      setPractitionerList(prev =>
        practitionerPage === 0
          ? practitionersResponse.data
          : [...prev, ...practitionersResponse.data]
      );
    }
  }, [practitionersResponse, practitionerPage]);

  useEffect(() => {
    if (hpRecord?.practitionerId && practitionerList.length > 0) {
      const matchingPractitioner = practitionerList.find(p => p.id === hpRecord.practitionerId);

      if (matchingPractitioner) {
        setPractitioner(matchingPractitioner);
      }
    }
  }, [hpRecord?.facilityId, practitionerList, hpRecord?.practitionerId]);

  const [createPreferredHP] = useCreatePatientPreferredHealthProfessionalMutation();
  const [updatePreferredHP] = useUpdatePatientPreferredHealthProfessionalMutation();

  const handleSaveAddPrefferdHealthProfessional = async () => {
    try {
      if (!patient?.id) {
        dispatch(notify({ msg: 'No patient selected', sev: 'error' }));
        return;
      }

      if (!hpRecord.facilityId || !hpRecord.practitionerId) {
        dispatch(notify({ msg: 'Facility and HP Name are required', sev: 'error' }));
        return;
      }

      const body = {
        ...hpRecord
      };

      if (hpRecord.id) {
        await updatePreferredHP({
          id: hpRecord.id,
          patientId: patient.id,
          body
        }).unwrap();

        dispatch(
          notify({
            msg: 'Preferred Health Professional updated',
            sev: 'success'
          })
        );
      } else {
        await createPreferredHP({
          patientId: patient.id,
          body
        }).unwrap();

        dispatch(
          notify({
            msg: 'Preferred Health Professional added',
            sev: 'success'
          })
        );
      }

      setOpen(false);
      if (refetch) refetch();
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || 'Failed to save Preferred Health Professional',
          sev: 'error'
        })
      );
    }
  };

  const content = () => (
    <Form layout="inline" className="ph-main-container" fluid>
      <MyInput
        column
        required
        fieldLabel="HP Organization"
        fieldType="select"
        fieldName="facilityId"
        selectData={facilityListResponse ?? []}
        selectDataLabel="name"
        selectDataValue="id"
        record={hpRecord}
        setRecord={updatedHP => {
          const facilityId = updatedHP.facilityId ?? null;

          setPractitionerPage(0);
          setPractitionerList([]);

          setPatientHP({
            ...updatedHP,
            facilityId,
            practitionerId: 0
          });

          setPractitioner({ ...newPractitioner });
        }}
      />

      <MyInput
        column
        required
        fieldLabel="HP Name"
        fieldType="selectPagination"
        fieldName="practitionerId"
        selectData={practitionersResponse?.data ?? []}
        selectDataLabel={['firstName', 'lastName']}
        selectDataValue="id"
        record={hpRecord}
        setRecord={updatedHP => {
          const selected = practitionersResponse?.data?.find(
            p => p.id === updatedHP.practitionerId
          );

          setPatientHP({
            ...updatedHP,
            practitionerId: updatedHP.practitionerId
          });

          setPractitioner(selected ? selected : { ...newPractitioner });
        }}
        searchable
        loading={loadingPractitioners}
        hasMore={practitionersResponse?.links?.next ? true : false}
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

  return (
    <MyModal
      open={open}
      setOpen={isOpen => {
        setOpen(isOpen);
        if (!isOpen) {
          setPractitionerPage(0);
          setPractitionerList([]);
        }
      }}
      title={
        editable
          ? 'Edit Patient Preferred Health Professional'
          : 'New Patient Preferred Health Professional'
      }
      actionButtonLabel={editable ? 'Update' : 'Save'}
      bodyheight="65vh"
      actionButtonFunction={handleSaveAddPrefferdHealthProfessional}
      steps={[
        {
          title: 'Preferred Health Professional',
          icon: <FontAwesomeIcon icon={faHospitalUser} />
        }
      ]}
      size="35vw"
      content={content}
    />
  );
};

export default AddPrefferdHealthProfessionalModal;
