import React from 'react';
import clsx from 'clsx';
import { Form } from 'rsuite';
import { FaFilePrescription } from 'react-icons/fa6';
import PlusIcon from '@rsuite/icons/Plus';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';

import PrescriptionReportButton from './PrescriptionReportButton';

type Props = {
  edit: boolean;
  isNurse: boolean;
  isLoadingPrescriptions: boolean;
  isLoadingCreateOrGet: boolean;
  currentPrescription: any;
  preKeyRecord: { preKey: number | null };
  setPreKeyRecord: React.Dispatch<React.SetStateAction<{ preKey: number | null }>>;
  prescriptionOptions: any[];
  selectedRows: any[];
  patientPrescriptionMedicationObject: any;
  setSelectedRows: React.Dispatch<React.SetStateAction<any[]>>;
  setOpenCancellation: React.Dispatch<React.SetStateAction<boolean>>;
  setSummaryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleNewPrescriptionAndAddMedication: () => void;
};

const PrescriptionToolbar = ({
  edit,
  isNurse,
  isLoadingPrescriptions,
  isLoadingCreateOrGet,
  currentPrescription,
  preKeyRecord,
  setPreKeyRecord,
  prescriptionOptions,
  selectedRows,
  patientPrescriptionMedicationObject,
  setSelectedRows,
  setOpenCancellation,
  setSummaryModalOpen,
  handleNewPrescriptionAndAddMedication
}: Props) => {
  return (
    <div className="bt-div">
      <div style={{ width: '500px', display: 'flex', flexDirection: 'row', gap: '6px' }}>
        <Form fluid>
          <MyInput
            placeholder="Prescription"
            fieldName="preKey"
            fieldType="select"
            record={preKeyRecord}
            setRecord={setPreKeyRecord}
            selectData={prescriptionOptions}
            selectDataLabel="label"
            selectDataValue="key"
            showLabel={false}
          />
        </Form>

        <div className="icon-style">
          <FaFilePrescription size={18} />
        </div>

        <div>
          <div className="prescripton-word-style">Prescription</div>
          <div className="prescripton-number-style">
            {currentPrescription?.prescriptionNum || currentPrescription?.id || '_'}
          </div>
        </div>

        <Form fluid>
          <MyInput
            fieldName=""
            fieldType="select"
            selectData={[]}
            placeholder="Pharmacy"
            selectDataLabel="label"
            selectDataValue="key"
            record={{}}
            setRecord={() => {}}
            width={110}
          />
        </Form>
      </div>

      <div className={clsx('bt-right', { 'disabled-panel': edit })}>

        <MyButton loading={isLoadingPrescriptions}>
          <Translate>Validate with Gallon Reasoner</Translate>
        </MyButton>

        <MyButton
          onClick={handleNewPrescriptionAndAddMedication}
          prefixIcon={() => <PlusIcon />}
          loading={isLoadingPrescriptions || isLoadingCreateOrGet}
          disabled={
            edit ||
            isNurse ||
          
            String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED'
          }
        >
          Add Medication
        </MyButton>

        <MyButton
          prefixIcon={() => <BlockIcon />}
          onClick={() => {
            if (!selectedRows.length && patientPrescriptionMedicationObject?.id) {
              setSelectedRows([patientPrescriptionMedicationObject]);
            }
            setOpenCancellation(true);
          }}
          disabled={
            (!selectedRows.length && !patientPrescriptionMedicationObject?.id) ||
            edit ||
            String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED'
          }
        >
          Cancel
        </MyButton>

        <MyButton
          loading={isLoadingPrescriptions}
          onClick={() => setSummaryModalOpen(true)}
          disabled={edit || !currentPrescription || currentPrescription?.status === 'SUBMITTED'}
          prefixIcon={() => <CheckIcon />}
        >
          Sign & Submit Order
        </MyButton>
      </div>

      <PrescriptionReportButton
        prescriptionId={currentPrescription?.id}
        disabled={!currentPrescription?.id || currentPrescription?.status !== 'SUBMITTED'}
      />
    </div>
  );
};

export default PrescriptionToolbar;