import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FaTags } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import {
  useCreateDiscountCodeMutation,
  useUpdateDiscountCodeMutation
} from '@/services/setup/discountCode/discountCodeService';
import type {
  DiscountCode,
  DiscountCodeCreateDTO,
  DiscountType
} from '@/types/model-types-new';
import { newDiscountCode } from '@/types/model-types-constructor-new';
import './styles.less';

type AddEditDiscountCodeProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  discountCode: DiscountCode;
  onSaved: (action: 'create' | 'update') => void;
};

type DiscountCodeForm = {
  id?: number;
  facilityId?: number;
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType | '';
  percentage?: number | string | null;
  fixedAmount?: number | string | null;
  currency?: string | null;
};

const emptyForm = (): DiscountCodeForm => ({
  ...newDiscountCode,
  discountType: newDiscountCode.discountType || 'PERCENTAGE'
});

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === '' || value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractErrorMessage = (error: any): string => {
  const data = error?.data ?? {};
  const fieldErrors = Array.isArray(data.fieldErrors) ? data.fieldErrors : [];
  if (fieldErrors.length > 0) {
    return fieldErrors
      .map((item: { message?: string; field?: string }) => item.message || item.field)
      .filter(Boolean)
      .join(', ');
  }
  if (typeof data.title === 'string' && data.title && data.title !== 'Bad Request') {
    return data.title;
  }
  if (typeof data.detail === 'string' && data.detail) {
    return data.detail;
  }
  if (typeof data.message === 'string') {
    return data.message.replace(/^error\./i, '');
  }
  return 'Save failed';
};

const AddEditDiscountCode = ({
  open,
  setOpen,
  discountCode,
  onSaved
}: AddEditDiscountCodeProps) => {
  const dispatch = useAppDispatch();
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const discountTypeOptions = useEnumOptions('DiscountType');
  const currencyOptions = useEnumOptions('Currency');
  const [form, setForm] = useState<DiscountCodeForm>(emptyForm());
  const [createDiscountCode, { isLoading: isCreating }] = useCreateDiscountCodeMutation();
  const [updateDiscountCode, { isLoading: isUpdating }] = useUpdateDiscountCodeMutation();
  const isEdit = Boolean(discountCode?.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (discountCode?.id) {
      setForm({
        id: discountCode.id,
        facilityId: discountCode.facilityId,
        code: discountCode.code ?? '',
        name: discountCode.name ?? '',
        description: discountCode.description ?? '',
        discountType: discountCode.discountType ?? 'PERCENTAGE',
        percentage: discountCode.percentage ?? null,
        fixedAmount: discountCode.fixedAmount ?? null,
        currency: discountCode.currency ?? null
      });
      return;
    }
    setForm(emptyForm());
  }, [open, discountCode]);

  const handleTypeChange = (next: DiscountCodeForm) => {
    if (next.discountType === 'PERCENTAGE') {
      setForm({ ...next, fixedAmount: null, currency: null });
      return;
    }
    if (next.discountType === 'FIXED_AMOUNT') {
      setForm({ ...next, percentage: null });
      return;
    }
    setForm(next);
  };

  const validate = (): string => {
    const missing: string[] = [];
    if (!form.facilityId) missing.push('Facility');
    if (!form.code?.trim()) missing.push('Code');
    if (!form.name?.trim()) missing.push('Name');
    if (!form.discountType) missing.push('Discount Type');

    if (form.discountType === 'PERCENTAGE') {
      const percentage = toNumber(form.percentage);
      if (percentage == null) {
        missing.push('Percentage');
      } else if (percentage < 0 || percentage > 100) {
        return 'Discount percentage must be between 0 and 100';
      }
    }

    if (form.discountType === 'FIXED_AMOUNT') {
      if (toNumber(form.fixedAmount) == null) missing.push('Fixed Amount');
      if (!form.currency) missing.push('Currency');
      const fixedAmount = toNumber(form.fixedAmount);
      if (fixedAmount != null && fixedAmount < 0) {
        return 'Fixed discount amount cannot be negative';
      }
    }

    return missing.length ? `${missing.join(', ')} is required` : '';
  };

  const buildPayload = (): DiscountCodeCreateDTO => ({
    facilityId: Number(form.facilityId),
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description?.trim() ? form.description.trim() : null,
    discountType: form.discountType as DiscountType,
    percentage: form.discountType === 'PERCENTAGE' ? toNumber(form.percentage) : null,
    fixedAmount: form.discountType === 'FIXED_AMOUNT' ? toNumber(form.fixedAmount) : null,
    currency: form.discountType === 'FIXED_AMOUNT' ? form.currency || null : null
  });

  const handleSave = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      dispatch(notify({ msg: errorMessage, sev: 'warning' }));
      return;
    }

    try {
      const payload = buildPayload();
      if (isEdit && form.id) {
        await updateDiscountCode({ ...payload, id: form.id }).unwrap();
        dispatch(notify({ msg: 'Discount code updated successfully', sev: 'success' }));
        setOpen(false);
        onSaved('update');
        return;
      }

      await createDiscountCode(payload).unwrap();
      dispatch(notify({ msg: 'Discount code added successfully', sev: 'success' }));
      setOpen(false);
      onSaved('create');
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error), sev: 'warning' }));
    }
  };

  const content = () => (
    <Form fluid>
      <MyInput
        required
        width="100%"
        fieldLabel="Facility"
        fieldType="select"
        fieldName="facilityId"
        selectData={facilityListResponse ?? []}
        selectDataLabel="name"
        selectDataValue="id"
        record={form}
        setRecord={setForm}
        placeholder="Select Facility"
        searchable
        disabled={isEdit}
      />

      <br />

      <div className="discount-code-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Code"
          fieldName="code"
          record={form}
          setRecord={setForm}
          placeholder="Enter code"
        />
        <MyInput
          required
          width="100%"
          fieldLabel="Name"
          fieldName="name"
          record={form}
          setRecord={setForm}
          placeholder="Enter name"
        />
      </div>

      <br />

      <div className="discount-code-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Discount Type"
          fieldType="select"
          fieldName="discountType"
          selectData={discountTypeOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={form}
          setRecord={handleTypeChange}
          placeholder="Percentage or fixed amount"
          searchable={false}
        />
        {form.discountType === 'FIXED_AMOUNT' ? (
          <MyInput
            required
            width="100%"
            fieldLabel="Fixed Amount"
            fieldType="number"
            fieldName="fixedAmount"
            record={form}
            setRecord={setForm}
            placeholder="Amount taken off the service price"
          />
        ) : (
          <MyInput
            required
            width="100%"
            fieldLabel="Percentage"
            fieldType="number"
            fieldName="percentage"
            record={form}
            setRecord={setForm}
            placeholder="Percent taken off the service price"
          />
        )}
      </div>

      {form.discountType === 'FIXED_AMOUNT' && (
        <>
          <br />
          <MyInput
            required
            width="100%"
            fieldLabel="Currency"
            fieldType="select"
            fieldName="currency"
            selectData={currencyOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={form}
            setRecord={setForm}
            placeholder="Select currency"
            searchable
          />
        </>
      )}

      <br />

      <MyInput
        width="100%"
        fieldLabel="Description"
        fieldType="textarea"
        fieldName="description"
        record={form}
        setRecord={setForm}
        placeholder="Optional description"
      />
    </Form>
  );

  return (
    <MyModal
      actionButtonLabel={isEdit ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      open={open}
      setOpen={setOpen}
      position="right"
      title={isEdit ? 'Edit Discount Code' : 'New Discount Code'}
      content={content}
      steps={[{ title: 'Discount Code', icon: <FaTags /> }]}
      size="46vw"
      actionButtonLoading={isCreating || isUpdating}
    />
  );
};

export default AddEditDiscountCode;
