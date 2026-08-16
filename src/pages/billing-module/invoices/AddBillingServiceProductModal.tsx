import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, Loader, Radio, RadioGroup } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import '@/components/ChildModal/styles.less';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { usePreviewCatalogItemPricingMutation } from '@/services/billing/financialDocumentAdjustmentService';
import { useGetActiveServicesByFacilityQuery } from '@/services/setup/serviceService';
import { useGetBrandMedicationsByIsActiveQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetActiveDiagnosticTestsByTypeQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetActiveProceduresByFacilityQuery } from '@/services/setup/procedure/procedureService';
import {
  newPatientServiceAndProduct
} from '@/types/model-types-constructor-new';
import type { PatientServiceAndProduct } from '@/types/model-types-new';
import type { InvoiceLineAdjustmentRequest, InvoiceLineItem } from '@/services/billing/financialDocumentAdjustmentService';
import { inferInvoiceScopeAdjustments } from './invoiceLinePricingUtils';

export type PendingNewServiceLine = InvoiceLineAdjustmentRequest & {
  tempId: string;
  itemLabel?: string;
  grossAmount?: number;
  itemDiscountAmount?: number;
  itemTaxAmount?: number;
  invoiceDiscountAmount?: number;
  invoiceTaxAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  netAmount?: number;
  patientShareAmount?: number;
  insuranceShareAmount?: number;
};

type AddBillingServiceProductModalProps = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  encounterId: number;
  facilityId?: number | null;
  invoiceId?: number | null;
  currency?: string;
  documentSubtype?: string | null;
  patientInsuranceId?: number | null;
  referenceInvoiceLines?: InvoiceLineItem[];
  onAdd: (line: PendingNewServiceLine) => void;
};

const AddBillingServiceProductModal: React.FC<AddBillingServiceProductModalProps> = ({
  open,
  onClose,
  patientId,
  encounterId,
  facilityId,
  invoiceId,
  currency = 'SAR',
  documentSubtype,
  patientInsuranceId,
  referenceInvoiceLines,
  onAdd
}) => {
  const billingItemTypeOptions = useEnumOptions('BillingItemTypes', { exclude: ['PATHOLOGY'] });
  const [previewCatalogItemPricing] = usePreviewCatalogItemPricingMutation();
  const [isResolvingPrice, setIsResolvingPrice] = useState(false);
  const [record, setRecord] = useState<PatientServiceAndProduct>({
    ...newPatientServiceAndProduct,
    patientId,
    encounterId,
    quantity: 1,
    currency
  });

  useEffect(() => {
    if (!open) return;
    setIsResolvingPrice(false);
    setRecord({
      ...newPatientServiceAndProduct,
      patientId,
      encounterId,
      quantity: 1,
      currency
    });
  }, [open, patientId, encounterId, currency]);

  const [linePricingPreview, setLinePricingPreview] = useState<{
    grossAmount: number;
    itemDiscountAmount: number;
    itemTaxAmount: number;
    invoiceDiscountAmount: number;
    invoiceTaxAmount: number;
    netAmount: number;
    patientShareAmount: number;
    insuranceShareAmount: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setLinePricingPreview(null);
    }
  }, [open]);

  const handleCategoryChange = (value: string | number | null) => {
    setLinePricingPreview(null);
    setRecord({
      ...record,
      billingItemType: value != null ? String(value) : undefined,
      brandMedicationId: null,
      diagnosticTestId: null,
      serviceId: null,
      procedureId: null,
      unitPrice: 0,
      currency
    });
  };

  const applyPricingPreview = useCallback(
    (pricingPreview: {
      unitPrice: number;
      grossAmount: number;
      itemDiscountAmount: number;
      itemTaxAmount: number;
      invoiceDiscountAmount: number;
      invoiceTaxAmount: number;
      netAmount: number;
      patientShareAmount?: number;
      insuranceShareAmount?: number;
    }) => {
      setLinePricingPreview({
        grossAmount: pricingPreview.grossAmount,
        itemDiscountAmount: pricingPreview.itemDiscountAmount,
        itemTaxAmount: pricingPreview.itemTaxAmount,
        invoiceDiscountAmount: pricingPreview.invoiceDiscountAmount,
        invoiceTaxAmount: pricingPreview.invoiceTaxAmount,
        netAmount: pricingPreview.netAmount,
        patientShareAmount: Number(
          pricingPreview.patientShareAmount ?? pricingPreview.netAmount ?? 0
        ),
        insuranceShareAmount: Number(pricingPreview.insuranceShareAmount ?? 0)
      });
      setRecord(current => ({
        ...current,
        unitPrice: pricingPreview.unitPrice
      }));
    },
    []
  );

  const { data: activeServicesResponse, isFetching: isFetchingServices } =
    useGetActiveServicesByFacilityQuery(
      { facilityId: facilityId as number, page: 0, size: 50, sort: 'id,asc' },
      { skip: !open || !facilityId || record?.billingItemType !== 'SERVICE' }
    );

  const { data: medicationsResponse, isFetching: isFetchingMedications } =
    useGetBrandMedicationsByIsActiveQuery(
      { isActive: true, page: 0, size: 50, sort: 'id,asc' },
      { skip: !open || record?.billingItemType !== 'MEDICATION' }
    );

  const { data: laboratoryResponse, isFetching: isFetchingLaboratory } =
    useGetActiveDiagnosticTestsByTypeQuery(
      { type: 'LABORATORY', page: 0, size: 50, sort: 'id,asc' },
      { skip: !open || record?.billingItemType !== 'LABORATORY' }
    );

  const { data: radiologyResponse, isFetching: isFetchingRadiology } =
    useGetActiveDiagnosticTestsByTypeQuery(
      { type: 'RADIOLOGY', page: 0, size: 50, sort: 'id,asc' },
      { skip: !open || record?.billingItemType !== 'RADIOLOGY' }
    );

  const { data: proceduresResponse, isFetching: isFetchingProcedures } =
    useGetActiveProceduresByFacilityQuery(
      { facilityId: facilityId as number, page: 0, size: 50, sort: 'id,asc' },
      { skip: !open || !facilityId || record?.billingItemType !== 'PROCEDURE' }
    );

  const itemSelectConfig = useMemo(() => {
    switch (record?.billingItemType) {
      case 'MEDICATION':
        return {
          fieldName: 'brandMedicationId',
          fieldLabel: 'Medication',
          selectData: medicationsResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingMedications
        };
      case 'LABORATORY':
        return {
          fieldName: 'diagnosticTestId',
          fieldLabel: 'Laboratory test',
          selectData: laboratoryResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingLaboratory
        };
      case 'RADIOLOGY':
        return {
          fieldName: 'diagnosticTestId',
          fieldLabel: 'Radiology test',
          selectData: radiologyResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingRadiology
        };
      case 'SERVICE':
        return {
          fieldName: 'serviceId',
          fieldLabel: 'Service',
          selectData: activeServicesResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingServices
        };
      case 'PROCEDURE':
        return {
          fieldName: 'procedureId',
          fieldLabel: 'Procedure',
          selectData: proceduresResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingProcedures
        };
      default:
        return null;
    }
  }, [
    record?.billingItemType,
    medicationsResponse,
    laboratoryResponse,
    radiologyResponse,
    activeServicesResponse,
    proceduresResponse,
    isFetchingMedications,
    isFetchingLaboratory,
    isFetchingRadiology,
    isFetchingServices,
    isFetchingProcedures
  ]);

  const getValidationError = () => {
    if (!record?.billingItemType) return 'Category is required.';
    if (record.billingItemType === 'MEDICATION' && !record.brandMedicationId) {
      return 'Medication is required.';
    }
    if (
      ['LABORATORY', 'RADIOLOGY'].includes(String(record.billingItemType)) &&
      !record.diagnosticTestId
    ) {
      return 'Test is required.';
    }
    if (record.billingItemType === 'SERVICE' && !record.serviceId) return 'Service is required.';
    if (record.billingItemType === 'PROCEDURE' && !record.procedureId) {
      return 'Procedure is required.';
    }
    if (!record.quantity || Number(record.quantity) <= 0) {
      return 'Quantity must be greater than zero.';
    }
    if (!record.unitPrice || Number(record.unitPrice) <= 0) {
      return 'Unit price must be greater than zero.';
    }
    if (!record.currency) return 'Currency is required.';
    return '';
  };

  const resolveItemLabel = () => {
    if (!itemSelectConfig) return record.billingItemType ?? 'Service';
    const selected = itemSelectConfig.selectData.find(
      (item: any) =>
        String(item?.[itemSelectConfig.selectDataValue]) ===
        String(record?.[itemSelectConfig.fieldName as keyof PatientServiceAndProduct])
    );
    return selected?.[itemSelectConfig.selectDataLabel] ?? record.billingItemType ?? 'Service';
  };

  const buildPricingPreviewRequest = useCallback(
    (nextRecord: PatientServiceAndProduct) => {
      if (!facilityId) {
        return null;
      }

      const billingItemType = String(nextRecord.billingItemType ?? '');
      if (!billingItemType) {
        return null;
      }

      return {
        patientId,
        encounterId,
        facilityId,
        currency,
        billingItemType,
        brandMedicationId:
          billingItemType === 'MEDICATION'
            ? nextRecord.brandMedicationId ?? undefined
            : undefined,
        diagnosticTestId: ['LABORATORY', 'RADIOLOGY'].includes(billingItemType)
          ? nextRecord.diagnosticTestId ?? undefined
          : undefined,
        serviceId:
          billingItemType === 'SERVICE' ? nextRecord.serviceId ?? undefined : undefined,
        procedureId:
          billingItemType === 'PROCEDURE' ? nextRecord.procedureId ?? undefined : undefined,
        quantity: Number(nextRecord.quantity ?? 1),
        coverageType: patientInsuranceId != null ? ('INSURANCE' as const) : ('SELF_PAY' as const),
        patientInsuranceId: patientInsuranceId ?? null,
        invoiceId: invoiceId ?? undefined
      };
    },
    [currency, encounterId, facilityId, invoiceId, patientId, patientInsuranceId]
  );

  const applyInvoiceScopeFallback = useCallback(
    <T extends {
      grossAmount: number;
      itemDiscountAmount: number;
      itemTaxAmount: number;
      invoiceDiscountAmount: number;
      invoiceTaxAmount: number;
      netAmount: number;
    }>(
      preview: T,
      lineGross: number
    ) => {
      if (
        invoiceId == null ||
        (preview.invoiceDiscountAmount > 0 || preview.invoiceTaxAmount > 0)
      ) {
        return preview;
      }

      const inferred = inferInvoiceScopeAdjustments(lineGross, referenceInvoiceLines);
      if (!inferred) {
        return preview;
      }

      return {
        ...preview,
        invoiceDiscountAmount: inferred.invoiceDiscountAmount,
        invoiceTaxAmount: inferred.invoiceTaxAmount,
        netAmount: inferred.netAmount
      };
    },
    [invoiceId, referenceInvoiceLines]
  );

  const resolvePricingPreview = useCallback(
    async (nextRecord: PatientServiceAndProduct, setupFallbackPrice?: number | null) => {
      const previewRequest = buildPricingPreviewRequest(nextRecord);
      if (!previewRequest) {
        const unitPrice = Number(setupFallbackPrice ?? 0);
        const qty = Number(nextRecord.quantity ?? 1);
        const grossAmount = unitPrice * qty;
        return applyInvoiceScopeFallback(
          {
            unitPrice,
            grossAmount,
            itemDiscountAmount: 0,
            itemTaxAmount: 0,
            invoiceDiscountAmount: 0,
            invoiceTaxAmount: 0,
            netAmount: grossAmount
          },
          grossAmount
        );
      }

      setIsResolvingPrice(true);

      try {
        const preview = await previewCatalogItemPricing(previewRequest).unwrap();
        const unitPrice = Number(
          preview.unitPrice ?? preview.setupUnitPrice ?? setupFallbackPrice ?? 0
        );
        const qty = Number(nextRecord.quantity ?? 1);
        const lineGross =
          preview.itemGrossAmount != null
            ? Number(preview.itemGrossAmount)
            : preview.grossAmount != null
              ? Number(preview.grossAmount)
              : unitPrice * qty;
        const itemDiscount = Number(preview.itemDiscountAmount ?? 0);
        const itemTax = Number(preview.itemTaxAmount ?? 0);
        const invoiceDiscount = Number(preview.invoiceDiscountAmount ?? 0);
        const invoiceTax = Number(preview.invoiceTaxAmount ?? 0);
        const lineNet =
          preview.netAmount != null
            ? Number(preview.netAmount)
            : Math.max(0, lineGross - itemDiscount - invoiceDiscount + itemTax + invoiceTax);

        const patientShareAmount = Number(
          preview.patientShareAmount ?? lineNet
        );
        const insuranceShareAmount = Number(preview.insuranceShareAmount ?? 0);

        return applyInvoiceScopeFallback(
          {
            unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
            grossAmount: lineGross,
            itemDiscountAmount: itemDiscount,
            itemTaxAmount: itemTax,
            invoiceDiscountAmount: invoiceDiscount,
            invoiceTaxAmount: invoiceTax,
            netAmount: lineNet,
            patientShareAmount,
            insuranceShareAmount
          },
          lineGross
        );
      } catch {
        const unitPrice = Number(setupFallbackPrice ?? 0);
        const qty = Number(nextRecord.quantity ?? 1);
        const grossAmount = unitPrice * qty;
        return applyInvoiceScopeFallback(
          {
            unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
            grossAmount,
            itemDiscountAmount: 0,
            itemTaxAmount: 0,
            invoiceDiscountAmount: 0,
            invoiceTaxAmount: 0,
            netAmount: grossAmount
          },
          grossAmount
        );
      } finally {
        setIsResolvingPrice(false);
      }
    },
    [applyInvoiceScopeFallback, buildPricingPreviewRequest, previewCatalogItemPricing]
  );

  const handleCatalogItemSelect = useCallback(
    async (selectedItem: any) => {
      if (!itemSelectConfig || selectedItem == null) {
        return;
      }

      const fieldName = itemSelectConfig.fieldName as keyof PatientServiceAndProduct;
      const selectedId = selectedItem?.[itemSelectConfig.selectDataValue] ?? null;
      const setupFallbackPrice = Number(selectedItem?.price ?? 0);

      const nextRecord = {
        ...record,
        [fieldName]: selectedId,
        unitPrice: 0,
        currency
      };

      setRecord(nextRecord);

      const pricingPreview = await resolvePricingPreview(nextRecord, setupFallbackPrice);

      setRecord(current => ({
        ...current,
        [fieldName]: selectedId,
        unitPrice: pricingPreview.unitPrice,
        currency
      }));
      applyPricingPreview(pricingPreview);
    },
    [applyPricingPreview, currency, itemSelectConfig, record, resolvePricingPreview]
  );

  const handleQuantityChange = useCallback(
    async (nextRecord: PatientServiceAndProduct) => {
      setRecord(nextRecord);

      const hasCatalogItem =
        nextRecord.brandMedicationId != null ||
        nextRecord.diagnosticTestId != null ||
        nextRecord.serviceId != null ||
        nextRecord.procedureId != null;

      if (!hasCatalogItem) {
        setLinePricingPreview(null);
        return;
      }

      const pricingPreview = await resolvePricingPreview(nextRecord);
      applyPricingPreview(pricingPreview);
    },
    [applyPricingPreview, resolvePricingPreview]
  );

  const handleAdd = () => {
    const validationError = getValidationError();
    if (validationError) return;

    const itemLabel = resolveItemLabel();
    const patientShareAmount = Number(
      linePricingPreview?.patientShareAmount ?? linePricingPreview?.netAmount ?? 0
    );
    const insuranceShareAmount = Number(linePricingPreview?.insuranceShareAmount ?? 0);
    const billedShare =
      String(documentSubtype ?? '').toUpperCase() === 'INSURANCE_CLAIM'
        ? insuranceShareAmount
        : patientShareAmount;
    const line: PendingNewServiceLine = {
      tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'ADD_NEW',
      billingItemType: record.billingItemType,
      brandMedicationId:
        record.billingItemType === 'MEDICATION' ? record.brandMedicationId ?? undefined : undefined,
      diagnosticTestId: ['LABORATORY', 'RADIOLOGY'].includes(String(record.billingItemType))
        ? record.diagnosticTestId ?? undefined
        : undefined,
      serviceId: record.billingItemType === 'SERVICE' ? record.serviceId ?? undefined : undefined,
      procedureId:
        record.billingItemType === 'PROCEDURE' ? record.procedureId ?? undefined : undefined,
      quantity: Number(record.quantity),
      unitPrice: Number(record.unitPrice),
      grossAmount: linePricingPreview?.grossAmount,
      itemDiscountAmount: linePricingPreview?.itemDiscountAmount,
      itemTaxAmount: linePricingPreview?.itemTaxAmount,
      invoiceDiscountAmount: linePricingPreview?.invoiceDiscountAmount,
      invoiceTaxAmount: linePricingPreview?.invoiceTaxAmount,
      discountAmount:
        Number(linePricingPreview?.itemDiscountAmount ?? 0) +
        Number(linePricingPreview?.invoiceDiscountAmount ?? 0),
      taxAmount:
        Number(linePricingPreview?.itemTaxAmount ?? 0) +
        Number(linePricingPreview?.invoiceTaxAmount ?? 0),
      netAmount: billedShare || linePricingPreview?.netAmount,
      patientShareAmount,
      insuranceShareAmount,
      currency: record.currency,
      serviceSource: 'SERVICE_AND_PRODUCT',
      notes: itemLabel,
      itemLabel
    };

    onAdd(line);
    onClose();
  };

  const modalContent = (
    <Form fluid>
      <Form.Group controlId="billingItemType">
        <Form.ControlLabel>
          Category <span className="required-field">*</span>
        </Form.ControlLabel>
        <RadioGroup
          name="billingItemType"
          value={record.billingItemType ?? null}
          onChange={handleCategoryChange}
        >
          {billingItemTypeOptions.map(option => (
            <Radio key={option.value} value={option.value}>
              {option.label}
            </Radio>
          ))}
        </RadioGroup>
      </Form.Group>

      {itemSelectConfig && (
        <MyInput
          required
          fieldLabel={itemSelectConfig.fieldLabel}
          fieldType="selectPagination"
          fieldName={itemSelectConfig.fieldName}
          selectData={itemSelectConfig.selectData}
          selectDataLabel={itemSelectConfig.selectDataLabel}
          selectDataValue={itemSelectConfig.selectDataValue}
          record={record}
          setRecord={setRecord}
          width="100%"
          searchable
          cleanable={false}
          virtualized={false}
          loading={itemSelectConfig.loading}
          hasMore={false}
          onFetchMore={async () => {}}
          placeholder={`Select ${itemSelectConfig.fieldLabel.toLowerCase()}`}
          onSelectItem={selectedItem => {
            if (selectedItem == null) {
              return;
            }

            void handleCatalogItemSelect(selectedItem);
          }}
        />
      )}

      <MyInput
        required
        fieldName="quantity"
        fieldLabel="Quantity"
        fieldType="number"
        record={record}
        setRecord={handleQuantityChange}
        width="100%"
      />

      <div style={{ position: 'relative' }}>
        <MyInput
          required
          fieldName="unitPrice"
          fieldLabel="Unit price (price list)"
          fieldType="number"
          record={record}
          setRecord={setRecord}
          width="100%"
          disabled={isResolvingPrice}
        />
        {isResolvingPrice ? (
          <Loader
            content="Resolving price..."
            style={{
              position: 'absolute',
              right: 0,
              top: 28
            }}
          />
        ) : null}
      </div>

      {linePricingPreview ? (
        <div className="billing-add-service-pricing-preview">
          <div>
            <span>Price</span>
            <strong>{linePricingPreview.grossAmount.toFixed(2)} {currency}</strong>
          </div>
          <div>
            <span>Item disc.</span>
            <strong className="billing-add-service-pricing-preview__discount">
              -{linePricingPreview.itemDiscountAmount.toFixed(2)} {currency}
            </strong>
          </div>
          <div>
            <span>Item tax</span>
            <strong>{linePricingPreview.itemTaxAmount.toFixed(2)} {currency}</strong>
          </div>
          <div>
            <span>Inv. disc.</span>
            <strong className="billing-add-service-pricing-preview__discount">
              -{linePricingPreview.invoiceDiscountAmount.toFixed(2)} {currency}
            </strong>
          </div>
          <div>
            <span>Inv. tax</span>
            <strong>{linePricingPreview.invoiceTaxAmount.toFixed(2)} {currency}</strong>
          </div>
          <div>
            <span>Net</span>
            <strong>{linePricingPreview.netAmount.toFixed(2)} {currency}</strong>
          </div>
          <div>
            <span>Patient share</span>
            <strong>{linePricingPreview.patientShareAmount.toFixed(2)} {currency}</strong>
          </div>
          <div>
            <span>Insurance share</span>
            <strong>{linePricingPreview.insuranceShareAmount.toFixed(2)} {currency}</strong>
          </div>
        </div>
      ) : null}
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={value => {
        if (!value) onClose();
      }}
      title="Add service / product"
      actionButtonLabel="Add to debit note"
      actionButtonFunction={handleAdd}
      isDisabledActionBtn={isResolvingPrice}
      enforceFocus={false}
      backdrop={false}
      customClassName="child-right-modal billing-add-service-modal"
      position="right"
      size="30vw"
      content={modalContent}
    />
  );
};

export default AddBillingServiceProductModal;
