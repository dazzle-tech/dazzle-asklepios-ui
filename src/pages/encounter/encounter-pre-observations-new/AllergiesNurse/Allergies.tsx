// src/components/Allergies/Allergies.tsx  (نفس كودك + فقط تأكيد على dispatch عند الإضافة في DetailsModal)
import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
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
import './styles.less';
import { useLocation } from 'react-router-dom';
import { formatDateWithoutSeconds } from '@/utils';
import { resetRefetchEncounter, setRefetchEncounter } from '@/reducers/refetchEncounterState';

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
   const authSlice = useAppSelector(state => state.auth);

  const [allerges, setAllerges] = useState<ApVisitAllergies>({ ...newApVisitAllergies });
  const [showCanceled, setShowCanceled] = useState(true);
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
  const [saveAllergies] = useSaveAllergiesMutation();
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
  }, [showPrev, showCanceled, patient?.key, encounter.key]);

  useEffect(() => {
    fetchallerges();
  }, [listRequest, fetchallerges]);

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

  const handleCancle = async () => {
    try {
      await saveAllergies({
        ...allerges,
        statusLkey: '3196709905099521',
        isValid: false,
        deletedAt: Date.now(),
        deletedBy: authSlice.user?.login
      }).unwrap();

      dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));
      dispatch(setRefetchEncounter(true));
      await fetchallerges();

      setOpenCancellationReasonModel(false);
    } catch {
      dispatch(notify({ msg: 'Deleted Failed', sev: 'error' }));
    }
  };

  const handleResolved = async () => {
    try {
      await saveAllergies({
        ...allerges,
        statusLkey: '9766179572884232',
        resolvedAt: Date.now(),
        resolvedBy: authSlice.user?.login
      }).unwrap();

      dispatch(notify('Resolved Successfully'));
      dispatch(setRefetchEncounter(true));
      await fetchallerges();
       dispatch(resetRefetchEncounter());
      dispatch(setRefetchEncounter(true));
      setOpenConfirmResolvedModel(false);
      setAllerges({ ...newApVisitAllergies });
    } catch {
      dispatch(notify('Resolved Fail'));
    }
  };

  const handleUndoResolved = async () => {
    try {
      await saveAllergies({ ...allerges, statusLkey: '9766169155908512' }).unwrap();

      dispatch(notify('Undo Resolved Successfully'));
      dispatch(setRefetchEncounter(true)); 
      await fetchallerges();
       dispatch(resetRefetchEncounter());
      dispatch(setRefetchEncounter(true));

      setOpenConfirmUndoResolvedModel(false);
      setAllerges({ ...newApVisitAllergies });
    } catch {
      dispatch(notify('Undo Resolved Fail'));
    }
  };

  const tableColumns: any[] = [
    {
      key: 'allergyTypeLvalue',
      dataKey: 'allergyTypeLvalue',
      title: <Translate>Allergy Typesss</Translate>,
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
      key: 'statusLvalue',
      dataKey: 'statusLvalue',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.statusLvalue?.lovDisplayVale
    },
    props.showTableActions !== false && {
      key: 'actions',
      dataKey: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 1,
      render: () => (
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
          key: 'createdByAt',
          title: 'Created By/At',
          dataKey: 'createdByAt',
          width: 220,
          expandable: true,
    
          render: (row: any) => (
            <>
              {row.createdBy}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
            </>
          )
        },
        {
          key: 'resolvedByAt',
          title: 'Resolved By/At',
          dataKey: 'resolvedByAt',
          width: 220,
          expandable: true,
          render: (row: any) => (
            <>
              {row.resolvedBy}
              <br />  
              <span className="date-table-style">{formatDateWithoutSeconds(row.resolvedAt)}</span>
            </>
          )
    
        },
        {
          key: 'deletedByAt',
          title: 'Cancelled By/At',
          dataKey: 'deletedByAt',
          width: 220,
          expandable: true,
          render: (row: any) => (
            <>
              {row.deletedBy}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
            </>
          )
    
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
            Show Previous Allergies
          </Checkbox>

          <Checkbox checked={!showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
            Show Cancelled
          </Checkbox>
        </div>

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
            Add Allergy
          </MyButton>
        </div>
      </div>

      <MyTable
        columns={tableColumns}
        data={allergiesListResponse?.object || []}
        onRowClick={rowData => {
          setAllerges(rowData);
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

      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={allerges}
        setObject={setAllerges}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
        fieldLabel="Cancellation Reason"
        title="Cancellation"
      />

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
