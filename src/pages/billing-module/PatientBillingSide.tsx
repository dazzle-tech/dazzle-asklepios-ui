import React, { useEffect, useState } from 'react';
import { Avatar, Divider, Loader, Panel, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faIdCard,
  faScaleBalanced,
  faUser,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { IoMdClose } from 'react-icons/io';

import MyButton from '@/components/MyButton/MyButton';

import { useFetchAttachmentQuery } from '@/services/attachmentService';
import { useGetPrimaryDocumentByPatientQuery } from '@/services/patients/patientDocumentsService';
import { calculateAgeFormat, formatEnumString } from '@/utils';
import { newPatient } from '@/types/model-types-constructor-new';
import { ApAttachment } from '@/types/model-types';

import { usePatientRemainingBalance } from './accounting/hooks/usePatientRemainingBalance';
import { WALLET_DEPOSIT_BUTTON_LABEL } from './accounting/utils/billingAccountingUtils';

import '../encounter/encounter-main-info-section/styles.less';

interface PatientBillingSideProps {
  patient: any;
  onDeposit?: () => void;
  setPatient?: (patient: any) => void;
}

const formatAmount = (amount: number | null | undefined) =>
  Number(amount ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const PatientBillingSide: React.FC<PatientBillingSideProps> = ({
  patient,
  onDeposit,
  setPatient
}) => {
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);

  const patientId = patient?.id ?? patient?.key;

  const {
    walletAvailable,
    walletReserved,
    walletConsumed,
    remainingBalance,
    loadingBalance
  } = usePatientRemainingBalance(patientId);

  const { data: primaryDocument } = useGetPrimaryDocumentByPatientQuery(patientId, {
    skip: !patientId
  });

  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: patientId
    },
    { skip: !patientId }
  );

  useEffect(() => {
    if (
      fetchPatientImageResponse.isSuccess &&
      fetchPatientImageResponse.data &&
      fetchPatientImageResponse.data.key
    ) {
      setPatientImage(fetchPatientImageResponse.data);
    } else {
      setPatientImage(undefined);
    }
  }, [fetchPatientImageResponse]);

  const textOr = (v: any, fallback = '') => (v == null || v === '' ? fallback : v);

  const documentTypeText = primaryDocument?.type
    ? formatEnumString(primaryDocument.type)
    : textOr(patient?.documentTypeLvalue?.lovDisplayVale, '');

  const documentNumberText = textOr(primaryDocument?.number, textOr(patient?.documentNo, ''));

  const patientName = textOr(
    patient?.firstName + ' ' + patient?.lastName,
    patient?.fullName || 'Patient Name'
  );
  const patientMRN = textOr(
    patient?.medicalRecordNumber || patient?.patientMrn,
    'MRN'
  );

  return (
    <Panel className="patient-panel">
      {setPatient && (
        <div className="patient-panel-close-btn">
          <IoMdClose
            size={22}
            className="icons-style"
            onClick={() => setPatient({ ...newPatient })}
          />
        </div>
      )}

      <div className="div-avatar">
        <Avatar
          circle
          bordered
          src={
            patientImage && patientImage.fileContent
              ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
              : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
          }
          alt={patientName}
        />
        <div>
          <div className="patient-info">
            <Text className="patient-name">{patientName}</Text>
          </div>
          <div className="info-label"># {patientMRN}</div>
        </div>
      </div>

      <Text className="main-info-patient-side">
        <FontAwesomeIcon icon={faIdCard} className="icon-color" />{' '}
        <span className="section-title-patient-side">Document Information</span>
      </Text>
      <br />

      <div className="info-section">
        <div className="info-column">
          <Text className="info-label">Document Type</Text>
          <Text className="info-value">{documentTypeText}</Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Document No</Text>
          <Text className="info-value">{documentNumberText}</Text>
        </div>
      </div>

      <Divider className="divider-style" />

      <Text className="main-info-patient-side">
        <FontAwesomeIcon icon={faUser} className="icon-color" />{' '}
        <span className="section-title-patient-side">Patient Information</span>
      </Text>
      <br />

      <div className="info-section">
        <div className="info-column">
          <Text className="info-label">Age</Text>
          <Text className="info-value">
            {patient?.dateOfBirth
              ? calculateAgeFormat(patient.dateOfBirth)
              : patient?.dob
              ? calculateAgeFormat(patient.dob)
              : ''}
          </Text>
        </div>

        <div className="info-column">
          <Text className="info-label">Gender</Text>
          <Text className="info-value">
            {textOr(formatEnumString(patient?.sexAtBirth || patient?.genderLkey), '')}
          </Text>
        </div>
      </div>

      <Divider className="divider-style" />

      <Text className="main-info-patient-side">
        <FontAwesomeIcon icon={faScaleBalanced} className="icon-color" />{' '}
        <span className="section-title-patient-side">Patient Balance</span>
      </Text>
      <br />

      {loadingBalance ? (
        <Loader content="Loading balance..." />
      ) : (
        <>
          <div className="info-section">
            <div className="info-column">
              <Text className="info-label">Wallet Available</Text>
              <Text className="info-value">{formatAmount(walletAvailable)}</Text>
            </div>
          </div>

          <div className="info-section" style={{ marginTop: '10px' }}>
            <div className="info-column">
              <Text className="info-label">Wallet Reserved</Text>
              <Text className="info-value">{formatAmount(walletReserved)}</Text>
            </div>
          </div>

          {walletConsumed > 0 && (
            <div className="info-section" style={{ marginTop: '10px' }}>
              <div className="info-column">
                <Text className="info-label">Wallet Consumed</Text>
                <Text className="info-value">{formatAmount(walletConsumed)}</Text>
              </div>
            </div>
          )}

          {onDeposit && (
            <div style={{ marginTop: '14px' }}>
              <MyButton
                block
                appearance="primary"
                prefixIcon={() => <FontAwesomeIcon icon={faWallet} />}
                onClick={onDeposit}
              >
                {WALLET_DEPOSIT_BUTTON_LABEL}
              </MyButton>
            </div>
          )}

          <div className="info-section" style={{ marginTop: '10px' }}>
            <div className="info-column">
              <Text className="info-label">Remaining Balance</Text>
              <Text
                className="info-value"
                style={
                  remainingBalance > 0
                    ? { color: 'var(--primary-red, #e74c3c)' }
                    : undefined
                }
              >
                {formatAmount(remainingBalance)}
              </Text>
            </div>
          </div>
        </>
      )}

      <Divider className="divider-style" />
    </Panel>
  );
};

export default PatientBillingSide;
