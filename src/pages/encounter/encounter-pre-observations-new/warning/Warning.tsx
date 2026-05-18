import CancellationModal from '@/components/CancellationModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useCancelPatientWarningMutation,
  useGetPatientWarningsByPatientIdQuery,
  useResolvePatientWarningMutation,
  useUndoResolvePatientWarningMutation
} from '@/services/encounters/patientWarningsService';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newPatientWarnings } from '@/types/model-types-constructor-new';
import { PatientWarnings } from '@/types/model-types-new';
import {
  conjureValueBasedOnKeyFromListOfValues,
  formatDateWithoutSeconds,
  formatEnumString
} from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload';
import React, { useEffect, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox } from 'rsuite';
import DetailsModal from './DetailsModal';
import WarningDetailsSection from './WarningDetailsSection';
import './styles.less';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

interface WarningProps {
  patient?: any;
  encounter?: any;
  edit?: boolean;
  showTableActions?: boolean;
  showTableButtons?: boolean;
}

const NameCell = ({ login }: { login?: string | null }) => {
  const { data: fullName } = useGetUserFullNameByLoginQuery(login ?? '', {
    skip: !login
  });
  return <span>{fullName || login || '-'}</span>;
};

const Warning = (props: WarningProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Derived props/context
  const patient = props.patient ?? location.state?.patient ?? {};
  const encounter = props.encounter ?? location.state?.encounter ?? {};
  const edit = props.edit ?? location.state?.edit ?? false;
  const { showTableActions = true, showTableButtons = true } = props;

  // State
  const [warning, setWarning] = useState<PatientWarnings>({ ...newPatientWarnings });
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openToAdd, setOpenToAdd] = useState(true);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);
  const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  // Data fetching + mutations
  const {
    data: warningsListResponse,
    refetch: fetchWarnings,
    isLoading
  } = useGetPatientWarningsByPatientIdQuery(
    {
      patientId: patient?.id,
      showCancelled: showCanceled,
      ...paginationParams
    },
    {
      skip: !patient?.id
    }
  );

  const { data: warningTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_WARNING_TYPS');
  const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const [cancelPatientWarning] = useCancelPatientWarningMutation();
  const [resolvePatientWarning] = useResolvePatientWarningMutation();
  const [undoResolvePatientWarning] = useUndoResolvePatientWarningMutation();

  const totalCount = warningsListResponse?.totalCount ?? 0;

  // table column
  const tableColumns: any[] = [
    {
      key: 'warningType',
      title: <Translate>Warning Type</Translate>,
      render: (rowData: PatientWarnings) => (
        <p>
          {conjureValueBasedOnKeyFromListOfValues(
            warningTypeLovQueryResponse?.object ?? [],
            rowData.warningType,
            'lovDisplayVale'
          )}
        </p>
      )
    },
    {
      key: 'warning',
      title: <Translate>Warning</Translate>
    },
    {
      key: 'severity',
      title: <Translate>Severity</Translate>,
      render: (rowData: PatientWarnings) => <p>{formatEnumString(rowData.severity)}</p>
    },
    {
      key: 'onsetDate',
      title: <Translate>onset Date</Translate>,
      render: (rowData: PatientWarnings) =>
        rowData.onsetDateUndefined ? (
          <p>Undefined</p>
        ) : (
          <p>{new Date(rowData.onsetDate).toLocaleDateString()}</p>
        )
    },
    {
      key: 'sourceOfInformation',
      title: <Translate>Source of information</Translate>,
      render: (rowData: PatientWarnings) =>
        rowData.byPatient ? (
          <p>By Patient</p>
        ) : (
          <p>
            {conjureValueBasedOnKeyFromListOfValues(
              sourceofinformationLovQueryResponse?.object ?? [],
              rowData.sourceOfInformation,
              'lovDisplayVale'
            )}
          </p>
        )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => (
        <MyBadgeStatus
          color={
            rowData?.status === 'CANCELLED'
              ? '#969fb0'
              : rowData?.status === 'RESOLVED'
              ? '#800080'
              : '#45b887'
          }
          contant={<Translate>{formatEnumString(rowData?.status)}</Translate>}
        />
      )
    },
    showTableActions !== false && {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: rowData => {
        const createdDate = new Date(rowData.createdDate);
        const today = new Date();

        createdDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const isPast = createdDate < today;

        return (
          <MdModeEdit
            title="Edit"
            className="icons-style"
            size={24}
            fill="var(--primary-gray)"
            onClick={e => {
              e.stopPropagation();
              if (isPast || rowData.status !== 'ACTIVE') return;
              if (rowData.id !== warning?.id) {
                setWarning(rowData);
              }
              setOpenDetailsModal(true);
              setOpenToAdd(false);
            }}
            style={{
              cursor: isPast || rowData.status !== 'ACTIVE' ? 'not-allowed' : 'pointer',
              opacity: isPast || rowData.status !== 'ACTIVE' ? 0.5 : 1
            }}
          />
        );
      }
    },
    {
      key: 'createdByAt',
      title: 'Created By/At',
      expandable: true,
      render: (row: PatientWarnings) => (
        <>
          <NameCell login={row.createdBy} />
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
        </>
      )
    },
    {
      key: 'resolvedByAt',
      title: 'Resolved By/At',
      expandable: true,
      render: (row: PatientWarnings) => (
        <>
          <NameCell login={row.resolvedBy} />
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(row.resolvedDate)}</span>
        </>
      )
    },
    {
      key: 'cancelledByAt',
      title: 'Cancelled By/At',
      expandable: true,
      render: (row: PatientWarnings) => (
        <>
          <NameCell login={row.cancelledBy} />
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(row.cancelledDate)}</span>
        </>
      )
    },
    {
      key: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true
    }
  ].filter(Boolean);

  // class name for selected row
  const isSelected = (rowData: any) =>
    rowData && warning && rowData.id === warning?.id ? 'selected-row' : '';

  // handle clear the warning object
  const handleClear = () => {
    setWarning({ ...newPatientWarnings });
  };

  // handle cancel warning
  const handleCancel = async () => {
    let reason;
    if (warning?.cancellationReason) {
      reason = warning?.cancellationReason;
    } else {
      reason = undefined;
      dispatch(notify({ msg: 'Cancellation Reason is required', sev: 'warning' }));
    }

    if (!reason) return;

    try {
      const result = await cancelPatientWarning({
        id: warning.id,
        reason
      }).unwrap();
      setWarning(result);
      setOpenCancellationReasonModel(false);
      dispatch(notify({ msg: 'Warning cancelled successfully', sev: 'success' }));
      await fetchWarnings();
    } catch {
      dispatch(notify({ msg: 'Failed to cancel warning', sev: 'warning' }));
    }
  };

  // handle resolve warning
  const handleResolve = async () => {
    try {
      const result = await resolvePatientWarning({
        id: warning.id
      }).unwrap();
      setWarning(result);
      dispatch(notify({ msg: 'Warning resolved successfully', sev: 'success' }));
      setOpenConfirmResolvedModel(false);
      await fetchWarnings();
    } catch {
      dispatch(notify({ msg: 'Failed to resolve warning', sev: 'error' }));
    }
  };

  // handle undo resolve for warning
  const handleUndoResolve = async () => {
    try {
      const result = await undoResolvePatientWarning({
        id: warning.id
      }).unwrap();
      setOpenConfirmUndoResolvedModel(false);
      setWarning(result);
      dispatch(notify({ msg: 'Resolve undone successfully', sev: 'success' }));
      await fetchWarnings();
    } catch {
      dispatch(notify({ msg: 'Failed to undo resolve', sev: 'error' }));
    }
  };

  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleSortChange = (newSortColumn: string, newSortType: 'asc' | 'desc') => {
    setSortColumn(newSortColumn);
    setSortType(newSortType);

    const sortValue = `${newSortColumn},${newSortType}`;
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
  };

  useEffect(() => {
    dispatch(setPageCode('medical_warnings'));
    dispatch(setDivContent('Medical Warnings'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <div className="bt-div-2">
        <div className="bt-left-2">
          {showTableButtons && (
            <>
              <MyButton
                prefixIcon={() => <CloseOutlineIcon />}
                onClick={() => setOpenCancellationReasonModel(true)}
                disabled={!warning?.id || warning?.status === 'CANCELLED'}
              >
                Cancel
              </MyButton>

              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
                onClick={() => setOpenConfirmResolvedModel(true)}
                disabled={
                  !warning?.id || warning?.status === 'RESOLVED' || warning?.status === 'CANCELLED'
                }
              >
                Resolved
              </MyButton>

              <MyButton
                prefixIcon={() => <ReloadIcon />}
                onClick={() => setOpenConfirmUndoResolvedModel(true)}
                disabled={
                  !warning?.id || warning?.status === 'ACTIVE' || warning?.status === 'CANCELLED'
                }
              >
                Undo Resolved
              </MyButton>
            </>
          )}

          <Checkbox checked={showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
            <Translate>Show Cancelled</Translate>
          </Checkbox>
        </div>

        {showTableButtons && (
          <div className="bt-right-2">
            <MyButton
              disabled={edit}
              prefixIcon={() => <PlusIcon />}
              onClick={() => {
                handleClear();
                setOpenDetailsModal(true);
                setOpenToAdd(true);
              }}
            >
              Add Warning
            </MyButton>
          </div>
        )}
      </div>

      <div className="container-of-table-and-section-patient-warning">
        <MyTable
          columns={tableColumns}
          data={warningsListResponse?.data || []}
          totalCount={totalCount}
          onRowClick={rowData => {
            if (rowData.id === warning?.id) {
              handleClear();
            } else {
              setWarning(rowData);
              setOpenToAdd(false);
            }
          }}
          rowClassName={isSelected}
          loading={isLoading}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={handlePageChange}
          onRowsPerPageChange={e => {
            const newSize = Number(e.target.value);
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
        />
        {warning?.id && (
          <WarningDetailsSection warning={warning} setWarning={setWarning} edit={edit} />
        )}
      </div>

      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={warning}
        setObject={setWarning}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        fieldLabel="Cancellation Reason"
        title="Cancellation"
        required
      />

      <DeletionConfirmationModal
        open={openConfirmResolvedModel}
        setOpen={setOpenConfirmResolvedModel}
        itemToDelete="Patient Warning"
        actionType="confirm"
        actionButtonFunction={handleResolve}
        confirmationQuestion="Are you sure you want to Resolve this Patient Warning?"
      />

      <DeletionConfirmationModal
        open={openConfirmUndoResolvedModel}
        setOpen={setOpenConfirmUndoResolvedModel}
        itemToDelete="Patient Warning"
        actionType="confirm"
        actionButtonFunction={handleUndoResolve}
        confirmationQuestion="Are you sure you want to Undo Resolve this Patient Warning?"
      />

      <DetailsModal
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        warning={warning}
        setWarning={setWarning}
        edit={edit}
        patient={patient}
        encounter={encounter}
        fetchWarnings={fetchWarnings}
        openToAdd={openToAdd}
      />
    </div>
  );
};

export default Warning;
