import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyModal from '@/components/MyModal/MyModal';
import { useGetNotificationByIdQuery } from '@/services/notification-management/notificationService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';
import { NotificationChannel, NotificationResponseVM } from '@/types/model-types-new';
import {
  conjureValueBasedOnIDFromList,
  conjureValueBasedOnKeyFromList,
  formatDateWithoutSeconds,
  formatEnumString,
} from '@/utils';
import React, { useEffect, useState } from 'react';
import { Col, Form, Loader, Row } from 'rsuite';
import { getNotificationChannelPageConfig } from './notificationChannelPageConfig';
import './styles.less';

interface ViewNotificationModalProps {
  channel: NotificationChannel;
  open: boolean;
  setOpen: (open: boolean) => void;
  notification: NotificationResponseVM | null;
}

type ViewRecord = {
  code: string;
  status: string;
  priority: string;
  language: string;
  facility: string;
  recipientName: string;
  recipientEmail: string;
  toEmails: string;
  ccEmails: string;
  bccEmails: string;
  recipientPhone: string;
  toPhone: string;
  subject: string;
  title: string;
  body: string;
  providerName: string;
  providerStatus: string;
  providerMessageId: string;
  relatedEntity: string;
  sentDate: string;
  deliveredDate: string;
  failedDate: string;
  nextRetryDate: string;
  retryCount: string;
  errorMessage: string;
};

const emptyViewRecord = (): ViewRecord => ({
  code: '',
  status: '',
  priority: '',
  language: '',
  facility: '',
  recipientName: '',
  recipientEmail: '',
  toEmails: '',
  ccEmails: '',
  bccEmails: '',
  recipientPhone: '',
  toPhone: '',
  subject: '',
  title: '',
  body: '',
  providerName: '',
  providerStatus: '',
  providerMessageId: '',
  relatedEntity: '',
  sentDate: '',
  deliveredDate: '',
  failedDate: '',
  nextRetryDate: '',
  retryCount: '',
  errorMessage: '',
});

const formatListValue = (value?: string[] | null) => (value?.length ? value.join(', ') : '');

const mapDetailToViewRecord = (
  detail: NotificationResponseVM | null | undefined,
  facilityListResponse: unknown,
  languages: unknown
): ViewRecord => {
  if (!detail) return emptyViewRecord();

  return {
    code: detail.code ?? '',
    status: detail.status ? formatEnumString(detail.status) : '',
    priority: detail.priority ? formatEnumString(detail.priority) : '',
    language: detail.language
      ? conjureValueBasedOnKeyFromList(languages as any[], detail.language, 'langName') ??
        detail.language
      : '',
    facility: detail.facilityId
      ? conjureValueBasedOnIDFromList(
          facilityListResponse as any[],
          detail.facilityId,
          'name'
        ) ?? String(detail.facilityId)
      : 'All Facilities',
    recipientName: detail.recipientName ?? '',
    recipientEmail: detail.recipientEmail ?? '',
    toEmails: formatListValue(detail.toEmails),
    ccEmails: formatListValue(detail.ccEmails),
    bccEmails: formatListValue(detail.bccEmails),
    recipientPhone: detail.recipientPhone ?? '',
    toPhone: detail.toPhone ?? '',
    subject: detail.subject ?? '',
    title: detail.title ?? '',
    body: detail.body ?? '',
    providerName: detail.providerName ?? '',
    providerStatus: detail.providerStatus ?? '',
    providerMessageId: detail.providerMessageId ?? '',
    relatedEntity:
      detail.relatedEntityType || detail.relatedEntityId
        ? `${formatEnumString(detail.relatedEntityType ?? '')} #${detail.relatedEntityId ?? '-'}`
        : '',
    sentDate: formatDateWithoutSeconds(detail.sentDate) || '',
    deliveredDate: formatDateWithoutSeconds(detail.deliveredDate) || '',
    failedDate: formatDateWithoutSeconds(detail.failedDate) || '',
    nextRetryDate: formatDateWithoutSeconds(detail.nextRetryDate) || '',
    retryCount: `${detail.retryCount ?? 0} / ${detail.maxRetryCount ?? 0}`,
    errorMessage: detail.errorMessage ?? '',
  };
};

const ViewNotificationModal: React.FC<ViewNotificationModalProps> = ({
  channel,
  open,
  setOpen,
  notification,
}) => {
  const config = getNotificationChannelPageConfig(channel);
  const notificationId = notification?.id;
  const { data: fetchedNotification, isFetching } = useGetNotificationByIdQuery(notificationId!, {
    skip: !open || !notificationId,
  });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const { data: languages } = useGetAllLanguagesQuery({});

  const detail = fetchedNotification ?? notification;
  const [viewRecord, setViewRecord] = useState<ViewRecord>(emptyViewRecord);

  useEffect(() => {
    if (!open) return;
    setViewRecord(mapDetailToViewRecord(detail, facilityListResponse, languages));
  }, [open, detail, facilityListResponse, languages]);

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const conjureFormContent = () => {
    if (isFetching && !detail) {
      return <Loader center content="Loading..." />;
    }

    return (
      <Form fluid className="channel-notification-detail-form" disabled>
        <Row>
          <Col md={12}>
            <MyInput
              fieldName="code"
              fieldType="text"
              fieldLabel="Code"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
          <Col md={12}>
            <MyInput
              fieldName="status"
              fieldType="text"
              fieldLabel="Status"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              fieldName="priority"
              fieldType="text"
              fieldLabel="Priority"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
          <Col md={12}>
            <MyInput
              fieldName="language"
              fieldType="text"
              fieldLabel="Language"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              fieldName="facility"
              fieldType="text"
              fieldLabel="Facility"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
          <Col md={12}>
            <MyInput
              fieldName="recipientName"
              fieldType="text"
              fieldLabel="Recipient Name"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
        </Row>
        {config.showEmailColumns && (
          <>
            <Row>
              <Col md={12}>
                <MyInput
                  fieldName="recipientEmail"
                  fieldType="text"
                  fieldLabel="Recipient Email"
                  record={viewRecord}
                  setRecord={setViewRecord}
                  width="100%"
                  disabled
                />
              </Col>
              <Col md={12}>
                <MyInput
                  fieldName="toEmails"
                  fieldType="text"
                  fieldLabel="To Emails"
                  record={viewRecord}
                  setRecord={setViewRecord}
                  width="100%"
                  disabled
                />
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <MyInput
                  fieldName="ccEmails"
                  fieldType="text"
                  fieldLabel="CC Emails"
                  record={viewRecord}
                  setRecord={setViewRecord}
                  width="100%"
                  disabled
                />
              </Col>
              <Col md={12}>
                <MyInput
                  fieldName="bccEmails"
                  fieldType="text"
                  fieldLabel="BCC Emails"
                  record={viewRecord}
                  setRecord={setViewRecord}
                  width="100%"
                  disabled
                />
              </Col>
            </Row>
          </>
        )}
        {config.showPhoneColumns && (
          <Row>
            <Col md={12}>
              <MyInput
                fieldName="recipientPhone"
                fieldType="text"
                fieldLabel="Recipient Phone"
                record={viewRecord}
                setRecord={setViewRecord}
                width="100%"
                disabled
              />
            </Col>
            <Col md={12}>
              <MyInput
                fieldName="toPhone"
                fieldType="text"
                fieldLabel="To Phone"
                record={viewRecord}
                setRecord={setViewRecord}
                width="100%"
                disabled
              />
            </Col>
          </Row>
        )}
        {config.showSubjectColumn && (
          <Row>
            <Col md={24}>
              <MyInput
                fieldName="subject"
                fieldType="text"
                fieldLabel="Subject"
                record={viewRecord}
                setRecord={setViewRecord}
                width="100%"
                disabled
              />
            </Col>
          </Row>
        )}
        {config.showTitleColumn && (
          <Row>
            <Col md={24}>
              <MyInput
                fieldName="title"
                fieldType="text"
                fieldLabel="Title"
                record={viewRecord}
                setRecord={setViewRecord}
                width="100%"
                disabled
              />
            </Col>
          </Row>
        )}
        <Row>
          <Col md={24}>
            {config.bodyViewAsHtml ? (
              <div className="channel-notification-detail-field">
                <MyLabel label="Body" />
                {detail?.body ? (
                  <div
                    className="channel-notification-detail-body"
                    dangerouslySetInnerHTML={{ __html: detail.body }}
                  />
                ) : (
                  <span className="channel-notification-detail-value">-</span>
                )}
              </div>
            ) : (
              <MyInput
                fieldName="body"
                fieldType="textarea"
                fieldLabel="Body"
                record={viewRecord}
                setRecord={setViewRecord}
                width="100%"
                disabled
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              fieldName="providerName"
              fieldType="text"
              fieldLabel="Provider Name"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
          <Col md={12}>
            <MyInput
              fieldName="providerStatus"
              fieldType="text"
              fieldLabel="Provider Status"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              fieldName="providerMessageId"
              fieldType="text"
              fieldLabel="Provider Message ID"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
          <Col md={12}>
            <MyInput
              fieldName="relatedEntity"
              fieldType="text"
              fieldLabel="Related Entity"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              fieldName="sentDate"
              fieldType="text"
              fieldLabel="Sent Date"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
          <Col md={12}>
            <MyInput
              fieldName="deliveredDate"
              fieldType="text"
              fieldLabel="Delivered Date"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              fieldName="failedDate"
              fieldType="text"
              fieldLabel="Failed Date"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
          <Col md={12}>
            <MyInput
              fieldName="nextRetryDate"
              fieldType="text"
              fieldLabel="Next Retry Date"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <MyInput
              fieldName="retryCount"
              fieldType="text"
              fieldLabel="Retry Count"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
          <Col md={12}>
            <MyInput
              fieldName="errorMessage"
              fieldType="textarea"
              fieldLabel="Error Message"
              record={viewRecord}
              setRecord={setViewRecord}
              width="100%"
              disabled
            />
          </Col>
        </Row>
      </Form>
    );
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={config.modalTitle}
      size="lg"
      position="right"
      hideActionBtn
      content={() => <div dir={dir}>{conjureFormContent()}</div>}
    />
  );
};

export default ViewNotificationModal;
