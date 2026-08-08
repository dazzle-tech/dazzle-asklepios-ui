import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetAgeGroupByBirthDateQuery } from '@/services/setup/ageGroupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { calculateAgeFormat } from '@/utils';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
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
import { Patient, Address, PatientInsurance } from '@/types/model-types-new';
import { Panel } from 'rsuite';
import { Translate } from '@mui/icons-material';
import MyTab from '@/components/MyTab';

interface ProfileTabsProps {
  localPatient: Patient;
  setLocalPatient: (patient: Patient) => void;
  validationResult: any;
  setRefetchAttachmentList: (value: boolean) => void;
  refetchAttachmentList: boolean;
  cchiAddress: Address | null;
  setCchiAddress: (address: Address | null) => void;
  cchiDocument?: any;
  cchiInsurance?: PatientInsurance | null;
  setCchiInsurance?: (insurance: PatientInsurance | null) => void;
  openCchiDocumentPopup?: boolean;
  setOpenCchiDocumentPopup?: (value: boolean) => void;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  localPatient,
  setLocalPatient,
  validationResult,
  refetchAttachmentList,
  setRefetchAttachmentList,
  cchiAddress,
  setCchiAddress,
  cchiDocument,
  cchiInsurance,
  setCchiInsurance,
  openCchiDocumentPopup,
  setOpenCchiDocumentPopup,
  activeTab,
  setActiveTab
}) => {
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['1']));

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
    setLoadedTabs(prev => {
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    const dob = localPatient?.dateOfBirth;

    if (!dob) {
      setAgeFormatType({ ageFormat: '' });
      setAgeGroupValue({ ageGroup: '' });
      lastProcessedDOB.current = null;
      return;
    }

    const dobStr =
      dob instanceof Date
        ? dayjs(dob).format('YYYY-MM-DD')
        : typeof dob === 'string'
          ? dob
          : dob != null
            ? String(dob)
            : '';

    if (lastProcessedDOB.current === dobStr) {
      return;
    }

    lastProcessedDOB.current = dobStr;

    const calculatedFormat = calculateAgeFormat(dobStr);
    setAgeFormatType({ ageFormat: calculatedFormat });

    const birthDate = dobStr.includes('T') ? dobStr.split('T')[0] : dobStr;

    fetchAgeGroupByBirthDate({ birthDate })
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
          patientClassLovQueryResponse={patientClassLovQueryResponse}
          ageFormatType={ageFormatType}
          ageGroupValue={ageGroupValue}
        />
      )
    },
    {
      title: 'Documents',
      content: (
        <SecondaryIDTab
          localPatient={localPatient}
          cchiDocument={cchiDocument}
          openCchiDocumentPopup={openCchiDocumentPopup}
          setOpenCchiDocumentPopup={setOpenCchiDocumentPopup}
        />
      )
    },
    {
      title: 'Address',
      content: (
        <AddressTab
          localPatient={localPatient}
          cchiAddress={cchiAddress}
          setCchiAddress={setCchiAddress}
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
    {
      title: 'Insurance',
      content: (
        <InsuranceTab
          localPatient={localPatient}
          setLocalPatient={setLocalPatient}
          cchiInsurance={cchiInsurance}
          setCchiInsurance={setCchiInsurance}
        />
      )
    },
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
      title: 'Primary Care Provider',
      content: <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.id} />
    },
    {
      title: 'Family Members',
      content: <PatientFamilyMembers localPatient={localPatient} />
    },
    {
      title: 'Next of Kin',
      content: <NextOfKin patient={localPatient} isClick={!localPatient.id} />
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
    }
  ];

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <Panel>
        <MyTab data={tabData} activeTab={activeTab} setActiveTab={setActiveTab} lazy />
      </Panel>
    </div>
  );
};

export default ProfileTabs;