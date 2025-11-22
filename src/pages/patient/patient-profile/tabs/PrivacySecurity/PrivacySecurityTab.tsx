import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient, PatientHIPAA } from '@/types/model-types-new';
import { PlusRound, CheckRound } from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
import { Divider, Form, Loader, Message, useToaster } from 'rsuite';
import '../styles.less';
import AddVerification from './AddVerification';
import {
  useGetPatientHIPAAQuery,
  useCreatePatientHIPAAMutation,
  useUpdatePatientHIPAAMutation
} from '@/services/patients/hipaaService';
import { newPatientHIPAA } from '@/types/model-types-constructor-new';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

interface PrivacySecurityTabProps {
  localPatient: Patient;
  setLocalPatient: (patient: Patient) => void;
  validationResult: any;
}

const PrivacySecurityTab: React.FC<PrivacySecurityTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  const dispatch=useAppDispatch();
  const toaster = useToaster();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [hippa,setHippa]=useState({...newPatientHIPAA});
  // ========== LOV ==========
  const { data: securityAccessLevelLovQueryResponse } =
    useGetLovValuesByCodeQuery('SEC_ACCESS_LEVEL');

  // ========== HIPAA API ==========
 const {
  data: hipaaData,
  error: hipaaError,
  isError: isHipaaError,
  isFetching: hipaaLoading
} = useGetPatientHIPAAQuery(
  { patientId: localPatient.id! },
  { skip: !localPatient.id }
);

 console.log(hipaaData)
  
  const [createHIPAA, { isLoading: creating }] = useCreatePatientHIPAAMutation();
  const [updateHIPAA, { isLoading: updating }] = useUpdatePatientHIPAAMutation();

useEffect(() => {
  
  if (!localPatient.id) {
    setHippa({ ...newPatientHIPAA });
    return;
  }

 if (isHipaaError && (hipaaError as any)?.status === 404) {
  setHippa({ ...newPatientHIPAA });
  return;
}


 
  if (hipaaData) {
    setHippa(hipaaData);
    return;
  }

  
  if (hipaaLoading) {
    return;
  }

 
  setHippa({ ...newPatientHIPAA });

}, [localPatient.id, hipaaData, hipaaError, hipaaLoading]);


  // ========== Save HIPAA ==========
 const handleSaveHIPAA = async () => {
  console.log("iam in save");

  if (!localPatient.id) {
    toaster.push(
      <Message type="warning" showIcon>
        Please save the patient first.
      </Message>,
      { duration: 3000 }
    );
    return;
  }

  const payload: PatientHIPAA = {
    ...hippa,
    patientId: localPatient.id
  };

  try {
    if (hipaaData) {
      await updateHIPAA({ patientId: localPatient.id, body: payload }).unwrap();
    } else {
      await createHIPAA({ body: payload }).unwrap();
    }
   dispatch(notify({msg:"HIPAA saved successfully",sev:"success"}))
  
  } catch (err) {
    console.log(err);
    dispatch(notify({msg:err,sev:"error"}))
    
  }
};


  return (
    <div className="tab-main-container">
      <AddVerification
        open={verificationModalOpen}
        setOpen={setVerificationModalOpen}
        localPatient={localPatient}
        setLocalPatient={setLocalPatient}
        validationResult={validationResult}
      />

      {/* Security Access Level */}
      <Form layout="inline" className="btn-fileds-style">
        <MyInput
          vr={validationResult}
          column
          fieldLabel="Security Access Level"
          fieldType="select"
          fieldName="securityAccessLevelLkey"
          selectData={securityAccessLevelLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={localPatient}
          setRecord={setLocalPatient}
        />

        <MyButton
          onClick={() => setVerificationModalOpen(true)}
          disabled={!localPatient.id}
          prefixIcon={() => <PlusRound />}
        >
          Patient Verification
        </MyButton>
      </Form>

      {/* HIPAA */}
      <Form layout="inline" fluid>
        <h5 className="border-top">HIPAA</h5>

        {hipaaLoading && (
       
            <div className="loader">
                              <Loader content=" Loading HIPAA data..." />
                          </div>
        )}

        <div className="covg-content">
          <MyInput
            column
            vr={validationResult}
            fieldType="checkbox"
            fieldLabel="Notice of Privacy Practices"
            fieldName="noticeOfPrivacyPractice"
            record={hippa}
            setRecord={setHippa}
          />
          <MyInput
            column
            vr={validationResult}
            fieldType="date"
            showLabel={false}
            fieldName="noticeOfPrivacyPracticeDate"
            record={hippa}
            setRecord={setHippa}
          />

          <Divider className="divider-line-vertical" vertical />

          <MyInput
            column
            vr={validationResult}
            fieldType="checkbox"
            fieldLabel="Privacy Authorization"
            fieldName="privacyAuthorization"
            record={hippa}
            setRecord={setHippa}
          />
          <MyInput
            column
            vr={validationResult}
            fieldType="date"
            showLabel={false}
            fieldName="privacyAuthorizationDate"
           record={hippa}
            setRecord={setHippa}
          />

          {/* ======== SAVE HIPAA BUTTON ======== */}
          <MyButton
            className="ml-3"
            appearance="primary"
            loading={creating || updating}
            prefixIcon={() => <CheckRound />}
            onClick={handleSaveHIPAA}
          >
            Save HIPAA
          </MyButton>
        </div>
      </Form>
    </div>
  );
};

export default PrivacySecurityTab;
