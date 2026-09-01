import React, { useMemo, useState } from 'react';
import { Checkbox, DateRangePicker, Form, Tooltip, Whisper } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import {
  useGetPendingClaimInvoicesQuery,
  useSubmitClaimBatchMutation
} from '@/services/waseel-integration/claimService';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';
import type { PendingClaimInvoiceResponse } from '@/types/model-types-new';
import { useAppDispatch } from '@/hooks';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  WASEEL_CLAIM_TYPE_OPTIONS,
  isProfessionalClaimType,
  subTypeOptionsForClaimType
} from './types';
import Translate from '@/components/Translate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileWaveform
} from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';

type ClaimBatchPanelProps = {
  onSubmitted?: () => void;
};

const ClaimBatchPanel: React.FC<ClaimBatchPanelProps> = ({ onSubmitted }) => {
  const dispatch = useAppDispatch();
  const [payorId, setPayorId] = useState<number | null>(null);
  const [claimType, setClaimType] = useState<string | null>('PROFESSIONAL');
  const [claimSubType, setClaimSubType] = useState<string | null>('OUTPATIENT');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [appliedPayorId, setAppliedPayorId] = useState<number | null>(null);
  const [appliedPayerNphiesId, setAppliedPayerNphiesId] = useState<string | null>(null);
  const [appliedClaimType, setAppliedClaimType] = useState<string | null>(null);
  const [appliedClaimSubType, setAppliedClaimSubType] = useState<string | null>(null);
  const [appliedFromDate, setAppliedFromDate] = useState<string | null>(null);
  const [appliedToDate, setAppliedToDate] = useState<string | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);
  const [openEMRModal, setOpenEMRModal] = useState(false);

  const { data: pendingInvoices = [], isFetching, refetch } = useGetPendingClaimInvoicesQuery(
    {
      payorId: appliedPayorId,
      payerNphiesId: appliedPayerNphiesId,
      fromDate: appliedFromDate,
      toDate: appliedToDate,
      claimType: appliedClaimType,
      claimSubType: appliedClaimSubType
    },
    {
      skip: appliedPayorId == null || !appliedClaimType || !appliedClaimSubType
    }
  );

  const [submitBatch, { isLoading: submitting }] = useSubmitClaimBatchMutation();

  const { data: nphiesPayerListResponse, isFetching: isNphiesPayersLoading } =
    useGetAllNphiesPayersQuery({ page: 0, size: 2000, sort: 'nameEn,asc' });

  const payorOptions = useMemo(
    () =>
      (nphiesPayerListResponse?.data ?? [])
        .filter(payer => payer?.id != null && payer.isActive !== false)
        .map(payer => ({
          id: Number(payer.id),
          nphiesId: payer.nphiesId,
          label: formatPayorOptionLabel(payer.nameEn, payer.nphiesId)
        })),
    [nphiesPayerListResponse]
  );

  const subTypeOptions = useMemo(
    () => subTypeOptionsForClaimType(claimType),
    [claimType]
  );

  const handleClaimTypeChange = (value: { claimType: string | null }) => {
    const nextType = value.claimType;
    setClaimType(nextType);
    if (!isProfessionalClaimType(nextType)) {
      setClaimSubType('OUTPATIENT');
    }
  };

  const rows = useMemo(() => pendingInvoices ?? [], [pendingInvoices]);

  const toggleRow = (invoiceId: number) => {
    setSelectedInvoiceIds(current =>
      current.includes(invoiceId)
        ? current.filter(id => id !== invoiceId)
        : [...current, invoiceId]
    );
  };

  const toggleAll = () => {
    const ids = rows
      .map(row => row.financialDocumentId)
      .filter((id): id is number => id != null);

    if (selectedInvoiceIds.length === ids.length) {
      setSelectedInvoiceIds([]);
      return;
    }

    setSelectedInvoiceIds(ids);
  };

  const handleSearch = () => {
    if (payorId == null) {
      dispatch(notify({ msg: 'Select a payor before searching invoices.', sev: 'warning' }));
      return;
    }

    if (!claimType) {
      dispatch(notify({ msg: 'Select a claim type before searching invoices.', sev: 'warning' }));
      return;
    }

    if (!claimSubType) {
      dispatch(notify({ msg: 'Select a claim sub type before searching invoices.', sev: 'warning' }));
      return;
    }

    setAppliedPayorId(payorId);
    setAppliedPayerNphiesId(
      payorOptions.find(option => option.id === payorId)?.nphiesId?.trim() || null
    );
    setAppliedClaimType(claimType);
    setAppliedClaimSubType(claimSubType);
    setAppliedFromDate(toStartOfDayIso(dateRange?.[0]));
    setAppliedToDate(toExclusiveEndIso(dateRange?.[1]));
    setSelectedInvoiceIds([]);
  };

  const handleSubmitBatch = async () => {
    if (!selectedInvoiceIds.length) {
      dispatch(notify({ msg: 'Select at least one insurance invoice.', sev: 'warning' }));
      return;
    }

    if (!appliedClaimType || !appliedClaimSubType) {
      dispatch(notify({ msg: 'Search invoices with a claim type and sub type first.', sev: 'warning' }));
      return;
    }

    try {
      dispatch(showSystemLoader());
      const result = await submitBatch({
        financialDocumentIds: selectedInvoiceIds,
        claimType: appliedClaimType,
        claimSubType: appliedClaimSubType
      }).unwrap();
      dispatch(
        notify({
          msg:
            result.message ??
            `Submitted ${result.submittedClaimCount ?? selectedInvoiceIds.length} claim(s) to Waseel.`,
          sev: String(result.outcome ?? '').toUpperCase() === 'FAILED' ? 'error' : 'success'
        })
      );
      setSelectedInvoiceIds([]);
      refetch();
      onSubmitted?.();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Failed to submit claim batch',
          sev: 'error'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const columns = [
    {
      key: 'select',
      title: (
        <Checkbox
          checked={rows.length > 0 && selectedInvoiceIds.length === rows.length}
          indeterminate={
            selectedInvoiceIds.length > 0 && selectedInvoiceIds.length < rows.length
          }
          disabled={!rows.length}
          onChange={toggleAll}
        />
      ),
      width: 48,
      render: (row: PendingClaimInvoiceResponse) => {
        const invoiceId = row.financialDocumentId;
        if (invoiceId == null) {
          return null;
        }

        return (
          <Checkbox
            checked={selectedInvoiceIds.includes(invoiceId)}
            onChange={() => toggleRow(invoiceId)}
          />
        );
      }
    },
    {
      key: 'documentNumber',
      title: 'Invoice',
      width: 140,
      render: (row: PendingClaimInvoiceResponse) => row.documentNumber ?? '-'
    },
    {
      key: 'encounter',
      title: 'Encounter',
      width: 100,
      render: (row: PendingClaimInvoiceResponse) => row?.encounter?.encounterNumber ?? '-'
    },
    {
      key: 'encounterType',
      title: 'Visit type',
      width: 120,
      render: (row: PendingClaimInvoiceResponse) =>
        formatEnumString(row.encounterType ?? row.encounter?.encounterType) || '-'
    },
    {
      key: 'matchingItemCount',
      title: 'Claim items',
      width: 110,
      render: (row: PendingClaimInvoiceResponse) => row.matchingItemCount ?? '-'
    },
    {
      key: 'patientFullName',
      title: 'PATIENT',
      render: (row: PendingClaimInvoiceResponse) => {
        const speaker = (
          <Tooltip>
            <div>MRN: {row?.patient?.medicalRecordNumber ?? '-'}</div>
            <div>Age: {calculateAge(row?.patient?.dateOfBirth)}</div>
            <div>Gender: {row?.patient?.sexAtBirth ?? '-'}</div>
          </Tooltip>
        );
        return (
          <Whisper trigger="hover" placement="top" speaker={speaker}>
            {row?.patient?.firstName + " " + row?.patient?.secondName + " " + row?.patient?.lastName}

          </Whisper>
        );
      }
    },
    {
      key: 'claimReference',
      title: 'Claim ref',
      width: 180,
      render: (row: PendingClaimInvoiceResponse) => row.claimReference ?? '-'
    },
    {
      key: 'totalAmount',
      title: 'Invoice amount',
      width: 130,
      render: (row: PendingClaimInvoiceResponse) =>
        `${Number(row.totalAmount ?? 0).toFixed(2)} ${row.currency ?? 'SAR'}`
    },
    {
      key: 'matchingNetAmount',
      title: 'Claim amount',
      width: 130,
      render: (row: PendingClaimInvoiceResponse) =>
        `${Number(row.matchingNetAmount ?? 0).toFixed(2)} ${row.currency ?? 'SAR'}`
    },
    {
      key: 'createdDate',
      title: 'Issued',
      width: 150,
      render: (row: PendingClaimInvoiceResponse) =>
        row.createdDate ? formatDateWithoutSeconds(String(row.createdDate)) : '-'
    },
     {
      key: 'actions',
      title: ' ',
      render: (row: PendingClaimInvoiceResponse) => {
        const tooltipEMR = (
          <Tooltip>
            <Translate>Go to EMR</Translate>
          </Tooltip>
        );

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper
              trigger="hover"
              placement="top"
              speaker={tooltipEMR}
            >
              <div>
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={ () => {
                      setEmrEncounter(row?.encounter);
                      setEmrPatient(row?.patient);
                      setOpenEMRModal(true);
                   
                  }}
                >
                  <FontAwesomeIcon icon={faFileWaveform} />
                </MyButton>
              </div>
            </Whisper>
          </Form>
        );
      },
    }
  ];

  return (
    <div className="bc-card bc-card--batch">
      <div className="bc-card__head">
        <div>
          <h2 className="bc-card__head-title">Monthly claim batch</h2>
          <div className="bc-card__head-meta">
            Filter insurance invoices by payor, claim type, sub type, and period. Matching invoice
            lines are submitted as one Waseel claim type; remaining lines stay for another type.
          </div>
        </div>
      </div>

      <Form fluid className="claims-batch-filters-form">
        <div className="claims-batch-filters">
          <MyInput
            fieldLabel="Payor"
            fieldName="payorId"
            fieldType="select"
            selectData={payorOptions}
            selectDataLabel="label"
            selectDataValue="id"
            record={{ payorId }}
            setRecord={(value: { payorId: number | string | null }) =>
              setPayorId(toNullableNumber(value.payorId))
            }
            cleanable
            loading={isNphiesPayersLoading}
            placeholder={
              isNphiesPayersLoading
                ? 'Loading payors...'
                : payorOptions.length === 0
                  ? 'No payors found'
                  : 'Select payor'
            }
            width="280px"
          />

          <MyInput
            fieldLabel="Type"
            fieldName="claimType"
            fieldType="select"
            selectData={WASEEL_CLAIM_TYPE_OPTIONS}
            selectDataLabel="label"
            selectDataValue="value"
            record={{ claimType }}
            setRecord={handleClaimTypeChange}
            searchable={false}
            cleanable={false}
            placeholder="Select type"
            width="180px"
          />

          <MyInput
            fieldLabel="Sub Type"
            fieldName="claimSubType"
            fieldType="select"
            selectData={subTypeOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={{ claimSubType }}
            setRecord={(value: { claimSubType: string | null }) =>
              setClaimSubType(value.claimSubType)
            }
            searchable={false}
            cleanable={false}
            disabled={!isProfessionalClaimType(claimType)}
            placeholder="Select sub type"
            width="180px"
          />

          <div className="claims-batch-filters__dates">
            <span className="claims-batch-filters__label">Period</span>
            <DateRangePicker
              value={dateRange}
              onChange={value => setDateRange(value)}
              placement="bottomStart"
              placeholder="Select period"
            />
          </div>

          <MyButton appearance="primary" onClick={handleSearch}>
            Search invoices
          </MyButton>

          <MyButton
            appearance="primary"
            loading={submitting}
            disabled={!selectedInvoiceIds.length || submitting}
            onClick={handleSubmitBatch}
          >
            Submit selected ({selectedInvoiceIds.length})
          </MyButton>
        </div>
      </Form>

      <div className="bc-table-wrap">
        <MyTable
          columns={columns}
          data={rows}
          loading={isFetching}
          height={280}
          totalCount={rows.length}
        />
         <MyModal
          open={openEMRModal}
          setOpen={setOpenEMRModal}
          title="Electronic Medical Record"
          size="90vw"
          content={
            emrPatient && emrEncounter ? (
              <PatientEMRModal patient={emrPatient} encounter={emrEncounter} />
            ) : (
              <div className="encounter-list__no-patient">No patient selected.</div>
            )
          }
          actionButtonLabel="Close"
          actionButtonFunction={() => setOpenEMRModal(false)}
          cancelButtonLabel="Cancel"
        />
      </div>
    </div>
  );
};

const formatPayorOptionLabel = (nameEn?: string | null, nphiesId?: string | null) => {
  const name = nameEn?.trim();
  const code = nphiesId?.trim();

  if (name && code) {
    return `${name} (${code})`;
  }

  return name || code || '-';
};

const toNullableNumber = (value: number | string | null | undefined) => {
  if (value == null || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const toStartOfDayIso = (date?: Date | null) => {
  if (!date) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
};

const toExclusiveEndIso = (date?: Date | null) => {
  if (!date) {
    return null;
  }

  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  return end.toISOString();

};

const calculateAge = (dateOfBirth?: string | Date | null) => {
  if (!dateOfBirth) {
    return '-';
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime())) {
    return '-';
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;

    const previousMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    );

    days += previousMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years}y ${months}m ${days}d`;
};

export default ClaimBatchPanel;
