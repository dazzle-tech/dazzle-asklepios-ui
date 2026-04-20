import MyTab from '@/components/MyTab';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetAgeGroupByBirthDateQuery } from '@/services/setup/ageGroupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import { calculateAgeFormat } from '@/utils';
import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import ConsentFormTab from './ConsentFormTab';
import PatientAttachment from './tabs/Attachment-new/PatientAttachment';
import DemographicsTab from './tabs/DemographicsTab';
import SecondaryIDTab from './tabs/ExtraDetails/IDTab';
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

  const [fetchAgeGroupByBirthDate, { data: patientAgeGroupResponse }] =
    useLazyGetAgeGroupByBirthDateQuery();

  const genderEnum = useEnumOptions('Gender');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const patientDocumentEnum = useEnumOptions('DocumentType');

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
          patientDocumentEnum={patientDocumentEnum}
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
      title: 'Primary Care Provider',
      content: <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.id} />
    },
    { title: 'Family Members', content: <PatientFamilyMembers localPatient={localPatient} /> },
    { title: 'Documents', content: <SecondaryIDTab localPatient={localPatient} /> },
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

  useEffect(() => {
    if (localPatient?.dateOfBirth) {
      const calculatedFormat = calculateAgeFormat(localPatient.dateOfBirth);

      setAgeFormatType(prev => ({
        ...prev,
        ageFormat: calculatedFormat
      }));

      fetchAgeGroupByBirthDate({
        birthDate: String(localPatient.dateOfBirth)
      });
    } else {
      setAgeFormatType(prev => ({
        ...prev,
        ageFormat: ''
      }));
    }
  }, [localPatient?.dateOfBirth]);

  useEffect(() => {
    if (patientAgeGroupResponse?.ageGroup) {
      setAgeGroupValue({
        ageGroup: patientAgeGroupResponse.ageGroup
      });
    }
  }, [patientAgeGroupResponse]);

  console.log('ageGroupValue in ProfileTabs-new:', ageGroupValue);
  console.log('dateOfBirth in ProfileTabs-new:', localPatient?.dateOfBirth);
  console.log('patientAgeGroupResponse in ProfileTabs-new:', patientAgeGroupResponse);

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <Panel
        header={
          <h5 className="title">
            <Translate>Details</Translate>
          </h5>
        }
      >
        <MyTab data={tabData} />
      </Panel>
    </div>
  );
};

export default ProfileTabs;
