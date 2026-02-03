import React, { useEffect, useMemo, useState } from 'react';
import { type ApPatient, type ApPatientInsurance } from '@/types/model-types';
import { newApPatientInsurance } from '@/types/model-types-constructor';
import { PlusRound } from '@rsuite/icons';
import { faUserPen, faLock, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  useGetPatientInsuranceQuery,
  useDeletePatientInsuranceMutation
} from '@/services/patientService';
import InsuranceModal from '../InsuranceModal';
import SpecificCoverageModa from '../SpecificCoverageModa';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge } from 'rsuite';
import MyTable from '@/components/MyTable';
import './styles.less';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';

import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { useLazyGetPlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';

import { conjureValueBasedOnIDFromList } from '@/utils';

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
  const [hideSaveBtn, setHideSaveBtn] = useState(false);

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // 1) Fetch Patient Insurances
  const patientInsuranceResponse = useGetPatientInsuranceQuery({
    patientKey: localPatient.key
  });

  const { data: payorListResponse, isFetching: payorFetching } = useGetAllPayorsQuery({
    page: 0,
    size: 1000,
    sort: 'name,asc'
  });

  const payorsList = payorListResponse?.data ?? [];

  // 3) Plans cache by PayorId
  const [plansByPayorId, setPlansByPayorId] = useState<Record<number, any[]>>({});
  const [triggerGetPlans] = useLazyGetPlansByPayorQuery();

  // Pagination calc
  const totalCount = patientInsuranceResponse?.data?.length ?? 0;
  const paginatedData = patientInsuranceResponse?.data?.slice(
    pageIndex * rowsPerPage,
    pageIndex * rowsPerPage + rowsPerPage
  );

  // 4) Load needed plans for the currently visible rows (imperatively)
  const visiblePayorIds = useMemo(() => {
    const ids = new Set<number>();
    (paginatedData ?? []).forEach((row: any) => {
      const id = row?.insuranceProviderLkey ?? row?.insuranceProviderId;
      const n = Number(id);
      if (!Number.isNaN(n) && n > 0) ids.add(n);
    });
    return Array.from(ids);
  }, [paginatedData]);

  useEffect(() => {
    const load = async () => {
      for (const payorId of visiblePayorIds) {
        if (plansByPayorId[payorId]) continue;

        try {
          const res = await triggerGetPlans(
            {
              payorId,
              page: 0,
              size: 1000,
              sort: 'name,asc'
            },
            true
          ).unwrap();

          setPlansByPayorId(prev => ({
            ...prev,
            [payorId]: res?.data ?? []
          }));
        } catch {
          setPlansByPayorId(prev => ({
            ...prev,
            [payorId]: []
          }));
        }
      }
    };

    if (visiblePayorIds.length > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePayorIds, triggerGetPlans]);

  // Row selected styling
  const isSelected = (rowData: any) => {
    if (rowData && selectedInsurance && rowData.key === selectedInsurance.key)
      return 'selected-row';
    return '';
  };

  // Actions
  const handleEditModal = () => {
    if (selectedInsurance) {
      setInsuranceModalOpen(true);
      setHideSaveBtn(false);
    }
  };

  const handleCloseInsuranceModal = () => {
    setInsuranceModalOpen(false);
    setSelectedInsurance(null);
    setInsuranceBrowsing(false);
  };

  const handleShowInsuranceDetails = () => {
    setInsuranceModalOpen(true);
    setInsuranceBrowsing(true);
    setHideSaveBtn(true);
  };

  const handleDeleteInsurance = () => {
    if (!selectedInsurance?.key) return;

    deleteInsurance({ key: selectedInsurance.key }).then(() => {
      patientInsuranceResponse.refetch();
      dispatch(notify({ msg: 'Insurance Deleted Successfully', sev: 'success' }));
      setSelectedInsurance(null);
      setOpenDeleteModal(false);
    });
  };

  // Pagination handlers
  const handlePageChange = (_: unknown, newPage: number) => {
    setPageIndex(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };

  //  Columns using conjureValueBasedOnIDFromList
  const columns = [
    {
      key: 'insuranceProvider',
      title: <Translate>Insurance Provider</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        const payorId = Number(rowData?.insuranceProviderLkey ?? rowData?.insuranceProviderId);

        const payorName = conjureValueBasedOnIDFromList(payorsList, payorId, 'name');

        return rowData.primaryInsurance ? (
          <div>
            <Badge color="blue" content="Primary">
              <p className="insurance-badge-text">{payorName}</p>
            </Badge>
          </div>
        ) : (
          <p>{payorName}</p>
        );
      }
    },
    {
      key: 'insurancePolicyNumber',
      title: <Translate>Insurance Policy Number</Translate>,
      flexGrow: 4,
      dataKey: 'insurancePolicyNumber'
    },
    {
      key: 'groupNumber',
      title: <Translate>Group Number</Translate>,
      flexGrow: 4,
      dataKey: 'groupNumber'
    },
    {
      key: 'insurancePlanType',
      title: <Translate>Insurance Plan Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        const payorId = Number(rowData?.insuranceProviderLkey ?? rowData?.insuranceProviderId);
        const planId = Number(rowData?.insurancePlanTypeLkey ?? rowData?.insurancePlanTypeId);

        const plansList = plansByPayorId[payorId] ?? [];

        return <span>{conjureValueBasedOnIDFromList(plansList, planId, 'name')}</span>;
      }
    },
    {
      key: 'expirationDate',
      title: <Translate>Expiration Date</Translate>,
      flexGrow: 4,
      dataKey: 'expirationDate'
    },
    {
      key: 'details',
      title: <Translate>Details</Translate>,
      flexGrow: 2,
      render: () => (
        <MyButton onClick={handleShowInsuranceDetails} appearance="subtle">
          <FontAwesomeIcon icon={faEllipsis} />
        </MyButton>
      )
    }
  ];

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
        >
          New Insurance
        </MyButton>

        <MyButton
          onClick={handleEditModal}
          disabled={!selectedInsurance?.key}
          prefixIcon={() => <FontAwesomeIcon icon={faUserPen} />}
        >
          Edit
        </MyButton>

        <MyButton
          onClick={() => setSpecificCoverageModalOpen(true)}
          disabled={!selectedInsurance?.key}
          prefixIcon={() => <FontAwesomeIcon icon={faLock} />}
        >
          Specific Coverage
        </MyButton>

        <MyButton
          onClick={() => setOpenDeleteModal(true)}
          disabled={!selectedInsurance?.key}
          prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}
        >
          Delete
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
        data={paginatedData ?? []}
        columns={columns}
        onRowClick={setSelectedInsurance}
        rowClassName={isSelected}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={patientInsuranceResponse.isFetching || payorFetching}
      />

      <DeletionConfirmationModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        itemToDelete="Insurance"
        actionButtonFunction={handleDeleteInsurance}
      />
    </div>
  );
};

export default InsuranceTab;
