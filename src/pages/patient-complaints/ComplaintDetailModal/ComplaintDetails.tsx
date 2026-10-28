import React from 'react';
import { Badge, Loader } from 'rsuite';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import {
  PATIENT_COMPLAINT_FEEDBACK_TYPE_ENUM,
  PATIENT_COMPLAINT_FEEDBACK_TYPE_LABEL_OVERRIDES,
  PATIENT_COMPLAINT_PREFERRED_CONTACT_METHOD_ENUM,
  PATIENT_COMPLAINT_TYPE_ENUM,
  PATIENT_COMPLAINT_TYPE_LABEL_OVERRIDES,
  formatDisplayDate,
  formatDisplayTime,
  getStatusColor,
  resolveEnumLabel,
  type PatientComplaintDetail
} from '../constants';

type ComplaintDetailsProps = {
  complaint: PatientComplaintDetail | undefined;
  detailFetching: boolean;
  detailError: boolean;
  overdue: boolean;
  mutationPending: boolean;
  fetchAttachmentDownloadUrl: (args: {
    complaintId: number;
    attachmentId: number;
  }) => {
    unwrap: () => Promise<{ url: string }>;
  };
  notifyError: (error: unknown, fallback: string) => void;
};

const ComplaintDetails = ({
  complaint,
  detailFetching,
  detailError,
  overdue,
  mutationPending,
  fetchAttachmentDownloadUrl,
  notifyError
}: ComplaintDetailsProps) => {
  const feedbackTypeOptions = useEnumOptions(PATIENT_COMPLAINT_FEEDBACK_TYPE_ENUM, {
    labelOverrides: PATIENT_COMPLAINT_FEEDBACK_TYPE_LABEL_OVERRIDES
  });
  const complaintTypeOptions = useEnumOptions(PATIENT_COMPLAINT_TYPE_ENUM, {
    labelOverrides: PATIENT_COMPLAINT_TYPE_LABEL_OVERRIDES
  });
  const preferredContactOptions = useEnumOptions(
    PATIENT_COMPLAINT_PREFERRED_CONTACT_METHOD_ENUM
  );

  if (!complaint) {
    return (
      <div className="patient-complaint-modal-section">
        {detailFetching ? <Loader content="Loading…" /> : null}
        {detailError ? (
          <div className="patient-complaint-form-error" role="alert">
            <Translate>Unable to load complaint details.</Translate>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="patient-complaint-modal-section">
      <div className="patient-complaint-detail-grid">
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Complaint Reference</Translate>
          </div>
          <div className="patient-complaint-detail-value">{complaint.reference}</div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Status</Translate>
          </div>
          <div className="patient-complaint-detail-value patient-complaint-status-inline">
            {overdue ? (
              <Badge
                className="patient-complaint-overdue-badge"
                color="red"
                content={<Translate>Overdue</Translate>}
              >
                <MyBadgeStatus
                  contant={complaint.status}
                  color={getStatusColor(complaint.status)}
                />
              </Badge>
            ) : (
              <MyBadgeStatus
                contant={complaint.status}
                color={getStatusColor(complaint.status)}
              />
            )}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Complaint Mode</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous ? <Translate>Anonymous</Translate> : <Translate>Identified</Translate>}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Full Name</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous ? <Translate>Anonymous</Translate> : complaint.patientName || '-'}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Document Type</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous ? '-' : complaint.documentType || '-'}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Document Number</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous
              ? '-'
              : complaint.documentNumber || complaint.patientIdentifier || '-'}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Email</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous ? '-' : complaint.contactEmail || '-'}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Phone Number</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous ? '-' : complaint.contactPhone || '-'}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Preferred Contact Method</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous || !complaint.preferredContactMethod
              ? '-'
              : resolveEnumLabel(
                  preferredContactOptions,
                  complaint.preferredContactMethod
                )}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>On Behalf of Someone Else</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous || complaint.onBehalf == null
              ? '-'
              : complaint.onBehalf
                ? <Translate>Yes</Translate>
                : <Translate>No</Translate>}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Relationship</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.anonymous || !complaint.relationshipToPatient
              ? '-'
              : complaint.relationshipToPatient}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Consent to Contact / Record Review</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.consentToContact ? <Translate>Yes</Translate> : <Translate>No</Translate>}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Type of Feedback</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.feedbackType
              ? resolveEnumLabel(feedbackTypeOptions, complaint.feedbackType)
              : '-'}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Category</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {complaint.complaintType
              ? resolveEnumLabel(complaintTypeOptions, complaint.complaintType)
              : '-'}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Date of Visit</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {formatDisplayDate(complaint.incidentDate)}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Time of Visit</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {formatDisplayTime(complaint.incidentTime)}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Facility</Translate>
          </div>
          <div className="patient-complaint-detail-value">{complaint.facilityName}</div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Department or Clinic</Translate>
          </div>
          <div className="patient-complaint-detail-value">{complaint.departmentName || '-'}</div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Assigned To</Translate>
          </div>
          <div className="patient-complaint-detail-value">{complaint.assignedUserName || '-'}</div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Target Deadline</Translate>
          </div>
          <div className={`patient-complaint-detail-value ${overdue ? 'is-overdue' : ''}`}>
            {formatDisplayDate(complaint.targetDeadline)}
          </div>
        </div>
        <div>
          <div className="patient-complaint-detail-label">
            <Translate>Received Date</Translate>
          </div>
          <div className="patient-complaint-detail-value">
            {formatDisplayDate(complaint.receivedDate)}
          </div>
        </div>
      </div>

      <div className="patient-complaint-detail-block">
        <div className="patient-complaint-detail-label">
          <Translate>Subject</Translate>
        </div>
        <div className="patient-complaint-detail-value">{complaint.subject}</div>
      </div>

      <div className="patient-complaint-detail-block">
        <div className="patient-complaint-detail-label">
          <Translate>Details</Translate>
        </div>
        <div className="patient-complaint-detail-value">{complaint.description}</div>
      </div>

      <div className="patient-complaint-detail-block">
        <div className="patient-complaint-detail-label">
          <Translate>Healthcare Professional Involved</Translate>
        </div>
        <div className="patient-complaint-detail-value">
          {complaint.involvedStaffNames || '-'}
        </div>
      </div>

      <div className="patient-complaint-detail-block">
        <div className="patient-complaint-detail-label">
          <Translate>Outcome Looking For</Translate>
        </div>
        <div className="patient-complaint-detail-value">
          {complaint.desiredResolution || '-'}
        </div>
      </div>

      <div className="patient-complaint-detail-block">
        <div className="patient-complaint-detail-label">
          <Translate>Attachments</Translate>
        </div>
        {(complaint.attachments ?? []).length === 0 ? (
          <div className="patient-complaint-detail-value">-</div>
        ) : (
          <div className="patient-complaint-attachment-list">
            {complaint.attachments?.map(attachment => (
              <div key={attachment.id} className="patient-complaint-attachment-item">
                <span>{attachment.filename}</span>
                <MyButton
                  appearance="ghost"
                  size="sm"
                  disabled={mutationPending}
                  onClick={async () => {
                    try {
                      const result = await fetchAttachmentDownloadUrl({
                        complaintId: complaint.id,
                        attachmentId: attachment.id
                      }).unwrap();
                      window.open(result.url, '_blank', 'noopener,noreferrer');
                    } catch (error) {
                      notifyError(error, 'Unable to download attachment.');
                    }
                  }}
                >
                  <Translate>Download</Translate>
                </MyButton>
              </div>
            ))}
          </div>
        )}
      </div>

      {complaint.resolutionSummary ? (
        <div className="patient-complaint-detail-block">
          <div className="patient-complaint-detail-label">
            <Translate>Resolution Summary</Translate>
          </div>
          <div className="patient-complaint-detail-value">{complaint.resolutionSummary}</div>
        </div>
      ) : null}

      {complaint.reopenReason ? (
        <div className="patient-complaint-detail-block">
          <div className="patient-complaint-detail-label">
            <Translate>Last Reopen Reason</Translate>
          </div>
          <div className="patient-complaint-detail-value">{complaint.reopenReason}</div>
        </div>
      ) : null}
    </div>
  );
};

export default ComplaintDetails;
