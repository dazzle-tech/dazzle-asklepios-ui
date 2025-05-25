import React from 'react';
import clsx from 'clsx';
import { Box, Typography } from '@mui/material';
import './styles.less';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
interface ToothActionCardProps {
  date: number;
  toothNumber?: number;
  action: string;
  type: string;
  surface: string;
  note: string;
  existing: boolean;
}

const ToothActionCard = ({
  date,
  toothNumber,
  action,
  type,
  surface,
  note,
  existing
}: ToothActionCardProps) => {
  const formattedDate = new Date(date);

  const monthName = formattedDate.toLocaleString('default', { month: 'long' }); // e.g., "May"
  const dayNumber = formattedDate.getDate();

  return (
    <Box className="tooth-action-card">
      <Box className="tooth-action-date">
        <Typography className="tooth-action-month">{monthName}</Typography>
        <Typography className="tooth-action-day">{dayNumber}</Typography>
      </Box>
      <Box className="tooth-action-content">
        <Box className="tooth-info">
          {toothNumber && (
            <Box className="tooth-info-item">
              <Typography className="tooth-action-info-label">Tooth #</Typography>
              <Typography className="tooth-action-info-value">{toothNumber}</Typography>
            </Box>
          )}
          <Box className="tooth-info-item">
            <Typography className="tooth-action-info-label">Action</Typography>
            <Typography className="tooth-action-info-value">{action}</Typography>
          </Box>
          <Box className="tooth-info-item">
            <Typography className="tooth-action-info-label">Type</Typography>
            <Typography
              className={clsx('tooth-action-info-value', {
                treatment: type.toLowerCase() === 'treatment',
                condition: type.toLowerCase() === 'condition'
              })}
            >
              {type}
            </Typography>
          </Box>
          <Box className="tooth-info-item">
            <Typography className="tooth-action-info-label">Surface</Typography>
            <Typography className="tooth-action-info-value">{surface}</Typography>
          </Box>
          <Box className="tooth-info-item">
            <Typography className="tooth-action-info-label">Existing</Typography>
            <Typography className="tooth-action-info-value">{existing ? 'Yes' : 'No'}</Typography>
          </Box>
        </Box>
        <Box className="tooth-action-note">
          <StickyNote2OutlinedIcon />
          <Typography className="tooth-action-note-value">{note}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ToothActionCard;
