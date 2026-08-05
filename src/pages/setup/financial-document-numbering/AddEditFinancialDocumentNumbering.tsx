import React, {
  useMemo
} from 'react';

import { Form } from 'rsuite';

import { FaHashtag } from 'react-icons/fa';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

import { useAppDispatch } from '@/hooks';

import { notify } from '@/utils/uiReducerActions';

import { useEnumOptions } from '@/services/enumsApi';

import { useFinancialDocumentTypeOptions } from '@/pages/billing-module/invoices/useFinancialDocumentTypes';

import {
  useAddFinancialDocumentNumberingMutation,
  useUpdateFinancialDocumentNumberingMutation
} from '@/services/billing/financialDocumentNumberingService';

import type {
  FinancialDocumentNumbering,
  SaveFinancialDocumentNumberingRequest
} from '@/types/model-types-new';

import {
  extractFinancialDocumentNumberingErrorMessage
} from './financialDocumentNumberingErrorHandler';

const buildPreviewNumber = (
  config: FinancialDocumentNumbering
) => {
  if (!config.prefix?.trim()) {
    return '';
  }

  const parts = [config.prefix.trim().toUpperCase()];

  if (config.includeFacilityCode) {
    parts.push('FAC');
  }

  if (config.includeYear) {
    parts.push(String(new Date().getFullYear()));
  }

  const sequenceLength = Math.max(
    1,
    Number(config.sequenceLength) || 6
  );
  const startingNumber = Math.max(
    1,
    Number(config.startingNumber) || 1
  );

  parts.push(
    String(startingNumber).padStart(sequenceLength, '0')
  );

  return parts.join(config.numberSeparator ?? '-');
};

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  width: number;
  configuration: FinancialDocumentNumbering;
  setConfiguration: React.Dispatch<
    React.SetStateAction<FinancialDocumentNumbering>
  >;
  usedDocumentTypes: string[];
  onSaveSuccess?: () => void;
};

const AddEditFinancialDocumentNumbering: React.FC<Props> = ({
  open,
  setOpen,
  width,
  configuration,
  setConfiguration,
  usedDocumentTypes,
  onSaveSuccess
}) => {
  const dispatch = useAppDispatch();
  const isEdit = Boolean(configuration.id);

  const documentTypeOptions = useFinancialDocumentTypeOptions();
  const resetFrequencyOptions = useEnumOptions(
    'BillingResetFrequency'
  );
  const statusOptions = useEnumOptions(
    'BillingConfigurationStatus'
  );

  const availableDocumentTypeOptions = useMemo(() => {
    if (isEdit) {
      return documentTypeOptions;
    }

    return documentTypeOptions.filter(
      option =>
        !usedDocumentTypes.includes(option.value)
    );
  }, [documentTypeOptions, isEdit, usedDocumentTypes]);

  const [addConfiguration, { isLoading: isCreating }] =
    useAddFinancialDocumentNumberingMutation();
  const [updateConfiguration, { isLoading: isUpdating }] =
    useUpdateFinancialDocumentNumberingMutation();

  const isLoading = isCreating || isUpdating;

  const previewRecord = useMemo(
    () => ({
      previewNumber: buildPreviewNumber(configuration)
    }),
    [configuration]
  );

  const validate = (): string | null => {
    if (!configuration.facilityId) {
      return 'Facility is required.';
    }

    if (!configuration.documentType) {
      return 'Document type is required.';
    }

    if (!configuration.prefix?.trim()) {
      return 'Prefix is required.';
    }

    return null;
  };

  const handleSave = async () => {
    const validationMessage = validate();

    if (validationMessage) {
      dispatch(
        notify({
          msg: validationMessage,
          sev: 'warning'
        })
      );
      return;
    }

    const payload: SaveFinancialDocumentNumberingRequest = {
      id: isEdit ? configuration.id : null,
      facilityId: configuration.facilityId as number,
      documentType: configuration.documentType as string,
      prefix: configuration.prefix!.trim().toUpperCase(),
      sequenceLength: Math.max(
        1,
        Math.min(12, Number(configuration.sequenceLength) || 6)
      ),
      includeYear: Boolean(configuration.includeYear),
      includeFacilityCode: Boolean(
        configuration.includeFacilityCode
      ),
      numberSeparator:
        configuration.numberSeparator?.trim() || '-',
      resetFrequency:
        configuration.resetFrequency ?? 'YEARLY',
      startingNumber: Math.max(
        1,
        Number(configuration.startingNumber) || 1
      ),
      active: Boolean(configuration.active),
      status: configuration.status ?? 'ACTIVE'
    };

    try {
      if (isEdit && configuration.id) {
        await updateConfiguration({
          id: configuration.id,
          data: {
            ...payload,
            id: configuration.id
          }
        }).unwrap();
      } else {
        await addConfiguration(payload).unwrap();
      }

      dispatch(
        notify({
          msg: isEdit
            ? 'Document numbering updated successfully'
            : 'Document numbering created successfully',
          sev: 'success'
        })
      );

      onSaveSuccess?.();
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractFinancialDocumentNumberingErrorMessage(
            error,
            'Failed to save document numbering'
          ),
          sev: 'error'
        })
      );
    }
  };

  const content = () => (
    <Form fluid>
      <MyInput
        required
        width="100%"
        fieldLabel="Document Type"
        fieldName="documentType"
        fieldType="select"
        placeholder="Invoice"
        selectData={availableDocumentTypeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={configuration}
        setRecord={setConfiguration}
        searchable={false}
        isEnum
        disabled={isEdit}
      />

      <br />

      <div className="financial-document-numbering-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Prefix"
          fieldName="prefix"
          fieldType="text"
          placeholder="INV"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          required
          width="100%"
          fieldLabel="Number Separator"
          fieldName="numberSeparator"
          fieldType="text"
          placeholder="-"
          record={configuration}
          setRecord={setConfiguration}
        />
      </div>

      <br />

      <div className="financial-document-numbering-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Sequence Length"
          fieldName="sequenceLength"
          fieldType="number"
          placeholder="6"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          required
          width="100%"
          fieldLabel="Starting Number"
          fieldName="startingNumber"
          fieldType="number"
          placeholder="1"
          record={configuration}
          setRecord={setConfiguration}
        />
      </div>

      <br />

      <div className="financial-document-numbering-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Reset Frequency"
          fieldName="resetFrequency"
          fieldType="select"
          placeholder="Yearly"
          selectData={resetFrequencyOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={configuration}
          setRecord={setConfiguration}
          searchable={false}
          isEnum
        />

        <MyInput
          required
          width="100%"
          fieldLabel="Status"
          fieldName="status"
          fieldType="select"
          placeholder="Active"
          selectData={statusOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={configuration}
          setRecord={setConfiguration}
          searchable={false}
          isEnum
        />
      </div>

      <br />

      <div className="financial-document-numbering-two-columns">
        <MyInput
          width="100%"
          fieldLabel="Include Year"
          fieldName="includeYear"
          fieldType="checkbox"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          width="100%"
          fieldLabel="Include Facility Code"
          fieldName="includeFacilityCode"
          fieldType="checkbox"
          record={configuration}
          setRecord={setConfiguration}
        />
      </div>

      <br />

      <MyInput
        width="100%"
        fieldLabel="Active"
        fieldName="active"
        fieldType="checkbox"
        record={configuration}
        setRecord={setConfiguration}
      />

      <br />

      <MyInput
        width="100%"
        fieldLabel="Document Number Preview"
        fieldName="previewNumber"
        fieldType="text"
        placeholder="INV-2026-000001"
        readOnly
        disabled
        record={previewRecord}
        setRecord={() => undefined}
      />
    </Form>
  );

  const direction =
    localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        isEdit
          ? 'Edit Document Numbering'
          : 'New Document Numbering'
      }
      position="right"
      content={() => <div dir={dir}>{content()}</div>}
      actionButtonLabel={isEdit ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      isDisabledActionBtn={isLoading}
      steps={[
        {
          title: 'Document Numbering Setup',
          icon: <FaHashtag />
        }
      ]}
      size={width > 600 ? '36vw' : '80vw'}
    />
  );
};

export default AddEditFinancialDocumentNumbering;
