import React from 'react';
import { useState } from 'react';
import { type ApPatient, type ApPatientInsurance } from '@/types/model-types';
import { newApPatientInsurance } from '@/types/model-types-constructor';
import { PlusRound, Icon } from '@rsuite/icons';
import { faUserPen, faLock, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useGetPatientInsuranceQuery, useDeletePatientInsuranceMutation } from '@/services/patientService';
import InsuranceModal from '../InsuranceModal';
import SpecificCoverageModa from '../SpecificCoverageModa';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge, Button, ButtonToolbar } from 'rsuite';
import MyTable from '@/components/MyTable';
import './styles.less'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
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
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [hideSaveBtn,setHideSaveBtn] = useState(false);
  // Define the table columns
  const columns = [
    {
      key: 'insuranceProvider',
      title: 'Insurance Provider',
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.primaryInsurance ? (
          <div>
            <Badge color="blue" content="Primary">
              <p className="insurance-badge-text">{rowData.insuranceProvider}</p>
            </Badge>
          </div>
        ) : (
          <p>{rowData.insuranceProvider}</p>
        ),
    },
    {
      key: 'insurancePolicyNumber',
      title: 'Insurance Policy Number',
      flexGrow: 4,
      dataKey: 'insurancePolicyNumber',
    },
    {
      key: 'groupNumber',
      title: 'Group Number',
      flexGrow: 4,
      dataKey: 'groupNumber',
    },
    {
      key: 'insurancePlanType',
      title: 'Insurance Plan Type',
      flexGrow: 4,
      dataKey: 'insurancePlanType',
    },
    {
      key: 'expirationDate',
      title: 'Expiration Date',
      flexGrow: 4,
      dataKey: 'expirationDate',
    },
    {
      key: 'details',
      title: 'Details',
      flexGrow: 2,
      render: (rowData: any) => (
        <MyButton
          onClick={() => {
            handleShowInsuranceDetails();
          }}
          appearance="subtle"

        >
          <FontAwesomeIcon icon={faEllipsis} />
        </MyButton>
      ),
    },
  ];

  // Fetch patient insurance data
  const patientInsuranceResponse = useGetPatientInsuranceQuery({
    patientKey: localPatient.key
  });

  // Function to check if the current row is the selected one
  const isSelected = rowData => {
    if (rowData && selectedInsurance && rowData.key === selectedInsurance.key) {
      return 'selected-row';
    } else return '';
  };

  // Handle edit insurance
  const handleEditModal = () => {
    if (selectedInsurance) {
      setInsuranceModalOpen(true);
      setHideSaveBtn(false);
    }
  };
  // Handle close insurance modal
  const handleCloseInsuranceModal = () => {
    setInsuranceModalOpen(false);
    setSelectedInsurance(null);
    setInsuranceBrowsing(false);
  };

  // Handle show insurance details
  const handleShowInsuranceDetails = () => {
    setInsuranceModalOpen(true);
    setInsuranceBrowsing(true);
    setHideSaveBtn(true);
  };

  // Handle delete insurance
  const handleDeleteInsurance = () => {
    deleteInsurance({
      key: selectedInsurance.key
    }).then(
      () => (
        patientInsuranceResponse.refetch(),
        dispatch(notify({ msg: 'Insurance Deleted Successfully', sev: "success" })),
        setSelectedInsurance(null),
        setOpenDeleteModal(false)
      )
    );
  };

  return (
    <div className="tab-main-container">
      <div className="tab-content-btns">
        <MyButton
          onClick={() => {
            setInsuranceModalOpen(true);
            setSelectedInsurance(newApPatientInsurance);
            setHideSaveBtn(false);
          }}
          disabled={!localPatient.key}
          prefixIcon={() => <PlusRound />}
        > New Insurance
        </MyButton>
        <MyButton
          onClick={handleEditModal}
          disabled={!selectedInsurance?.key}
          prefixIcon={() => <FontAwesomeIcon icon={faUserPen} />}
        > Edit
        </MyButton>
        <MyButton
          onClick={() => setSpecificCoverageModalOpen(true)}
          disabled={!selectedInsurance?.key}
          prefixIcon={() => <FontAwesomeIcon icon={faLock} />}
        > Specific Coverage
        </MyButton>
        <MyButton
          onClick={() => { setOpenDeleteModal(true) }}
          disabled={!selectedInsurance?.key}
          prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}
        >Delete
        </MyButton>
      </div>
      <InsuranceModal
        relations={[]}
        editing={selectedInsurance ? selectedInsurance : null}
        refetchInsurance={patientInsuranceResponse.refetch}
        patientKey={localPatient ?? localPatient.key}
        open={InsuranceModalOpen}
        setOpen={setInsuranceModalOpen}
        insuranceBrowsing={insuranceBrowsing}
        onClose={handleCloseInsuranceModal}
        hideSaveBtn={hideSaveBtn}
      />
      <SpecificCoverageModa
        insurance={selectedInsurance?.key}
        open={specificCoverageModalOpen}
        setOpen={setSpecificCoverageModalOpen}
      />
      <MyTable
        data={patientInsuranceResponse?.data ?? []}
        columns={columns}
        onRowClick={setSelectedInsurance}
        rowClassName={isSelected}
      />
      <DeletionConfirmationModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        itemToDelete='Insurance'
        actionButtonFunction={handleDeleteInsurance}>
      </DeletionConfirmationModal>
    </div>
  );
};

export default InsuranceTab;
