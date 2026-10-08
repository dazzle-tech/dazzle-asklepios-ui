import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXRay } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import {
  useCreateClaimEncounterCopyDiagnosticOrderTestReportMutation,
  useUpdateClaimEncounterCopyDiagnosticOrderTestReportMutation
} from '@/services/billing/claimEncounterCopyDiagnosticOrderTestReportService';
import { useEnumOptions } from '@/services/enumsApi';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  ClaimEncounterCopyDiagnosticOrderTestReport,
  ClaimEncounterCopyDiagnosticOrderTestReportCreateDTO,
  ClaimEncounterCopyDiagnosticOrderTestReportUpdateDTO
} from '@/types/model-types-new';

interface AddClaimEncounterCopyDiagnosticOrderTestReportProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  claimEncounterCopyId: number;
  orderTestId: number;
  testName?: string;
  initialData?: ClaimEncounterCopyDiagnosticOrderTestReport | null;
}

const AddClaimEncounterCopyDiagnosticOrderTestReport = ({
  open,
  setOpen,
  claimEncounterCopyId,
  orderTestId,
  testName,
  initialData
}: AddClaimEncounterCopyDiagnosticOrderTestReportProps) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    report: null as string | null,
    radiologistInformation: null as string | null,
    criticalFindings: null as string | null,
    radiologistComments: null as string | null,
    severity: null as string | null
  });

  const [createReport] =
    useCreateClaimEncounterCopyDiagnosticOrderTestReportMutation();

  const [updateReport] =
    useUpdateClaimEncounterCopyDiagnosticOrderTestReportMutation();

  const severityOptions = useEnumOptions('Severity');

  useEffect(() => {
    if (initialData) {
      setFormData({
        report: initialData.report ?? null,
        radiologistInformation: initialData.radiologistInformation ?? null,
        criticalFindings: initialData.criticalFindings ?? null,
        radiologistComments: initialData.radiologistComments ?? null,
        severity: initialData.severity ?? null
      });
    } else {
      setFormData({
        report: null,
        radiologistInformation: null,
        criticalFindings: null,
        radiologistComments: null,
        severity: null
      });
    }
  }, [initialData, open]);

  const handleSave = async () => {
    const hasContent =
      formData.report?.trim() ||
      formData.radiologistInformation?.trim() ||
      formData.criticalFindings?.trim() ||
      formData.radiologistComments?.trim();

    if (!hasContent) {
      dispatch(
        notify({ msg: 'Report content is required', sev: 'warning' })
      );
      return;
    }

    try {
      if (initialData?.id) {
        const payload: ClaimEncounterCopyDiagnosticOrderTestReportUpdateDTO = {
          report: formData.report?.trim(),
          radiologistInformation: formData.radiologistInformation?.trim(),
          criticalFindings: formData.criticalFindings?.trim(),
          radiologistComments: formData.radiologistComments?.trim(),
          severity: formData.severity
        };

        await updateReport({
          id: initialData.id,
          data: payload
        }).unwrap();

        dispatch(
          notify({ msg: 'Report updated successfully', sev: 'success' })
        );
      } else {
        const payload: ClaimEncounterCopyDiagnosticOrderTestReportCreateDTO = {
          orderTestId,
          report: formData.report?.trim(),
          radiologistInformation: formData.radiologistInformation?.trim(),
          criticalFindings: formData.criticalFindings?.trim(),
          radiologistComments: formData.radiologistComments?.trim(),
          severity: formData.severity
        };

        await createReport({
          claimEncounterCopyId,
          data: payload
        }).unwrap();

        dispatch(
          notify({ msg: 'Report added successfully', sev: 'success' })
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
        <Col md={16}>
          <div style={{ marginBottom: 10, fontWeight: 600 }}>
            {testName || `Test #${orderTestId}`}
          </div>
        </Col>

        <Col md={8}>
          <MyInput
            width="100%"
            column
            fieldType="select"
            fieldLabel="Severity"
            selectData={severityOptions}
            selectDataLabel="label"
            selectDataValue="value"
            fieldName="severity"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col md={24}>
          <MyInput
            width="100%"
            column
            fieldType="textarea"
            fieldLabel="Report"
            fieldName="report"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col md={12}>
          <MyInput
            width="100%"
            column
            fieldType="textarea"
            fieldLabel="Radiologist Information"
            fieldName="radiologistInformation"
            record={formData}
            setRecord={setFormData}
          />
        </Col>

        <Col md={12}>
          <MyInput
            width="100%"
            column
            fieldType="textarea"
            fieldLabel="Critical Findings"
            fieldName="criticalFindings"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col md={24}>
          <MyInput
            width="100%"
            column
            fieldType="textarea"
            fieldLabel="Radiologist Comments"
            fieldName="radiologistComments"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add / Edit Radiology Report"
      steps={[
        {
          title: 'Radiology Report',
          icon: <FontAwesomeIcon icon={faXRay} />
        }
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="38vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddClaimEncounterCopyDiagnosticOrderTestReport;
