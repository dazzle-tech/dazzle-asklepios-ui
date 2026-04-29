import React, { useEffect, useMemo, useState } from 'react';
import './styles.less';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { Loader, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import CancellationModal from '@/components/CancellationModal';
import AddEditReferralRequest from './AddEditReferralRequest';
import ReferralRequestPreview from './ReferralRequestPreview';
import {
  useGetReferralRequestsByEncounterQuery,
  useCreateReferralRequestMutation,
  useUpdateReferralRequestMutation
} from '@/services/medicalsheetsEncounter/referralRequestService';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { newReferralRequest } from '@/types/model-types-constructor-new';
import { skipToken } from '@reduxjs/toolkit/query';
import { useLocation } from 'react-router-dom';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { MdModeEdit } from 'react-icons/md';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
const REFERRAL_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Referral request data is required.',
  'patient.invalid': 'Invalid patient id.',
  'encounter.invalid': 'Invalid encounter id.',
  'db.constraint': 'Database constraint violated while saving referral request.',
  notfound: 'Referral request not found.'
};

const REFERRAL_FIELD_LABELS: Record<string, string> = {
  patientId: 'Patient',
  encounterId: 'Encounter',
  referralType: 'Referral Type',
  fromFacilityId: 'From Facility',
  fromDepartmentId: 'From Department',
  toFacilityId: 'To Facility',
  toDepartmentId: 'To Department',
  priority: 'Priority',
  referralReason: 'Referral Reason'
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? err ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const normalizeMsg = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size')) return 'length is out of range';
    if (m.includes('greater')) return 'value is too small';
    if (m.includes('less')) return 'value is too large';
    return msg || 'invalid value';
  };

  const toLabel = (field: string) => REFERRAL_FIELD_LABELS[field] ?? field;

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
    (messageProp && messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ||
    data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
};

const ReferralRequest = () => {
  const { state } = useLocation();
  const { patient, encounter } = state || {};
  const viewMode = state?.viewMode;
  const edit = viewMode === 'readOnly';


  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);
  const selectedDepartment = useAppSelector(state => state.auth?.selectedDepartment);

  const patientId = patient?.id
    ? Number(patient.id)
    : patient?.key
      ? Number(patient.key)
      : undefined;

  const encounterId = Number(encounter.id)


  const dispatch = useAppDispatch();

  const [referral, setReferral] = useState<any>({ ...newReferralRequest });
  const [openPopup, setOpenPopup] = useState(false);
  const [width] = useState(window.innerWidth);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState({});

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 10,
    sort: 'id,desc'
  });

  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');

  const [departmentsMap, setDepartmentsMap] = useState<Record<number, string>>({});
  const [facilityMap, setFacilityMap] = useState<Record<number, string>>({});
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const { data: referralListResponse, isFetching, refetch } =
    useGetReferralRequestsByEncounterQuery(
      encounterId
        ? {
          encounterId,
          page: paginationParams.page,
          size: paginationParams.size,
          sort: paginationParams.sort
        }
        : skipToken
    );

  const tableData = useMemo(
    () => referralListResponse?.data ?? referralListResponse ?? [],
    [referralListResponse]
  );
  const totalCount = referralListResponse?.totalCount ?? tableData.length ?? 0;

  const [createReferral] = useCreateReferralRequestMutation();
  const [updateReferral] = useUpdateReferralRequestMutation();
  const [getDepartmentsBulk] = useGetDepartmentsBulkMutation();

  const {
    data: facilitiesResponse,
    isFetching: isFacilitiesFetching,
    isLoading: isFacilitiesLoading
  } = useGetAllFacilitiesQuery({});

  useEffect(() => {
    if (!facilitiesResponse?.length) {
      setFacilityMap({});
      return;
    }

    const map: Record<number, string> = {};
    facilitiesResponse.forEach((f: any) => {
      map[f.id] = f.name ?? '';
    });
    setFacilityMap(map);
  }, [facilitiesResponse]);

  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      if (!tableData.length) {
        if (!cancelled) {
          setDepartmentsMap({});
          setDepartmentsLoading(false);
        }
        return;
      }

      const uniqueIds = Array.from(
        new Set(
          tableData
            .flatMap((row: any) => [row.fromDepartmentId, row.toDepartmentId])
            .filter((id): id is number => id != null && id !== undefined && Number(id) > 0)
        )
      ) as number[];

      if (!uniqueIds.length) {
        if (!cancelled) {
          setDepartmentsMap({});
          setDepartmentsLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) setDepartmentsLoading(true);
        const departments = await getDepartmentsBulk(uniqueIds).unwrap();

        if (cancelled) return;

        setDepartmentsMap(
          Object.fromEntries((departments ?? []).map((d: any) => [d.id, d.name]))
        );
      } catch {
        if (!cancelled) {
          setDepartmentsMap({});
        }
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    };

    loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [tableData, getDepartmentsBulk]);

  const validateRequiredFields = () => {
    const missingFields: string[] = [];

    if (!referral?.referralType) missingFields.push('Referral Type');
    if (!referral?.priority) missingFields.push('Priority');
    if (!referral?.referralReason) missingFields.push('Referral Reason');
    if (!referral?.toDepartmentId) missingFields.push('To Department');

    if (referral?.referralType === 'EXTERNAL' && !referral?.toFacilityId) {
      missingFields.push('To Facility');
    }

    if (missingFields.length > 0) {
      const lines = missingFields.map(field => `• ${field}: is required`);
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
        ...(referral?.id && { id: Number(referral.id) }),
        patientId,
        encounterId,
        referralType: referral.referralType,
        fromFacilityId: selectedFacility?.id ? Number(selectedFacility.id) : null,
        fromDepartmentId: selectedDepartment?.departmentId ? Number(selectedDepartment.departmentId) : null,
        toFacilityId:
          referral?.referralType === 'INTERNAL'
            ? selectedFacility?.id
              ? Number(selectedFacility.id)
              : null
            : referral?.toFacilityId
              ? Number(referral.toFacilityId)
              : null,
        toDepartmentId: referral?.toDepartmentId ? Number(referral.toDepartmentId) : null,
        referralReason: referral.referralReason,
        priority: referral.priority,
        status: referral.status ?? 'PENDING'
      };

      if (referral?.id) {
        await updateReferral({ id: referral.id, data: payload }).unwrap();
        dispatch(notify({ msg: 'Referral updated successfully', sev: 'success' }));
      } else {
        await createReferral(payload as any).unwrap();
        dispatch(notify({ msg: 'Referral created successfully', sev: 'success' }));
      }

      setOpenPopup(false);
      setReferral({ ...newReferralRequest });
      refetch();
      return true;
    } catch (err: any) {
      handleCrudError(err, dispatch, REFERRAL_ERROR_MAP);
      return false;
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const isSelected = (rowData: any) => (rowData?.id === referral?.id ? 'selected-row' : '');

  const tableColumns = [
    {
      key: 'referralType',
      title: <Translate>Referral Type</Translate>,
      flexGrow: 2,
      render: (rowData: any) => <p>{formatEnumString(rowData?.referralType)}</p>
    },
    {
      key: 'fromFacilityId',
      title: <Translate>From Facility</Translate>,
      flexGrow: 2,
      render: (row: any) => facilityMap[row.fromFacilityId] ?? '-'
    },
    {
      key: 'fromDepartmentId',
      title: <Translate>From Department</Translate>,
      flexGrow: 2,
      render: (row: any) => departmentsMap[row.fromDepartmentId] ?? '-'
    },
    {
      key: 'toFacilityId',
      title: <Translate>To Facility</Translate>,
      flexGrow: 2,
      render: (row: any) => facilityMap[row.toFacilityId] ?? '-'
    },
    {
      key: 'toDepartmentId',
      title: <Translate>To Department</Translate>,
      flexGrow: 2,
      render: (row: any) => departmentsMap[row.toDepartmentId] ?? '-'
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      flexGrow: 2,
      render: (rowData: any) => <p>{formatEnumString(rowData?.priority)}</p>
    },
    {
      key: 'referralReason',
      title: <Translate>Reason</Translate>,
      flexGrow: 3
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (row: any) => {
        const statusUpper = String(row?.status ?? '').toUpperCase();

        const statusColorMap: Record<string, string> = {
          REQUESTED: '#fd7e14',
          ACCEPTED: '#198754',
          REJECTED: '#dc3545'
        };
        return (
          <MyBadgeStatus
            color={statusColorMap[statusUpper] ?? '#969fb0'}
            contant={formatEnumString(row?.status) ?? row?.status ?? '-'}
          />
        );
      }
    },
    {
      key: 'createdBy',
      title: <Translate>Created By/At</Translate>,
      flexGrow: 3,
      expandable: true,

      render: (row: any) => (
        <>
          {row?.createdBy ?? '-'}
          <br />
          <span className="date-table-style">
            {row?.createdDate ? formatDateWithoutSeconds(row.createdDate) : '-'}
          </span>
        </>
      )
    },

    {
      key: 'acceptedBy',
      title: <Translate>Accepted By/At</Translate>,
      flexGrow: 3,
      expandable: true,
      render: (row: any) => (
        <>
          {row?.acceptedBy ?? '-'}
          <br />
          <span className="date-table-style">
            {row?.acceptedDate ? formatDateWithoutSeconds(row.acceptedDate) : '-'}
          </span>
        </>
      )
    },
    {
      key: 'rejectedBy',
      title: <Translate>Rejected By/At</Translate>,
      flexGrow: 3,
      expandable: true,

      render: (row: any) => (
        <>
          {row?.rejectedBy ?? '-'}
          <br />
          <span className="date-table-style">
            {row?.rejectedDate ? formatDateWithoutSeconds(row.rejectedDate) : '-'}
          </span>
        </>
      )
    },
    {
      key: 'rejectReason',
      title: <Translate>Reject Reason</Translate>,
      flexGrow: 3,
      expandable: true,

      render: (row: any) => row?.rejectReason ?? '-'
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 1,
      align: 'center',
      render: (rowData: any) => (
        <MdModeEdit
          className="icons-style"
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={e => {
            e.stopPropagation();
            setReferral({ ...rowData });
            setOpenPopup(true);
          }}
        />
      )
    }
  ];

  const handlePageChange = (_event: any, newPage: number) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    setPaginationParams({ ...paginationParams, sort: `${column},${type}`, page: 0 });
  };

  const listsLoading = isFacilitiesLoading || isFacilitiesFetching || departmentsLoading;
  const pageLoading = isFetching || listsLoading;
          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
  <div dir={dir} className={edit ? 'disabled-panel' : ''}>
    <Panel dir={dir}>
      <div style={{ position: 'relative' }}>
        {listsLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              background: 'rgba(255,255,255,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8
            }}
          >
            <Loader size="md" content="Loading data..." vertical />
          </div>
        )}

        <MyTable
          data={tableData}
          totalCount={totalCount}
          loading={pageLoading}
          columns={tableColumns}
          rowClassName={isSelected}
          onRowClick={(rowData: any) => {
            setReferral(rowData);
          }}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={handlePageChange}
          onRowsPerPageChange={(e: any) => {
            const newSize = Number(e.target.value);
            setPaginationParams({ ...paginationParams, size: newSize, page: 0 });
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
          tableButtons={
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => {
                setReferral({ ...newReferralRequest });
                setOpenPopup(true);
              }}
              width="109px"
              disabled={listsLoading}
            >
              Add New
            </MyButton>
          }
        />
      </div>

      <AddEditReferralRequest
        open={openPopup}
        setOpen={setOpenPopup}
        referral={referral}
        setReferral={setReferral}
        handleSave={handleSave}
        width={width}
      />
      <CancellationModal
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        object={cancelObject}
        setObject={setCancelObject}
        handleCancle={() => setOpenCancelModal(false)}
        title="Cancel Referral"
        fieldLabel="Reason for cancellation"
        fieldName="cancelReason"
      />
    </Panel>
  </div>
  );
};

export default ReferralRequest;