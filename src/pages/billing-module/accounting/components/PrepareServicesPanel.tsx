import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Loader, Tag, Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { usePrepareDefaultServicesMutation } from '@/services/billing/billingTransactionService';
import { useLazyGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { notify } from '@/utils/uiReducerActions';
import type {
  BillingCoverageType,
  EncounterBillingSummary,
  PrepareDefaultServicesRequest
} from '@/types/model-types-new';

import {
  computeEncounterPatientShare,
  computeEncounterRemainingToPay,
  extractResponseList,
  formatBillingEnum,
  formatBillingPriceSource,
  formatMoney,
  makeRequestId,
  normalizeBillingError,
  sumEncounterReservedAmount,
  toNumber,
  type PrepareServiceRow,
  type UnifiedBillingChargeRow
} from '../utils/billingAccountingUtils';

type PrepareServicesPanelProps = {
  patientId: number | null;
  encounterId: number | null;
  departmentId: number | null;
  facilityId: number | null;
  currency: string;
  summary: EncounterBillingSummary;
  coverageType: BillingCoverageType;
  selectedInsuranceId: number | null;
  patientInsurances: any[];
  onCoverageTypeChange: (value: BillingCoverageType) => void;
  onInsuranceChange: (insuranceId: number | null) => void;
  onPrepared?: () => void;
  chargeRows?: UnifiedBillingChargeRow[];
  loadingBillingMetrics?: boolean;
  readOnly?: boolean;
};

const PrepareServicesPanel: React.FC<PrepareServicesPanelProps> = ({
  patientId,
  encounterId,
  departmentId,
  facilityId,
  currency,
  summary,
  coverageType,
  selectedInsuranceId,
  patientInsurances,
  onCoverageTypeChange,
  onInsuranceChange,
  onPrepared,
  chargeRows = [],
  loadingBillingMetrics = false,
  readOnly = false
}) => {
  const dispatch = useAppDispatch();
  const [serviceRows, setServiceRows] = useState<PrepareServiceRow[]>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const [triggerGetServices, servicesResponse] = useLazyGetServicesByDepartmentQuery();
  const [prepareDefaultServices, { isLoading: preparing }] = usePrepareDefaultServicesMutation();

  const isInsurance = coverageType === 'INSURANCE';
  const servicesArePrepared = (summary.items ?? []).length > 0;
  const servicesLocked = readOnly || servicesArePrepared;
  const patientShare = computeEncounterPatientShare(summary, chargeRows);
  const remainingToPay = loadingBillingMetrics
    ? null
    : computeEncounterRemainingToPay(summary, chargeRows);
  const reservedOnEncounter = sumEncounterReservedAmount(summary);

  const insuranceOptions = useMemo(
    () =>
      patientInsurances.map(insurance => {
        const insuranceId = insurance?.id ?? insurance?.patientInsuranceId;
        return {
          label: [
            insurance?.payerName ?? insurance?.insuranceCompanyName ?? insurance?.payerNphiesId,
            insurance?.policyClassName ?? insurance?.planName,
            insurance?.memberCardId ?? insurance?.policyNumber
          ]
            .filter(Boolean)
            .join(' • '),
          value: Number(insuranceId)
        };
      }),
    [patientInsurances]
  );

  useEffect(() => {
    if (!departmentId) {
      setServiceRows([]);
      return;
    }

    triggerGetServices({
      sourceId: departmentId,
      page: 0,
      size: 200,
      sort: 'id,asc'
    });
  }, [departmentId, triggerGetServices]);

  useEffect(() => {
    const list = extractResponseList(servicesResponse.data);
    const billedBySourceId = new Map(
      (summary.items ?? [])
        .filter(item => item.sourceId != null)
        .map(item => [Number(item.sourceId), item])
    );

    const mapped: PrepareServiceRow[] = list.map((service: any, index: number) => {
      const serviceId = toNumber(service?.id ?? service?.serviceId);
      const billed = billedBySourceId.get(serviceId);

      return {
        id: serviceId,
        serviceId,
        serviceType: String(service?.serviceType ?? service?.type ?? service?.category ?? 'SERVICE'),
        serviceName: String(service?.name ?? service?.serviceName ?? `Service #${serviceId}`),
        selected: billed != null ? true : service?.selected == null ? true : Boolean(service.selected),
        isExempted: Boolean(service?.isExempted),
        quantity: billed?.quantity != null ? Number(billed.quantity) : 1,
        sequence: index + 1,
        setupPrice:
          billed?.setupUnitPrice ??
          (service?.price != null && service?.price !== '' ? toNumber(service.price) : null),
        calculatedPrice: billed?.unitPrice ?? null,
        priceSource: billed?.priceSource ?? null,
        patientShare: billed?.patientResponsibilityAmount ?? null,
        insuranceShare: billed?.insuranceResponsibilityAmount ?? null
      };
    });

    setServiceRows(previous => {
      const oldMap = new Map(previous.map(row => [row.serviceId, row]));
      return mapped.map(row => {
        const old = oldMap.get(row.serviceId);
        if (!old || servicesArePrepared) return row;
        return {
          ...row,
          selected: old.selected,
          isExempted: old.isExempted,
          quantity: old.quantity,
          sequence: old.sequence
        };
      });
    });
  }, [servicesResponse.data, summary.items, servicesArePrepared]);

  const selectedRows = useMemo(
    () =>
      serviceRows
        .filter(row => row.selected)
        .sort((first, second) => first.sequence - second.sequence),
    [serviceRows]
  );

  const allSelected = serviceRows.length > 0 && serviceRows.every(row => row.selected);
  const someSelected = serviceRows.some(row => row.selected);

  const updateServiceRow = (serviceId: number, partial: Partial<PrepareServiceRow>) => {
    setServiceRows(previous =>
      previous.map(row => (row.serviceId === serviceId ? { ...row, ...partial } : row))
    );
  };

  const toggleAllSelected = (checked: boolean) => {
    setServiceRows(previous => previous.map(row => ({ ...row, selected: checked })));
  };

  const handlePrepare = async () => {
    if (patientId == null || encounterId == null || facilityId == null) {
      dispatch(notify({ msg: 'Select a patient and encounter first.', sev: 'warning' }));
      return;
    }

    if (!selectedRows.length) {
      dispatch(notify({ msg: 'Select at least one service to calculate.', sev: 'warning' }));
      return;
    }

    if (isInsurance && selectedInsuranceId == null) {
      dispatch(notify({ msg: 'Select patient insurance for insurance billing.', sev: 'warning' }));
      return;
    }

    const body: PrepareDefaultServicesRequest = {
      patientId,
      facilityId,
      currency,
      coverageType,
      patientInsuranceId: isInsurance ? selectedInsuranceId : null,
      items: selectedRows.map((row, index) => ({
        serviceId: row.serviceId,
        quantity: row.quantity,
        sequence: index + 1,
        isExempted: row.isExempted
      })),
      requestId: makeRequestId('PREPARE-DEFAULT-SERVICES')
    };

    try {
      const result = await prepareDefaultServices({ encounterId, body }).unwrap();
      const failed = result.items.filter(item => !item.billingResult?.processed);

      if (failed.length) {
        const message = failed
          .map(
            item =>
              `Service ${item.serviceId}: ${item.billingResult?.message ?? 'Billing rule did not match'}`
          )
          .join('\n');
        throw new Error(message);
      }

      setResultMessage(result.message ?? 'Services prepared and prices calculated successfully.');
      dispatch(
        notify({
          msg: result.message ?? 'Services prepared and prices calculated successfully.',
          sev: 'success'
        })
      );
      onPrepared?.();
    } catch (error: any) {
      const message = normalizeBillingError(error);
      setResultMessage(message);
      dispatch(notify({ msg: message, sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'selected',
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={!allSelected && someSelected}
          onChange={(_, checked) => toggleAllSelected(checked)}
          disabled={servicesLocked}
        />
      ),
      width: 48,
      render: (row: PrepareServiceRow) => (
        <Checkbox
          checked={row.selected}
          onChange={(_, checked) => updateServiceRow(row.serviceId, { selected: checked })}
          disabled={servicesLocked}
        />
      )
    },
    {
      key: 'sequence',
      title: 'Order',
      width: 70,
      dataKey: 'sequence'
    },
    {
      key: 'serviceType',
      title: 'Type',
      width: 120,
      render: (row: PrepareServiceRow) => formatBillingEnum(row.serviceType)
    },
    {
      key: 'serviceName',
      title: 'Service',
      width: 220,
      dataKey: 'serviceName'
    },
    {
      key: 'setupPrice',
      title: 'Setup price',
      width: 110,
      render: (row: PrepareServiceRow) =>
        row.setupPrice != null ? formatMoney(row.setupPrice, currency) : '-'
    },
    {
      key: 'calculatedPrice',
      title: 'Calculated price',
      width: 120,
      render: (row: PrepareServiceRow) =>
        row.calculatedPrice != null ? formatMoney(row.calculatedPrice, currency) : '-'
    },
    {
      key: 'priceSource',
      title: 'Price source',
      width: 110,
      render: (row: PrepareServiceRow) =>
        row.priceSource ? (
          <Tag size="sm">{formatBillingPriceSource(row.priceSource)}</Tag>
        ) : (
          '-'
        )
    },
    {
      key: 'patientShare',
      title: 'Patient',
      width: 100,
      render: (row: PrepareServiceRow) =>
        row.patientShare != null ? formatMoney(row.patientShare, currency) : '-'
    },
    {
      key: 'insuranceShare',
      title: 'Insurance',
      width: 100,
      render: (row: PrepareServiceRow) =>
        row.insuranceShare != null ? formatMoney(row.insuranceShare, currency) : '-'
    }
  ];

  if (encounterId == null) {
    return (
      <div className="billing-accounting__empty">
        Select an encounter to prepare and calculate services.
      </div>
    );
  }

  return (
    <div>
      <Text muted size="sm" style={{ marginBottom: 12 }}>
        Choose coverage and department services, then run calculation. Pricing uses the billing
        engine (price list first, then setup fallback) based on setup billing rules.
      </Text>

      {readOnly && (
        <Text size="sm" muted style={{ marginBottom: 12 }}>
          <Tag color="green" size="sm">
            Checkout finalized
          </Tag>{' '}
          Prepare & calculate is locked. Services are view-only until billing is reopened.
        </Text>
      )}

      <Form fluid>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 12
          }}
        >
          <MyInput
            column
            fieldType="select"
            fieldLabel="Coverage type"
            fieldName="coverageType"
            record={{ coverageType }}
            setRecord={(record: { coverageType: BillingCoverageType }) => {
              onCoverageTypeChange(record.coverageType);
              if (record.coverageType === 'SELF_PAY') {
                onInsuranceChange(null);
              }
            }}
            selectData={[
              { label: 'Self pay (Cash)', value: 'SELF_PAY' },
              { label: 'Insurance (Waseel)', value: 'INSURANCE' }
            ]}
            selectDataLabel="label"
            selectDataValue="value"
            disabled={servicesLocked}
          />

          <MyInput
            column
            fieldType="select"
            fieldLabel="Patient insurance"
            fieldName="patientInsuranceId"
            record={{ patientInsuranceId: selectedInsuranceId }}
            setRecord={(record: { patientInsuranceId: number | null }) =>
              onInsuranceChange(record.patientInsuranceId)
            }
            selectData={insuranceOptions}
            selectDataLabel="label"
            selectDataValue="value"
            disabled={!isInsurance || servicesLocked}
          />
        </div>
      </Form>

      {servicesResponse.isFetching ? (
        <div className="billing-accounting__empty">
          <Loader size="sm" content="Loading department services..." />
        </div>
      ) : !departmentId ? (
        <div className="billing-accounting__empty">
          This encounter has no department. Services cannot be loaded for calculation.
        </div>
      ) : !serviceRows.length ? (
        <div className="billing-accounting__empty">
          No active services are configured for this department in setup.
        </div>
      ) : (
        <MyTable
          height={280}
          data={serviceRows}
          columns={columns}
          tableButtons={
            <MyButton
              appearance="primary"
              loading={preparing}
              disabled={servicesLocked}
              onClick={handlePrepare}
            >
              Prepare & calculate
            </MyButton>
          }
        />
      )}

      {servicesArePrepared && (
        <>
          <div className="billing-accounting__encounter-pay-strip">
            <div className="billing-accounting__encounter-pay-metric">
              <span className="billing-accounting__encounter-pay-label">Patient share</span>
              <strong>{formatMoney(patientShare, currency)}</strong>
            </div>
            <div className="billing-accounting__encounter-pay-metric">
              <span className="billing-accounting__encounter-pay-label">Reserved</span>
              <strong>{formatMoney(reservedOnEncounter, currency)}</strong>
            </div>
            <div className="billing-accounting__encounter-pay-metric">
              <span className="billing-accounting__encounter-pay-label">Remaining to pay</span>
              <strong
                className={
                  remainingToPay != null && remainingToPay > 0
                    ? 'billing-accounting__encounter-pay-value--danger'
                    : 'billing-accounting__encounter-pay-value--success'
                }
              >
                {remainingToPay == null ? '—' : formatMoney(remainingToPay, currency)}
              </strong>
            </div>
          </div>
          <Text size="sm" style={{ marginTop: 10 }}>
            <Tag color="green" size="sm">
              Calculated
            </Tag>{' '}
            Charge lines exist for this encounter. Remaining amount is per encounter; final patient
            account balance is calculated at invoice. To change coverage, cancel or reprice existing
            services first.
          </Text>
        </>
      )}

      {resultMessage && (
        <Text muted size="sm" style={{ marginTop: 8 }}>
          {resultMessage}
        </Text>
      )}
    </div>
  );
};

export default PrepareServicesPanel;
