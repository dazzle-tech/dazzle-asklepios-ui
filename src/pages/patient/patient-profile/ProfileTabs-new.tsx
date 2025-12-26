import MyTab from '@/components/MyTab';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetAgeGroupByBirthDateQuery } from '@/services/setup/ageGroupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import { calculateAgeFormat } from '@/utils';
import React, { useEffect, useRef, useState } from 'react';
import { Panel } from 'rsuite';
import ConsentFormTab from './ConsentFormTab';
import AddressTab from './tabs/AddressTab';
import PatientAttachment from './tabs/Attachment-new/PatientAttachment';
import DemographicsTab from './tabs/DemographicsTab';
import SecondaryIDTab from './tabs/ExtraDetails';
import ExtraDetailsTab from './tabs/ExtraDetailsTab';
import PatientFamilyMembers from './tabs/FamilyMember/PatientFamilyMembers';
import InsuranceTab from './tabs/InsuranceTab';
import PreferredHealthProfessional from './tabs/PreferredHealthProfessional/PreferredHealthProfessional';
import PrivacySecurityTab from './tabs/PrivacySecurity/PrivacySecurityTab';
import NextOfKin from './tabs/NextOfKin/NextOfKin';
import { useSelector } from 'react-redux';

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
  const direction = useSelector(state => state.ui.direction);
  const [ageGroupValue, setAgeGroupValue] = useState<{ ageGroup: string }>({
    ageGroup: ''
  });

  const [ageFormatType, setAgeFormatType] = useState<{ ageFormat: string }>({
    ageFormat: ''
  });

  const lastProcessedDOB = useRef<string | null>(null);

  const [fetchAgeGroupByBirthDate] = useLazyGetAgeGroupByBirthDateQuery();

  const genderEnum = useEnumOptions('Gender');
  const patientDocumentEnum = useEnumOptions('DocumentType');

  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const { data: patientClassLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_CLASS');

  useEffect(() => {
    if (!localPatient?.dateOfBirth) {
      setAgeFormatType({ ageFormat: '' });
      setAgeGroupValue({ ageGroup: '' });
      lastProcessedDOB.current = null;
      return;
    }

    if (lastProcessedDOB.current === localPatient.dateOfBirth) {
      return;
    }

    lastProcessedDOB.current = localPatient.dateOfBirth;

    const calculatedFormat = calculateAgeFormat(localPatient.dateOfBirth);
    setAgeFormatType({ ageFormat: calculatedFormat });

    fetchAgeGroupByBirthDate({
      birthDate: localPatient.dateOfBirth.includes('T')
        ? localPatient.dateOfBirth.split('T')[0]
        : String(localPatient.dateOfBirth)
    })
      .unwrap()
      .then(res => {
        setAgeGroupValue({
          ageGroup: res?.ageGroup ?? ''
        });
      })
      .catch(err => {
        console.error('Age group API error:', err);
        setAgeGroupValue({ ageGroup: '' });
      });
  }, [localPatient?.id, localPatient?.dateOfBirth]);

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
      title: 'Address',
      content: (
        <AddressTab
          localPatient={localPatient}
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
    {
      title: 'Family Members',
      content: <PatientFamilyMembers localPatient={localPatient} />
    },
    {
      title: 'Documents',
      content: <SecondaryIDTab localPatient={localPatient} />
    },
    {
      title: 'Attachments',
      content: (
        <PatientAttachment
          localPatient={localPatient}
          setRefetchAttachmentList={setRefetchAttachmentList}
          refetchAttachmentList={refetchAttachmentList}
        />
      )
    },
    {
      title: 'Next of Kin',
      content: (
        <NextOfKin
         patient={localPatient}
         isClick={!localPatient?.id}
        />
      )
    },
    
  ];

  return (
    <Panel
      header={
        <h5 dir={direction === 'RTL' ? 'rtl' : 'ltr'} className="title">
          <Translate>Details</Translate>
        </h5>
      }
    >
      <MyTab data={tabData} />
    </Panel>
  );
};

export default ProfileTabs;
