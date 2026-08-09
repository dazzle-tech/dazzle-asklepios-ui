import React, { useMemo, useState } from 'react';
import './Style.less';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import CancellationModal from '@/components/CancellationModal';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { Panel, Checkbox } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { skipToken } from '@reduxjs/toolkit/query';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/hooks';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { newGlasgowComaScaleAssessment } from '@/types/model-types-constructor-new';
import GlasgowComaScaleModal from './GlasgowComaScaleModal';
import {
  useGetGlasgowComaScaleAssessmentsByEncounterIdQuery,
  useAddGlasgowComaScaleAssessmentMutation,
  useUpdateGlasgowComaScaleAssessmentMutation,
  useCancelGlasgowComaScaleAssessmentMutation
} from '@/services/medicalsheetsEncounter/glasgowComaScaleAssessmentService';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
const GCS_ERROR_MAP: Record<string, string> = {
  'id.mismatch': 'Path id does not match payload id.',
  'id.notfound': 'Glasgow Coma Scale assessment not found.',
  'encounter.notfound': 'Encounter not found.',
  'patient.notfound': 'Patient not found.',
  'patient.encounter.mismatch': 'The provided patient does not belong to the provided encounter.',
  'gcs.score.invalid': 'Invalid GCS total score.',
  'gcs.cancel.invalid':
    'Cancelled By and Cancellation Reason are required when cancelling Glasgow Coma Scale assessment.',
  'db.constraint':
    'Database constraint violated while saving Glasgow Coma Scale assessment.'
};

const GCS_FIELD_LABELS: Record<string, string> = {
  patientId: 'Patient',
  encounterId: 'Encounter',
  eyeOpening: 'Eye Opening',
  verbalResponse: 'Verbal Response',
  motorResponse: 'Motor Response',
  cancellationReason: 'Cancellation Reason'
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? err ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const normalizeMsg = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    return msg || 'invalid value';
  };

  const toLabel = (field: string) => GCS_FIELD_LABELS[field] ?? field;

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map(
      (fe: any) => `• ${toLabel(fe.field)}: ${normalizeMsg(fe.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';

  const errorKey =
    (messageProp && messageProp.startsWith('error.')
      ? messageProp.substring(6)
      : undefined) || data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
};

const getRiskBadgeColors = (scoreInterpretation?: string | null) => {
  if (scoreInterpretation === 'MILD_TRAUMATIC_BRAIN_INJURY') {
    return {
      backgroundColor: 'var(--light-green)',
      color: 'var(--primary-green)'
    };
  }

  if (scoreInterpretation === 'MODERATE_TRAUMATIC_BRAIN_INJURY') {
    return {
      backgroundColor: 'var(--light-orange)',
      color: 'var(--primary-orange)'
    };
  }

  if (scoreInterpretation === 'SEVERE_TRAUMATIC_BRAIN_INJURY_COMA') {
    return {
      backgroundColor: 'var(--light-pink)',
      color: 'var(--primary-pink)'
    };
  }

  return {
    backgroundColor: 'var(--background-gray)',
    color: 'var(--primary-gray)'
  };
};

type GlasgowComaScaleProps = {
  patient?: any;
  encounter?: any;
  viewMode?: string;
};

const GlasgowComaScale = ({
  patient: patientProp,
  encounter: encounterProp,
  viewMode: viewModeProp
}: GlasgowComaScaleProps) => {
  const { state } = useLocation();

  const patient = patientProp ?? state?.patient;
  const encounter = encounterProp ?? state?.encounter;
  const viewMode = viewModeProp ?? state?.viewMode;

  const isReadOnly = viewMode === 'readOnly' || viewMode === 'View';
  const edit = viewMode === 'readOnly';

  const [openCancellationReasonModal, setOpenCancellationReasonModal] =
    useState(false);

  const [showCanceled, setShowCanceled] = useState(false);

  const patientId = patient?.id
    ? Number(patient.id)
    : patient?.key
      ? Number(patient.key)
      : undefined;

  const encounterId = encounter?.id
    ? Number(encounter.id)
    : undefined;

  const dispatch = useAppDispatch();

  const [gcsAssessment, setGcsAssessment] = useState<any>({
    ...newGlasgowComaScaleAssessment
  });

  const [openPopup, setOpenPopup] = useState(false);

  const [width] = useState(window.innerWidth);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 10,
    sort: 'id,desc'
  });

  const [sortColumn, setSortColumn] = useState('id');

  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');

  const {
    data: gcsListResponse,
    isFetching,
    refetch
  } = useGetGlasgowComaScaleAssessmentsByEncounterIdQuery(
    encounterId
      ? {
        encounterId,
        showCancelled: showCanceled,
        page: paginationParams.page,
        size: paginationParams.size,
        sort: paginationParams.sort
      }
      : skipToken
  );

  const tableData = useMemo(
    () => gcsListResponse?.data ?? gcsListResponse ?? [],
    [gcsListResponse]
  );

  const totalCount =
    gcsListResponse?.totalCount ?? tableData.length ?? 0;

  const [createGcsAssessment] =
    useAddGlasgowComaScaleAssessmentMutation();

  const [updateGcsAssessment] =
    useUpdateGlasgowComaScaleAssessmentMutation();

  const [cancelGcsAssessment] =
    useCancelGlasgowComaScaleAssessmentMutation();

  const validateRequiredFields = () => {
    const missingFields: string[] = [];

    if (!gcsAssessment?.eyeOpening)
      missingFields.push('Eye Opening');

    if (!gcsAssessment?.verbalResponse)
      missingFields.push('Verbal Response');

    if (!gcsAssessment?.motorResponse)
      missingFields.push('Motor Response');

    if (missingFields.length > 0) {
      const lines = missingFields.map(
        field => `• ${field}: is required`
      );

      dispatch(
        notify({
          msg: `Please fix the following fields:\n${lines.join('\n')}`,
          sev: 'warning'
        })
      );

      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateRequiredFields()) return false;

    try {
      dispatch(showSystemLoader());

      const payload = {
        ...(gcsAssessment?.id && {
          id: Number(gcsAssessment.id)
        }),

        patient: patientId ? { id: patientId } : null,

        encounter: encounterId ? { id: encounterId } : null,

        eyeOpening: gcsAssessment.eyeOpening,

        verbalResponse: gcsAssessment.verbalResponse,

        motorResponse: gcsAssessment.motorResponse
      };

      if (gcsAssessment?.id) {
        await updateGcsAssessment(payload as any).unwrap();

        dispatch(
          notify({
            msg: 'Glasgow Coma Scale assessment updated successfully',
            sev: 'success'
          })
        );
      } else {
        await createGcsAssessment(payload as any).unwrap();

        dispatch(
          notify({
            msg: 'Glasgow Coma Scale assessment created successfully',
            sev: 'success'
          })
        );
      }

      setOpenPopup(false);

      setGcsAssessment({
        ...newGlasgowComaScaleAssessment
      });

      refetch();

      return true;
    } catch (err: any) {
      handleCrudError(err, dispatch, GCS_ERROR_MAP);

      return false;
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleCancel = async () => {
    if (!gcsAssessment?.id) return;

    const cancellationReason =
      gcsAssessment?.cancellationReason?.trim();

    if (!cancellationReason) {
      dispatch(
        notify({
          msg: 'Cancellation Reason is required',
          sev: 'warning'
        })
      );

      return;
    }

    try {
      dispatch(showSystemLoader());

      await cancelGcsAssessment({
        id: gcsAssessment.id,
        cancellationReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Glasgow Coma Scale assessment cancelled successfully',
          sev: 'success'
        })
      );

      setOpenCancellationReasonModal(false);

      setGcsAssessment({
        ...newGlasgowComaScaleAssessment
      });

      refetch();
    } catch (err: any) {
      handleCrudError(err, dispatch, GCS_ERROR_MAP);
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const isSelected = (rowData: any) =>
    rowData?.id === gcsAssessment?.id
      ? 'selected-row'
      : '';

  const UserFullName = ({ login }: { login?: string }) => {
    const { data } = useGetUserFullNameByLoginQuery(
      login || skipToken
    );

    return <>{data || login || '-'}</>;
  };

  const tableColumns = [
    {
      key: 'totalScore',
      title: <Translate>GCS Score</Translate>,
      flexGrow: 1,
      render: (row: any) => row?.totalScore ?? '-'
    },

    {
      key: 'scoreInterpretation',
      title: <Translate>Level of Injury</Translate>,
      flexGrow: 3,
      render: (row: any) => {
        const colors = getRiskBadgeColors(
          row?.scoreInterpretation
        );

        return (
          <MyBadgeStatus
            backgroundColor={colors.backgroundColor}
            color={colors.color}
            contant={
              formatEnumString(
                row?.scoreInterpretation
              ) ?? '-'
            }
          />
        );
      }
    },

    {
      key: 'eyeOpening',
      title: <Translate>Eye Opening</Translate>,
      flexGrow: 2,
      render: (row: any) => (
        <p>
          {formatEnumString(row?.eyeOpening)} (
          {row?.eyeOpeningScore ?? 0})
        </p>
      )
    },

    {
      key: 'verbalResponse',
      title: <Translate>Verbal Response</Translate>,
      flexGrow: 2,
      render: (row: any) => (
        <p>
          {formatEnumString(row?.verbalResponse)} (
          {row?.verbalResponseScore ?? 0})
        </p>
      )
    },

    {
      key: 'motorResponse',
      title: <Translate>Motor Response</Translate>,
      flexGrow: 2,
      render: (row: any) => (
        <p>
          {formatEnumString(row?.motorResponse)} (
          {row?.motorResponseScore ?? 0})
        </p>
      )
    },

    {
      key: 'createdBy',
      title: <Translate>Created By/At</Translate>,
      flexGrow: 3,
      expandable: true,
      render: (row: any) => (
        <>
          <UserFullName login={row?.createdBy} />
          <br />
          <span className="date-table-style">
            {row?.createdDate
              ? formatDateWithoutSeconds(row.createdDate)
              : '-'}
          </span>
        </>
      )
    },

    {
      key: 'lastModifiedDate',
      title: <Translate>Updated By/At</Translate>,
      expandable: true,
      render: (row: any) =>
        row?.lastModifiedDate ? (
          <>
            <UserFullName login={row?.lastModifiedBy} />
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.lastModifiedDate)}
            </span>
          </>
        ) : (
          ''
        )
    },

    {
      key: 'cancelledByAt',
      title: <Translate>Cancelled By/At</Translate>,
      expandable: true,
      render: (row: any) =>
        row?.cancelledAt ? (
          <>
            <UserFullName login={row?.cancelledBy} />
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.cancelledAt)}
            </span>
          </>
        ) : (
          ''
        )
    },

    {
      key: 'cancellationReason',
      title: (
        <Translate>
          Cancellation Reason
        </Translate>
      ),
      expandable: true,
      render: (row: any) =>
        row?.cancellationReason ?? '-'
    },

    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 1,
      align: 'center',

      render: (rowData: any) => {
        if (isReadOnly) return null;

        return (
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center'
          }}
        >
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            style={{
              cursor: rowData?.cancelledAt
                ? 'not-allowed'
                : 'pointer',

              opacity: rowData?.cancelledAt
                ? 0.5
                : 1
            }}
            onClick={e => {
              e.stopPropagation();

              if (rowData?.cancelledAt) return;

              setGcsAssessment({
                ...rowData
              });

              setOpenPopup(true);
            }}
          />

          <MdDelete
            size={22}
            fill="var(--rs-red-500, #f44336)"
            title="Cancel"
            style={{
              cursor: rowData?.cancelledAt
                ? 'not-allowed'
                : 'pointer',
              opacity: rowData?.cancelledAt
                ? 0.5
                : 1
            }}
            onClick={e => {
              e.stopPropagation();

              if (rowData?.cancelledAt) return;

              setGcsAssessment(rowData);

              setOpenCancellationReasonModal(true);
            }}
          />
        </div>
        );
      }
    }
  ].filter(column => !isReadOnly || column.key !== 'actions');

  const handlePageChange = (
    _event: any,
    newPage: number
  ) => {
    setPaginationParams({
      ...paginationParams,
      page: newPage
    });
  };

  const handleSortChange = (
    column: string,
    type: 'asc' | 'desc'
  ) => {
    setSortColumn(column);

    setSortType(type);

    setPaginationParams({
      ...paginationParams,
      sort: `${column},${type}`,
      page: 0
    });
  };

  const direction =
    localStorage.getItem('direction') || 'LTR';

  const dir =
    direction === 'RTL'
      ? 'rtl'
      : 'ltr';

return (
    <div
      dir={dir}
      className={edit ? 'disabled-panel' : ''}
    >
      <Panel dir={dir}>
        <div className="gcs-table-header">
          <Checkbox
            checked={showCanceled}
            onChange={() => {
              setShowCanceled(prev => !prev);

              setPaginationParams(prev => ({
                ...prev,
                page: 0,
                timestamp: Date.now()
              }));
            }}
            disabled={isReadOnly}
          >
            <Translate>Show Cancelled</Translate>
          </Checkbox>

          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setGcsAssessment({
                ...newGlasgowComaScaleAssessment
              });

              setOpenPopup(true);
            }}
            width="109px"
            disabled={isReadOnly}
          >
            Add New
          </MyButton>
        </div>

        <MyTable
          data={tableData}
          totalCount={totalCount}
          loading={isFetching}
          columns={tableColumns}
          rowClassName={isSelected}
          onRowClick={(rowData: any) => {
            setGcsAssessment(rowData);
          }}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={handlePageChange}
          onRowsPerPageChange={(e: any) => {
            const newSize = Number(e.target.value);

            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0
            });
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
        />

        <CancellationModal
          open={openCancellationReasonModal}
          setOpen={setOpenCancellationReasonModal}
          object={gcsAssessment}
          setObject={setGcsAssessment}
          handleCancle={handleCancel}
          fieldName="cancellationReason"
          fieldLabel="Cancellation Reason"
          title="Cancellation"
        />

        <GlasgowComaScaleModal
          open={openPopup}
          setOpen={setOpenPopup}
          width={width}
          gcsAssessment={gcsAssessment}
          setGcsAssessment={setGcsAssessment}
          handleSave={handleSave}
          readOnly={isReadOnly}
        />
      </Panel>
    </div>
  );
};

export default GlasgowComaScale;