import React, { useState, useEffect } from 'react';
import type { ApPatient } from '@/types/model-types';
import { Panel, Tabs } from 'rsuite';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import { calculateAgeFormat } from '@/utils';
import DemographicsTab from './tabs/DemographicsTab';
import ExtraDetailsTab from './tabs/ExtraDetailsTab';
import InsuranceTab from './tabs/InsuranceTab';
import ConsentFormTab from './ConsentFormTab';
import PreferredHealthProfessional from './tabs/PreferredHealthProfessional/PreferredHealthProfessional';
import PatientFamilyMembers from './tabs/FamilyMember/PatientFamilyMembers';
import SecondaryIDTab from './tabs/ExtraDetails/SecondaryIDTab';
import PatientAttachment from './tabs/Attachment-new/PatientAttachment';
import Translate from '@/components/Translate';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import PrivacySecurityTab from './tabs/PrivacySecurity/PrivacySecurityTab';
import MyTab from '@/components/MyTab';

interface ProfileTabsProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
  setRefetchAttachmentList: (value: boolean) => void;
  refetchAttachmentList: boolean;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  localPatient,
  setLocalPatient,
  validationResult,
  refetchAttachmentList,
  setRefetchAttachmentList
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
  const { data: bloodGroupLovQueryResponse } = useGetLovValuesByCodeQuery('BLOOD_GROUPS');

  const tabData = [
    {
      title: 'Demographics',
      content: (
        <DemographicsTab
          localPatient={localPatient}
          setLocalPatient={setLocalPatient}
          validationResult={validationResult}
          genderLovQueryResponse={genderLovQueryResponse}
          docTypeLovQueryResponse={docTypeLovQueryResponse}
          countryLovQueryResponse={countryLovQueryResponse}
          patientClassLovQueryResponse={patientClassLovQueryResponse}
          bloodGroupLovQueryResponse={bloodGroupLovQueryResponse}
          ageFormatType={ageFormatType}
          ageGroupValue={ageGroupValue}
        />
      )
    },
    {
      title: 'Extra Details',
      content: (
        <ExtraDetailsTab
          localPatient={localPatient}
          setLocalPatient={setLocalPatient}
          validationResult={validationResult}
        />
      )
    },
    { title: 'Insurance', content: <InsuranceTab localPatient={localPatient} /> },
    {
      title: 'Privacy & Security',
      content: (
        <PrivacySecurityTab
          localPatient={localPatient}
          setLocalPatient={setLocalPatient}
          validationResult={validationResult}
        />
      )
    },
    {
      title: 'Consent Forms',
      content: <ConsentFormTab patient={localPatient} isClick={!localPatient.key} />
    },
    {
      title: 'Preferred Health Professional',
      content: <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.key} />
    },
    { title: 'Family Members', content: <PatientFamilyMembers localPatient={localPatient} /> },
    { title: 'Secondary ID', content: <SecondaryIDTab localPatient={localPatient} /> },
    {
      title: 'Attachments',
      content: (
        <PatientAttachment
          localPatient={localPatient}
          setRefetchAttachmentList={setRefetchAttachmentList}
          refetchAttachmentList={refetchAttachmentList}
        />
      )
    }
  ];
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
            <Translate>Details</Translate>
          </h5>
        }
      >
        {/* <Tabs defaultActiveKey="1" appearance="subtle" className="patient-info-tabs">
          <Tabs.Tab eventKey="1" title={<Translate>Demographics</Translate>}>
            <DemographicsTab
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
              genderLovQueryResponse={genderLovQueryResponse}
              docTypeLovQueryResponse={docTypeLovQueryResponse}
              countryLovQueryResponse={countryLovQueryResponse}
              patientClassLovQueryResponse={patientClassLovQueryResponse}
              bloodGroupLovQueryResponse={bloodGroupLovQueryResponse}
              ageFormatType={ageFormatType}
              ageGroupValue={ageGroupValue}
            />
          </Tabs.Tab>
          <Tabs.Tab eventKey="2" title={<Translate>Extra Details</Translate>}>
            <ExtraDetailsTab
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
            />
          </Tabs.Tab>
          <Tabs.Tab eventKey="3" title={<Translate>Insurance</Translate>}>
            <InsuranceTab localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="4" title={<Translate>Privacy & Security</Translate>}>
            <PrivacySecurityTab
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
            />
          </Tabs.Tab>
          <Tabs.Tab eventKey="5" title={<Translate>Consent Forms</Translate>}>
            <ConsentFormTab patient={localPatient} isClick={!localPatient.key} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="6" title={<Translate>Preferred Health Professional</Translate>}>
            <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.key} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="7" title={<Translate>Family Members</Translate>}>
            <PatientFamilyMembers localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="8" title={<Translate>Secondary ID</Translate>}>
            <SecondaryIDTab localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="9" title={<Translate>Attachments</Translate>}>
            <PatientAttachment
              localPatient={localPatient}
              setRefetchAttachmentList={setRefetchAttachmentList}
              refetchAttachmentList={refetchAttachmentList}
            />
          </Tabs.Tab>
        </Tabs> */}
        <MyTab 
         data={tabData}
        />
      </Panel>
    </>
  );
};

export default ProfileTabs;
