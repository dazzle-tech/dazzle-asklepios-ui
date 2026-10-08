import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import {
  useCreateClaimEncounterCopyDiagnosticOrderTestResultMutation,
  useUpdateClaimEncounterCopyDiagnosticOrderTestResultMutation
} from '@/services/billing/claimEncounterCopyDiagnosticOrderTestResultService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  ClaimEncounterCopyDiagnosticOrderTestResult,
  ClaimEncounterCopyDiagnosticOrderTestResultCreateDTO,
  ClaimEncounterCopyDiagnosticOrderTestResultUpdateDTO
} from '@/types/model-types-new';

interface AddClaimEncounterCopyDiagnosticOrderTestResultProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  claimEncounterCopyId: number;
  orderTestId: number;
  testName?: string;
  initialData?: ClaimEncounterCopyDiagnosticOrderTestResult | null;
}

const AddClaimEncounterCopyDiagnosticOrderTestResult = ({
  open,
  setOpen,
  claimEncounterCopyId,
  orderTestId,
  testName,
  initialData
}: AddClaimEncounterCopyDiagnosticOrderTestResultProps) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    resultValueNumber: null as number | null,
    resultValueText: null as string | null,
    resultTypeAtEntry: null as string | null
  });

  const [createResult] =
    useCreateClaimEncounterCopyDiagnosticOrderTestResultMutation();

  const [updateResult] =
    useUpdateClaimEncounterCopyDiagnosticOrderTestResultMutation();

  const isLov = formData.resultTypeAtEntry === 'LOV';
  const isNumber = !isLov;

  useEffect(() => {
    if (initialData) {
      setFormData({
        resultValueNumber: initialData.resultValueNumber ?? null,
        resultValueText: initialData.resultValueText ?? null,
        resultTypeAtEntry: initialData.resultTypeAtEntry ?? 'NUMBER'
      });
    } else {
      setFormData({
        resultValueNumber: null,
        resultValueText: null,
        resultTypeAtEntry: 'NUMBER'
      });
    }
  }, [initialData, open]);

  const handleSave = async () => {
    if (
      formData.resultValueNumber == null &&
      !formData.resultValueText?.trim()
    ) {
      dispatch(
        notify({ msg: 'Result value is required', sev: 'warning' })
      );
      return;
    }

    try {
      if (initialData?.id) {
        const payload: ClaimEncounterCopyDiagnosticOrderTestResultUpdateDTO = {
          resultValueNumber: isNumber ? formData.resultValueNumber : null,
          resultValueText: isNumber
            ? null
            : formData.resultValueText?.trim()
        };

        await updateResult({
          id: initialData.id,
          data: payload
        }).unwrap();

        dispatch(
          notify({ msg: 'Result updated successfully', sev: 'success' })
        );
      } else {
        const payload: ClaimEncounterCopyDiagnosticOrderTestResultCreateDTO = {
          orderTestId,
          resultValueNumber: isNumber ? formData.resultValueNumber : null,
          resultValueText: isNumber
            ? null
            : formData.resultValueText?.trim(),
          resultTypeAtEntry: formData.resultTypeAtEntry
        };

        await createResult({
          claimEncounterCopyId,
          data: payload
        }).unwrap();

        dispatch(
          notify({ msg: 'Result added successfully', sev: 'success' })
        );
      }

      setOpen(false);
    } catch (error: any) {
      const data = error?.data ?? {};
      const message =
        data?.detail ||
        data?.message ||
        data?.title ||
        error?.error ||
        'Unexpected error';

      dispatch(notify({ msg: message, sev: 'warning' }));
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const content = (
    <Form fluid className="fields-container">
      <Row gutter={16}>
        <Col md={24}>
          <div style={{ marginBottom: 10, fontWeight: 600 }}>
            {testName || `Test #${orderTestId}`}
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col md={12}>
          <MyInput
            width="100%"
            column
            fieldType="select"
            fieldLabel="Result Type"
            selectData={[
              { label: 'Number', value: 'NUMBER' },
              { label: 'LOV / Text', value: 'LOV' }
            ]}
            selectDataLabel="label"
            selectDataValue="value"
            fieldName="resultTypeAtEntry"
            record={formData}
            setRecord={setFormData}
          />
        </Col>

        <Col md={12}>
          {isNumber ? (
            <MyInput
              width="100%"
              column
              fieldLabel="Result Value"
              fieldType="number"
              fieldName="resultValueNumber"
              record={formData}
              setRecord={setFormData}
              required
            />
          ) : (
            <MyInput
              width="100%"
              column
              fieldLabel="Result Value"
              fieldType="text"
              fieldName="resultValueText"
              record={formData}
              setRecord={setFormData}
              required
            />
          )}
        </Col>
      </Row>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add / Edit Laboratory Result"
      steps={[
        {
          title: 'Laboratory Result',
          icon: <FontAwesomeIcon icon={faFlask} />
        }
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="30vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddClaimEncounterCopyDiagnosticOrderTestResult;
