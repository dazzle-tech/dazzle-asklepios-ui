import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useState } from 'react';
import { Col, Form, Panel, Row } from 'rsuite';
import './styles.less';
import { useGetDiagnosticOrderTestByIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

interface PreviewDiagnosticsOrderProps {
  open: boolean;
  orderTest: any;
}

const PreviewDiagnosticsOrder: React.FC<PreviewDiagnosticsOrderProps> = ({
  open,
  orderTest
}) => {

  const [previewData, setPreviewData] = useState<any>({
    testName: '',
    orderType: '',
    repeatEveryNumber: '',
    repeatEveryUnit: '',
    periodNumber: '',
    periodUnit: '',
    firstOccurrenceDateTime: '',
    notes: '',
    isRepeat: false,
    reason: '',
    receivedLab: ''
  });

  // ✅ مهم: هذا ID الصح
  const testId = orderTest?.id;

    const { data: reasonLov } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');

  const {
    data: fullOrderTest,
    isFetching,
    isError,
    error
  } = useGetDiagnosticOrderTestByIdQuery(
    testId ? testId : skipToken
  );

const resolveReason = (key: any) => {
  if (!key) return null;

  const found = reasonLov?.object?.find(
    (x: any) => String(x.key) === String(key)
  );

  return found?.lovDisplayVale ?? null;
};

  useEffect(() => {
    if (!fullOrderTest) return;

    const data = fullOrderTest as any;

    const mapped = {
    testName:
        data?.test?.name ??
        orderTest?.test?.name ??
        '-',

    orderType:
        data?.orderTypeLvalue?.lovDisplayVale ??
        data?.orderType ??
        data?.test?.type ??
        orderTest?.test?.type ??
        '-',

    notes: data?.notes ?? orderTest?.notes ?? '',

reason:
  data?.reasonLvalue?.lovDisplayVale ||
  resolveReason(data?.reasonLkey ?? data?.reason) ||
  '-',

    receivedLab:
        data?.receivedDepartment?.name ??
        data?.receivedDepartment?.translatedObject?.name ??
        '-'
    };
    setPreviewData(mapped);

  }, [fullOrderTest]);

  if (!open) return null;

  // 🔄 Loading
  if (isFetching) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  // ❌ Error
  if (isError) {
    return <div style={{ padding: 20 }}>Error loading data</div>;
  }

  return (
    <Panel
      key={testId} // 🔥 مهم لإعادة التحديث
      bordered
      className="preview-request"
      header={
        <div className="preview-header">
          <span>Diagnostics Order Preview</span>
        </div>
      }
    >
        <div className="main-sections-preview-request-container">

          {/* ✅ Basic Info */}
          <SectionContainer
            title="Basic Info"
            content={
                <Form>
              <Row gutter={16}>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Test Name"
                    record={previewData}
                    fieldName="testName"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Test Type"
                    record={previewData}
                    fieldName="orderType"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Reason"
                    record={previewData}
                    fieldName="reason"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Received Lab"
                    record={previewData}
                    fieldName="receivedLab"
                    disabled
                  />
                </Col>
              </Row>
              </Form>
            }
          />

          {/* 🔁 Repeat */}
          {previewData.isRepeat && (
            <SectionContainer
              title="Repeat Details"
              content={
                <Form>
                <Row gutter={16}>
                  <Col md={8}>
                    <MyInput
                      fieldType="text"
                      fieldLabel="Repeat Every"
                      record={previewData}
                      fieldName="repeatEveryNumber"
                      disabled
                    />
                  </Col>

                  <Col md={8}>
                    <MyInput
                      fieldType="text"
                      fieldLabel="For Period"
                      record={previewData}
                      fieldName="periodNumber"
                      disabled
                    />
                  </Col>

                  <Col md={8}>
                    <MyInput
                      fieldType="datetime"
                      fieldLabel="First Occurrence"
                      record={previewData}
                      fieldName="firstOccurrenceDateTime"
                      disabled
                    />
                  </Col>
                </Row>
                </Form>
              }
            />
          )}

          {/* 📝 Notes */}
          <SectionContainer
            title="Notes"
            content={
            <Form>
              <Row>
                <Col md={24}>
                  <MyInput
                    fieldType="textarea"
                    fieldLabel="Notes"
                    record={previewData}
                    fieldName="notes"
                    disabled
                  />
                </Col>
              </Row>
              </Form>
            }
          />

        </div>
    </Panel>
  );
};

export default PreviewDiagnosticsOrder;