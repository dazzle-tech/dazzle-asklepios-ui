import React, { useEffect, useState } from 'react';
import { Button, Panel } from 'rsuite';
import {
  ButtonToolbar,
  Form,
  Input
} from 'rsuite';
import { Modal, Steps, SelectPicker, DatePicker, Toggle } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { faUser, faIdCard, faPhone, faShieldHalved, faCheck } from '@fortawesome/free-solid-svg-icons';
const steps = [
  { title: 'Basic Info', icon: faUser },
  { title: 'Document', icon: faIdCard },
  { title: 'Contact', icon: faPhone },
  { title: 'Insurance', icon: faShieldHalved }
];
import MyInput from '@/components/MyInput';
import { Divider } from 'rsuite';
import './styles.less';
import { newApPatientInsurance } from '@/types/model-types-constructor';
import { ApPatientInsurance } from '@/types/model-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import {
  newApPatient,
} from '@/types/model-types-constructor';
import {
  ApPatient,
} from '@/types/model-types';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
  useSavePatientMutation
} from '@/services/patientService';
import { useNavigate } from 'react-router-dom';
import { useSavePatientInsuranceMutation } from '@/services/patientService';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import QuickPatient from '../patient-profile/quickPatient';
import { setDivContent ,setPageCode } from '@/reducers/divSlice';
const RegistrationWizard = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [currentStep, setCurrentStep] = useState(0);
  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
  const [savePatientInsurance, savePatientInsuranceMutation] = useSavePatientInsuranceMutation();
  const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const navigate = useNavigate();
  const handleClose = () => setOpen(false);
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: preferredWayOfContactLovQueryResponse } = useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({ code: 'CITY', parentValueKey: localPatient.countryLkey });
  const { data: isnuranceProviderTypeResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
  const { data: isnurancePlanTypeResponse } = useGetLovValuesByCodeQuery('INS_PLAN_TYPS');
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  const handleSave = () => {
    savePatient({ ...localPatient, incompletePatient: false, unknownPatient: false }).unwrap().then(() => {
      dispatch(notify('Patient Added Successfully'));
    });
  };
  const goToPatientProfile = () => {
    handleSave();
    setOpen(false);
    const privatePatientPath = '/patient-profile';
    navigate(privatePatientPath, { state: { patient: localPatient } });
    setLocalPatient({ ...newApPatient });
    setPatientInsurance({ ...newApPatientInsurance });
  };
  const handleSaveInsurance = async () => {
    savePatientInsurance({ ...patientInsurance, patientKey: localPatient.key }).unwrap().then(() => {
      dispatch(notify('Patient Insurance Added Successfully'));
      const privatePatientPath = '/patient-profile';
      navigate(privatePatientPath, { state: { patient: localPatient } });
      setOpen(false);
      setLocalPatient({ ...newApPatient });
      setPatientInsurance({ ...newApPatientInsurance });
    }).catch((error) => {
      setPatientInsurance({ ...patientInsurance, primaryInsurance: false })
    });


  };
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.removeItem('divElement');
        localStorage.removeItem('pageCode');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  useEffect(() => {
    return () => {
      dispatch (setPageCode(''));
          dispatch(setDivContent(null));
    };
  }, [location.pathname, dispatch]);
  const conjureFormContent = (stepNumber) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout='inline' style={{ height: '350px' }}>
            <br />
            <span style={{ color: "#a4a6b3", fontSize: "12px", fontWeight: '600' }}>Basic Information</span>
            <br />
            <br />
            <MyInput
              required
              width={235}
              column
              fieldName="firstName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              required
              width={235}
              column
              fieldName="secondName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <br />
            <MyInput
              width={235}
              column
              fieldName="thirdName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              required
              width={235}
              column
              fieldName="lastName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <br />
            <MyInput
              required
              width={235}
              column
              fieldLabel="Sex at Birth"
              fieldType="select"
              fieldName="genderLkey"
              selectData={genderLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={235}
              column
              fieldType="date"
              fieldLabel="DOB"
              fieldName="dob"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <br />
            <MyInput
              column
              required
              width={235}
              fieldName="phoneNumber"
              fieldLabel="Primary Mobile Number"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={180}
              column
              fieldLabel="Private Patient"
              fieldType="checkbox"
              fieldName="privatePatient"
              record={localPatient}
              setRecord={setLocalPatient}
            />
          </Form>
        );
      case 1:
        return (
          <Form fluid layout='inline' style={{ height: '350px' }}>
            <br />
            <span style={{ color: "#a4a6b3", fontSize: "12px", fontWeight: '600' }}>Document Information</span>
            <br />
            <br />
            <MyInput
              required
              width={235}
              column
              fieldLabel="Document Type"
              fieldType="select"
              fieldName="documentTypeLkey"
              selectData={docTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              required
              width={235}
              column
              fieldLabel="Document Country"
              fieldType="select"
              fieldName="documentCountryLkey"
              selectData={countryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={localPatient.documentTypeLkey === 'NO_DOC'}
            />
            <MyInput
              required
              width={235}
              column
              fieldLabel="Document Number"
              fieldName="documentNo"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={localPatient.documentTypeLkey === 'NO_DOC'}
            />
          </Form>
        );
      case 2:
        return (
          <Form fluid layout='inline' style={{ height: '350px' }}>
            <br />
            <span style={{ color: "#a4a6b3", fontSize: "12px", fontWeight: '600' }}>Contact Information</span>
            <br />


            <MyInput
              column
              width={235}
              fieldLabel="Secondary Mobile Number"
              fieldName="secondaryMobileNumber"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={235}
              fieldName="homePhone"
              record={localPatient}
              setRecord={setLocalPatient}
            />

            <MyInput
              column
              width={235}
              fieldName="email"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={235}
              fieldLabel="Preferred Way of Contact"
              fieldType="select"
              fieldName="preferredContactLkey"
              selectData={preferredWayOfContactLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={235}
              fieldName="emergencyContactName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={235}
              fieldName="emergencyContactPhone"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <br />
            <span style={{ color: "#a4a6b3", fontSize: "12px", fontWeight: '600' }}>Address Information</span>
            <br />
            <MyInput
              column
              width={235}
              fieldLabel="Country"
              fieldType="select"
              fieldName="countryLkey"
              selectData={countryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={235}
              fieldLabel="State/Province"
              fieldType="select"
              fieldName="stateProvinceRegionLkey"
              selectData={cityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={235}
              fieldLabel="City"
              fieldType="select"
              fieldName="cityLkey"
              selectData={cityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={235}
              fieldLabel="Postal/ZIP code"
              fieldName="postalCode"
              record={localPatient}
              setRecord={setLocalPatient}
            />
          </Form>);
      case 3:
        return (
          <Form fluid layout='inline' style={{ height: '350px' }}>
            <br />
            <span style={{ color: "#a4a6b3", fontSize: "12px", fontWeight: '600' }}>Insurance Information</span>
            <br />
            <MyInput
              width={235}
              column
              fieldLabel="Insurance Provider"
              fieldType="select"
              fieldName="insuranceProviderLkey"
              selectData={isnuranceProviderTypeResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
            />
            <MyInput
              width={235}
              column
              fieldLabel="Insurance Policy Number"
              fieldName="insurancePolicyNumber"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
            />
            <MyInput
              width={235}
              column
              fieldLabel="Insurance Plan Type"
              fieldType="select"
              fieldName="insurancePlanTypeLkey"
              selectData={isnurancePlanTypeResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
            />
            <MyInput
              width={235}
              column
              fieldLabel="Group Number"
              fieldName="groupNumber"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
            />
            <MyInput
              width={480}
              column
              fieldType="date"
              fieldLabel="Expiration Date"
              fieldName="expirationDate"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
            />
          </Form>
        );
    }
  };
  useEffect(() => {
    if (savePatientMutation && savePatientMutation.status === 'fulfilled') {
      setLocalPatient(savePatientMutation.data);
    }
  }, [savePatientMutation])
  return (
    <Panel  >
      <ButtonToolbar style={{ display: 'flex', alignItems: 'center' }} zoom={0.8}>
        <Button appearance="primary" style={{ backgroundColor: 'var(--primary-blue)', color: 'white', display: 'flex', gap: '10px', borderRadius: '15px' }} onClick={() => setOpen(true)}>
          <FontAwesomeIcon icon={faUserPlus} />
          Create New Patient
        </Button>
        <Button appearance="ghost" style={{ borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)', display: 'flex', gap: '10px', borderRadius: '15px' }} onClick={() => setQuickPatientModalOpen(true)}>
          <FontAwesomeIcon icon={faBolt} /> Quick Patient
        </Button>
      </ButtonToolbar>
      <Modal open={open} onClose={handleClose} size="450px" >
        <Modal.Header>
          <Modal.Title>Create New Patient</Modal.Title>
        </Modal.Header>
        <Divider />
        <Modal.Body>
          <Steps current={currentStep} style={{ width: '400px' }}>
            {steps.map((step, index) => (
              <Steps.Item
                style={{ paddingLeft: 0 }}
                key={index}
                icon={<></>}
                title={<div style={{ textAlign: 'center' }}>
                  <FontAwesomeIcon
                    icon={currentStep > index ? faCheck : step.icon}
                    style={{ color: currentStep > index ? 'green' : currentStep === index ? 'blue' : 'gray' }}
                  />
                  <div style={{ fontSize: '10px' }}>{step.title}</div>
                </div>}
              />
            ))}
          </Steps>
          {conjureFormContent(currentStep)}
        </Modal.Body>
        <Modal.Footer>
          <Divider />
          {currentStep > 0 ? <Button onClick={handlePrev} appearance="subtle" disabled={currentStep === 0} style={{ color: 'var(--primary-blue)' }}>
            Back
          </Button> : <></>}
          {currentStep < 2 ? <Button appearance="subtle" style={{ color: 'var(--primary-blue)' }} onClick={handleSave}>
            Save
          </Button> : <></>}
          {currentStep === 2 ? <Button onClick={goToPatientProfile} appearance="subtle" style={{ color: 'var(--primary-blue)' }}>

            Skip & Create
          </Button> : <></>}
          {currentStep < 3 ? <Button onClick={handleNext} appearance="primary" style={{ backgroundColor: 'var(--primary-blue)', color: 'white' }}>
            Next
          </Button> : <></>}
          {currentStep === 3 ? <Button onClick={handleSaveInsurance} appearance="primary" style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "3px" }}>
            <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: '5px', color: 'white' }} />
            Create
          </Button> : <></>}
        </Modal.Footer>
      </Modal>
      <QuickPatient
                open={quickPatientModalOpen}
                onClose={() => setQuickPatientModalOpen(false)}
              />
    </Panel>

  );
};

export default RegistrationWizard;
