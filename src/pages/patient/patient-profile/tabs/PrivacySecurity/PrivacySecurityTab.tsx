import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { Patient, PatientHIPAA } from '@/types/model-types-new';
import { PlusRound, CheckRound } from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
import { Divider, Form, Loader, Message, useToaster, Stack } from 'rsuite';
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
import { useEnumOptions } from '@/services/enumsApi';
import clsx from 'clsx';

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
  const dispatch = useAppDispatch();
  const toaster = useToaster();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [hippa, setHippa] = useState({ ...newPatientHIPAA });
  // ========== LOV ==========

  const SecurityLevel = useEnumOptions('SecurityLevel');
  // ========== HIPAA API ==========
  const {
    data: hipaaData,
    error: hipaaError,
    isError: isHipaaError,
    isFetching: hipaaLoading
  } = useGetPatientHIPAAQuery({ patientId: localPatient.id! }, { skip: !localPatient.id });


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
      dispatch(notify({ msg: 'HIPAA saved successfully', sev: 'success' }));
    } catch (err) {
      dispatch(notify({ msg: err, sev: 'error' }));
    }
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div className="tab-main-container" dir={dir} >
      <AddVerification
        open={verificationModalOpen}
        setOpen={setVerificationModalOpen}
        localPatient={localPatient}
        setLocalPatient={setLocalPatient}
        validationResult={validationResult}
      />
          <div className="privacy-security-tab-container">
            <div className="privacy-security-tab-top-section">
              <SectionContainer
                  title={<Translate>Security Access Level</Translate>}
                  content={
                    <Form layout="inline" className="btn-fileds-style" >
                      <MyInput
                        vr={validationResult}
                        showLabel={false}
                        fieldType="select"
                        fieldName="securityAccessLevel"
                        selectData={SecurityLevel ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={localPatient}
                        setRecord={setLocalPatient}
                        disabled={!localPatient.id || localPatient.patientStatus === 'MERGED'}
                      />
                    </Form>
                  }
                />

                <SectionContainer
                  title={<Translate>Verification</Translate>}
                  content={
                    <Form layout="inline" className="btn-fileds-style">
                      <MyButton
                        onClick={() => setVerificationModalOpen(true)}
                        disabled={!localPatient.id || localPatient.patientStatus === 'MERGED'}
                        prefixIcon={() => <PlusRound />}
                      >
                        Patient Verification
                      </MyButton>
                    </Form>
                  }
                />
            </div>
                <SectionContainer
                  title={<Translate><span>HIPAA</span></Translate>}
                  content={
                    <Form layout="inline" fluid>
                      {hipaaLoading && (
                        <div className="loader">
                          <Loader content=" Loading HIPAA data..." />
                        </div>
                      )}

                      <div  className={clsx('covg-content', { 'disabled-panel': localPatient?.patientStatus === 'MERGED' })}>
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

                        <div className="privacy-security-tab-save-button">
                          <MyButton
                            appearance="primary"
                            loading={creating || updating}
                            prefixIcon={() => <CheckRound />}
                            onClick={handleSaveHIPAA}
                            disabled={!localPatient.id || localPatient.patientStatus === 'MERGED'}
                          >
                            Save HIPAA
                          </MyButton>
                        </div>
                      </div>
                    </Form>
                  }
                />
          </div>
    </div>
  );
};

export default PrivacySecurityTab;