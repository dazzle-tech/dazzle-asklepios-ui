import { useCountUnreadInAppNotificationsQuery } from '@/services/notification-management/notificationService';

import { useAppSelector } from '@/hooks';

import NoticeIcon from '@rsuite/icons/Notice';

import { IconButton } from '@mui/material';

import React, { useMemo } from 'react';

import { Badge, Whisper } from 'rsuite';

import InAppNotificationsPopover from './InAppNotificationsPopover';

import { getInAppRecipientFromUser } from './inAppNotificationUtils';



const InAppNotificationBell = () => {

  const mode = useAppSelector(state => state.ui.mode);

  const user = useAppSelector(state => state.auth.user);

  const recipientParams = useMemo(() => getInAppRecipientFromUser(user), [user]);

  const unreadCountParams = useMemo(
    () => (recipientParams ? { ...recipientParams, channel: 'IN_APP' as const } : null),
    [recipientParams]
  );

  const { data: unreadCount = 0 } = useCountUnreadInAppNotificationsQuery(unreadCountParams!, {
    skip: !unreadCountParams,
    pollingInterval: 60000,
  });



  return (

    <Whisper

      placement="bottomEnd"

      trigger="click"

      speaker={(props, ref) => (

        <InAppNotificationsPopover ref={ref} {...props} recipientParams={recipientParams} />

      )}

    >

      <IconButton size="small">
        {unreadCount > 0 ? (
          <Badge content={unreadCount}>
            <NoticeIcon
              style={{ fontSize: 20 }}
              color={mode === 'light' ? '#333' : 'var(--white)'}
            />
          </Badge>
        ) : (
          <NoticeIcon
            style={{ fontSize: 20 }}
            color={mode === 'light' ? '#333' : 'var(--white)'}
          />
        )}
      </IconButton>

    </Whisper>

  );

};



export default InAppNotificationBell;

