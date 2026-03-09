import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { faEllipsis, faLock, faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PlusRound } from '@rsuite/icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from 'rsuite';
import InsuranceModal from '../InsuranceModal';
import SpecificCoverageModa from '../SpecificCoverageModa';
import './styles.less';
import { Tooltip, Whisper } from 'rsuite';
import { useRef } from 'react';
import { newPatientInsurance } from '@/types/model-types-constructor-new';
import { PatientInsurance } from '@/types/model-types-new';

import {
  useDeletePatientInsuranceMutation,
  useGetInsurancesByPatientQuery,
  useLazyGetInsuranceCoveragesCountQuery
} from '@/services/patients/patientInsurancesService';

import { useLazyGetPlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';

import { Patient } from '@/types/model-types-new';
import { conjureValueBasedOnIDFromList } from '@/utils';

interface InsuranceTabProps {
  localPatient: Patient;
}

const InsuranceTab: React.FC<InsuranceTabProps> = ({ localPatient }) => {
  const dispatch = useAppDispatch();

  const [selectedInsurance, setSelectedInsurance] = useState<PatientInsurance | null>(null);

  const [InsuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [specificCoverageModalOpen, setSpecificCoverageModalOpen] = useState(false);
  const [insuranceBrowsing, setInsuranceBrowsing] = useState(false);

  const [deleteInsurance] = useDeletePatientInsuranceMutation();

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [hideSaveBtn, setHideSaveBtn] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openDeleteWithCoveragesModal, setOpenDeleteWithCoveragesModal] = useState(false);
  const [coveragesCount, setCoveragesCount] = useState<number>(0);

  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
  const [triggerCoveragesCount] = useLazyGetInsuranceCoveragesCountQuery();

const patientId = localPatient?.id;

const patientInsuranceResponse = useGetInsurancesByPatientQuery(
  {
    patientId,
    page: 0,
    size: 100,
    sort: 'id,desc'
  },
  {
    skip: !patientId
  }
);
  const { data: payorListResponse, isFetching: payorFetching } = useGetAllPayorsQuery({
    page: 0,
    size: 1000,
    sort: 'name,asc'
  });

  const payorsList = payorListResponse?.data ?? [];

  const [plansByPayorId, setPlansByPayorId] = useState<Record<number, any[]>>({});

  const [triggerGetPlans] = useLazyGetPlansByPayorQuery();

  const paginatedData = patientInsuranceResponse?.data?.data?.slice(
    pageIndex * rowsPerPage,
    pageIndex * rowsPerPage + rowsPerPage
  );

  const visiblePayorIds = useMemo(() => {
    const ids = new Set<number>();
    (paginatedData ?? []).forEach(row => {
      const payorId = Number(row?.payorId);
      if (!Number.isNaN(payorId)) ids.add(payorId);
    });
    return Array.from(ids);
  }, [paginatedData]);

  useEffect(() => {
    const loadPlans = async () => {
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

    if (visiblePayorIds.length > 0) loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePayorIds]);

  const handleEditModal = (row?: any) => {
    const target = row ?? selectedInsurance;
    if (!target) return;
    setSelectedInsurance(target);
    setInsuranceModalOpen(true);
    setInsuranceBrowsing(false);
    setHideSaveBtn(false);
  };

  const handleShowInsuranceDetails = (row?: any) => {
    if (row) setSelectedInsurance(row);
    setInsuranceModalOpen(true);
    setInsuranceBrowsing(true);
    setHideSaveBtn(true);
  };

  const handleOpenSpecificCoverage = (row?: any) => {
    const target = row ?? selectedInsurance;
    if (!target?.id) return;
    setSelectedInsurance(target);
    setSpecificCoverageModalOpen(true);
  };

  const handleDeleteInsurance = async (row?: any) => {
    const target = row ?? selectedInsurance;
    if (!target?.id) return;

    setSelectedInsurance(target);

    try {
      const countRes = await triggerCoveragesCount({ id: target.id }, true).unwrap();
      const count = Number(countRes ?? 0);
      setCoveragesCount(count);

      if (count > 0) {
        setOpenDeleteWithCoveragesModal(true);
      } else {
        setOpenDeleteModal(true);
      }
    } catch {
      // fallback
      setOpenDeleteModal(true);
    }
  };

  const confirmDeleteInsurance = async () => {
    if (!selectedInsurance?.id) return;

    try {
      await deleteInsurance({ id: selectedInsurance.id, deleteCoverages: false }).unwrap();
      patientInsuranceResponse.refetch();
      dispatch(notify({ msg: 'Insurance Deleted Successfully', sev: 'success' }));
      setSelectedInsurance(null);
      setOpenDeleteModal(false);
    } catch (err: any) {
      const msg = err?.data?.detail || 'Failed to delete insurance';
      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const confirmDeleteInsuranceWithCoverages = async () => {
    if (!selectedInsurance?.id) return;

    try {
      await deleteInsurance({ id: selectedInsurance.id, deleteCoverages: true }).unwrap();
      patientInsuranceResponse.refetch();
      dispatch(notify({ msg: 'Insurance & Coverages Deleted Successfully', sev: 'success' }));
      setSelectedInsurance(null);
      setOpenDeleteWithCoveragesModal(false);
    } catch (err: any) {
      const msg = err?.data?.detail || 'Failed to delete insurance';
      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'payor',
      title: <Translate>Insurance Provider</Translate>,
      flexGrow: 4,
      render: (row: any) => {
        const payorName = conjureValueBasedOnIDFromList(payorsList, row.payorId, 'name');

        return row.isPrimary ? (
          <Badge color="blue" content="Primary">
            <span className="insurance-badge-text" style={{ fontSize: '14px' }}>
              {payorName}
            </span>
          </Badge>
        ) : (
          <p>{payorName}</p>
        );
      }
    },
    {
      key: 'policyNumber',
      title: <Translate>Insurance Policy Number</Translate>,
      flexGrow: 4,
      dataKey: 'policyNumber'
    },
    {
      key: 'groupNumber',
      title: <Translate>Group Number</Translate>,
      flexGrow: 4,
      dataKey: 'groupNumber'
    },
    {
      key: 'plan',
      title: <Translate>Insurance Plan Type</Translate>,
      flexGrow: 4,
      render: (row: any) => {
        const plans = plansByPayorId[row.payorId] ?? [];
        return <span>{conjureValueBasedOnIDFromList(plans, row.planId, 'name')}</span>;
      }
    },
    {
      key: 'expirationDate',
      title: <Translate>Expiration Date</Translate>,
      flexGrow: 4,
      dataKey: 'expirationDate'
    },
    {
      key: 'actions',
      title: <Translate>ACTIONS</Translate>,
      flexGrow: 4,
      render: (rowData: PatientInsurance) => (
        <div className="container-of-icons insurance-tooltip-wrapper">
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Edit Insurance</Tooltip>}>
            <span className="insurance-tooltip-trigger">
              <MyButton
                className="icons-style"
                appearance="subtle"
                onClick={() => handleEditModal(rowData)}
              >
                <FontAwesomeIcon
                  className="icons-style"
                  color="var(--primary-gray)"
                  icon={faUserPen}
                />
              </MyButton>
            </span>
          </Whisper>

          <Whisper
            placement="top"
            trigger="hover"
            speaker={<Tooltip>Manage Specific Coverages</Tooltip>}
          >
            <span className="insurance-tooltip-trigger">
              <MyButton
                className="icons-style"
                appearance="subtle"
                onClick={() => handleOpenSpecificCoverage(rowData)}
              >
                <FontAwesomeIcon
                  className="icons-style"
                  color="var(--primary-gray)"
                  icon={faLock}
                />
              </MyButton>
            </span>
          </Whisper>

          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Delete Insurance</Tooltip>}>
            <span className="insurance-tooltip-trigger">
              <MyButton
                className="icons-style"
                appearance="subtle"
                onClick={() => handleDeleteInsurance(rowData)}
              >
                <FontAwesomeIcon
                  className="icons-style"
                  color="var(--primary-pink)"
                  icon={faTrash}
                />
              </MyButton>
            </span>
          </Whisper>

          <Whisper
            placement="top"
            trigger="hover"
            speaker={<Tooltip>View Insurance Details</Tooltip>}
          >
            <span className="insurance-tooltip-trigger">
              <MyButton
                className="icons-style"
                appearance="subtle"
                onClick={() => handleShowInsuranceDetails(rowData)}
              >
                <FontAwesomeIcon
                  className="icons-style"
                  color="var(--primary-gray)"
                  icon={faEllipsis}
                />
              </MyButton>
            </span>
          </Whisper>
        </div>
      )
    }
  ];

  return (
    <div ref={tooltipContainerRef} className="tab-main-container">
      <div className="tab-content-btns">
        <MyButton
          onClick={() => {
            setInsuranceModalOpen(true);
            setSelectedInsurance(newPatientInsurance);
            setInsuranceBrowsing(false);
            setHideSaveBtn(false);
          }}
          disabled={!localPatient.id}
          prefixIcon={() => <PlusRound />}
        >
          New Insurance
        </MyButton>
      </div>
      <InsuranceModal
        relations={[]}
        editing={selectedInsurance}
        refetchInsurance={patientInsuranceResponse.refetch}
        patientKey={localPatient}
        open={InsuranceModalOpen}
        setOpen={setInsuranceModalOpen}
        insuranceBrowsing={insuranceBrowsing}
        onClose={() => setInsuranceModalOpen(false)}
        hideSaveBtn={hideSaveBtn}
      />
      <SpecificCoverageModa
        insurance={selectedInsurance?.id}
        open={specificCoverageModalOpen}
        setOpen={setSpecificCoverageModalOpen}
      />
      <MyTable
        data={paginatedData ?? []}
        columns={columns}
        onRowClick={setSelectedInsurance}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={patientInsuranceResponse?.data?.data?.length ?? 0}
        onPageChange={(_, p) => setPageIndex(p)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPageIndex(0);
        }}
        loading={patientInsuranceResponse.isFetching || payorFetching}
      />
      <DeletionConfirmationModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        itemToDelete="Insurance"
        actionButtonFunction={confirmDeleteInsurance}
      />
      <DeletionConfirmationModal
        open={openDeleteWithCoveragesModal}
        setOpen={setOpenDeleteWithCoveragesModal}
        itemToDelete={coveragesCount}
        actionButtonFunction={confirmDeleteInsuranceWithCoverages}
        confirmationQuestion={`Are you sure you want to delete this Insurance (will also delete ${coveragesCount} coverages)`}
      />
    </div>
  );
};

export default InsuranceTab;