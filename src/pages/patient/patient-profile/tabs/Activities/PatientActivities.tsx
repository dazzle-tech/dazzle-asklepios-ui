import React, { useMemo, useState } from 'react';
import { Form, Loader } from 'rsuite';
import { PlusRound } from '@rsuite/icons';
import {
  MdCancel,
  MdCheckCircle,
  MdModeEdit,
  MdOutlineCalendarMonth,
  MdOutlineFolderOpen,
  MdOutlinePhone,
  MdOutlineScience
} from 'react-icons/md';
import { FaNotesMedical, FaRegFileAlt } from 'react-icons/fa';
import dayjs from 'dayjs';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetPatientActivitiesQuery,
  useGetPatientActivitySummaryQuery
} from '@/services/patients/patientActivityService';
import type { PatientActivity } from '@/types/model-types-new';
import AddEditPatientActivity from './AddEditPatientActivity';
import ActivityActionModal from './ActivityActionModal';
import { emptyPatientActivityForm } from './activityCatalog';
import './styles.less';

type Props = {
  patient: { id?: number; patientStatus?: string };
};

const statusLabel = (status?: string) => {
  if (status === 'DONE') return 'Completed';
  if (status === 'CANCELLED') return 'Cancelled';
  return 'Open';
};

const emptyFilters = {
  search: '',
  category: 'all',
  status: 'all'
};

const ActivityIcon = ({ category }: { category?: string }) => {
  if (category === 'PATIENT_COMMUNICATION') return <MdOutlinePhone />;
  if (category === 'INSURANCE_REVENUE_CYCLE') return <FaRegFileAlt />;
  if (category === 'LABORATORY_RADIOLOGY') return <MdOutlineScience />;
  if (category === 'APPOINTMENT_COORDINATION') return <MdOutlineCalendarMonth />;
  if (category === 'ADMINISTRATIVE') return <MdOutlineFolderOpen />;
  return <FaNotesMedical />;
};

const PatientActivities: React.FC<Props> = ({ patient }) => {
  const patientId = patient?.id;
  const isMerged = patient?.patientStatus === 'MERGED';
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(15);
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<PatientActivity | null>(null);
  const [form, setForm] = useState(emptyPatientActivityForm());
  const [actionMode, setActionMode] = useState<'complete' | 'cancel'>('complete');
  const [openAction, setOpenAction] = useState(false);

  const categories = useEnumOptions('PatientActivityCategory');
  const statuses = useEnumOptions('PatientActivityStatus');

  const { data: summary } = useGetPatientActivitySummaryQuery(patientId as number, {
    skip: !patientId
  });

  const { data, isFetching, isError } = useGetPatientActivitiesQuery(
    {
      patientId: patientId as number,
      page,
      size: rowsPerPage,
      sort: 'createdDate,desc',
      category: applied.category === 'all' ? undefined : applied.category,
      status: applied.status === 'all' ? undefined : applied.status,
      search: applied.search || undefined
    },
    { skip: !patientId }
  );

  const applyFilters = () => {
    setApplied({
      search: (draft.search ?? '').trim(),
      category: draft.category || 'all',
      status: draft.status || 'all'
    });
    setPage(0);
  };

  const clearFilters = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPage(0);
  };

  const categoryOptions = useMemo(
    () => [{ value: 'all', label: 'All categories' }, ...categories],
    [categories]
  );
  const statusOptions = useMemo(
    () => [{ value: 'all', label: 'All statuses' }, ...statuses],
    [statuses]
  );

  const rows = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  const openCreate = () => {
    setSelected(null);
    setForm(emptyPatientActivityForm());
    setOpenForm(true);
  };

  const openEdit = (row: PatientActivity) => {
    setSelected(row);
    setForm({
      category: row.category ?? '',
      activityType: row.activityType ?? '',
      status: row.status ?? 'OPEN',
      priority: row.priority ?? 'NORMAL',
      note: row.note ?? '',
      dueAt: row.dueAt ? String(row.dueAt).slice(0, 10) : '',
      encounterId: row.encounterId ?? null,
      appointmentId: row.appointmentId ?? null
    });
    setOpenForm(true);
  };

  const openCompleteOrCancel = (row: PatientActivity, mode: 'complete' | 'cancel') => {
    setSelected(row);
    setActionMode(mode);
    setOpenAction(true);
  };

  if (!patientId) {
    return (
      <div className="patient-activity-empty">
        <Translate>Save the patient before adding activities.</Translate>
      </div>
    );
  }

  return (
    <div className="patient-activity-tab">
      <div className="patient-activity-header">
        <h3>Activities & Follow-up</h3>
        <MyButton
          prefixIcon={() => <PlusRound />}
          onClick={openCreate}
          disabled={isMerged}
        >
          Add Activity
        </MyButton>
      </div>

      <Form fluid layout="inline" className="form-of-filters-set-up patient-activity-filters">
        <MyInput
          column
          width={240}
          fieldType="text"
          fieldName="search"
          fieldLabel="Search"
          placeholder="Search activities"
          record={draft}
          setRecord={setDraft}
          enterClick={applyFilters}
        />
        <MyInput
          column
          width={240}
          fieldType="select"
          fieldName="category"
          fieldLabel="Category"
          isEnum
          searchable
          selectData={categoryOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={draft}
          setRecord={setDraft}
        />
        <MyInput
          column
          width={240}
          fieldType="select"
          fieldName="status"
          fieldLabel="Status"
          isEnum
          searchable
          selectData={statusOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={draft}
          setRecord={setDraft}
        />
        <div className="patient-activity-filter-actions">
          <MyButton onClick={applyFilters}>Search</MyButton>
          <MyButton appearance="ghost" onClick={clearFilters}>
            Clear
          </MyButton>
        </div>
      </Form>

      <div className="patient-activity-summary">
        <div>
          <div className="patient-activity-summary-label">Open tasks</div>
          <div className="patient-activity-summary-value">{summary?.openTasks ?? 0}</div>
        </div>
        <div>
          <div className="patient-activity-summary-label">Overdue</div>
          <div className="patient-activity-summary-value">{summary?.overdue ?? 0}</div>
        </div>
        <div>
          <div className="patient-activity-summary-label">Completed</div>
          <div className="patient-activity-summary-value">{summary?.completed ?? 0}</div>
        </div>
      </div>

      {isError && (
        <div className="patient-activity-empty">
          <Translate>Failed to load activities.</Translate>
        </div>
      )}

      <div className="patient-activity-list">
        {isFetching && rows.length === 0 && (
          <div className="patient-activity-empty">
            <Loader />
          </div>
        )}
        {!isFetching && rows.length === 0 && (
          <div className="patient-activity-empty">
            <Translate>No activities found.</Translate>
          </div>
        )}
        {rows.map(row => {
          const isOpen = row.status === 'OPEN';
          const canEdit = isOpen && row.source === 'STAFF' && !isMerged;
          const created = row.createdDate ? dayjs(row.createdDate) : null;
          const due = row.dueAt ? dayjs(row.dueAt) : null;
          const meta = [
            created ? created.format('DD MMM YYYY') : null,
            created ? created.format('HH:mm') : null,
            row.createdBy || formatEnumString(row.category)
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <article key={row.id} className="patient-activity-card">
              <div className={`patient-activity-icon category-${row.category?.toLowerCase()}`}>
                <ActivityIcon category={row.category} />
              </div>
              <div className="patient-activity-card-body">
                <div className="patient-activity-card-top">
                  <div>
                    <div className="patient-activity-title">{formatEnumString(row.activityType)}</div>
                    <div className="patient-activity-meta">{meta}</div>
                  </div>
                  <div className="patient-activity-actions">
                    {canEdit && (
                      <MdModeEdit title="Edit" size={20} onClick={() => openEdit(row)} />
                    )}
                    {isOpen && !isMerged && (
                      <MdCheckCircle
                        title="Complete"
                        size={20}
                        className="complete"
                        onClick={() => openCompleteOrCancel(row, 'complete')}
                      />
                    )}
                    {isOpen && !isMerged && (
                      <MdCancel
                        title="Cancel"
                        size={20}
                        className="cancel"
                        onClick={() => openCompleteOrCancel(row, 'cancel')}
                      />
                    )}
                  </div>
                </div>
                <p className="patient-activity-note">{row.note}</p>
                <div className="patient-activity-footer">
                  <span className={`patient-activity-status status-${row.status?.toLowerCase()}`}>
                    {statusLabel(row.status)}
                  </span>
                  {due && (
                    <span className="patient-activity-due">
                      {row.status === 'DONE'
                        ? `Follow-up: ${due.format('DD MMM')}`
                        : `Due ${due.format('DD MMM')}`}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {totalCount > rowsPerPage && (
        <div className="patient-activity-pager">
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            {page + 1} / {pageCount}
          </span>
          <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}

      <AddEditPatientActivity
        open={openForm}
        setOpen={setOpenForm}
        patientId={patientId}
        activity={selected}
        form={form}
        setForm={setForm}
      />
      <ActivityActionModal
        open={openAction}
        setOpen={setOpenAction}
        mode={actionMode}
        activityId={selected?.id}
        patientId={patientId}
      />
    </div>
  );
};

export default PatientActivities;
