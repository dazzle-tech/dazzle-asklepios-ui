import {
  faBookmark,
  faBullhorn,
  faCalendarDays,
  faChartColumn,
  faCommentDots,
  faHeadset,
  faNoteSticky,
  faRepeat
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ChatScreen from '../ChatScreen/ChatScreen';
import './style.less';

const MainScreenBar = ({ setExpandNotes }) => {
  const mode = useSelector(state => state.ui.mode);
  const [showChatModal, setShowChatModal] = useState(false);

  return (
    <>
      <div
        className={`main-screen-bar-icons-main-container ${mode === 'light' ? 'light' : 'dark'}`}
      >
        <Tooltip title="Customize Dashboard">
          <IconButton size="small">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faChartColumn} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Secure Messaging">
          <IconButton size="small" onClick={() => setShowChatModal(true)}>
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faCommentDots} />
          </IconButton>
        </Tooltip>
        <Tooltip title="My Appointments">
          <IconButton size="small">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faCalendarDays} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Bookmarks">
          <IconButton size="small">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faBookmark} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Announcements">
          <IconButton size="small">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faBullhorn} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Switch Department">
          <IconButton size="small">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faRepeat} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Help & Support">
          <IconButton size="small">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faHeadset} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Sticky Notes">
          <IconButton size="small" onClick={() => setExpandNotes(true)}>
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faNoteSticky} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Chat Screen Modal */}
      <Dialog
        open={showChatModal}
        onClose={() => setShowChatModal(false)}
        maxWidth="lg"
        fullWidth
        classes={{ paper: 'chat-modal-paper' }}
        
      >
        <DialogTitle className="chat-modal-title">
          <div className="chat-modal-title-inner">
            <Typography variant="h6">Secure Messaging</Typography>
            <IconButton onClick={() => setShowChatModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent className="chat-modal-content">
          <ChatScreen />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MainScreenBar;
