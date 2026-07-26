import React, { useEffect, useState } from 'react';
import { Avatar, Divider, Panel, Text } from 'rsuite';
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

import { WALLET_DEPOSIT_BUTTON_LABEL } from './accounting/utils/billingAccountingUtils';

import '../encounter/encounter-main-info-section/styles.less';

interface PatientBillingSideProps {
  patient: any;
  balance?: {
    freeBalance: number;
    outstanding: number;
  };
  financeDetails?: {
    walletBalance: number;
    totalDebt: number;
    reservedBalance?: number;
    simulatedInvoiceIncrease: number;
    simulatedPaymentDecrease: number;
  };
  onDeposit?: () => void;
  setPatient?: (patient: any) => void;
}

const PatientBillingSide: React.FC<PatientBillingSideProps> = ({
  patient,
  balance,
  financeDetails,
  onDeposit,
  setPatient,
}) => {
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);

  const patientId = patient?.id ?? patient?.key;

  const { data: primaryDocument } = useGetPrimaryDocumentByPatientQuery(patientId, {
    skip: !patientId,
  });

  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: patientId,
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

  const totalBalance = (balance?.freeBalance ?? 0) + (balance?.outstanding ?? 0);
  const dueAmount = balance?.outstanding ?? 0;

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

      <div className="info-section">
        <div className="info-column">
          <Text className="info-label">Current Balance</Text>
          <Text className="info-value">
            {totalBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </div>
      </div>

      <div className="info-section" style={{ marginTop: '10px' }}>
        <div className="info-column">
          <Text className="info-label">Patient Wallet</Text>
          <Text className="info-value">
            {Number(financeDetails?.walletBalance ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </div>
      </div>

      {financeDetails?.reservedBalance != null && (
        <div className="info-section" style={{ marginTop: '10px' }}>
          <div className="info-column">
            <Text className="info-label">Reserved balance</Text>
            <Text className="info-value">
              {Number(financeDetails.reservedBalance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
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
          <Text className="info-label">Outstanding Debt</Text>
          <Text className="info-value">
            {Number(financeDetails?.totalDebt ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </div>
      </div>

      <div className="info-section" style={{ marginTop: '10px' }}>
        <div className="info-column">
          <Text className="info-label">Invoice Impact </Text>
          <Text className="info-value">
            +{' '}
            {Number(financeDetails?.simulatedInvoiceIncrease ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </div>
      </div>

      <div className="info-section" style={{ marginTop: '10px' }}>
        <div className="info-column">
          <Text className="info-label">Payment Impact </Text>
          <Text className="info-value" style={{ color: 'var(--primary-green, #27ae60)' }}>
            -{' '}
            {Number(financeDetails?.simulatedPaymentDecrease ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </div>
      </div>

      {dueAmount > 0 && (
        <div className="info-section" style={{ marginTop: '10px' }}>
          <div className="info-column">
            <Text className="info-label">Due Amount</Text>
            <Text className="info-value" style={{ color: 'var(--primary-red, #e74c3c)' }}>
              {dueAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </div>
        </div>
      )}

      <Divider className="divider-style" />
    </Panel>
  );
};

export default PatientBillingSide;
