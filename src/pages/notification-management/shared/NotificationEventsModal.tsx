import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useGetNotificationEventsQuery } from '@/services/notification-management/notificationService';
import { NotificationEventResponseVM, NotificationResponseVM } from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import React from 'react';
import { Loader, Tooltip, Whisper } from 'rsuite';

interface NotificationEventsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  notification: NotificationResponseVM | null;
}

const truncate = (value: string, max = 40) =>
  value && value.length > max ? `${value.substring(0, max)}...` : value || '-';

const formatPayload = (payload?: Record<string, unknown> | null) => {
  if (!payload || Object.keys(payload).length === 0) return '-';

  try {
    return JSON.stringify(payload);
  } catch {
    return '-';
  }
};

const NotificationEventsModal: React.FC<NotificationEventsModalProps> = ({
  open,
  setOpen,
  notification,
}) => {
  const notificationId = notification?.id;
  const { data: events, isFetching } = useGetNotificationEventsQuery(notificationId!, {
    skip: !open || !notificationId,
  });

  const columns = [
    {
      key: 'eventType',
      title: 'Event Type',
      render: (row: NotificationEventResponseVM) =>
        row.eventType ? formatEnumString(row.eventType) : '-',
    },
    {
      key: 'oldStatus',
      title: 'Old Status',
      render: (row: NotificationEventResponseVM) =>
        row.oldStatus ? formatEnumString(row.oldStatus) : '-',
    },
    {
      key: 'newStatus',
      title: 'New Status',
      render: (row: NotificationEventResponseVM) =>
        row.newStatus ? formatEnumString(row.newStatus) : '-',
    },
    {
      key: 'providerName',
      title: 'Provider',
      render: (row: NotificationEventResponseVM) => row.providerName || '-',
    },
    {
      key: 'providerStatus',
      title: 'Provider Status',
      render: (row: NotificationEventResponseVM) => row.providerStatus || '-',
    },
    {
      key: 'providerMessageId',
      title: 'Provider Message ID',
      render: (row: NotificationEventResponseVM) => row.providerMessageId || '-',
    },
    {
      key: 'message',
      title: 'Message',
      render: (row: NotificationEventResponseVM) => (
        <Whisper placement="top" speaker={<Tooltip>{row.message || '-'}</Tooltip>}>
          <span>{truncate(row.message ?? '')}</span>
        </Whisper>
      ),
    },
    {
      key: 'errorMessage',
      title: 'Error',
      render: (row: NotificationEventResponseVM) => (
        <Whisper placement="top" speaker={<Tooltip>{row.errorMessage || '-'}</Tooltip>}>
          <span>{truncate(row.errorMessage ?? '', 30)}</span>
        </Whisper>
      ),
    },
    {
      key: 'createdDate',
      title: 'Created Date',
      render: (row: NotificationEventResponseVM) => formatDateWithoutSeconds(row.createdDate) || '-',
    },
    {
      key: 'eventPayload',
      title: 'Payload',
      render: (row: NotificationEventResponseVM) => {
        const payload = formatPayload(row.eventPayload);
        return (
          <Whisper placement="top" speaker={<Tooltip>{payload}</Tooltip>}>
            <span>{truncate(payload, 30)}</span>
          </Whisper>
        );
      },
    },
  ];

  const title = notification?.code
    ? `Notification Events - ${notification.code}`
    : 'Notification Events';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={title}
      size="lg"
      hideActionBtn
      content={() =>
        isFetching ? (
          <Loader center content="Loading..." />
        ) : (
          <MyTable height={400} data={events ?? []} columns={columns} />
        )
      }
    />
  );
};

export default NotificationEventsModal;
