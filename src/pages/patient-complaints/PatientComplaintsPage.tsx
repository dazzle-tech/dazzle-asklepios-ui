import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Form } from 'rsuite';
import { MdVisibility } from 'react-icons/md';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetUsersByFacilityQuery } from '@/services/security/UserRoleService';
import {
  useGetPatientComplaintSummaryQuery,
  useSearchPatientComplaintsQuery
} from '@/services/patient-complaints/patientComplaintService';
import { useEnumOptions } from '@/services/enumsApi';
import ComplaintDetailModal from './ComplaintDetailModal';
import {
  PATIENT_COMPLAINT_FEEDBACK_TYPE_ENUM,
  PATIENT_COMPLAINT_FEEDBACK_TYPE_LABEL_OVERRIDES,
  PATIENT_COMPLAINT_STATUS_ENUM,
  PATIENT_COMPLAINT_TYPE_ENUM,
  PATIENT_COMPLAINT_TYPE_LABEL_OVERRIDES,
  dateInputToInstant,
  formatDisplayDate,
  formatStaffUserLabel,
  getStatusColor,
  isComplaintOverdue,
  resolveEnumLabel,
  type ComplaintStatus,
  type PatientComplaintListItem,
  type SummaryFilter
} from './constants';
import './styles.less';

const renderComplaintStatus = (row: PatientComplaintListItem) => {
  const statusBadge = (
    <MyBadgeStatus contant={row.status} color={getStatusColor(row.status)} />
  );

  if (!isComplaintOverdue(row)) {
    return <div className="patient-complaint-status-cell">{statusBadge}</div>;
  }

  return (
    <div className="patient-complaint-status-cell">
      <Badge
        className="patient-complaint-overdue-badge"
        color="red"
        content={<Translate>Overdue</Translate>}
      >
        {statusBadge}
      </Badge>
    </div>
  );
};

type FilterRecord = {
  search: string;
  status: ComplaintStatus | null;
  assignedUserId: number | string | null;
  receivedDateFrom: string;
  receivedDateTo: string;
};

const EMPTY_FILTERS: FilterRecord = {
  search: '',
  status: null,
  assignedUserId: null,
  receivedDateFrom: '',
  receivedDateTo: ''
};

const PatientComplaintsPage = () => {
  const dispatch = useAppDispatch();
  const selectedDepartment = useAppSelector(state => state.auth.selectedDepartment);
  const facilityId = selectedDepartment?.facilityId
    ? Number(selectedDepartment.facilityId)
    : null;

  const [filterRecord, setFilterRecord] = useState<FilterRecord>({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<FilterRecord>({ ...EMPTY_FILTERS });
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(setPageCode('PATIENT_COMPLAINTS'));
    dispatch(setDivContent('Patient Complaints'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const { data: facilityUsers = [] } = useGetUsersByFacilityQuery(facilityId as number, {
    skip: facilityId == null || Number.isNaN(facilityId)
  });

  const complaintStatusOptions = useEnumOptions(PATIENT_COMPLAINT_STATUS_ENUM);
  const feedbackTypeOptions = useEnumOptions(PATIENT_COMPLAINT_FEEDBACK_TYPE_ENUM, {
    labelOverrides: PATIENT_COMPLAINT_FEEDBACK_TYPE_LABEL_OVERRIDES
  });
  const complaintTypeOptions = useEnumOptions(PATIENT_COMPLAINT_TYPE_ENUM, {
    labelOverrides: PATIENT_COMPLAINT_TYPE_LABEL_OVERRIDES
  });

  const assigneeOptions = useMemo(
    () =>
      (facilityUsers as any[])
        .filter(user => user?.id != null)
        .map(user => ({
          label: formatStaffUserLabel(user),
          value: Number(user.id)
        })),
    [facilityUsers]
  );

  const searchParams = useMemo(
    () => ({
      page,
      size: rowsPerPage,
      sort: 'receivedDate,desc',
      search: appliedFilters.search.trim() || undefined,
      status: appliedFilters.status || undefined,
      assignedUserId:
        appliedFilters.assignedUserId != null && appliedFilters.assignedUserId !== ''
          ? Number(appliedFilters.assignedUserId)
          : undefined,
      receivedFrom: appliedFilters.receivedDateFrom
        ? dateInputToInstant(appliedFilters.receivedDateFrom, false)
        : undefined,
      receivedTo: appliedFilters.receivedDateTo
        ? dateInputToInstant(appliedFilters.receivedDateTo, true)
        : undefined,
      summaryFilter: summaryFilter || undefined
    }),
    [appliedFilters, page, rowsPerPage, summaryFilter]
  );

  const {
    data: complaintsPage,
    isFetching: listFetching,
    isError: listError
  } = useSearchPatientComplaintsQuery(searchParams);

  const { data: summary, isFetching: summaryFetching } = useGetPatientComplaintSummaryQuery();

  const complaints = complaintsPage?.data ?? [];
  const totalCount = complaintsPage?.totalCount ?? 0;

  const summaryCounts = {
    NEW: summary?.newCount ?? 0,
    UNASSIGNED: summary?.unassignedCount ?? 0,
    ASSIGNED_TO_ME: summary?.assignedToMeCount ?? 0,
    OVERDUE: summary?.overdueCount ?? 0,
    RESOLVED: summary?.resolvedCount ?? 0
  };

  const hasAppliedFilters = Boolean(
    appliedFilters.search.trim() ||
      appliedFilters.status ||
      (appliedFilters.assignedUserId != null && appliedFilters.assignedUserId !== '') ||
      appliedFilters.receivedDateFrom ||
      appliedFilters.receivedDateTo ||
      summaryFilter
  );

  const showEmptyState = !listFetching && !listError && complaints.length === 0;

  const handleSearch = () => {
    setPage(0);
    setAppliedFilters({ ...filterRecord });
  };

  const handleClear = () => {
    setFilterRecord({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setSummaryFilter(null);
    setPage(0);
  };

  const handleSummaryClick = (value: SummaryFilter) => {
    setSummaryFilter(prev => (prev === value ? null : value));
    setPage(0);
  };

  const handleView = (complaint: PatientComplaintListItem) => {
    setSelectedComplaintId(complaint.id);
    setModalOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        key: 'reference',
        title: <Translate>Complaint Reference</Translate>,
        flexGrow: 2,
        render: (row: PatientComplaintListItem) => row.reference
      },
      {
        key: 'patientSubject',
        title: <Translate>Patient / Subject</Translate>,
        flexGrow: 3,
        render: (row: PatientComplaintListItem) => (
          <div className="patient-complaint-patient-subject">
            <div className="patient-complaint-patient-name">
              {row.anonymous ? <Translate>Anonymous</Translate> : row.patientName}
            </div>
            <div className="patient-complaint-subject-line">{row.subject}</div>
          </div>
        )
      },
      {
        key: 'feedbackType',
        title: <Translate>Feedback Type</Translate>,
        flexGrow: 2,
        render: (row: PatientComplaintListItem) =>
          row.feedbackType
            ? resolveEnumLabel(feedbackTypeOptions, row.feedbackType)
            : row.complaintType
              ? resolveEnumLabel(complaintTypeOptions, row.complaintType)
              : '-'
      },
      {
        key: 'department',
        title: <Translate>Department</Translate>,
        flexGrow: 2,
        render: (row: PatientComplaintListItem) => row.departmentName || '-'
      },
      {
        key: 'assignedTo',
        title: <Translate>Assigned To</Translate>,
        flexGrow: 2,
        render: (row: PatientComplaintListItem) => row.assignedUserName || '-'
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        flexGrow: 2,
        render: (row: PatientComplaintListItem) => renderComplaintStatus(row)
      },
      {
        key: 'targetDeadline',
        title: <Translate>Target Deadline</Translate>,
        flexGrow: 2,
        render: (row: PatientComplaintListItem) => (
          <span className={isComplaintOverdue(row) ? 'is-overdue' : ''}>
            {formatDisplayDate(row.targetDeadline)}
          </span>
        )
      },
      {
        key: 'receivedDate',
        title: <Translate>Received Date</Translate>,
        flexGrow: 2,
        render: (row: PatientComplaintListItem) => formatDisplayDate(row.receivedDate)
      },
      {
        key: 'actions',
        title: <Translate>View</Translate>,
        width: 90,
        render: (row: PatientComplaintListItem) => (
          <span
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
          >
            <MyButton
              appearance="subtle"
              size="sm"
              className="patient-complaint-view-btn"
              onClick={() => handleView(row)}
            >
              <MdVisibility size={18} />
            </MyButton>
          </span>
        )
      }
    ],
    [complaintTypeOptions, feedbackTypeOptions]
  );

  const summaryCards: { key: Exclude<SummaryFilter, null>; label: string }[] = [
    { key: 'NEW', label: 'New' },
    { key: 'UNASSIGNED', label: 'Unassigned' },
    { key: 'ASSIGNED_TO_ME', label: 'Assigned to Me' },
    { key: 'OVERDUE', label: 'Overdue' },
    { key: 'RESOLVED', label: 'Resolved' }
  ];

  return (
    <SectionContainer
      title="Patient Complaints"
      content={
        <div
          className={`patient-complaints-page${
            showEmptyState ? ' is-empty' : ''
          }${listError ? ' is-error' : ''}`}
        >
          <div className="patient-complaint-summary-row">
            {summaryCards.map(card => (
              <button
                key={card.key}
                type="button"
                className={`patient-complaint-summary-card ${
                  summaryFilter === card.key ? 'is-active' : ''
                } ${card.key === 'OVERDUE' ? 'is-overdue-card' : ''}`}
                onClick={() => handleSummaryClick(card.key)}
              >
                <div className="patient-complaint-summary-label">
                  <Translate>{card.label}</Translate>
                </div>
                <div className="patient-complaint-summary-value">
                  {summaryFetching && summary == null ? '—' : summaryCounts[card.key]}
                </div>
              </button>
            ))}
          </div>

          <div className="patient-complaint-filters-block">
            <Form fluid className="patient-complaints-filter-container">
              <MyInput
                fieldType="text"
                fieldName="search"
                fieldLabel="Search (Reference / Patient / Subject)"
                record={filterRecord}
                setRecord={setFilterRecord}
                width="18vw"
              />
              <MyInput
                fieldType="select"
                fieldName="status"
                fieldLabel="Status"
                record={filterRecord}
                setRecord={setFilterRecord}
                selectData={complaintStatusOptions}
                selectDataLabel="label"
                selectDataValue="value"
                searchable
                width="12vw"
              />
              <MyInput
                fieldType="select"
                fieldName="assignedUserId"
                fieldLabel="Assigned User"
                record={filterRecord}
                setRecord={setFilterRecord}
                selectData={assigneeOptions}
                selectDataLabel="label"
                selectDataValue="value"
                searchable
                width="12vw"
              />
              <MyInput
                fieldType="date"
                fieldName="receivedDateFrom"
                fieldLabel="Received From"
                record={filterRecord}
                setRecord={setFilterRecord}
                width="12vw"
              />
              <MyInput
                fieldType="date"
                fieldName="receivedDateTo"
                fieldLabel="Received To"
                record={filterRecord}
                setRecord={setFilterRecord}
                width="12vw"
              />
            </Form>
            <AdvancedSearchFilters
              searchFilter
              clearOnClick={handleClear}
              searchOnClick={handleSearch}
            />
          </div>

          {listError ? (
            <div className="patient-complaint-form-error" role="alert">
              <Translate>Unable to load complaints. Please try again.</Translate>
            </div>
          ) : null}

          <div className="patient-complaint-table-wrap">
            {showEmptyState ? (
              <div className="patient-complaint-empty-state" role="status">
                <div className="patient-complaint-empty-title">
                  <Translate>
                    {hasAppliedFilters ? 'No complaints found' : 'No complaints yet'}
                  </Translate>
                </div>
                <div className="patient-complaint-empty-subtitle">
                  <Translate>
                    {hasAppliedFilters
                      ? 'Try adjusting your search or filters.'
                      : 'Submitted complaints will appear here.'}
                  </Translate>
                </div>
                {hasAppliedFilters ? (
                  <div className="patient-complaint-empty-actions">
                    <MyButton appearance="ghost" onClick={handleClear}>
                      <Translate>Clear Filters</Translate>
                    </MyButton>
                  </div>
                ) : null}
              </div>
            ) : null}

            <MyTable
              data={complaints}
              columns={columns}
              loading={listFetching}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={event => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowClassName={(row: PatientComplaintListItem) =>
                isComplaintOverdue(row) ? 'patient-complaint-overdue-row' : ''
              }
            />
          </div>

          <ComplaintDetailModal
            open={modalOpen}
            setOpen={next => {
              setModalOpen(next);
              if (!next) {
                setSelectedComplaintId(null);
              }
            }}
            complaintId={selectedComplaintId}
          />
        </div>
      }
    />
  );
};

export default PatientComplaintsPage;
