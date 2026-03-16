import React, { useEffect } from 'react';
import { Form } from 'rsuite';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { useSavePatientPreferredHealthProfessionalMutation } from '@/services/patientService';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import { newApPatientPreferredHealthProfessional } from '@/types/model-types-constructor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { newPractitioner } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';

const AddPrefferdHealthProfessionalModal = ({
  open,
  setOpen,
  patient,
  patientHP,
  setPatientHP,
  practitioner,
  setPractitioner,
  refetch
}) => {
  const [savePatientPH] = useSavePatientPreferredHealthProfessionalMutation();
  const dispatch = useAppDispatch();

  // Fetch enum data for various fields
  const specility = useEnumOptions('Specialty');
  // Fetch Practitioner list
  const { data: practitionerListResponse } = useGetAllPractitionersQuery({});
  // Fetch and map the practitioner list for select input
  const practitionerList = (practitionerListResponse?.data ?? []).map(item => ({
    value: String(item.id),
    label: item.firstName + ' ' + item.lastName,
    practitioner: item
  }));
  // handle Clear Modal
  const handleClearModal = () => {
    setPatientHP({ ...newApPatientPreferredHealthProfessional });
    setPractitioner({ ...newPractitioner });
    setOpen(false);
  };
  // handle Save PH Patient
  const handleSave = () => {
    savePatientPH({ ...patientHP, patientKey: patient?.key })
      .unwrap()
      .then(() => {
        if (patientHP.key === undefined) {
          dispatch(
            notify({ msg: 'Preferred Health Professional Added Successfully', sev: 'success' })
          );
        } else {
          dispatch(
            notify({ msg: 'Preferred Health Professional Updated Successfully', sev: 'success' })
          );
        }
        refetch();
        handleClearModal();
      })
      .catch(error => {
        console.error('Error saving Preferred Health Professional:', error);
      });
  };

  useEffect(() => {
    const selectedPractitioner = practitionerListResponse?.data?.find(
      item => item.id === Number(patientHP.practitionerKey)
    );
    setPractitioner(selectedPractitioner ? selectedPractitioner : {});
  }, [patientHP]);
  

  //MyModal content
  const content = () => (
    <Form layout="inline" className="ph-main-container" fluid>
      <MyInput
        column
        fieldLabel="HP Name"
        fieldType="select"
        fieldName="practitionerKey"
        selectData={practitionerList}
        selectDataLabel="label"
        selectDataValue="value"
        record={patientHP}
        setRecord={setPatientHP}
      />
      <MyInput
        column
        disabled
        fieldLabel="Specialty"
        fieldType="select"
        fieldName="specialty"
        selectData={specility ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={practitioner}
        setRecord={setPractitioner}
      />
      <MyInput
        column
        fieldLabel="Network Affiliation"
        fieldType="text"
        fieldName="networkAffiliation"
        record={patientHP}
        setRecord={setPatientHP}
      />
      <MyInput
        column
        fieldLabel="Email"
        fieldType="text"
        fieldName="email"
        record={practitioner}
        setRecord={setPractitioner}
        disabled
      />
      <MyInput
        column
        fieldLabel="Telephone No."
        fieldType="text"
        fieldName="phoneNumber"
        record={practitioner}
        setRecord={setPractitioner}
        disabled
      />
      <MyInput
        column
        fieldLabel="Related with"
        fieldType="text"
        fieldName="relatedWith"
        record={patientHP}
        setRecord={setPatientHP}
      />
    </Form>
  );
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New/Edit Patient Preferred Health Professional"
      actionButtonLabel="Save"
      bodyheight="65vh"
      actionButtonFunction={handleSave}
      steps={[
        { title: 'Preferred Health Professional', icon: <FontAwesomeIcon icon={faHospitalUser} /> }
      ]}
      size="35vw"
      content={content}
    />
  );
};
export default AddPrefferdHealthProfessionalModal;
