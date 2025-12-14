import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useSendVerificationOtpMutation, useVerifyVerificationOtpMutation } from '@/services/patientService';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import '../styles.less'
import MyButton from '@/components/MyButton/MyButton';
const AddVerification = ({ localPatient, setLocalPatient, validationResult, open,setOpen}) => {
  const dispatch = useAppDispatch();;
  const [verificationRequest, setVerificationRequest] = useState({
    otp: ''
  });
  const [sendOtp, sendOtpMutation] = useSendVerificationOtpMutation();
  const [verifyOtp, verifyOtpMutation] = useVerifyVerificationOtpMutation();

  // Effects for OTP verification
  React.useEffect(() => {
    if (sendOtpMutation.status === 'fulfilled') {
      dispatch(notify({msg:'OTP sent',sev: 'success'}));
    }
  }, [sendOtpMutation]);

  React.useEffect(() => {
    if (verifyOtpMutation.status === 'fulfilled') {
      dispatch(notify({msg:'Patient verified success',sev: 'success'}));
      setLocalPatient(verifyOtpMutation.data);
      setOpen(false);
    }
  }, [verifyOtpMutation]);

  return (
    <MyModal
    open={open}
    setOpen={setOpen}
    bodyheight="40vh"
    title="Patient Verification"
    actionButtonLabel="Verify"
    actionButtonFunction={() =>
        verifyOtp({
          otp: verificationRequest.otp,
          patientId: localPatient.key
        }).unwrap()
      }
    steps={[{ title: "Patient Verification", icon:<FontAwesomeIcon icon={ faShieldAlt }/>,footer :<MyButton onClick={() => sendOtp(localPatient.key).unwrap()} appearance="subtle"> Send Code</MyButton>}]}
    size="xs"
    content={       
     <Form layout='inline' fluid className='add-verification'>
        <MyInput
          column
          vr={validationResult}
          fieldLabel="Primary Mobile Number"
          fieldName="phoneNumber"
          record={localPatient}
          setRecord={setLocalPatient}
          disabled={true}
        />
        <MyInput
          column
          vr={validationResult}
          fieldLabel="Code"
          fieldName="otp"
          record={verificationRequest}
          setRecord={setVerificationRequest}
        />
      </Form>}
/>
  );
};

export default AddVerification;
