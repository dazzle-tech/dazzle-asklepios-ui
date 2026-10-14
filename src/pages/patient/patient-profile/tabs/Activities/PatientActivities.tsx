import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdCancel, MdCheckCircle, MdModeEdit } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetPatientActivitiesQuery, useGetPatientActivityCatalogQuery } from '@/services/patients/patientActivityService';
import type { PatientActivity } from '@/types/model-types-new';
import AddEditPatientActivity from './AddEditPatientActivity';
import ActivityActionModal from './ActivityActionModal';
import { emptyPatientActivityForm } from './activityCatalog';
import './styles.less';

type Props = {
  patient: { id?: number; patientStatus?: string };
};

const statusColor = (status?: string) => {
  if (status === 'DONE') return '#45b887';
  if (status === 'CANCELLED') return '#969fb0';
  return '#d97706';
};

const toSelectOptions = (values: string[]) =>
  values.map(value => ({ value, label: formatEnumString(value) }));

const PatientActivities: React.FC<Props> = ({ patient }) => {
  const patientId = patient?.id;
  const isMerged = patient?.patientStatus === 'MERGED';
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<PatientActivity | null>(null);
  const [form, setForm] = useState(emptyPatientActivityForm());
  const [actionMode, setActionMode] = useState<'complete' | 'cancel'>('complete');
  const [openAction, setOpenAction] = useState(false);

  const { data: catalog } = useGetPatientActivityCatalogQuery();
  const { data, isFetching, isError } = useGetPatientActivitiesQuery(
    {
      patientId: patientId as number,
      page,
      size: rowsPerPage,
      sort: 'createdDate,desc',
      category: category === 'all' ? undefined : category,
      status: status === 'all' ? undefined : status
    },
    { skip: !patientId }
  );

  const categoryOptions = useMemo(
    () => [{ value: 'all', label: 'All categories' }, ...toSelectOptions(catalog?.categories ?? [])],
    [catalog?.categories]
  );
  const statusOptions = useMemo(
    () => [{ value: 'all', label: 'All statuses' }, ...toSelectOptions(catalog?.statuses ?? [])],
    [catalog?.statuses]
  );

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

  const columns = [
    {
      key: 'actions',
      title: <Translate></Translate>,
      width: 110,
      render: (row: PatientActivity) => {
        const isOpen = row.status === 'OPEN';
        const canEdit = isOpen && row.source === 'STAFF' && !isMerged;
        return (
          <div className="container-of-icons">
            {canEdit && (
              <MdModeEdit
                title="Edit"
                size={22}
                className="icons-style"
                fill="var(--primary-gray)"
                onClick={event => {
                  event.stopPropagation();
                  openEdit(row);
                }}
              />
            )}
            {isOpen && !isMerged && (
              <MdCheckCircle
                title="Complete"
                size={22}
                className="icons-style"
                fill="#45b887"
                onClick={event => {
                  event.stopPropagation();
                  openCompleteOrCancel(row, 'complete');
                }}
              />
            )}
            {isOpen && !isMerged && (
              <MdCancel
                title="Cancel"
                size={22}
                className="icons-style"
                fill="var(--primary-pink)"
                onClick={event => {
                  event.stopPropagation();
                  openCompleteOrCancel(row, 'cancel');
                }}
              />
            )}
          </div>
        );
      }
    },
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      render: (row: PatientActivity) => formatEnumString(row.category)
    },
    {
      key: 'activityType',
      title: <Translate>Activity</Translate>,
      render: (row: PatientActivity) => formatEnumString(row.activityType)
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (row: PatientActivity) => (
        <MyBadgeStatus color={statusColor(row.status)} contant={formatEnumString(row.status)} />
      )
    },
    {
      key: 'source',
      title: <Translate>Source</Translate>,
      render: (row: PatientActivity) => (
        <MyBadgeStatus
          color={row.source === 'SYSTEM' ? '#6b7280' : '#2264e5'}
          contant={formatEnumString(row.source)}
        />
      )
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      render: (row: PatientActivity) => formatEnumString(row.priority)
    },
    {
      key: 'note',
      title: <Translate>Note</Translate>,
      render: (row: PatientActivity) => (
        <span className="patient-activity-note" title={row.note}>
          {row.note}
        </span>
      )
    },
    {
      key: 'dueAt',
      title: <Translate>Due</Translate>,
      render: (row: PatientActivity) => (row.dueAt ? formatDateWithoutSeconds(row.dueAt) : '-')
    },
    {
      key: 'createdDate',
      title: <Translate>Created</Translate>,
      render: (row: PatientActivity) =>
        row.createdDate ? formatDateWithoutSeconds(row.createdDate) : '-'
    }
  ];

  if (!patientId) {
    return (
      <div className="patient-activity-empty">
        <Translate>Save the patient before adding activities.</Translate>
      </div>
    );
  }

  return (
    <div className="patient-activity-tab">
      {isError && (
        <div className="patient-activity-empty">
          <Translate>Failed to load activities.</Translate>
        </div>
      )}
      <MyTable
        data={data?.data ?? []}
        columns={columns}
        loading={isFetching}
        height={460}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={data?.totalCount ?? 0}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={event => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        filters={
          <Form fluid layout="inline" className="form-of-filters-set-up patient-activity-filters">
            <MyInput
              column
              width={240}
              fieldType="select"
              fieldName="category"
              fieldLabel="Category"
              selectData={categoryOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={{ category }}
              setRecord={(next: { category?: string }) => {
                setCategory(next?.category || 'all');
                setPage(0);
              }}
              searchable={false}
            />
            <MyInput
              column
              width={240}
              fieldType="select"
              fieldName="status"
              fieldLabel="Status"
              selectData={statusOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={{ status }}
              setRecord={(next: { status?: string }) => {
                setStatus(next?.status || 'all');
                setPage(0);
              }}
              searchable={false}
            />
          </Form>
        }
        tableButtons={
          <MyButton prefixIcon={AddOutlineIcon} onClick={openCreate} disabled={isMerged}>
            Add Activity
          </MyButton>
        }
      />
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
