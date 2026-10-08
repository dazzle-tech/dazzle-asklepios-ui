
import React, { useMemo, useState } from 'react';
import { DateRangePicker, Form, Tooltip, Whisper } from 'rsuite';
import { FaArrowsRotate } from 'react-icons/fa6';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWaveform } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

import {
  useGetClaimTrackingQuery,
  useGetPendingClaimInvoicesQuery
} from '@/services/waseel-integration/claimService';

import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';
import { useGetAllActivePayorsQuery } from '@/services/setup/payer/PayorService';

import type {
  ClaimTrackingResponse,
  PendingClaimInvoiceResponse
} from '@/types/model-types-new';

import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import {
  WASEEL_CLAIM_TYPE_OPTIONS,
  isProfessionalClaimType,
  subTypeOptionsForClaimType
} from './types';
import EditEncounterDetailsModal from './EditEncounterDetailsModal';

const BillersWorkspace: React.FC = () => {
  const [payerNphiesId, setPayerNphiesId] = useState<string | null>(null);
  const [claimType, setClaimType] = useState<string | null>('PROFESSIONAL');
  const [claimSubType, setClaimSubType] = useState<string | null>('OUTPATIENT');

  const [dateRange, setDateRange] = useState<[Date, Date] | null>(
    currentMonthToTodayRange()
  );

  const [encounterDateRange, setEncounterDateRange] =
    useState<[Date, Date] | null>(null);

  const [appliedPayorId, setAppliedPayorId] = useState<number | null>(null);
  const [appliedPayerNphiesId, setAppliedPayerNphiesId] = useState<string | null>(null);
  const [appliedClaimType, setAppliedClaimType] = useState<string | null>(null);
  const [appliedClaimSubType, setAppliedClaimSubType] = useState<string | null>(null);

  const [appliedFromDate, setAppliedFromDate] = useState<string | null>(null);
  const [appliedToDate, setAppliedToDate] = useState<string | null>(null);

  const [appliedEncounterDateFrom, setAppliedEncounterDateFrom] =
    useState<string | null>(null);

  const [appliedEncounterDateTo, setAppliedEncounterDateTo] =
    useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [emrEncounter, setEmrEncounter] = useState<any>(null);
  const [openEditEncounterDetailsModal, setOpenEditEncounterDetailsModal] = useState(false);

  const {
    data: claimTrackingData,
    refetch: refetchClaims,
    isLoading: isClaimsLoading,
    isFetching: isClaimsFetching
  } = useGetClaimTrackingQuery({
    page: 0,
    size: 10,
    sort: 'id,desc'
  });

  const {
    data: pendingInvoicesPage,
    isFetching: isInvoicesFetching
  } = useGetPendingClaimInvoicesQuery(
    {
      payorId: appliedPayorId,
      payerNphiesId: appliedPayerNphiesId,
      fromDate: appliedFromDate,
      toDate: appliedToDate,
      claimType: appliedClaimType,
      claimSubType: appliedClaimSubType,
      encounterDateFrom: appliedEncounterDateFrom,
      encounterDateTo: appliedEncounterDateTo,
      page,
      size: rowsPerPage
    },
    {
      skip:
        (appliedPayorId == null && !appliedPayerNphiesId) ||
        !appliedClaimType ||
        !appliedClaimSubType
    }
  );

  const { data: nphiesPayerListResponse, isFetching: isNphiesPayersLoading } =
    useGetAllNphiesPayersQuery({
      page: 0,
      size: 2000,
      sort: 'nameEn,asc'
    });

  const { data: localPayorListResponse } = useGetAllActivePayorsQuery({
    page: 0,
    size: 2000,
    sort: 'id,asc'
  });

  const claimRows: ClaimTrackingResponse[] = useMemo(() => {
    const response: any = claimTrackingData;

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    if (Array.isArray(response?.data)) return response.data;

    return [];
  }, [claimTrackingData]);

  const statusSummary = useMemo(() => {
    const counts = {
      submitted: 0,
      accepted: 0,
      failed: 0,
      rejected: 0
    };

    claimRows.forEach(row => {
      const status = String(row.status ?? '').toUpperCase();

      if (status === 'SUBMITTED') counts.submitted += 1;
      if (status === 'ACCEPTED') counts.accepted += 1;
      if (status === 'FAILED') counts.failed += 1;
      if (status === 'REJECTED') counts.rejected += 1;
    });

    return counts;
  }, [claimRows]);

  const payorOptions = useMemo(
    () =>
      (nphiesPayerListResponse?.data ?? [])
        .filter(payer => payer?.nphiesId && payer.isActive !== false)
        .map(payer => ({
          nphiesId: String(payer.nphiesId).trim(),
          label: formatPayorOptionLabel(payer.nameEn, payer.nphiesId)
        })),
    [nphiesPayerListResponse]
  );

  const subTypeOptions = useMemo(
    () => subTypeOptionsForClaimType(claimType),
    [claimType]
  );

  const rows: PendingClaimInvoiceResponse[] = pendingInvoicesPage?.data ?? [];
  const totalCount = pendingInvoicesPage?.totalCount ?? 0;

  const handleClaimTypeChange = (value: { claimType: string | null }) => {
    const nextType = value.claimType;

    setClaimType(nextType);

    if (!isProfessionalClaimType(nextType)) {
      setClaimSubType('OUTPATIENT');
    }
  };

  const handleSearch = () => {
    const selectedNphiesId = payerNphiesId?.trim() || null;

    if (!selectedNphiesId || !claimType || !claimSubType) {
      return;
    }

    setAppliedPayorId(
      resolveLocalPayorId(selectedNphiesId, localPayorListResponse?.data)
    );

    setAppliedPayerNphiesId(selectedNphiesId);
    setAppliedClaimType(claimType);
    setAppliedClaimSubType(claimSubType);

    setAppliedFromDate(toStartOfDayIso(dateRange?.[0]));
    setAppliedToDate(toExclusiveEndIso(dateRange?.[1]));

    setAppliedEncounterDateFrom(toIsoDateString(encounterDateRange?.[0]));
    setAppliedEncounterDateTo(toIsoDateString(encounterDateRange?.[1]));

    setPage(0);
  };

  const handleRefresh = () => {
    refetchClaims();
  };

  const columns = [
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
      render: (row: PendingClaimInvoiceResponse) =>
        row?.encounter?.encounterNumber ?? '-'
    },
    {
      key: 'encounterDate',
      title: 'Encounter Date',
      width: 150,
      render: (row: PendingClaimInvoiceResponse) =>
        row.encounter?.createdDate
          ? formatDateWithoutSeconds(String(row.encounter.createdDate))
          : '-'
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

        const patientName = [
          row?.patient?.firstName,
          row?.patient?.secondName,
          row?.patient?.lastName
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Whisper trigger="hover" placement="top" speaker={speaker}>
            <span>{patientName || '-'}</span>
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
        row.createdDate
          ? formatDateWithoutSeconds(String(row.createdDate))
          : '-'
    },
    {
      key: 'actions',
      title: ' ',
      render: (row: PendingClaimInvoiceResponse) => (
        <Whisper
          trigger="hover"
          placement="top"
          speaker={
            <Tooltip>
              <Translate>Edit Encounter Details</Translate>
            </Tooltip>
          }
        >
          <div>
            <MyButton
              size="small"
              backgroundColor="violet"
              onClick={() => {
                setEmrEncounter(row?.encounter);
                setOpenEditEncounterDetailsModal(true);
              }}
            >
              <FontAwesomeIcon icon={faFileWaveform} />
            </MyButton>
          </div>
        </Whisper>
      )
    }
  ];

  const tableLoading =
    isClaimsLoading || isClaimsFetching || isInvoicesFetching;

  return (
    <>
      <div className="bc-toolbar__stats-row">
        <div className="bc-toolbar__stats" aria-label="Claim status summary">
          <div className="bc-chip">
            <span className="bc-chip__dot bc-chip__dot--info" />
            Submitted <strong>{statusSummary.submitted}</strong>
          </div>

          <div className="bc-chip">
            <span className="bc-chip__dot bc-chip__dot--success" />
            Accepted <strong>{statusSummary.accepted}</strong>
          </div>

          <div className="bc-chip">
            <span className="bc-chip__dot bc-chip__dot--danger" />
            Failed <strong>{statusSummary.failed}</strong>
          </div>

          <div className="bc-chip">
            <span className="bc-chip__dot bc-chip__dot--warn" />
            Rejected <strong>{statusSummary.rejected}</strong>
          </div>
        </div>

        <button
          type="button"
          className="bc-toolbar__refresh"
          disabled={tableLoading}
          onClick={handleRefresh}
        >
          <FaArrowsRotate size={13} />
          Refresh
        </button>
      </div>

      <div className="bc-body">
        <main className="bc-main">
          <div className="bc-card bc-card--batch">
            <div className="bc-card__head">
              <div>
                <h2 className="bc-card__head-title">Monthly claim batch</h2>

                <div className="bc-card__head-meta">
                  Filter insurance invoices by payor, claim type, sub type, and period.
                  Matching invoice lines are submitted as one Waseel claim type;
                  remaining lines stay for another type.
                </div>
              </div>
            </div>

            <Form fluid className="claims-batch-filters-form">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '12px'
                }}
              >
                <div style={{ width: '260px' }}>
                  <MyInput
                    fieldLabel="Payor"
                    width="100%"
                    fieldName="payerNphiesId"
                    fieldType="select"
                    selectData={payorOptions}
                    selectDataLabel="label"
                    selectDataValue="nphiesId"
                    record={{ payerNphiesId }}
                    setRecord={(value: { payerNphiesId: number | string | null }) =>
                      setPayerNphiesId(
                        value.payerNphiesId == null || value.payerNphiesId === ''
                          ? null
                          : String(value.payerNphiesId).trim()
                      )
                    }
                    cleanable
                    loading={isNphiesPayersLoading}
                  />
                </div>

                <div style={{ minWidth: '140px' }}>
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
                  />
                </div>

                <div style={{ minWidth: '180px' }}>
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
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="claims-batch-filters__label">
                    Period
                  </label>

                  <DateRangePicker
                    value={dateRange}
                    onChange={value => setDateRange(value)}
                    placement="bottomStart"
                    size="sm"
                    style={{ width: '220px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="claims-batch-filters__label">
                    Encounter Period
                  </label>

                  <DateRangePicker
                    value={encounterDateRange}
                    onChange={value => setEncounterDateRange(value)}
                    placement="bottomStart"
                    cleanable
                    size="sm"
                    style={{ width: '220px' }}
                    container={() => document.body}
                  />
                </div>

                <MyButton appearance="primary" onClick={handleSearch}>
                  Search
                </MyButton>
              </div>
            </Form>

            <div className="bc-table-wrap">
              <MyTable
                columns={columns}
                // data={[{ encounter: {id: 68} }]}
                data={rows}
                loading={isInvoicesFetching}
                height={320}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
                onRowsPerPageChange={(
                  event: React.ChangeEvent<HTMLInputElement>
                ) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </div>
          </div>
        </main>
      </div>

      <EditEncounterDetailsModal
        open={openEditEncounterDetailsModal}
        setOpen={setOpenEditEncounterDetailsModal}
        encounter={emrEncounter}
      />

    </>
  );
};

const formatPayorOptionLabel = (
  nameEn?: string | null,
  nphiesId?: string | null
) => {
  const name = nameEn?.trim();
  const code = nphiesId?.trim();

  if (name && code) return `${name} (${code})`;

  return name || code || '-';
};

const resolveLocalPayorId = (
  nphiesId: string,
  localPayors?: Array<{ id?: number | null; nphiesId?: string | null }> | null
) => {
  const normalized = nphiesId.trim().toLowerCase();

  const match = (localPayors ?? []).find(
    payor => String(payor?.nphiesId ?? '').trim().toLowerCase() === normalized
  );

  return match?.id != null ? Number(match.id) : null;
};

const currentMonthToTodayRange = (): [Date, Date] => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(0, 0, 0, 0);

  return [start, end];
};

const toIsoDateString = (date?: Date | null) => {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toStartOfDayIso = (date?: Date | null) => {
  if (!date) return null;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  return start.toISOString();
};

const toExclusiveEndIso = (date?: Date | null) => {
  if (!date) return null;

  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);

  return end.toISOString();
};

const calculateAge = (dateOfBirth?: string | Date | null) => {
  if (!dateOfBirth) return '-';

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime())) return '-';

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

export default BillersWorkspace;