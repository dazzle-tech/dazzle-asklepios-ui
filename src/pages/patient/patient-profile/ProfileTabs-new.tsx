import MyTab from '@/components/MyTab';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetAgeGroupByBirthDateQuery } from '@/services/setup/ageGroupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import { calculateAgeFormat } from '@/utils';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { Panel } from 'rsuite';
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
  const [activeTab, setActiveTab] = useState<string>('1');
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

    // normalize to string (prevents: includes is not a function)
    const dobStr =
      dob instanceof Date
        ? dayjs(dob).format('YYYY-MM-DD')
        : typeof dob === 'string'
        ? dob
        : dob != null
        ? String(dob)
        : '';

    // avoid re-processing same DOB
    if (lastProcessedDOB.current === dobStr) {
      return;
    }
    lastProcessedDOB.current = dobStr;

    // calculateAgeFormat expects DOB (string usually), so pass normalized string
    const calculatedFormat = calculateAgeFormat(dobStr);
    setAgeFormatType({ ageFormat: calculatedFormat });

    // API expects yyyy-mm-dd (strip time if exists)
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

  const isTabLoaded = (tabKey: string) => loadedTabs.has(tabKey);

  const tabData = [
    {
      title: 'Demographics',
      content: isTabLoaded('1') ? (
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
      ) : (
        <></>
      )
    },
    {
      title: 'Documents',
      content: isTabLoaded('2') ? <SecondaryIDTab localPatient={localPatient} /> : <></>
    },
    {
      title: 'Address',
      content: isTabLoaded('3') ? <AddressTab localPatient={localPatient} /> : <></>
    },
    {
      title: 'Extra Details',
      content: isTabLoaded('4') ? (
        <ExtraDetailsTab
          localPatient={localPatient}
          setLocalPatient={setLocalPatient}
          validationResult={validationResult}
        />
      ) : (
        <></>
      )
    },
    {
      title: 'Insurance',
      content: isTabLoaded('5') ? <InsuranceTab localPatient={localPatient} /> : <></>
    },
    {
      title: 'Privacy & Security',
      content: isTabLoaded('6') ? (
        <PrivacySecurityTab
          localPatient={localPatient}
          setLocalPatient={setLocalPatient}
          validationResult={validationResult}
        />
      ) : (
        <></>
      )
    },
    {
      title: 'Primary Care Provider',
      content: isTabLoaded('7') ? (
        <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.id} />
      ) : (
        <></>
      )
    },
    {
      title: 'Family Members',
      content: isTabLoaded('8') ? <PatientFamilyMembers localPatient={localPatient} /> : <></>
    },
    {
      title: 'Next of Kin',
      content: isTabLoaded('9') ? <NextOfKin patient={localPatient} isClick={!localPatient.id} /> : <></>
    },

    {
      title: 'Attachments',
      content: isTabLoaded('10') ? (
        <PatientAttachment
          localPatient={localPatient}
          setRefetchAttachmentList={setRefetchAttachmentList}
          refetchAttachmentList={refetchAttachmentList}
        />
      ) : (
        <></>
      )
    }
  ];
  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <Panel
        header={
          <div className="title">
            <Translate>Details</Translate>
          </div>
        }
      >
        <MyTab data={tabData} activeTab={activeTab} setActiveTab={key => setActiveTab(String(key))} />
      </Panel>
    </div>
  );
};

export default ProfileTabs;
