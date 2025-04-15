import React, { useState } from 'react';
import type { ApPatient } from '@/types/model-types';
import { Form, ButtonToolbar, Button, Divider, Modal } from 'rsuite';
import MyInput from '@/components/MyInput';
import { PlusRound, Icon } from '@rsuite/icons';
import { VscGitPullRequestGoToChanges } from 'react-icons/vsc';
import {
  useSendVerificationOtpMutation,
  useVerifyVerificationOtpMutation
} from '@/services/patientService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

interface PrivacySecurityTabProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
}

const PrivacySecurityTab: React.FC<PrivacySecurityTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  const dispatch = useAppDispatch();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState({
    otp: ''
  });
  const [sendOtp, sendOtpMutation] = useSendVerificationOtpMutation();
  const [verifyOtp, verifyOtpMutation] = useVerifyVerificationOtpMutation();

  // Fetch LOV data
  const { data: securityAccessLevelLovQueryResponse } =
    useGetLovValuesByCodeQuery('SEC_ACCESS_LEVEL');

  // Effects for OTP verification
  React.useEffect(() => {
    if (sendOtpMutation.status === 'fulfilled') {
      dispatch(notify('OTP sent'));
    }
  }, [sendOtpMutation]);

  React.useEffect(() => {
    if (verifyOtpMutation.status === 'fulfilled') {
      dispatch(notify('Patient verified success'));
      setLocalPatient(verifyOtpMutation.data);
      setVerificationModalOpen(false);
    }
  }, [verifyOtpMutation]);

  return (
    <>
      <Modal open={verificationModalOpen} onClose={() => setVerificationModalOpen(false)}>
        <Modal.Header>
          <Modal.Title>Patient Verification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form fluid>
            <MyInput
              width={165}
              vr={validationResult}
              fieldLabel="Primary Mobile Number"
              fieldName="phoneNumber"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={true}
            />
            <MyInput
              width={165}
              vr={validationResult}
              fieldLabel="Code"
              fieldName="otp"
              record={verificationRequest}
              setRecord={setVerificationRequest}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => sendOtp(localPatient.key).unwrap()} appearance="subtle">
            Send Code
          </Button>
          <Divider vertical />
          <Button
            onClick={() =>
              verifyOtp({
                otp: verificationRequest.otp,
                patientId: localPatient.key
              }).unwrap()
            }
            disabled={!verificationRequest.otp}
            appearance="primary"
          >
            Verify
          </Button>
        </Modal.Footer>
      </Modal>

      <Form layout="inline" fluid>
        <ButtonToolbar style={{ zoom: 0.8 }}>
          <Button
            style={{
              backgroundColor: 'var(--primary-blue)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
            onClick={() => setVerificationModalOpen(true)}
            disabled={!localPatient.key}
          >
            <PlusRound /> Patient Verification
          </Button>
          <Button
            style={{
              backgroundColor: 'var(--primary-blue)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Icon as={VscGitPullRequestGoToChanges} /> Amendment Requests
          </Button>
        </ButtonToolbar>
        <MyInput
          vr={validationResult}
          column
          width={165}
          fieldLabel="Security Access Level"
          fieldType="select"
          fieldName="securityAccessLevelLkey"
          selectData={securityAccessLevelLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={localPatient}
          setRecord={setLocalPatient}
        />
        <MyInput
          vr={validationResult}
          column
          width={165}
          fieldLabel="Social Security Number"
          fieldName="socialSecurityNumber"
          record={localPatient}
          setRecord={setLocalPatient}
        />
        <h5 style={{ borderTop: '1px solid #e1e1e1' }}>HIPAA</h5>
        <MyInput
          vr={validationResult}
          width={165}
          fieldType="checkbox"
          fieldLabel="Notice of Privacy Practices"
          fieldName="noticeOfPrivacyPractice"
          record={localPatient}
          setRecord={setLocalPatient}
        />
        <MyInput
          vr={validationResult}
          width={165}
          fieldType="date"
          fieldLabel=" "
          fieldName="noticeOfPrivacyPracticeDate"
          record={localPatient}
          setRecord={setLocalPatient}
        />
        <br />
        <MyInput
          width={165}
          vr={validationResult}
          fieldType="checkbox"
          fieldLabel="Privacy Authorization"
          fieldName="privacyAuthorization"
          record={localPatient}
          setRecord={setLocalPatient}
        />
        <MyInput
          vr={validationResult}
          fieldType="date"
          width={165}
          fieldLabel=" "
          fieldName="privacyAuthorizationDate"
          record={localPatient}
          setRecord={setLocalPatient}
        />
      </Form>
    </>
  );
};

export default PrivacySecurityTab;
