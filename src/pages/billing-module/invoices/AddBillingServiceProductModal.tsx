import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveServicesByFacilityQuery } from '@/services/setup/serviceService';
import { useGetBrandMedicationsByIsActiveQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetActiveDiagnosticTestsByTypeQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetActiveProceduresByFacilityQuery } from '@/services/setup/procedure/procedureService';
import {
  newPatientServiceAndProduct
} from '@/types/model-types-constructor-new';
import type { PatientServiceAndProduct } from '@/types/model-types-new';
import type { InvoiceLineAdjustmentRequest } from '@/services/billing/financialDocumentAdjustmentService';

export type PendingNewServiceLine = InvoiceLineAdjustmentRequest & {
  tempId: string;
  itemLabel?: string;
};

type AddBillingServiceProductModalProps = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  encounterId: number;
  facilityId?: number | null;
  currency?: string;
  onAdd: (line: PendingNewServiceLine) => void;
};

const AddBillingServiceProductModal: React.FC<AddBillingServiceProductModalProps> = ({
  open,
  onClose,
  patientId,
  encounterId,
  facilityId,
  currency = 'SAR',
  onAdd
}) => {
  const billingItemTypeOptions = useEnumOptions('BillingItemTypes', { exclude: ['PATHOLOGY'] });
  const [record, setRecord] = useState<PatientServiceAndProduct>({
    ...newPatientServiceAndProduct,
    patientId,
    encounterId,
    quantity: 1,
    currency
  });

  useEffect(() => {
    if (!open) return;
    setRecord({
      ...newPatientServiceAndProduct,
      patientId,
      encounterId,
      quantity: 1,
      currency
    });
  }, [open, patientId, encounterId, currency]);

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

  const handleAdd = () => {
    const validationError = getValidationError();
    if (validationError) return;

    const itemLabel = resolveItemLabel();
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
      <MyInput
        required
        fieldLabel="Category"
        fieldType="select"
        fieldName="billingItemType"
        selectData={billingItemTypeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={record}
        setRecord={val =>
          setRecord({
            ...val,
            brandMedicationId: null,
            diagnosticTestId: null,
            serviceId: null,
            procedureId: null,
            unitPrice: 0,
            currency
          })
        }
        width="100%"
        searchable={false}
      />

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
          loading={itemSelectConfig.loading}
          onSelectItem={(selectedItem: any) => {
            setRecord({
              ...record,
              [itemSelectConfig.fieldName]:
                selectedItem?.[itemSelectConfig.selectDataValue] ?? null,
              unitPrice: selectedItem?.price ?? record.unitPrice ?? 0,
              currency
            });
          }}
        />
      )}

      <MyInput
        required
        fieldName="quantity"
        fieldLabel="Quantity"
        fieldType="number"
        record={record}
        setRecord={setRecord}
        width="100%"
      />

      <MyInput
        required
        fieldName="unitPrice"
        fieldLabel="Unit price"
        fieldType="number"
        record={record}
        setRecord={setRecord}
        width="100%"
      />
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
      position="right"
      size="30vw"
      bodyheight="70vh"
      content={modalContent}
    />
  );
};

export default AddBillingServiceProductModal;
