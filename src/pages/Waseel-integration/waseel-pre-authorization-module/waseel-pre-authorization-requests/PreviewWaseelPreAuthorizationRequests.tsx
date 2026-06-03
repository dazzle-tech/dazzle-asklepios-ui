import React, { useEffect, useState } from 'react';
import { Col, Form, Panel, Row } from 'rsuite';

import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

import './styles.less';

interface PreviewWaseelPreAuthorizationRequestsProps {
  open: boolean;
  preAuth: any;
  onClose: () => void;
}

const PreviewWaseelPreAuthorizationRequests: React.FC<
  PreviewWaseelPreAuthorizationRequestsProps
> = ({
  open,
  preAuth,
  onClose
}) => {

  const [previewData, setPreviewData] = useState<any>({
    preAuthRefNo: '',
    encounterNo: '',
    mrn: '',
    patientName: '',
    insuranceCompany: '',
    memberId: '',
    diagnosisCode: '',
    procedureCode: '',
    requestedAmount: '',
    approvedAmount: '',
    approvalNumber: '',
    requestDate: '',
    responseDate: '',
    requestedBy: '',
    doctorName: '',
    rejectionReason: '',
    validUntil: '',
    status: ''
  });

  useEffect(() => {
    if (!preAuth) return;

    setPreviewData({
      preAuthRefNo: preAuth?.preAuthRefNo ?? '-',
      encounterNo: preAuth?.encounterNo ?? '-',
      mrn: preAuth?.mrn ?? '-',
      patientName: preAuth?.patientName ?? '-',
      insuranceCompany: preAuth?.insuranceCompany ?? '-',
      memberId: preAuth?.memberId ?? '-',
      diagnosisCode: preAuth?.diagnosisCode ?? '-',
      procedureCode: preAuth?.procedureCode ?? '-',
      requestedAmount: preAuth?.requestedAmount ?? '-',
      approvedAmount: preAuth?.approvedAmount ?? '-',
      approvalNumber: preAuth?.approvalNumber ?? '-',
      requestDate: preAuth?.requestDate ?? '-',
      responseDate: preAuth?.responseDate ?? '-',
      requestedBy: preAuth?.requestedBy ?? '-',
      doctorName: preAuth?.doctorName ?? '-',
      rejectionReason: preAuth?.rejectionReason ?? '-',
      validUntil: preAuth?.validUntil ?? '-',
      status: preAuth?.status ?? '-'
    });
  }, [preAuth]);

  if (!open) return null;

  return (
    <Panel
      bordered
      className="preview-request"
      header={
        <div className="preview-header">

          <div className="preview-title">
            Pre-Authorization Preview
          </div>

          <button
            className="close-preview-btn"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>

        </div>
      }
    >
      <div className="main-sections-preview-request-container">

        {/* Basic Info */}
        <SectionContainer
          title="Basic Information"
          content={
            <Form fluid>
              <Row gutter={16}>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Insurance Ref No"
                    record={previewData}
                    fieldName="preAuthRefNo"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Encounter No"
                    record={previewData}
                    fieldName="encounterNo"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="MRN"
                    record={previewData}
                    fieldName="mrn"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Patient Name"
                    record={previewData}
                    fieldName="patientName"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Insurance Company"
                    record={previewData}
                    fieldName="insuranceCompany"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Member ID"
                    record={previewData}
                    fieldName="memberId"
                    disabled
                  />
                </Col>

              </Row>
            </Form>
          }
        />

        {/* Medical Details */}
        <SectionContainer
          title="Medical Details"
          content={
            <Form fluid>
              <Row gutter={16}>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Diagnosis Code"
                    record={previewData}
                    fieldName="diagnosisCode"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Procedure Code"
                    record={previewData}
                    fieldName="procedureCode"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <div className="status-container">
                    <label className="status-label">
                      Pre-Auth Status
                    </label>

                    <MyBadgeStatus
                      contant={previewData.status}
                      color={
                        previewData.status === 'APPROVED'
                          ? '#28a745'
                          : previewData.status === 'REJECTED'
                            ? '#dc3545'
                            : previewData.status === 'PENDING'
                              ? '#ffc107'
                              : '#007bff'
                      }
                    />
                  </div>
                </Col>

              </Row>
            </Form>
          }
        />

        {/* Financial Details */}
        <SectionContainer
          title="Financial Details"
          content={
            <Form fluid>
              <Row gutter={16}>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Requested Amount"
                    record={previewData}
                    fieldName="requestedAmount"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Approved Amount"
                    record={previewData}
                    fieldName="approvedAmount"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Approval Number"
                    record={previewData}
                    fieldName="approvalNumber"
                    disabled
                  />
                </Col>

              </Row>
            </Form>
          }
        />

        {/* Dates & Users */}
        <SectionContainer
          title="Dates & Users"
          content={
            <Form fluid>
              <Row gutter={16}>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Request Date"
                    record={previewData}
                    fieldName="requestDate"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Response Date"
                    record={previewData}
                    fieldName="responseDate"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Valid Until"
                    record={previewData}
                    fieldName="validUntil"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Requested By"
                    record={previewData}
                    fieldName="requestedBy"
                    disabled
                  />
                </Col>

                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Doctor Name"
                    record={previewData}
                    fieldName="doctorName"
                    disabled
                  />
                </Col>

              </Row>
            </Form>
          }
        />

        {/* Rejection Reason */}
        {!!previewData?.rejectionReason &&
          previewData?.rejectionReason !== '-' && (
            <SectionContainer
              title="Rejection Reason"
              content={
                <Form fluid>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        fieldType="textarea"
                        fieldLabel="Reason"
                        record={previewData}
                        fieldName="rejectionReason"
                        disabled
                      />
                    </Col>
                  </Row>
                </Form>
              }
            />
          )}

      </div>
    </Panel>
  );
};

export default PreviewWaseelPreAuthorizationRequests;