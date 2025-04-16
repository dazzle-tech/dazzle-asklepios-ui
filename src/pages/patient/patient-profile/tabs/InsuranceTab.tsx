import React from 'react';
import { useState } from 'react';
import { type ApPatient, type ApPatientInsurance } from '@/types/model-types';
import {
  newApPatientInsurance,
} from '@/types/model-types-constructor';
import { PlusRound, Icon } from '@rsuite/icons';
import { faUserPen, faLock, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import TrashIcon from '@rsuite/icons/Trash';
import Translate from '@/components/Translate';
import {
  useGetPatientInsuranceQuery,
  useDeletePatientInsuranceMutation
} from '@/services/patientService';
import InsuranceModal from '../InsuranceModal';
import SpecificCoverageModa from '../SpecificCoverageModa';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge, Button, ButtonToolbar, Table } from 'rsuite';
import { HeaderCell, Column, Cell } from 'rsuite-table';

interface InsuranceTabProps {
  localPatient: ApPatient;
}

const InsuranceTab: React.FC<InsuranceTabProps> = ({ localPatient }) => {
  const dispatch = useAppDispatch();
  const [selectedInsurance, setSelectedInsurance] = useState<ApPatientInsurance | null>();
  const [InsuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [specificCoverageModalOpen, setSpecificCoverageModalOpen] = useState(false);
  const [insuranceBrowsing, setInsuranceBrowsing] = useState(false);
  const [deleteInsurance] = useDeletePatientInsuranceMutation();

  // Fetch patient insurance data
  const patientInsuranceResponse = useGetPatientInsuranceQuery({
    patientKey: localPatient.key
  });

  // Handle edit insurance
  const handleEditModal = () => {
    if (selectedInsurance) {
      setInsuranceModalOpen(true);
    }
  };

  // Handle show insurance details
  const handleShowInsuranceDetails = () => {
    setInsuranceModalOpen(true);
    setInsuranceBrowsing(true);
  };

  // Handle delete insurance
  const handleDeleteInsurance = () => {
    deleteInsurance({
      key: selectedInsurance.key
    }).then(
      () => (
        patientInsuranceResponse.refetch(),
        dispatch(notify('Insurance Deleted')),
        setSelectedInsurance(null)
      )
    );
  };

  return (
    <>
      <ButtonToolbar>
        <Button
          style={{
            backgroundColor: 'var(--primary-blue)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          disabled={!localPatient.key}
          onClick={() => {
            setInsuranceModalOpen(true);
            setSelectedInsurance(newApPatientInsurance);
          }}
        >
          <Icon as={PlusRound} /> New Insurance
        </Button>
        <Button
          disabled={!selectedInsurance?.key}
          onClick={handleEditModal}
          appearance="ghost"
          style={{
            border: '1px solid var(--primary-blue)',
            backgroundColor: 'white',
            color: 'var(--primary-blue)',
            marginLeft: '3px'
          }}
        >
          <FontAwesomeIcon
            icon={faUserPen}
            style={{ marginRight: '5px', color: 'var(--primary-blue)' }}
          />
          <span>Edit</span>
        </Button>
        <Button
          disabled={!selectedInsurance?.key}
          appearance="primary"
          style={{ backgroundColor: 'var(--primary-blue)' }}
          onClick={() => setSpecificCoverageModalOpen(true)}
        >
          <FontAwesomeIcon icon={faLock} style={{ marginRight: '8px' }} />
          <span>Specific Coverage</span>
        </Button>
        <Button
          disabled={!selectedInsurance?.key}
          style={{
            border: '1px solid var(--primary-blue)',
            backgroundColor: 'white',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          onClick={handleDeleteInsurance}
        >
          <TrashIcon /> <Translate>Delete</Translate>
        </Button>
      </ButtonToolbar>

      <InsuranceModal
        relations={[]}
        editing={selectedInsurance ? selectedInsurance : null}
        refetchInsurance={patientInsuranceResponse.refetch}
        patientKey={localPatient ?? localPatient.key}
        open={InsuranceModalOpen}
        insuranceBrowsing={insuranceBrowsing}
        onClose={() => {
          setInsuranceModalOpen(false);
          setInsuranceBrowsing(false);
          setSelectedInsurance(null);
        }}
      />

      <SpecificCoverageModa
        insurance={selectedInsurance?.key}
        open={specificCoverageModalOpen}
        onClose={() => {
          setSpecificCoverageModalOpen(false);
        }}
      />

      <Table
        height={400}
        headerHeight={40}
        rowHeight={50}
        bordered
        cellBordered
        onRowClick={setSelectedInsurance}
        data={patientInsuranceResponse?.data ?? []}
      >
        <Column flexGrow={4}>
          <HeaderCell>Insurance Provider </HeaderCell>
          <Cell dataKey="insuranceProvider">
            {rowData =>
              rowData.primaryInsurance ? (
                <div>
                  <Badge color="blue" content={'Primary'}>
                    <p>{rowData.insuranceProvider}</p>
                  </Badge>
                </div>
              ) : (
                <p>{rowData.insuranceProvider}</p>
              )
            }
          </Cell>
        </Column>
        <Column flexGrow={4}>
          <HeaderCell>Insurance Policy Number</HeaderCell>
          <Cell dataKey="insurancePolicyNumber" />
        </Column>
        <Column flexGrow={4}>
          <HeaderCell>Group Number</HeaderCell>
          <Cell dataKey="groupNumber" />
        </Column>
        <Column flexGrow={4}>
          <HeaderCell>Insurance Plan Type</HeaderCell>
          <Cell dataKey="insurancePlanType" />
        </Column>
        <Column flexGrow={4}>
          <HeaderCell>Expiration Date</HeaderCell>
          <Cell dataKey="expirationDate" />
        </Column>
        <Column flexGrow={4}>
          <HeaderCell>Details</HeaderCell>
          <Cell>
            <Button
              onClick={() => {
                handleShowInsuranceDetails();
              }}
              appearance="subtle"
            >
              <FontAwesomeIcon icon={faEllipsis} style={{ marginRight: '8px' }} />
            </Button>
          </Cell>
        </Column>
      </Table>
    </>
  );
};

export default InsuranceTab;
