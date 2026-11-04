import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';

import { MdModeEdit } from 'react-icons/md';
import { FaTrash } from 'react-icons/fa';

import { useAppDispatch } from '@/hooks';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';

import {
  useGetCoveragesByInsuranceQuery,
  useAddPatientInsuranceCoverageMutation,
  useUpdatePatientInsuranceCoverageMutation,
  useDeletePatientInsuranceCoverageMutation
} from '@/services/patients/patientInsuranceCoveragesService';

import { useEnumOptions } from '@/services/enumsApi';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { newPatientInsuranceCoverage } from '@/types/model-types-constructor-new';
import { PatientInsuranceCoverage } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  insurance: number;
}

const COVERAGE_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Coverage data is required.',
  'insurance.required': 'Insurance is required.',
  duplicate: 'Duplicate coverage for the same insurance, item type and coverage type.',
  'db.constraint': 'Database constraint violation while saving insurance coverage.',
  notfound: 'Coverage record not found.'
};

const COVERAGE_FIELD_LABELS: Record<string, string> = {
  itemType: 'Item Type',
  coverageType: 'Coverage Type',
  amount: 'Amount',
  insuranceId: 'Insurance'
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size')) return 'length is out of range';
      if (m.includes('greater')) return 'value is too small';
      if (m.includes('less')) return 'value is too large';
      return msg || 'invalid value';
    };

    const toLabel = (field: string) => COVERAGE_FIELD_LABELS[field] ?? field;

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
  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: humanMsg + suffix,
      sev: 'error'
    })
  );
};

const SpecificCoverageModal: React.FC<Props> = ({ open, setOpen, insurance }) => {
  const dispatch = useAppDispatch();

  const itemTypes = useEnumOptions('BillingItemTypes', {
    exclude: ['PATHOLOGY']
  });
  const coverageTypes = useEnumOptions('InsuranceCoverageType');

  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);

  const {
    data: response,
    isFetching,
    refetch
  } = useGetCoveragesByInsuranceQuery({ insuranceId: insurance, page, size }, { skip: !insurance });

  const [addCoverage] = useAddPatientInsuranceCoverageMutation();
  const [updateCoverage] = useUpdatePatientInsuranceCoverageMutation();
  const [deleteCoverage] = useDeletePatientInsuranceCoverageMutation();

  const [selectedRow, setSelectedRow] = useState<PatientInsuranceCoverage | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [record, setRecord] = useState<PatientInsuranceCoverage>({
    ...newPatientInsuranceCoverage,
    insuranceId: insurance ?? 0
  });

  useEffect(() => {
    if (open) {
      resetForm();
      setSelectedRow(null);
      if (insurance) refetch();
    }
  }, [open, insurance, refetch]);

  const resetForm = () => {
    setRecord({
      ...newPatientInsuranceCoverage,
      insuranceId: insurance ?? 0
    });
  };

  const saveHandler = async () => {
    const validationErrors: string[] = [];

    if (!insurance) {
      validationErrors.push('• Insurance: is required');
    }

    if (!record.itemType) {
      validationErrors.push('• Item Type: is required');
    }

    if (!record.coverageType) {
      validationErrors.push('• Coverage Type: is required');
    }

    if (record.amount === null || record.amount === undefined || record.amount === '') {
      validationErrors.push('• Amount: is required');
    } else {
      const amountValue = typeof record.amount === 'string' ? Number(record.amount) : record.amount;
      if (Number.isNaN(amountValue) || amountValue <= 0) {
        validationErrors.push('• Amount: must be a valid positive number');
      }
    }

    if (validationErrors.length > 0) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${validationErrors.join('\n')}`,
          sev: 'error'
        })
      );
      return;
    }

    const amountValue = typeof record.amount === 'string' ? Number(record.amount) : record.amount;

    try {
      dispatch(showSystemLoader());

      if (record.id) {
        await updateCoverage({
          ...record,
          insuranceId: insurance,
          amount: amountValue
        }).unwrap();
        dispatch(notify({ msg: 'Coverage updated successfully', sev: 'success' }));
      } else {
        await addCoverage({
          ...record,
          insuranceId: insurance,
          amount: amountValue
        }).unwrap();
        dispatch(notify({ msg: 'Coverage added successfully', sev: 'success' }));
      }

      resetForm();
      setSelectedRow(null);
      refetch();
    } catch (err: any) {
      handleCrudError(err, dispatch, COVERAGE_ERROR_MAP);
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const openDeleteHandler = (row: PatientInsuranceCoverage) => {
    if (!row?.id) return;
    setDeleteId(row.id);
    setOpenDeleteModal(true);
  };

  const confirmDeleteHandler = async () => {
    if (!deleteId) return;

    try {
      dispatch(showSystemLoader());
      await deleteCoverage({ id: deleteId }).unwrap();
      dispatch(notify({ msg: 'Coverage deleted successfully', sev: 'success' }));

      if (selectedRow?.id === deleteId) {
        setSelectedRow(null);
        resetForm();
      }

      refetch();
    } catch (err: any) {
      handleCrudError(err, dispatch, COVERAGE_ERROR_MAP);
    } finally {
      dispatch(hideSystemLoader());
      setOpenDeleteModal(false);
      setDeleteId(null);
    }
  };

  const columns = [
    {
      key: 'itemType',
      title: 'Item Type',
      flexGrow: 1,
      render: (row: PatientInsuranceCoverage) => <span>{formatEnumString(row?.itemType)}</span>
    },
    {
      key: 'coverageType',
      title: 'Coverage Type',
      flexGrow: 1,
      render: (row: PatientInsuranceCoverage) => <span>{formatEnumString(row?.coverageType)}</span>
    },
    {
      key: 'amount',
      title: 'Amount',
      flexGrow: 1
    },
    {
      key: 'actions',
      title: '',
      width: 90,
      render: (row: PatientInsuranceCoverage) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <MdModeEdit
            size={20}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedRow(row);
              setRecord({
                ...row,
                insuranceId: insurance ?? row.insuranceId ?? 0
              });
            }}
          />

          <FaTrash
            size={18}
            style={{ cursor: 'pointer', color: 'var(--primary-pink)' }}
            onClick={() => openDeleteHandler(row)}
          />
        </div>
      )
    }
  ];

  const rowClassName = (row: PatientInsuranceCoverage) =>
    selectedRow?.id && row?.id && selectedRow.id === row.id ? 'selected-row' : '';

  const inputs = (
    <Form fluid layout="inline">
      <MyInput
        fieldLabel="Item Type"
        fieldName="itemType"
        fieldType="select"
        selectData={itemTypes}
        selectDataLabel="label"
        selectDataValue="value"
        record={record}
        setRecord={setRecord}
        column
        required
      />

      <MyInput
        fieldLabel="Coverage Type"
        fieldName="coverageType"
        fieldType="select"
        selectData={coverageTypes}
        selectDataLabel="label"
        selectDataValue="value"
        record={record}
        setRecord={setRecord}
        column
        required
      />

      <MyInput
        fieldLabel="Amount"
        fieldName="amount"
        fieldType="number"
        record={record}
        setRecord={setRecord}
        column
        required
      />
    </Form>
  );

  const tableButtons = (
    <div style={{ display: 'flex', gap: 12 }}>
      <MyButton color="var(--deep-blue)" width="100px" onClick={saveHandler}>
        Save
      </MyButton>

      <MyButton
        color="var(--primary-gray)"
        width="100px"
        onClick={() => {
          resetForm();
          setSelectedRow(null);
        }}
      >
        Cancel
      </MyButton>
    </div>
  );

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';



  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      size="40vw"
      position="center"
      title="Insurance Coverages"
      content={
        <div dir={dir}>
          <MyTable
            data={response?.data ?? []}
            loading={isFetching}
            columns={columns}
            totalCount={response?.totalCount ?? 0}
            page={page}
            rowsPerPage={size}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => setSize(Number(e.target.value))}
            rowClassName={rowClassName}
            onRowClick={(row: PatientInsuranceCoverage) => setSelectedRow(row)}
            filters={inputs}
            tableButtons={tableButtons}
          />

          <DeletionConfirmationModal
            open={openDeleteModal}
            setOpen={setOpenDeleteModal}
            itemToDelete="Coverage"
            actionType="delete"
            actionButtonFunction={confirmDeleteHandler}
          />
        </div>
      }
    />
  );
};

export default SpecificCoverageModal;