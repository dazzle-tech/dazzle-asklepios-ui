import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import { calculateAgeFormat } from '@/utils';
import React, { useEffect, useState } from 'react';
import { Panel, Tabs } from 'rsuite';
import ConsentFormTab from './ConsentFormTab';
import PatientAttachment from './tabs/Attachment/PatientAttachment';
import DemographicsTab from './tabs/DemographicsTab';
import SecondaryIDTab from './tabs/ExtraDetails/SecondaryIDTab';
import ExtraDetailsTab from './tabs/ExtraDetailsTab';
import PatientFamilyMembers from './tabs/FamilyMember/PatientFamilyMembers';
import InsuranceTab from './tabs/InsuranceTab';
import PreferredHealthProfessional from './tabs/PreferredHealthProfessional/PreferredHealthProfessional';
import PrivacySecurityTab from './tabs/PrivacySecurity/PrivacySecurityTab';

interface ProfileTabsProps {
  localPatient: Patient;
  setLocalPatient: (patient: Patient) => void;
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
      dob: localPatient?.dateOfBirth ? new Date(localPatient.dateOfBirth).toISOString() : null
    },
    { skip: !localPatient?.dateOfBirth }
  );

  // Fetch LOV data for various fields
  const genderEnum = useEnumOptions('Gender');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: patientClassLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_CLASS');

  // Update age format when DOB changes
  useEffect(() => {
    if (localPatient?.dateOfBirth) {
      const calculatedFormat = calculateAgeFormat(localPatient.dateOfBirth);
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
  }, [localPatient?.dateOfBirth]);

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
        <Tabs defaultActiveKey="1" appearance="subtle" className="patient-info-tabs">
          <Tabs.Tab eventKey="1" title={<Translate>Demographics</Translate>}>
            <DemographicsTab
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
              genderEnum={genderEnum}
              docTypeLovQueryResponse={docTypeLovQueryResponse}
              countryLovQueryResponse={countryLovQueryResponse}
              patientClassLovQueryResponse={patientClassLovQueryResponse}
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
            <ConsentFormTab patient={localPatient} isClick={!localPatient.id} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="6" title={<Translate>Preferred Health Professional</Translate>}>
            <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.id} />
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
        </Tabs>
      </Panel>
    </>
  );
};

export default ProfileTabs;
