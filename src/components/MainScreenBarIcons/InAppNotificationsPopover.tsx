import {
  InAppNotificationRecipientParams,
  useGetInAppNotificationsQuery,
  useMarkNotificationReadMutation,
} from '@/services/notification-management/notificationService';
import { NotificationResponseVM } from '@/types/model-types-new';
import { extractErrorMessage } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import React, { forwardRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MdDone } from 'react-icons/md';
import { Badge, Button, List, Loader, Popover, Stack } from 'rsuite';
import {
  formatNotificationTimeAgo,
  getInAppNotificationBody,
  isUnreadInAppNotification,
} from './inAppNotificationUtils';
import './style.less';

const POPOVER_LIMIT = 10;

interface InAppNotificationsPopoverProps {
  onClose: () => void;
  left?: number;
  top?: number;
  className?: string;
  recipientParams: InAppNotificationRecipientParams | null;
}

const InAppNotificationsPopover = forwardRef<HTMLElement, InAppNotificationsPopoverProps>(
  ({ onClose, left, top, className, recipientParams }, ref) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { data, isFetching } = useGetInAppNotificationsQuery(recipientParams!, {
      skip: !recipientParams,
    });
    const [markNotificationRead, { isLoading: isMarkingRead }] = useMarkNotificationReadMutation();

    const notifications = useMemo(() => (data ?? []).slice(0, POPOVER_LIMIT), [data]);

    const handleMarkRead = async (
      event: React.MouseEvent,
      notification: NotificationResponseVM
    ) => {
      event.stopPropagation();

      if (!notification.id || !isUnreadInAppNotification(notification.status)) return;

      try {
        await markNotificationRead(notification.id).unwrap();
      } catch (error) {
        dispatch(
          notify({
            msg: extractErrorMessage(error) || 'Failed to mark notification as read',
            sev: 'warning',
          })
        );
      }
    };

    const handleMoreNotifications = () => {
      onClose();
      navigate('/in-app-notification');
    };

    const renderContent = () => {
      if (!recipientParams) {
        return <p className="in-app-notifications-popover__empty">Unable to load notifications.</p>;
      }

      if (isFetching) {
        return <Loader center content="Loading..." />;
      }

      if (!notifications.length) {
        return <p className="in-app-notifications-popover__empty">No notifications yet.</p>;
      }

      return (
        <List className="in-app-notifications-popover__list">
          {notifications.map(notification => {
            const unread = isUnreadInAppNotification(notification.status);
            const title = notification.title?.trim();
            const body = getInAppNotificationBody(notification);
            const timeLabel = formatNotificationTimeAgo(
              notification.sentDate ?? notification.readDate
            );

            return (
              <List.Item
                key={notification.id}
                className={`in-app-notifications-popover__item${
                  unread ? ' in-app-notifications-popover__item--unread' : ''
                }`}
              >
                <div className="in-app-notifications-popover__header">
                  <Stack spacing={4} alignItems="center">
                    {unread ? <Badge className="in-app-notifications-popover__badge" /> : null}
                    <span className="in-app-notifications-popover__time">{timeLabel}</span>
                  </Stack>
                  {unread ? (
                    <MdDone
                      title="Mark as read"
                      size={20}
                      className="in-app-notifications-popover__mark-read"
                      style={{
                        cursor: isMarkingRead ? 'not-allowed' : 'pointer',
                        opacity: isMarkingRead ? 0.5 : 1,
                      }}
                      onClick={event => handleMarkRead(event, notification)}
                    />
                  ) : null}
                </div>
                {title ? <p className="in-app-notifications-popover__title">{title}</p> : null}
                {body ? (
                  <p className="in-app-notifications-popover__body">{body}</p>
                ) : (
                  <p className="in-app-notifications-popover__body in-app-notifications-popover__body--empty">
                    {notification.code?.trim() || 'No content'}
                  </p>
                )}
              </List.Item>
            );
          })}
        </List>
      );
    };

    return (
      <Popover
        ref={ref}
        className={className}
        style={{ left, top, width: 380 }}
        title="Notifications"
      >
        {renderContent()}
        <div className="in-app-notifications-popover__footer">
          <Button appearance="link" onClick={handleMoreNotifications}>
            More notifications
          </Button>
        </div>
      </Popover>
    );
  }
);

InAppNotificationsPopover.displayName = 'InAppNotificationsPopover';

export default InAppNotificationsPopover;
