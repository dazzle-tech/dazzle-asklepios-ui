import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useAddPatientInsuranceMutation,
  useDeletePatientInsuranceMutation,
  useGetInsurancesByPatientQuery,
  useLazyGetInsuranceCoveragesCountQuery
} from '@/services/patients/patientInsurancesService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';
import { Patient, PatientInsurance } from '@/types/model-types-new';
import { newPatientInsurance } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import { faCheckDouble, faLayerGroup, faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PlusRound } from '@rsuite/icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Message, Tooltip, Whisper } from 'rsuite';
import InsuranceModal from '../InsuranceModal';
import SpecificCoverageModa from '../SpecificCoverageModa';
import WaseelClassListModal from '../WaseelClassListModal';
import {
  buildPatientInsuranceSavePayload,
  extractPatientInsurancesList,
  extractWaseelClassList,
  getCchiInsuranceStorageKey,
  getCchiPayorResolutionErrorMessage,
  normalizeCchiPatientInsurance,
  resolveCchiPayorFromInsurance
} from '../cchiMappers';
import {
  formatInsuranceCell,
  formatInsuranceDate,
  getInsuranceProviderName as resolveInsuranceProviderName,
  getInsuranceStatus,
  isDuplicateInsurance
} from '../insuranceDisplayUtils';
import './styles.less';

interface InsuranceTabProps {
  localPatient: Patient;
  cchiInsurance?: PatientInsurance | null;
  setCchiInsurance?: (insurance: PatientInsurance | null) => void;
}

const InsuranceTab: React.FC<InsuranceTabProps> = ({
  localPatient,
  cchiInsurance,
  setCchiInsurance
}) => {
  const dispatch = useAppDispatch();

  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedInsurance, setSelectedInsurance] = useState<PatientInsurance | null>(null);

  const [InsuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [specificCoverageModalOpen, setSpecificCoverageModalOpen] = useState(false);
  const [insuranceBrowsing, setInsuranceBrowsing] = useState(false);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDeleteWithCoveragesModal, setOpenDeleteWithCoveragesModal] = useState(false);
  const [classListModalOpen, setClassListModalOpen] = useState(false);
  const [classListInsurance, setClassListInsurance] = useState<PatientInsurance | null>(null);

  const [hideSaveBtn, setHideSaveBtn] = useState(false);
  const [coveragesCount, setCoveragesCount] = useState<number>(0);

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [deleteInsurance] = useDeletePatientInsuranceMutation();
  const [addPatientInsurance, { isLoading: isSavingCchiInsurance }] =
    useAddPatientInsuranceMutation();

  const [triggerCoveragesCount] = useLazyGetInsuranceCoveragesCountQuery();

  const patientId = Number(localPatient?.id);

  const {
    data: patientInsuranceResponse,
    isFetching: isFetchingInsurances,
    refetch: refetchInsurances
  } = useGetInsurancesByPatientQuery(
    {
      patientId,
      page: 0,
      size: 100,
      sort: 'id,desc'
    },
    {
      skip: !Number.isFinite(patientId) || patientId <= 0,
      refetchOnMountOrArgChange: true
    }
  );

  const savedInsurances = useMemo(
    () => extractPatientInsurancesList(patientInsuranceResponse),
    [patientInsuranceResponse]
  );

  const { data: payorListResponse } = useGetAllPayorsQuery(
    { page: 0, size: 1000, sort: 'name,asc' },
    { skip: !Number.isFinite(patientId) || patientId <= 0 }
  );

  const { data: nphiesPayerListResponse } = useGetAllNphiesPayersQuery(
    { page: 0, size: 2000, sort: 'nameEn,asc' },
    { skip: !Number.isFinite(patientId) || patientId <= 0 }
  );

  const payorsList = payorListResponse?.data ?? [];
  const nphiesPayersList = nphiesPayerListResponse?.data ?? [];

  const normalizedCchiInsurance = useMemo(() => {
    if (!cchiInsurance) {
      return null;
    }

    return normalizeCchiPatientInsurance(
      cchiInsurance as Record<string, any>,
      localPatient?.id,
      payorsList,
      [],
      nphiesPayersList
    );
  }, [cchiInsurance, localPatient?.id, payorsList, nphiesPayersList]);

  const cchiStorageKey = useMemo(
    () => getCchiInsuranceStorageKey(localPatient?.id, localPatient?.documentId),
    [localPatient?.id, localPatient?.documentId]
  );

  const cchiMatchesSavedInsurance = useMemo(() => {
    if (!normalizedCchiInsurance) {
      return false;
    }

    return savedInsurances.some(saved =>
      isDuplicateInsurance(normalizedCchiInsurance, saved)
    );
  }, [normalizedCchiInsurance, savedInsurances]);

  const pendingCchiInsurance = useMemo(() => {
    if (!normalizedCchiInsurance || cchiMatchesSavedInsurance) {
      return null;
    }

    return normalizedCchiInsurance;
  }, [normalizedCchiInsurance, cchiMatchesSavedInsurance]);

  useEffect(() => {
    if (!cchiMatchesSavedInsurance || !setCchiInsurance) {
      return;
    }

    setCchiInsurance(null);

    if (cchiStorageKey) {
      sessionStorage.removeItem(cchiStorageKey);
    }
  }, [cchiMatchesSavedInsurance, cchiStorageKey, setCchiInsurance]);

  useEffect(() => {
    if (!localPatient?.id || !cchiInsurance || cchiInsurance.patientId) {
      return;
    }

    setCchiInsurance?.({
      ...cchiInsurance,
      patientId: Number(localPatient.id)
    });
  }, [localPatient?.id, cchiInsurance, setCchiInsurance]);

  useEffect(() => {
    if (!setCchiInsurance || cchiInsurance || !cchiStorageKey) {
      return;
    }

    const saved = sessionStorage.getItem(cchiStorageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      setCchiInsurance({
        ...parsed,
        id: undefined,
        patientId: localPatient?.id != null ? Number(localPatient.id) : undefined
      } as PatientInsurance);
    } catch {
      sessionStorage.removeItem(cchiStorageKey);
    }
  }, [cchiInsurance, cchiStorageKey, localPatient?.id, setCchiInsurance]);

  const tableRows = useMemo(() => {
    const rows = [...savedInsurances];

    if (pendingCchiInsurance) {
      return [{ ...pendingCchiInsurance, _isCchiDraft: true }, ...rows];
    }

    return rows;
  }, [savedInsurances, pendingCchiInsurance]);

  const paginatedData = tableRows.slice(
    pageIndex * rowsPerPage,
    pageIndex * rowsPerPage + rowsPerPage
  );

  const handleEditModal = (row?: any) => {
    const target = row ?? selectedInsurance;

    if (!target) {
      return;
    }

    setSelectedInsurance(target);
    setInsuranceModalOpen(true);
    setInsuranceBrowsing(false);
    setHideSaveBtn(false);
  };

  const handleShowInsuranceDetails = (row?: any) => {
    if (row) {
      setSelectedInsurance(row);
    }

    setInsuranceModalOpen(true);
    setInsuranceBrowsing(true);
    setHideSaveBtn(true);
  };

  const handleOpenSpecificCoverage = (row?: any) => {
    const target = row ?? selectedInsurance;

    if (!target?.id) {
      return;
    }

    setSelectedInsurance(target);
    setSpecificCoverageModalOpen(true);
  };

  const handleDeleteInsurance = async (row?: any) => {
    const target = row ?? selectedInsurance;

    if (!target?.id) {
      return;
    }

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
      setOpenDeleteModal(true);
    }
  };

  const confirmDeleteInsurance = async () => {
    if (!selectedInsurance?.id) {
      return;
    }

    try {
      await deleteInsurance({
        id: selectedInsurance.id,
        deleteCoverages: false
      }).unwrap();

      void refetchInsurances();

      dispatch(
        notify({
          msg: 'Insurance Deleted Successfully',
          sev: 'success'
        })
      );

      setSelectedInsurance(null);
      setOpenDeleteModal(false);
    } catch (err: any) {
      let msg = 'Failed to delete insurance';

      if (err?.data?.message === 'error.delete.hasCoverages') {
        msg = 'This insurance cannot be deleted because it has associated coverages.';
      } else if (err?.data?.detail) {
        msg = err.data.detail;
      }

      dispatch(
        notify({
          msg,
          sev: 'error'
        })
      );
    }
  };

  const confirmDeleteInsuranceWithCoverages = async () => {
    if (!selectedInsurance?.id) {
      return;
    }

    try {
      await deleteInsurance({
        id: selectedInsurance.id,
        deleteCoverages: true
      }).unwrap();

      void refetchInsurances();

      dispatch(
        notify({
          msg: 'Insurance & Coverages Deleted Successfully',
          sev: 'success'
        })
      );

      setSelectedInsurance(null);
      setOpenDeleteWithCoveragesModal(false);
    } catch (err: any) {
      const msg = err?.data?.detail || 'Failed to delete insurance';

      dispatch(
        notify({
          msg,
          sev: 'error'
        })
      );
    }
  };

  const handleDiscardCchiInsurance = () => {
    setCchiInsurance?.(null);

    if (cchiStorageKey) {
      sessionStorage.removeItem(cchiStorageKey);
    }
  };

  const handleOpenClassList = (
    row: PatientInsurance,
    event?: React.MouseEvent
  ) => {
    event?.stopPropagation();
    setClassListInsurance(row);
    setClassListModalOpen(true);
  };

  const handleSaveCchiInsurance = async () => {
    if (!cchiInsurance || !pendingCchiInsurance) {
      return;
    }

    if (!localPatient?.id) {
      dispatch(
        notify({
          msg: 'Please save the patient before saving insurance',
          sev: 'warning'
        })
      );
      return;
    }

    if (!pendingCchiInsurance.policyNumber) {
      dispatch(
        notify({
          msg: 'CCHI insurance is missing a policy number',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const payorResolution = resolveCchiPayorFromInsurance(
        cchiInsurance as Record<string, any>,
        payorsList,
        nphiesPayersList
      );
      const payorError = getCchiPayorResolutionErrorMessage(
        cchiInsurance as Record<string, any>,
        payorResolution
      );

      if (payorError) {
        dispatch(
          notify({
            msg: payorError,
            sev: 'error'
          })
        );
        return;
      }

      const payload = buildPatientInsuranceSavePayload(
        cchiInsurance as Record<string, any>,
        Number(localPatient.id),
        payorsList,
        [],
        nphiesPayersList
      );

      if (!payload.payorId) {
        dispatch(
          notify({
            msg: 'Could not resolve a Payor for this CCHI insurance. Configure the payer under Setup.',
            sev: 'error'
          })
        );
        return;
      }

      await addPatientInsurance(payload).unwrap();

      setCchiInsurance?.(null);

      if (cchiStorageKey) {
        sessionStorage.removeItem(cchiStorageKey);
      }

      dispatch(
        notify({
          msg: 'Insurance Saved Successfully',
          sev: 'success'
        })
      );

      void refetchInsurances();
    } catch (err: any) {
      const fieldErrors = err?.data?.fieldErrors;
      const fieldMessage = Array.isArray(fieldErrors)
        ? fieldErrors.map((item: any) => `${item.field}: ${item.message}`).join(', ')
        : null;

      const errorKey =
        typeof err?.data?.message === 'string' && err.data.message.startsWith('error.')
          ? err.data.message.substring(6)
          : null;

      let msg =
        fieldMessage ||
        err?.data?.detail ||
        err?.data?.message ||
        err?.data?.title ||
        'Failed to save insurance from CCHI';

      if (errorKey === 'payor.unresolved') {
        msg =
          'Could not match the CCHI payer to a Payor in Setup. Configure the payer NPHIES ID under NPHIES Payers or Payors.';
      }

      dispatch(
        notify({
          msg,
          sev: 'error'
        })
      );
    }
  };

  const handleRowClick = (row: PatientInsurance & { _isCchiDraft?: boolean }) => {
    setSelectedInsurance(row);

    if (row._isCchiDraft) {
      handleShowInsuranceDetails(row);
      return;
    }

    handleShowInsuranceDetails(row);
  };

  const columns = [
    {
      key: 'payor',
      title: <Translate>Insurance Provider</Translate>,
      width: 170,
      render: (row: PatientInsurance & { _isCchiDraft?: boolean }) => {
        const payorName = resolveInsuranceProviderName(row, payorsList, nphiesPayersList);

        return (
          <div className="insurance-tab__provider-cell">
            {row.isPrimary ? (
              <Badge color="blue" content="Primary">
                <span className="insurance-badge-text" style={{ fontSize: '14px' }}>
                  {payorName}
                </span>
              </Badge>
            ) : (
              <span>{payorName}</span>
            )}
            {row._isCchiDraft ? (
              <Badge color="cyan" className="insurance-tab__draft-badge">
                CCHI · Pending save
              </Badge>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      width: 120,
      render: (row: PatientInsurance) => {
        if (row.eligibilityStatus) {
          const normalized = String(row.eligibilityStatus).toLowerCase();
          const color =
            normalized === 'active'
              ? '#45b887'
              : normalized === 'inactive'
                ? '#e11d48'
                : '#969fb0';

          return (
            <MyBadgeStatus
              contant={String(row.eligibilityStatus)}
              color={color}
            />
          );
        }

        const { label, color } = getInsuranceStatus(row.expirationDate);

        return <MyBadgeStatus contant={label} color={color} />;
      }
    },
    {
      key: 'policyNumber',
      title: <Translate>Policy Number</Translate>,
      width: 130,
      render: (row: PatientInsurance) => formatInsuranceCell(row.policyNumber)
    },
    {
      key: 'memberCardId',
      title: <Translate>Member ID</Translate>,
      width: 120,
      render: (row: PatientInsurance) => formatInsuranceCell(row.memberCardId)
    },
    {
      key: 'groupNumber',
      title: <Translate>Group Number</Translate>,
      width: 120,
      render: (row: PatientInsurance) => formatInsuranceCell(row.groupNumber)
    },
    {
      key: 'groupName',
      title: <Translate>Insurance Group</Translate>,
      width: 140,
      render: (row: PatientInsurance) => formatInsuranceCell(row.groupName)
    },
    {
      key: 'policyClassName',
      title: <Translate>Insurance Plan</Translate>,
      width: 140,
      render: (row: PatientInsurance) => formatInsuranceCell(row.policyClassName)
    },
    {
      key: 'planCode',
      title: <Translate>Plan Code</Translate>,
      width: 120,
      render: (row: PatientInsurance) => formatInsuranceCell(row.planCode)
    },
    {
      key: 'networkId',
      title: <Translate>Network</Translate>,
      width: 120,
      render: (row: PatientInsurance) => formatInsuranceCell(row.networkId)
    },
    {
      key: 'gpVisitCopay',
      title: <Translate>GP Copay</Translate>,
      width: 100,
      render: (row: PatientInsurance) => formatInsuranceCell(row.gpVisitCopay)
    },
    {
      key: 'specialistVisitsLimit',
      title: <Translate>Specialist Visits</Translate>,
      width: 120,
      render: (row: PatientInsurance) => formatInsuranceCell(row.specialistVisitsLimit)
    },
    {
      key: 'expirationDate',
      title: <Translate>Expiration Date</Translate>,
      width: 120,
      render: (row: PatientInsurance) => formatInsuranceDate(row.expirationDate)
    },
    {
      key: 'actions',
      title: <Translate>ACTIONS</Translate>,
      width: 140,
      render: (rowData: PatientInsurance & { _isCchiDraft?: boolean }) => {
        const hasClassList = extractWaseelClassList(rowData).length > 0;

        if (rowData._isCchiDraft) {
          return (
            <div className="container-of-icons insurance-tooltip-wrapper insurance-tab__actions">
              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>View Waseel Class List</Tooltip>}
              >
                <span className="insurance-tooltip-trigger">
                  <MyButton
                    className="icons-style"
                    appearance="subtle"
                    onClick={event => handleOpenClassList(rowData, event)}
                  >
                    <FontAwesomeIcon
                      className="icons-style"
                      color={hasClassList ? 'var(--primary-blue)' : 'var(--primary-gray)'}
                      icon={faLayerGroup}
                    />
                  </MyButton>
                </span>
              </Whisper>

              <MyButton
                appearance="link"
                onClick={() => handleShowInsuranceDetails(rowData)}
              >
                <Translate>Preview</Translate>
              </MyButton>
            </div>
          );
        }

        return (
          <div className="container-of-icons insurance-tooltip-wrapper insurance-tab__actions">
            <Whisper
              placement="top"
              trigger="hover"
              speaker={<Tooltip>View Waseel Class List</Tooltip>}
            >
              <span className="insurance-tooltip-trigger">
                <MyButton
                  className="icons-style"
                  appearance="subtle"
                  onClick={event => handleOpenClassList(rowData, event)}
                >
                  <FontAwesomeIcon
                    className="icons-style"
                    color={hasClassList ? 'var(--primary-blue)' : 'var(--primary-gray)'}
                    icon={faLayerGroup}
                  />
                </MyButton>
              </span>
            </Whisper>

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
          </div>
        );
      }
    }
  ];

  return (
    <div ref={tooltipContainerRef} className="tab-main-container">
      <div className="tab-content-btns">
        {pendingCchiInsurance ? (
          <>
            <MyButton
              onClick={handleSaveCchiInsurance}
              disabled={!localPatient.id || isSavingCchiInsurance}
              loading={isSavingCchiInsurance}
              prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
            >
              <Translate>Save CCHI Insurance</Translate>
            </MyButton>
            <MyButton appearance="ghost" onClick={handleDiscardCchiInsurance}>
              <Translate>Discard</Translate>
            </MyButton>
          </>
        ) : (
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
            <Translate>New Insurance</Translate>
          </MyButton>
        )}
      </div>

      {pendingCchiInsurance ? (
        <Message showIcon type="info" className="insurance-tab__info-banner">
          <Translate>
            New insurance fetched from CCHI is pending save. Review it, then click Save CCHI Insurance.
          </Translate>
        </Message>
      ) : null}

      <InsuranceModal
        relations={[]}
        editing={selectedInsurance}
        refetchInsurance={refetchInsurances}
        patientKey={Number.isFinite(patientId) && patientId > 0 ? patientId : undefined}
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

      <WaseelClassListModal
        open={classListModalOpen}
        setOpen={setClassListModalOpen}
        insurance={classListInsurance}
      />

      <div className="insurance-tab__table">
        <MyTable
          data={paginatedData ?? []}
          columns={columns}
          onRowClick={handleRowClick}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={tableRows.length}
          onPageChange={(_, p) => setPageIndex(p)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPageIndex(0);
          }}
          loading={isFetchingInsurances}
        />
      </div>

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