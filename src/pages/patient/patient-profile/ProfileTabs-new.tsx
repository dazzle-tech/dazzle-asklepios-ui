import MyTab from '@/components/MyTab';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import { calculateAgeFormat } from '@/utils';
import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import ConsentFormTab from './ConsentFormTab';
import PatientAttachment from './tabs/Attachment-new/PatientAttachment';
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

  const tabData = [
    {
      title: 'Demographics',
      content: (
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
      content: <ConsentFormTab patient={localPatient} isClick={!localPatient.id} />
    },
    {
      title: 'Preferred Health Professional',
      content: <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.id} />
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
        <MyTab data={tabData} />
      </Panel>
    </>
  );
};

export default ProfileTabs;
