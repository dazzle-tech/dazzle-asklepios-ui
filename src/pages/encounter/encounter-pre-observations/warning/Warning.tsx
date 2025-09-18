import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useGetWarningsQuery, useSaveWarningsMutation } from '@/services/observationService';
import { newApVisitWarning } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faArrowRotateRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload';
import React, { useEffect, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox } from 'rsuite';
import DetailsModal from './DetailsModal';
import './styles.less';

interface WarningProps {
  patient?: any;
  encounter?: any;
  edit?: boolean;
  showTableActions?: boolean;
  showTableButtons?: boolean;
}

const Warning = (props: WarningProps) => {
  const location = useLocation();
  const patient = props.patient ?? location.state?.patient ?? {};
  const encounter = props.encounter ?? location.state?.encounter ?? {};
  const edit = props.edit ?? location.state?.edit ?? false;
  const { showTableActions = true, showTableButtons = true } = props;

  const [warning, setWarning] = useState<any>({ ...newApVisitWarning });
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openToAdd, setOpenToAdd] = useState(true);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);
  const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);
  const [showCanceled, setShowCanceled] = useState(true);
  const [showPrev, setShowPrev] = useState(true);

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3196709905099521'
      }
    ]
  });

  const {
    data: warningsListResponse,
    refetch: fetchWarnings,
    isLoading
  } = useGetWarningsQuery({
    ...listRequest
  });

  const [saveWarning, saveWarningMutation] = useSaveWarningsMutation();
  const dispatch = useAppDispatch();

  const isSelected = (rowData: any) =>
    rowData && warning && rowData.key === warning.key ? 'selected-row' : '';

  useEffect(() => {
    if (showPrev) {
      setListRequest(prev => ({
        ...prev,
        filters: [
          { fieldName: 'patient_key', operator: 'match', value: patient?.key },
          {
            fieldName: 'status_lkey',
            operator: showCanceled ? 'notMatch' : 'match',
            value: '3196709905099521'
          },
          { fieldName: 'visit_key', operator: 'match', value: encounter.key }
        ]
      }));
    } else {
      setListRequest(prev => ({
        ...prev,
        filters: [
          { fieldName: 'patient_key', operator: 'match', value: patient?.key },
          {
            fieldName: 'status_lkey',
            operator: showCanceled ? 'notMatch' : 'match',
            value: '3196709905099521'
          }
        ]
      }));
    }
  }, [showPrev, showCanceled]);

  useEffect(() => {
    fetchWarnings();
  }, [saveWarningMutation, listRequest]);

  const handleClear = () => {
    setWarning({
      ...newApVisitWarning,
      sourceOfInformationLkey: null,
      severityLkey: null,
      warningTypeLkey: null
    });
  };

  const handleCancle = async () => {
    try {
      await saveWarning({
        ...warning,
        statusLkey: '3196709905099521',
        isValid: false,
        deletedAt: Date.now()
      }).unwrap();
      dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));
      await fetchWarnings();
      setOpenCancellationReasonModel(false);
    } catch {
      dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
    }
  };

  const handleResolved = async () => {
    try {
      await saveWarning({
        ...warning,
        statusLkey: '9766179572884232',
        resolvedAt: Date.now()
      }).unwrap();
      dispatch(notify('Resolved Successfully'));
      setShowPrev(false);
      await fetchWarnings();
      setOpenConfirmResolvedModel(false);
      setShowPrev(true);
      setWarning({ ...newApVisitWarning });
    } catch {
      dispatch(notify('Resolved Failed'));
    }
  };

  const handleUndoResolved = async () => {
    try {
      await saveWarning({ ...warning, statusLkey: '9766169155908512' }).unwrap();
      dispatch(notify('Undo Resolved Successfully'));
      setShowPrev(false);
      await fetchWarnings();
      setOpenConfirmUndoResolvedModel(false);
      setShowPrev(true);
      setWarning({ ...newApVisitWarning });
    } catch {
      dispatch(notify('Undo Resolved Failed'));
    }
  };

  const tableColumns: any[] = [
    {
      key: 'warningTypeLvalue',
      dataKey: 'warningTypeLvalue',
      title: <Translate>Warning Type</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.warningTypeLvalue?.lovDisplayVale
    },
    {
      key: 'severityLvalue',
      dataKey: 'severityLvalue',
      title: <Translate>Severity</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.severityLvalue?.lovDisplayVale
    },
    {
      key: 'firstTimeRecorded',
      dataKey: 'firstTimeRecorded',
      title: <Translate>First Time Recorded</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.firstTimeRecorded
          ? new Date(rowData.firstTimeRecorded).toLocaleDateString('en-GB')
          : 'Undefined'
    },
    {
      key: 'sourceOfInformationLvalue',
      dataKey: 'sourceOfInformationLvalue',
      title: <Translate>Source of information</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.sourceOfInformationLvalue?.lovDisplayVale || 'BY Patient'
    },
    {
      key: 'warning',
      dataKey: 'warning',
      title: <Translate>Warning</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.warning
    },
    {
      key: 'actionTake',
      dataKey: 'actionTake',
      title: <Translate>Action Taken</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.actionTake
    },
    {
      key: 'statusLvalue',
      dataKey: 'statusLvalue',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.statusLvalue?.lovDisplayVale
    },
    showTableActions && {
      key: 'actions',
      dataKey: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <MdModeEdit
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setOpenDetailsModal(true);
            setOpenToAdd(false);
          }}
        />
      )
    },
    {
      key: 'notes',
      dataKey: 'notes',
      title: <Translate>Notes</Translate>,
      expandable: true
    }
  ].filter(Boolean);

  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = warningsListResponse?.extraNumeric ?? 0;

  return (
    <div>
      <div className="bt-div-2">
        <div className="bt-left-2">
          {showTableButtons && (
            <>
              <MyButton
                prefixIcon={() => <CloseOutlineIcon />}
                onClick={() => setOpenCancellationReasonModel(true)}
                disabled={!edit ? (warning?.key == null ? true : false) : true}
              >
                Cancel
              </MyButton>
              <MyButton
                disabled={!edit ? (warning?.statusLkey != '9766169155908512' ? true : false) : true}
                prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
                onClick={() => setOpenConfirmResolvedModel(true)}
              >
                Resolved
              </MyButton>
              <MyButton
                prefixIcon={() => <ReloadIcon />}
                disabled={!edit ? (warning?.statusLkey != '9766179572884232' ? true : false) : true}
                onClick={() => setOpenConfirmUndoResolvedModel(true)}
              >
                Undo Resolved
              </MyButton>
              <Checkbox checked={!showPrev} onChange={() => setShowPrev(!showPrev)}>
                Show Previous Warnings
              </Checkbox>
            </>
          )}
          {/* Show Cancelled always showed*/}
          <Checkbox checked={!showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
            Show Cancelled
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

      <MyTable
        columns={tableColumns}
        data={warningsListResponse?.object || []}
        onRowClick={rowData => {
          setWarning(rowData);
          setOpenToAdd(false);
        }}
        rowClassName={isSelected}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => setListRequest({ ...listRequest, sortBy, sortType })}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(_, newPage) => setListRequest({ ...listRequest, pageNumber: newPage + 1 })}
        onRowsPerPageChange={e =>
          setListRequest({ ...listRequest, pageSize: parseInt(e.target.value, 10), pageNumber: 1 })
        }
        loading={isLoading}
      />

      {/* Cancel modal */}
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={warning}
        setObject={setWarning}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
        fieldLabel={'Cancellation Reason'}
        title={'Cancellation'}
      />

      {/* Resolve modal */}
      <MyModal
        open={openConfirmResolvedModel}
        setOpen={setOpenConfirmResolvedModel}
        actionButtonFunction={handleResolved}
        actionButtonLabel="Yes"
        title="Resolve"
        bodyheight="30vh"
        steps={[{ title: 'Is this warning resolved?', icon: <FontAwesomeIcon icon={faCheck} /> }]}
        content={<></>}
      />

      {/* Undo resolve modal */}
      <MyModal
        open={openConfirmUndoResolvedModel}
        setOpen={setOpenConfirmUndoResolvedModel}
        actionButtonFunction={handleUndoResolved}
        actionButtonLabel="Yes"
        title="Undo Resolve"
        bodyheight="30vh"
        steps={[
          { title: 'Is this warning active?', icon: <FontAwesomeIcon icon={faArrowRotateRight} /> }
        ]}
        content={<></>}
      />

      {/* Details modal */}
      <DetailsModal
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        warning={warning}
        setWarning={setWarning}
        handleClear={handleClear}
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
