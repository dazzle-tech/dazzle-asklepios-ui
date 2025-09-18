import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useGetAllergiesQuery, useSaveAllergiesMutation } from '@/services/observationService';
import { useGetAllergensQuery } from '@/services/setupService';
import { ApVisitAllergies } from '@/types/model-types';
import { newApVisitAllergies } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faArrowRotateRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload';
import React, { useEffect, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { Checkbox } from 'rsuite';
import DetailsModal from './DetailsModal';
import { formatDateWithoutSeconds } from '@/utils';
import './styles.less';
import { useLocation } from 'react-router-dom';

interface AllergiesProps {
  patient?: any;
  encounter?: any;
  edit?: boolean;
  showTableActions?: boolean;
  showTableButtons?: boolean;
}

const Allergies = (props: AllergiesProps) => {
  const location = useLocation();

  const patient = props.patient ?? location.state?.patient ?? {};
  const encounter = props.encounter ?? location.state?.encounter ?? {};
  const edit = props.edit ?? location.state?.edit ?? false;
  const { showTableActions = true, showTableButtons = true } = props;

  const [allerges, setAllerges] = useState<ApVisitAllergies>({ ...newApVisitAllergies });
  const [showCanceled, setShowCanceled] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPrev, setShowPrev] = useState(true);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openToAdd, setOpenToAdd] = useState(true);
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
    data: allergiesListResponse,
    refetch: fetchallerges,
    isLoading
  } = useGetAllergiesQuery({ ...listRequest });

  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);
  const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);

  const { data: allergensListToGetName } = useGetAllergensQuery({ ...initialListRequest });
  const [saveAllergies, saveAllergiesMutation] = useSaveAllergiesMutation();
  const dispatch = useAppDispatch();

  const isSelected = (rowData: any) =>
    rowData && allerges && rowData.key === allerges.key ? 'selected-row' : '';

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
    fetchallerges();
  }, [saveAllergiesMutation, listRequest]);

  useEffect(() => {
    if (showPrev) {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        },
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: encounter.key
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    } else {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
  }, [showCanceled]);

  const handleClear = () => {
    setAllerges({
      ...newApVisitAllergies,
      allergyTypeLkey: null,
      allergenKey: null,
      onsetLkey: null,
      reactionDescription: null,
      sourceOfInformationLkey: null,
      treatmentStrategyLkey: null,
      severityLkey: null,
      criticalityLkey: null,
      typeOfPropensityLkey: null
    });
  };

  const OpenCancellationReasonModel = () => {
    setOpenCancellationReasonModel(true);
  };
  const CloseCancellationReasonModel = () => {
    setOpenCancellationReasonModel(false);
  };
  const OpenConfirmUndoResolvedModel = () => {
    setOpenConfirmUndoResolvedModel(true);
  };
  const CloseConfirmUndoResolvedModel = () => {
    setOpenConfirmUndoResolvedModel(false);
  };
  const OpenConfirmResolvedModel = () => {
    setOpenConfirmResolvedModel(true);
  };
  const CloseConfirmResolvedModel = () => {
    setOpenConfirmResolvedModel(false);
  };
  const handleCancle = async () => {
    try {
      await saveAllergies({
        ...allerges,
        statusLkey: '3196709905099521',
        isValid: false,
        deletedAt: Date.now()
      }).unwrap();
      dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));
      fetchallerges().catch(error => console.error('Refetch failed:', error));
      setOpenCancellationReasonModel(false);
    } catch {
      dispatch(notify({ msg: 'Deleted Failed', sev: 'error' }));
    }
  };

  const handleResolved = async () => {
    setShowPrev(true);
    try {
      await saveAllergies({
        ...allerges,
        statusLkey: '9766179572884232',
        resolvedAt: Date.now()
      }).unwrap();
      dispatch(notify('Resolved Successfully'));
      setShowPrev(false);
      await fetchallerges().catch(error => console.error('Refetch failed:', error));
      setOpenConfirmResolvedModel(false);
      setShowPrev(true);
      setAllerges({ ...newApVisitAllergies });
    } catch {
      dispatch(notify('Resolved Fail'));
    }
  };

  const handleUndoResolved = async () => {
    setShowPrev(true);
    try {
      await saveAllergies({ ...allerges, statusLkey: '9766169155908512' }).unwrap();
      dispatch(notify('Undo Resolved Successfully'));
      setShowPrev(false);
      await fetchallerges().catch(error => console.error('Refetch failed:', error));
      setOpenConfirmUndoResolvedModel(false);
      setShowPrev(true);
      setAllerges({ ...newApVisitAllergies });
    } catch {
      dispatch(notify('Undo Resolved Fail'));
    }
  };

  const tableColumns: any[] = [
    {
      key: 'allergyTypeLvalue',
      dataKey: 'allergyTypeLvalue',
      title: <Translate>Allergy Type</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.allergyTypeLvalue?.lovDisplayVale
    },
    {
      key: 'allergenKey',
      dataKey: 'allergenKey',
      title: <Translate>Allergen</Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        if (!allergensListToGetName?.object) return 'Loading...';
        const found = allergensListToGetName.object.find(
          (item: any) => item.key === rowData.allergenKey
        );
        return found?.allergenName || 'No Name';
      }
    },
    {
      key: 'severityLvalue',
      dataKey: 'severityLvalue',
      title: <Translate>Severity</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.severityLvalue?.lovDisplayVale
    },
    {
      key: 'criticalityLkey',
      dataKey: 'criticalityLkey',
      title: <Translate>Certainty type</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.criticalityLkey
          ? rowData.criticalityLvalue?.lovDisplayVale
          : rowData.criticalityLkey
    },
    {
      key: 'onsetLvalue',
      dataKey: 'onsetLvalue',
      title: <Translate>Onset</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.onsetLvalue?.lovDisplayVale
    },
    {
      key: 'onsetDate',
      dataKey: 'onsetDate',
      title: <Translate>Onset Date Time</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.onsetDate ? new Date(rowData.onsetDate).toLocaleDateString('en-GB') : 'Undefined'
    },
    {
      key: 'treatmentStrategyLvalue',
      dataKey: 'treatmentStrategyLvalue',
      title: <Translate>Treatment Strategy</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.treatmentStrategyLvalue?.lovDisplayVale
    },
    {
      key: 'sourceOfInformationLvalue',
      dataKey: 'sourceOfInformationLvalue',
      title: <Translate>Source of information</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.sourceOfInformationLvalue?.lovDisplayVale || 'BY Patient'
    },
    {
      key: 'reactionDescription',
      dataKey: 'reactionDescription',
      title: <Translate>Reaction Description</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.reactionDescription
    },
    {
      key: 'typeOfPropensityLkey',
      dataKey: 'typeOfPropensityLkey',
      title: <Translate>Type Of Propensity</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.typeOfPropensityLkey
          ? rowData.typeOfPropensityLvalue?.lovDisplayVale
          : rowData.typeOfPropensityLkey
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
    },
    {
      key: 'certainty',
      dataKey: 'certainty',
      title: <Translate>Certainty</Translate>,
      expandable: true
    },
    {
      key: 'cancellationReason',
      dataKey: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true
    }
  ].filter(Boolean);

  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = allergiesListResponse?.extraNumeric ?? 0;

  const handlePageChange = (_: unknown, newPage: number) =>
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setListRequest({ ...listRequest, pageSize: parseInt(event.target.value, 10), pageNumber: 1 });

  return (
    <div>
      <div className="bt-div-2">
        <div className="bt-left-2">
          {showTableButtons && (
            <>
              <MyButton
                prefixIcon={() => <CloseOutlineIcon />}
                onClick={() => setOpenCancellationReasonModel(true)}
                disabled={!edit ? (allerges?.key == null ? true : false) : true}
              >
                Cancel
              </MyButton>
              <MyButton
                disabled={!edit ? (allerges?.statusLkey != '9766169155908512' ? true : false) : true}
                prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
                onClick={() => setOpenConfirmResolvedModel(true)}
              >
                Resolved
              </MyButton>
              <MyButton
                prefixIcon={() => <ReloadIcon />}
                disabled={!edit ? (allerges?.statusLkey != '9766179572884232' ? true : false) : true}
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
        data={allergiesListResponse?.object || []}
        onRowClick={rowData => {
          setAllerges(rowData);
          setEditing(rowData.statusLkey == '3196709905099521');
          setOpenToAdd(false);
        }}
        rowClassName={isSelected}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => setListRequest({ ...listRequest, sortBy, sortType })}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={isLoading}
      />
      {/* modal for cancell the allergy and write the reason */}
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={allerges}
        setObject={setAllerges}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
        fieldLabel={'Cancellation Reason'}
        title={'Cancellation'}
      />
      {/* open modal to resolve allergy */}
      <MyModal
        open={openConfirmResolvedModel}
        setOpen={setOpenConfirmResolvedModel}
        actionButtonFunction={handleResolved}
        actionButtonLabel="Yes"
        title="Resolve"
        bodyheight="30vh"
        steps={[{ title: 'Is this allergy resolved?', icon: <FontAwesomeIcon icon={faCheck} /> }]}
        content={<></>}
      />
      <MyModal
        open={openConfirmUndoResolvedModel}
        setOpen={setOpenConfirmUndoResolvedModel}
        actionButtonFunction={handleUndoResolved}
        actionButtonLabel="Yes"
        title="Undo Resolve"
        bodyheight="30vh"
        steps={[
          { title: 'Is this allergy active?', icon: <FontAwesomeIcon icon={faArrowRotateRight} /> }
        ]}
        content={<></>}
      />
      {/*modal for add details for allergy and save it */}
      <DetailsModal
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        allerges={allerges}
        setAllerges={setAllerges}
        handleClear={handleClear}
        edit={edit}
        patient={patient}
        encounter={encounter}
        fetchallerges={fetchallerges}
        openToAdd={openToAdd}
      />
    </div>
  );
};

export default Allergies;
