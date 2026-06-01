import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
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
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  useCancelPatientAllergyMutation,
  useGetPatientAllergiesByPatientIdQuery,
  useResolvePatientAllergyMutation,
  useUndoResolvePatientAllergyMutation
} from '@/services/encounters/patientAllergiesService';
import { PatientAllergiesResponseVM } from '@/types/model-types-new';
import { patientAllergiesResponseVM } from '@/types/model-types-constructor-new';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { useGetAllergensQuery } from '@/services/setup/allergensService';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import AllergyDetailsSection from './AllergyDetailsSection';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import clsx from 'clsx';

interface AllergiesProps {
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

const Allergies = (props: AllergiesProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const patient = props.patient ?? location.state?.patient ?? {};
  const encounter = props.encounter ?? location.state?.encounter ?? {};

  const viewMode = location.state?.viewMode;

  const edit = viewMode === 'readOnly' || props.edit;

  const [allerges, setAllerges] = useState<PatientAllergiesResponseVM>({
    ...patientAllergiesResponseVM
  });
  const [showCanceled, setShowCanceled] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openToAdd, setOpenToAdd] = useState(true);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);
  const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);

  // Pagination values
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // fetch lists
  const { data: allergensListResponse } = useGetAllergensQuery({});
  const { data: medicationClassesListResponse } = useGetAllMedicationCategoriesClassesQuery({});
  const {
    data: allergiesListResponse,
    refetch: fetchallerges,
    isLoading
  } = useGetPatientAllergiesByPatientIdQuery(
    {
      patientId: patient?.id,
      showCancelled: showCanceled,
      ...paginationParams
    },
    {
      skip: !patient?.id
    }
  );
  // number of all patient allergies
  const totalCount = allergiesListResponse?.totalCount ?? 0;

  // actions
  const [cancelPatientAllergy] = useCancelPatientAllergyMutation();
  const [resolvePatientAllergy] = useResolvePatientAllergyMutation();
  const [undoResolvePatientAllergy] = useUndoResolvePatientAllergyMutation();

  // class name for selected row
  const isSelected = (rowData: PatientAllergiesResponseVM) =>
    rowData && allerges && rowData.id === allerges?.id ? 'selected-row' : '';

  // table column
  const tableColumns: any[] = [
    {
      key: 'allergenType',
      title: <Translate>Allergy Type</Translate>,
      render: (rowData: PatientAllergiesResponseVM) => (
        <p>{formatEnumString(rowData.allergenType)}</p>
      )
    },

    {
      key: 'allergen',
      title: <Translate>Allergen</Translate>,
      render: (rowData: PatientAllergiesResponseVM) => {
        // ✅ NEW → OTHER TYPE
        if (rowData?.allergenType === 'OTHER') {
          return <p>{rowData?.allergenName ?? '-'}</p>;
        }

        // existing logic
        if (rowData?.allergenId && allergensListResponse?.data) {
          const allergen = allergensListResponse.data.find(
            (item: any) => item.id === rowData.allergenId
          );
          return <p>{allergen?.name ?? '-'}</p>;
        } else if (rowData?.medicationClassId && medicationClassesListResponse) {
          const medicationClass = medicationClassesListResponse.find(
            (item: any) => item.id === rowData.medicationClassId
          );
          return <p>{medicationClass?.name ?? '-'}</p>;
        }

        return <p>-</p>;
      }
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
    {
      key: 'severity',
      title: <Translate>Severity</Translate>,
      render: rowData => <p>{formatEnumString(rowData?.severity)}</p>
    },
    props.showTableActions !== false && {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: rowData => {
        console.log('🧪 Rendering rows for:', rowData);
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
              setAllerges(rowData);
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

      render: (row: PatientAllergiesResponseVM) => (
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
      render: (row: PatientAllergiesResponseVM) => (
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
      render: (row: PatientAllergiesResponseVM) => (
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

  // handle clear data
  const handleClear = () => {
    setAllerges({
      ...patientAllergiesResponseVM
    });
  };

  // handle cancel allergy
  const handleCancel = async () => {
    let reason;
    if (allerges?.cancellationReason) {
      reason = allerges?.cancellationReason;
    } else {
      reason = undefined;
      dispatch(notify({ msg: 'Cancellation Reason is required', sev: 'warning' }));
    }
    if (reason) {
      try {
        const result = await cancelPatientAllergy({
          id: allerges.id,
          cancelledBy: authSlice?.user?.firstName + ' ' + authSlice?.user?.lastName,
          reason: reason // optional
        }).unwrap();
        setAllerges(result);
        setOpenCancellationReasonModel(false);
        dispatch(notify({ msg: 'Allergy cancelled successfully', sev: 'success' }));
        await fetchallerges();
      } catch (error) {
        dispatch(notify({ msg: 'Failed to cancel allergy', sev: 'warning' }));
      }
    }
  };

  // handle resolve allergy
  const handleResolve = async () => {
    try {
      const result = await resolvePatientAllergy({
        id: allerges.id,
        resolvedBy: authSlice?.user?.firstName + ' ' + authSlice?.user?.lastName
      }).unwrap();
      setAllerges(result);

      dispatch(notify({ msg: 'Allergy resolved successfully', sev: 'success' }));
      setOpenConfirmResolvedModel(false);
      await fetchallerges();
    } catch (error) {
      dispatch(notify({ msg: 'Failed to resolve allergy', sev: 'error' }));
    }
  };

  // handle undo resolve
  const handleUndoResolve = async () => {
    try {
      const result = await undoResolvePatientAllergy({
        id: allerges.id
      }).unwrap();
      setOpenConfirmUndoResolvedModel(false);
      setAllerges(result);
      dispatch(notify({ msg: 'Resolve undone successfully', sev: 'success' }));
      await fetchallerges();
    } catch (error) {
      dispatch(notify({ msg: 'Failed to undo resolve', sev: 'error' }));
    }
  };

  // ──────────────────────────── PAGINATION ────────────────────────────
  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  const tablebuttons = (      <div className="bt-div-2">
        <div className="bt-left-2">
          <MyButton
            prefixIcon={() => <CloseOutlineIcon />}
            onClick={() => setOpenCancellationReasonModel(true)}
            disabled={!allerges?.id || allerges?.status === 'CANCELLED'}
          >
            Cancel
          </MyButton>

          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
            onClick={() => setOpenConfirmResolvedModel(true)}
            disabled={
              !allerges?.id || allerges?.status === 'RESOLVED' || allerges?.status === 'CANCELLED'
            }
          >
            Resolved
          </MyButton>

          <MyButton
            prefixIcon={() => <ReloadIcon />}
            onClick={() => setOpenConfirmUndoResolvedModel(true)}
            disabled={
              !allerges?.id || allerges?.status === 'ACTIVE' || allerges?.status === 'CANCELLED'
            }
          >
            Undo Resolved
          </MyButton>

          <Checkbox checked={showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
            <Translate>Show Cancelled</Translate>
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
      </div>);

  return (
    <div
      dir={dir}
      className={clsx({ 'disabled-panel': edit })}
      style={edit ? { pointerEvents: 'none', opacity: 0.6 } : {}}
    >

      <div className="container-of-table-and-section-patient-allergy">
        <MyTable
          columns={tableColumns}
          data={allergiesListResponse?.data || []}
          totalCount={totalCount}
          onRowClick={rowData => {
            if (allerges?.id && rowData.id === allerges.id) {
              handleClear();
            } else {
              setAllerges(rowData);
              setOpenToAdd(false);
            }
          }}
          tableButtons={tablebuttons}
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
        {allerges?.id && (
          <AllergyDetailsSection allerges={allerges} setAllerges={setAllerges} edit={edit} />
        )}
      </div>
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={allerges}
        setObject={setAllerges}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        fieldLabel="Cancellation Reason"
        title="Cancellation"
      />

      <DeletionConfirmationModal
        open={openConfirmResolvedModel}
        setOpen={setOpenConfirmResolvedModel}
        itemToDelete="Patient Allergy"
        actionType="confirm"
        actionButtonFunction={handleResolve}
        confirmationQuestion="Are you sure you want to Resolve this Patient Allergy?"
      />

      <DeletionConfirmationModal
        open={openConfirmUndoResolvedModel}
        setOpen={setOpenConfirmUndoResolvedModel}
        itemToDelete="Patient Allergy"
        actionType="confirm"
        actionButtonFunction={handleUndoResolve}
        confirmationQuestion="Are you sure you want to Undo Resolve this Patient Allergy?"
      />

      <DetailsModal
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        allerges={allerges}
        setAllerges={setAllerges}
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
