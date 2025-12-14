import React, { useState, useRef, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Divider,
  Paper,
  InputAdornment,
  Modal,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Flag as FlagIcon,
  VideoCall as VideoCallIcon,
  MoreVert as MoreVertIcon,
  EmojiEmotions as EmojiIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import './ChatScreen.less';
import MyButton from '../MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';

const ChatScreen = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  // States
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flaggedMessage, setFlaggedMessage] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [hideChatsContent, setHideChatsContent] = useState(false);
  const [showLastMessageOnly, setShowLastMessageOnly] = useState(false);

  const [chats, setChats] = useState([
    {
      id: 1,
      name: 'Alice Johnson',
      lastMessage: 'Hey, how are you doing?',
      time: '10:30 AM',
      unread: 2,
      isGroup: false,
      avatar: 'A',
      avatarColor: '#f44336',
      online: true,
      messages: [
        {
          id: 1,
          text: 'Hey there! How are you?',
          sender: 'other',
          time: '10:25 AM',
          flagged: false
        },
        { id: 2, text: "I'm doing great!", sender: 'me', time: '10:26 AM', flagged: false },
        {
          id: 3,
          text: "That's wonderful to hear!",
          sender: 'other',
          time: '10:27 AM',
          flagged: false
        },
        {
          id: 4,
          text: 'Are we still on for the meeting later?',
          sender: 'me',
          time: '10:28 AM',
          flagged: false
        },
        {
          id: 5,
          text: 'Yes, absolutely! See you at 3 PM',
          sender: 'other',
          time: '10:30 AM',
          flagged: false,
          status: 'read'
        }
      ]
    },
    {
      id: 2,
      name: 'Cardiology Ward',
      lastMessage: 'Meeting at 3 PM today',
      time: '9:45 AM',
      unread: 5,
      isGroup: true,
      avatar: 'T',
      avatarColor: '#2196f3',
      online: false,
      messages: [
        {
          id: 1,
          text: 'Team, please update the report.',
          sender: 'me',
          time: '9:00 AM',
          flagged: false
        },
        { id: 2, text: 'Got it, working on it.', sender: 'other', time: '9:15 AM', flagged: false },
        { id: 3, text: 'Meeting at 3 PM today', sender: 'other', time: '9:45 AM', flagged: false }
      ]
    },
    {
      id: 3,
      name: 'Bob Smith',
      lastMessage: 'Thanks for the help!',
      time: 'Yesterday',
      unread: 0,
      isGroup: false,
      avatar: 'B',
      avatarColor: '#4caf50',
      online: false,
      messages: [
        {
          id: 1,
          text: 'Can you help me with the task?',
          sender: 'other',
          time: 'Yesterday 08:00 AM',
          flagged: false
        },
        {
          id: 2,
          text: 'Sure, no problem.',
          sender: 'me',
          time: 'Yesterday 08:15 AM',
          flagged: false
        },
        {
          id: 3,
          text: 'Thanks for the help!',
          sender: 'other',
          time: 'Yesterday 09:00 AM',
          flagged: false
        }
      ]
    },
    {
      id: 4,
      name: 'ECG help!',
      lastMessage: 'Will next session be tomorrow?',
      time: 'Yesterday',
      unread: 1,
      isGroup: true,
      avatar: 'F',
      avatarColor: '#ff9800',
      online: false,
      messages: [
        {
          id: 1,
          text: 'Hi everyone!',
          sender: 'other',
          time: 'Yesterday 07:00 AM',
          flagged: false
        },
        {
          id: 2,
          text: 'How about a family dinner?',
          sender: 'other',
          time: 'Yesterday 07:30 AM',
          flagged: false
        },
        {
          id: 3,
          text: 'Will next session be tomorrow?',
          sender: 'other',
          time: 'Yesterday 08:00 AM',
          flagged: false
        }
      ]
    }
  ]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Computed values
  const currentChat = selectedChat !== null ? chats[selectedChat] : null;
  const currentMessages = currentChat?.messages || [];
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handles & Functions
  const sendMessage = () => {
    if (!message.trim() || selectedChat === null) return;

    const newMsg = {
      id: currentMessages.length + 1,
      text: message,
      sender: 'me' as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      flagged: false,
      status: 'sent' as const
    };

    setChats(prev =>
      prev.map((chat, i) =>
        i === selectedChat
          ? {
              ...chat,
              messages: [...chat.messages, newMsg],
              lastMessage: message,
              time: newMsg.time
            }
          : chat
      )
    );
    setMessage('');
  };

  const flagMessage = (messageId: number | null, reason: string) => {
    if (selectedChat === null || messageId === null) return;

    setChats(prev =>
      prev.map((chat, i) =>
        i === selectedChat
          ? {
              ...chat,
              messages: chat.messages.map(msg =>
                msg.id === messageId ? { ...msg, flagged: true, flagReason: reason } : msg
              )
            }
          : chat
      )
    );
    setShowFlagModal(false);
    setFlaggedMessage(null);
  };

  const handleFileAttach = () => fileInputRef.current?.click();
  const handleImageAttach = () => imageInputRef.current?.click();

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
    setGroupName('');
    setSelected([]);
  };

  const createGroupChat = () => {
    if (!groupName.trim()) return;

    const newChat = {
      id: chats.length + 1,
      name: groupName,
      lastMessage: 'Group created',
      time: 'now',
      unread: 0,
      isGroup: true,
      avatar: groupName[0].toUpperCase(),
      avatarColor: '#9c27b0',
      online: false,
      messages: []
    };
    setChats([newChat, ...chats]);
    handleCloseGroupModal();
  };

  // Effects
  useEffect(() => {
    if (!showGroupModal) {
      setGroupName('');
      setSelected([]);
    }
  }, [showGroupModal]);

  return (
    <Box className="chatScreen">
      {/* Sidebar - Chat List */}
      <Paper className="sidebar">
        {/* Header */}
        <Box className="sidebarHeader">
          <Box className="headerRow">
            <Typography variant="h6" className="headerTitle">
              Messages
            </Typography>
            <Tooltip title="Create New Group">
              <IconButton onClick={() => setShowGroupModal(true)} size="small">
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="searchField"
          />
        </Box>

        {/* Chat Options */}
        <Box className="chatOptions">
          <Box className="chatOptionsLeft">
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideChatsContent}
                  onChange={e => setHideChatsContent(e.target.checked)}
                  size="small"
                />
              }
              label="Hide Content"
              className="smallLabel"
            />
          </Box>
          <Tooltip title="More Options">
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />

        {/* Chat List */}
        <List className="chatList">
          {filteredChats.map((chat, index) => (
            <React.Fragment key={chat.id}>
              <ListItem
                button
                onClick={() => {
                  setSelectedChat(index);
                  setChats(prev => prev.map((c, i) => (i === index ? { ...c, unread: 0 } : c)));
                }}
                selected={selectedChat === index}
                className="chatListItem"
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color={chat.online ? 'success' : 'default'}
                    className={`avatarBadge ${chat.online ? 'online' : 'offline'}`}
                  >
                    <Avatar sx={{ bgcolor: chat.avatarColor }}>
                      {chat.isGroup ? <GroupIcon /> : chat.avatar}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" className="chatName">
                      {chat.name}
                    </Typography>
                  }
                  secondary={
                    !hideChatsContent ? (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {showLastMessageOnly
                          ? chat.messages?.[chat.messages.length - 1]?.text || chat.lastMessage
                          : chat.lastMessage}
                      </Typography>
                    ) : null
                  }
                />
                <ListItemSecondaryAction>
                  <Box className="listItemRight">
                    <Typography variant="caption" color="text.secondary">
                      {chat.time}
                    </Typography>
                    {chat.unread > 0 && (
                      <Chip label={chat.unread} size="small" color="primary" className="unreadChip" />
                    )}
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Main Chat Area */}
      <Box className="mainArea">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <Paper className="chatHeader">
              <Box className="chatHeaderRow">
                <Box className="userInfo">
                  <Avatar sx={{ bgcolor: currentChat.avatarColor }}>
                    {currentChat.isGroup ? <GroupIcon /> : currentChat.avatar}
                  </Avatar>
                  <Box className="userMeta">
                    <Typography variant="h6" className="chatTitle">
                      {currentChat.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentChat.online ? 'Online' : 'Last seen recently'}
                    </Typography>
                  </Box>
                </Box>
                <Box className="actionBtns">
                  <Tooltip title="Voice Call">
                    <IconButton>
                      <PhoneIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Video Call">
                    <IconButton>
                      <VideoCallIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="More">
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>

            {/* Messages Area */}
            <Box className="messagesArea">
              <Box className="messagesColumn">
                {currentMessages.map(msg => (
                  <Box
                    key={msg.id}
                    className={`messageRow ${msg.sender === 'me' ? 'me' : 'other'}`}
                  >
                    <Paper
                      className={`messageBubble ${msg.sender === 'me' ? 'me' : 'other'} ${
                        msg.flagged ? 'flagged' : ''
                      }`}
                    >
                      <Typography variant="body2">{msg.text}</Typography>

                      {/* Time & Status */}
                      <Box className="metaRow">
                        <Typography variant="caption" color="text.secondary">
                          {msg.time}
                        </Typography>
                        {msg.sender === 'me' && (
                          <Typography variant="caption" color="primary">
                            <div className="doubleCheck">
                              <FontAwesomeIcon
                                icon={faCheck}
                                color={msg.status === 'read' ? 'blue' : (mode === 'light' ? 'gray' : '#B3AFAF')}
                                className="checkIcon first"
                              />
                              <FontAwesomeIcon
                                icon={faCheck}
                                color={msg.status === 'read' ? 'blue' : 'gray'}
                                className="checkIcon second"
                              />
                            </div>
                          </Typography>
                        )}
                      </Box>

                      {/* Flagged Chip */}
                      {msg.flagged && (
                        <Chip
                          label={`Flagged: ${msg.flagReason}`}
                          size="small"
                          color="error"
                          className="flaggedChip"
                        />
                      )}

                      {/* Flag Button */}
                      <IconButton
                        className="flagButton"
                        size="small"
                        onClick={() => {
                          setFlaggedMessage(msg.id);
                          setShowFlagModal(true);
                        }}
                      >
                        <FlagIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Message Input */}
            <Paper className="messageInput">
              <Box className="inputRow">
                <Tooltip title="Attach File">
                  <IconButton onClick={handleFileAttach}>
                    <AttachFileIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Attach Image">
                  <IconButton onClick={handleImageAttach}>
                    <ImageIcon />
                  </IconButton>
                </Tooltip>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  className="messageTextField"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small">
                          <EmojiIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Tooltip title="Send">
                  <IconButton
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    color="primary"
                    className={`sendButton ${message.trim() ? 'enabled' : 'disabled'}`}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </>
        ) : (
          // No chat selected placeholder
          <Box className="emptyState">
            <Typography variant="h6" color="text.secondary">
              Select a chat to start messaging
            </Typography>
          </Box>
        )}
      </Box>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hiddenInput"
        onChange={e => console.log('File selected:', e.target?.files?.[0])}
      />
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hiddenInput"
        onChange={e => console.log('Image selected:', e.target?.files?.[0])}
      />

      {/* Group Chat Modal */}
      <Modal open={showGroupModal} onClose={handleCloseGroupModal}>
        <Paper className="groupModal">
          <Box className="modalHeader">
            <Typography variant="h6">Create New Group</Typography>
            <IconButton onClick={handleCloseGroupModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            label="Group Name"
            margin="normal"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            className="groupNameField"
          />
          <Typography variant="subtitle2" className="addMembersTitle">
            Add Members
          </Typography>
          <Box className="membersList">
            {['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Farouk Ameen'].map(
              contact => {
                const isSelected = selected.includes(contact);
                return (
                  <Box
                    key={contact}
                    onClick={() =>
                      setSelected(prev =>
                        isSelected ? prev.filter(c => c !== contact) : [...prev, contact]
                      )
                    }
                    className={`memberRow ${isSelected ? 'selected' : ''}`}
                  >
                    <Avatar className="memberAvatar">{contact[0]}</Avatar>
                    <Typography variant="body2">{contact}</Typography>
                  </Box>
                );
              }
            )}
          </Box>

          <Box className="modalActions">
            <MyButton onClick={handleCloseGroupModal} appearance="ghost" className="big-button">
              Cancel
            </MyButton>
            <MyButton onClick={createGroupChat} appearance="primary" className="big-button">
              Create
            </MyButton>
          </Box>
        </Paper>
      </Modal>

      {/* Flag Message Modal */}
      <Modal open={showFlagModal} onClose={() => setShowFlagModal(false)}>
        <Paper className="flagModal">
          <Box className="modalHeader">
            <Typography variant="h6">Report Message</Typography>
            <IconButton onClick={() => setShowFlagModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" className="flagInfo">
            Why do you want to report this message?
          </Typography>
          <Box className="flagReasons">
            {['Spam', 'Inappropriate Content', 'Harassment', 'False Information', 'Other'].map(
              reason => (
                <MyButton
                  key={reason}
                  appearance="ghost"
                  onClick={() => flagMessage(flaggedMessage, reason)}
                  className="flagReasonBtn"
                >
                  {reason}
                </MyButton>
              )
            )}
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
};

export default ChatScreen;
