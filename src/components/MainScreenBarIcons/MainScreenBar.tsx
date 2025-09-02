import React from 'react';
import { useState } from 'react';
import { IconButton, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartColumn,
  faCommentDots,
  faCalendarDays,
  faBookmark,
  faBullhorn,
  faRepeat,
  faHeadset,
  faNoteSticky
} from '@fortawesome/free-solid-svg-icons';
import './style.less';
const MainScreenBar = ({ setExpandNotes }) => {
  return (
    <div className='main-screen-bar-icons-main-container'>
      {/* Dashboard Customizing */}
      <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>Dashboard Customizing</Tooltip>}>
        <IconButton icon={<FontAwesomeIcon className='header-screen-bar-icon-size-handle' icon={faChartColumn} />} appearance="subtle" circle />
      </Whisper>

      {/* Secure Messaging */}
      <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>Secure Messaging</Tooltip>}>
        <IconButton icon={<FontAwesomeIcon className='header-screen-bar-icon-size-handle' icon={faCommentDots} />} appearance="subtle" circle />
      </Whisper>

      {/* My Appointments */}
      <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>My Appointments</Tooltip>}>
        <IconButton icon={<FontAwesomeIcon className='header-screen-bar-icon-size-handle' icon={faCalendarDays} />} appearance="subtle" circle />
      </Whisper>

      {/* Bookmarks */}
      <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>Bookmarks</Tooltip>}>
        <IconButton icon={<FontAwesomeIcon className='header-screen-bar-icon-size-handle' icon={faBookmark} />} appearance="subtle" circle />
      </Whisper>

      {/* Announcements */}
      <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>Announcements</Tooltip>}>
        <IconButton icon={<FontAwesomeIcon className='header-screen-bar-icon-size-handle' icon={faBullhorn} />} appearance="subtle" circle />
      </Whisper>

      {/* Department Switch */}
      <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>Department Switch</Tooltip>}>
        <IconButton icon={<FontAwesomeIcon className='header-screen-bar-icon-size-handle' icon={faRepeat} />} appearance="subtle" circle />
      </Whisper>

      {/* Help & Support */}
      <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>Help & Support</Tooltip>}>
        <IconButton icon={<FontAwesomeIcon className='header-screen-bar-icon-size-handle' icon={faHeadset} />} appearance="subtle" circle />
      </Whisper>

<Whisper placement="bottom" trigger="hover" speaker={<Tooltip>Sticky Notes</Tooltip>}>
      <IconButton
        icon={<FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faNoteSticky} />}
        appearance="subtle"
        circle
        onClick={() => setExpandNotes(true)}
      />
    </Whisper>
    
</div>);
};

export default MainScreenBar;
