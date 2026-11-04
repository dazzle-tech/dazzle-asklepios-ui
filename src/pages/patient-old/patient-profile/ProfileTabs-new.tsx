import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ApPatient } from '@/types/model-types';
import { Panel } from 'rsuite';
import { calculateAgeFormat, formatEnumString } from '@/utils';

import DemographicsTab from './tabs/DemographicsTab';
import ExtraDetailsTab from './tabs/ExtraDetailsTab';
import InsuranceTab from './tabs/InsuranceTab';
import ConsentFormTab from './ConsentFormTab';
import PreferredHealthProfessional from './tabs/PreferredHealthProfessional/PreferredHealthProfessional';
import PatientFamilyMembers from './tabs/FamilyMember/PatientFamilyMembers';
import SecondaryIDTab from './tabs/ExtraDetails/SecondaryIDTab';
import PatientAttachment from './tabs/Attachment-new/PatientAttachment';
import PrivacySecurityTab from './tabs/PrivacySecurity/PrivacySecurityTab';

import Translate from '@/components/Translate';
import MyTab from '@/components/MyTab';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useLazyGetAgeGroupByBirthDateQuery } from '@/services/setup/ageGroupService';

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
  const lastProcessedDOB = useRef<string | null>(null);

  const [ageGroupValue, setAgeGroupValue] = useState({ ageGroup: '' });
  const [ageFormatType, setAgeFormatType] = useState({ ageFormat: '' });

  const [fetchAgeGroupByBirthDate] = useLazyGetAgeGroupByBirthDateQuery();

  // LOV queries
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: patientClassLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_CLASS');
  const { data: bloodGroupLovQueryResponse } = useGetLovValuesByCodeQuery('BLOOD_GROUPS');

  // Normalize DOB to ISO string (supports Date | string)
  const dobStr = useMemo(() => {
    if (!localPatient?.dob) return null;
    return typeof localPatient.dob === 'string'
      ? localPatient.dob
      : localPatient.dob.toISOString();
  }, [localPatient?.dob]);

  // One effect only: calculates age format + fetch age group when DOB changes
  useEffect(() => {
    if (!dobStr) {
      setAgeFormatType({ ageFormat: '' });
      setAgeGroupValue({ ageGroup: '' });
      lastProcessedDOB.current = null;
      return;
    }

    if (lastProcessedDOB.current === dobStr) return;
    lastProcessedDOB.current = dobStr;

    // Calculate age format
    const calculatedFormat = calculateAgeFormat(dobStr);
    setAgeFormatType({ ageFormat: calculatedFormat });

    // Prepare birthDate for API (yyyy-mm-dd)
    const birthDateOnly = dobStr.includes('T') ? dobStr.split('T')[0] : dobStr;

    fetchAgeGroupByBirthDate({ birthDate: birthDateOnly })
      .unwrap()
      .then(res => {
        setAgeGroupValue({
          ageGroup: res?.ageGroup ? formatEnumString(res.ageGroup) : ''
        });
      })
      .catch(err => {
        console.error('Age group API error:', err);
        setAgeGroupValue({ ageGroup: '' });
      });
  }, [dobStr, fetchAgeGroupByBirthDate]);

  const tabData = useMemo(
    () => [
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
    ],
    [
      localPatient,
      setLocalPatient,
      validationResult,
      genderLovQueryResponse,
      docTypeLovQueryResponse,
      countryLovQueryResponse,
      patientClassLovQueryResponse,
      bloodGroupLovQueryResponse,
      ageFormatType,
      ageGroupValue,
      setRefetchAttachmentList,
      refetchAttachmentList
    ]
  );

  return (
    <Panel
      header={
        <h5 className="title">
          <Translate>Details</Translate>
        </h5>
      }
    >
      <MyTab data={tabData} lazy/>
    </Panel>
  );
};

export default ProfileTabs;