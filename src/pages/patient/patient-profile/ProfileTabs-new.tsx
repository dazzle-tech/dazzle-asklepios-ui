import React, { useState, useEffect } from 'react';
import type { ApPatient } from '@/types/model-types';
import { Panel } from 'rsuite';
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
import { useLazyGetAgeGroupByBirthDateQuery } from '@/services/setup/ageGroupService'; 
import { formatEnumString } from '@/utils';
import NextOfKin from './tabs/NextOfKin/NextOfKin';

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

  const [fetchAgeGroupByBirthDate, { data: patientAgeGroupResponse }] =
    useLazyGetAgeGroupByBirthDateQuery();

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
    },
    {
      title: 'Next of Kin',
      content: (
        // <PatientAttachment
        //   localPatient={localPatient}
        //   setRefetchAttachmentList={setRefetchAttachmentList}
        //   refetchAttachmentList={refetchAttachmentList}
        // />
        <NextOfKin
         patient={localPatient}
         isClick={!localPatient.key}
        />
      )
    }
  ];

  // Update age format when DOB changes
  useEffect(() => {
    if (localPatient?.dob) {
      const calculatedFormat = calculateAgeFormat(localPatient.dob);

      setAgeFormatType(prev => ({
        ...prev,
        ageFormat: calculatedFormat
      }));

      fetchAgeGroupByBirthDate({
        birthDate: String(localPatient.dob)
      });
    } else {
      setAgeFormatType(prev => ({
        ...prev,
        ageFormat: ''
      }));
    }
  }, [localPatient?.dob]);

  useEffect(() => {
    if (patientAgeGroupResponse?.ageGroup) {
      setAgeGroupValue({
        ageGroup: formatEnumString(patientAgeGroupResponse.ageGroup)
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
        <MyTab
          data={tabData}
        />
      </Panel>
    </>
  );
};

export default ProfileTabs;
