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
import PatientAttachment from './tabs/Attachment/PatientAttachment';
import Translate from '@/components/Translate';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import PrivacySecurityTab from './tabs/PrivacySecurity/PrivacySecurityTab';

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
        <Tabs defaultActiveKey="1" appearance="subtle" className="patient-info-tabs">
          <Tabs.Tab eventKey="1" title="Demographics">
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
          <Tabs.Tab eventKey="2" title="Extra Details">
            <ExtraDetailsTab
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
            />
          </Tabs.Tab>
          <Tabs.Tab eventKey="3" title="Insurance">
            <InsuranceTab localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="4" title="Privacy & Security">
            <PrivacySecurityTab
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
            />
          </Tabs.Tab>
          <Tabs.Tab eventKey="5" title="Consent Forms">
            <ConsentFormTab patient={localPatient} isClick={!localPatient.key} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="6" title="Preferred Health Professional">
            <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.key} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="7" title="Family Members">
            <PatientFamilyMembers localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="8" title="Secondary ID">
            <SecondaryIDTab localPatient={localPatient} />
          </Tabs.Tab>
          <Tabs.Tab eventKey="9" title="Attachments">
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
