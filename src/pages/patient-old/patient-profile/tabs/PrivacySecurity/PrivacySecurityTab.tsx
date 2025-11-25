import React, { useState } from 'react';
import type { ApPatient } from '@/types/model-types';
import { Form, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { PlusRound } from '@rsuite/icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyButton from '@/components/MyButton/MyButton';
interface PrivacySecurityTabProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
}
import '../styles.less'
import AddVerification from './AddVerification';
const PrivacySecurityTab: React.FC<PrivacySecurityTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  // Fetch LOV data for various fields
  const { data: securityAccessLevelLovQueryResponse } = useGetLovValuesByCodeQuery('SEC_ACCESS_LEVEL');

  return (
    <div className="tab-main-container">
    
        <AddVerification open={verificationModalOpen} setOpen={setVerificationModalOpen} localPatient={localPatient} setLocalPatient={setLocalPatient} validationResult={validationResult} />
        <Form layout="inline" className='btn-fileds-style'>
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
          disabled={!localPatient.key}
          prefixIcon={() => <PlusRound />}>
          Patient Verification
        </MyButton>
      </Form>
      
      <Form layout="inline" fluid>
        <h5 className='border-top'>HIPAA</h5>
        <div className='covg-content'>
          <MyInput
            column
            vr={validationResult}
            fieldType="checkbox"
            fieldLabel="Notice of Privacy Practices"
            fieldName="noticeOfPrivacyPractice"
            record={localPatient}
            setRecord={setLocalPatient}
          />
          <MyInput
            column
            vr={validationResult}
            fieldType="date"
            showLabel={false}
            fieldName="noticeOfPrivacyPracticeDate"
            record={localPatient}
            setRecord={setLocalPatient}
          />
          <Divider className='divider-line-vertical' vertical />
          <MyInput
            vr={validationResult}
            column
            fieldType="checkbox"
            fieldLabel="Privacy Authorization"
            fieldName="privacyAuthorization"
            record={localPatient}
            setRecord={setLocalPatient}
          />
          <MyInput
            vr={validationResult}
            column
            fieldType="date"
            showLabel={false}
            fieldName="privacyAuthorizationDate"
            record={localPatient}
            setRecord={setLocalPatient}
          />
        </div>
      </Form>
    </div>
  );
};

export default PrivacySecurityTab;
