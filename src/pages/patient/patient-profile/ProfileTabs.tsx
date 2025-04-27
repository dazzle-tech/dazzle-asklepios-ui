import React, { useState, useEffect } from 'react';
import type { ApPatient } from '@/types/model-types';
import { Panel, Tabs, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import { calculateAgeFormat } from '@/utils';
import BasicInfoTab from './tabs/BasicInfoTab';
import DemographicsTab from './tabs/DemographicsTab';
import ContactTab from './tabs/ContactTab';
import AddressTab from './tabs/AddressTab';
import InsuranceTab from './tabs/InsuranceTab';
import ConsentFormTab from './ConsentFormTab';
import PreferredHealthProfessional from './tabs/PreferredHealthProfessional/PreferredHealthProfessional';
import PatientFamilyMembers from './tabs/FamilyMember/PatientFamilyMembers';
import PatientExtraDetails from './tabs/ExtraDetails/PatientExtraDetails';
import PatientAttachment from './tabs/Attachment/PatientAttachment';
import Translate from '@/components/Translate';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import PrivacySecurityTab from './tabs/PrivacySecurity/PrivacySecurityTab';

interface ProfileTabsProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  localPatient,
  setLocalPatient,
  validationResult
}) => {
  const [ageGroupValue, setAgeGroupValue] = useState({
    ageGroup: ''
  });

  const [ageFormatType, setAgeFormatType] = useState({
    ageFormat: ''
  });

  // Fetch age group data
  const { data: patientAgeGroupResponse } = useGetAgeGroupValueQuery(
    {
      dob: localPatient?.dob ? new Date(localPatient.dob).toISOString() : null
    },
    { skip: !localPatient?.dob }
  );

  // Fetch LOV data for various fields
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: patientClassLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_CLASS');

  // Update age format when DOB changes
  useEffect(() => {
    if (localPatient?.dob) {
      const calculatedFormat = calculateAgeFormat(localPatient.dob);
      setAgeFormatType(prevState => ({
        ...prevState,
        ageFormat: calculatedFormat
      }));
    } else {
      setAgeFormatType(prevState => ({
        ...prevState,
        ageFormat: ''
      }));
    }
  }, [localPatient?.dob]);

  // Update age group when response changes
  useEffect(() => {
    if (patientAgeGroupResponse?.object?.lovDisplayVale) {
      setAgeGroupValue({
        ageGroup: patientAgeGroupResponse.object.lovDisplayVale
      });
    }
  }, [patientAgeGroupResponse]);

  return (
    <>
      <Panel
        header={
          <h5 className="title">
            <Translate>Basic Information</Translate>
          </h5>
        }
      >
        <BasicInfoTab
          localPatient={localPatient}
          setLocalPatient={setLocalPatient}
          validationResult={validationResult}
          genderLovQueryResponse={genderLovQueryResponse}
          docTypeLovQueryResponse={docTypeLovQueryResponse}
          countryLovQueryResponse={countryLovQueryResponse}
          patientClassLovQueryResponse={patientClassLovQueryResponse}
          ageFormatType={ageFormatType}
          ageGroupValue={ageGroupValue}
        />
      </Panel>
      <Panel
        header={
          <h5 className="title">
            <Translate>Details</Translate>
          </h5>
        }
      >
        <Tabs defaultActiveKey="1" appearance="subtle" className="patient-info-tabs">
          <Tabs.Tab eventKey="1" title="Demographics">
            <DemographicsTab localPatient={localPatient} setLocalPatient={setLocalPatient} validationResult={validationResult} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="2" title="Contact">
            <ContactTab localPatient={localPatient} setLocalPatient={setLocalPatient} validationResult={validationResult} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="3" title="Address">
            <AddressTab localPatient={localPatient} setLocalPatient={setLocalPatient} validationResult={validationResult} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="4" title="Insurance">
            <InsuranceTab localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="5" title="Privacy & Security">
            <PrivacySecurityTab
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
            />
          </Tabs.Tab>
          <Tabs.Tab eventKey="6" title="Consent Forms">
            <ConsentFormTab patient={localPatient} isClick={!localPatient.key} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="7" title="Preferred Health Professional">
            <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.key} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="8" title="Family Members">
            <PatientFamilyMembers localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="9" title="Extra Details">
            <Form layout="inline" fluid>
              <MyInput
                vr={validationResult}
                column
                fieldLabel=" Details"
                fieldType="textarea"
                fieldName="extraDetails"
                record={localPatient}
                setRecord={setLocalPatient}
              />
            </Form>
            <PatientExtraDetails localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="10" title="Attachments">
            <PatientAttachment localPatient={localPatient} />
          </Tabs.Tab>
        </Tabs>
      </Panel>
    </>
  );
};

export default ProfileTabs;
