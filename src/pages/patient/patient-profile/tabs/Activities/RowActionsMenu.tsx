import React, { useRef } from 'react';
import { Dropdown, IconButton, Popover, Whisper, type WhisperInstance } from 'rsuite';
import { MdMoreVert } from 'react-icons/md';
import Translate from '@/components/Translate';

export type RowAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
};

/**
 * The ⋮ menu of a row. It opens in a floating popover so a table's scroll area can't clip it.
 */
const RowActionsMenu: React.FC<{ actions: RowAction[] }> = ({ actions }) => {
  const whisperRef = useRef<WhisperInstance>(null);
  const shown = actions.filter(action => !action.hidden);
  if (!shown.length) return null;

  return (
    <Whisper
      ref={whisperRef}
      trigger="click"
      placement="bottomEnd"
      speaker={
        <Popover full className="row-actions-popover">
          <Dropdown.Menu>
            {shown.map(action => (
              <Dropdown.Item
                key={action.label}
                icon={action.icon as React.ReactElement | undefined}
                className={action.danger ? 'row-actions-danger' : ''}
                onClick={() => {
                  whisperRef.current?.close();
                  action.onClick();
                }}
              >
                <Translate>{action.label}</Translate>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Popover>
      }
    >
      <IconButton appearance="subtle" size="xs" icon={<MdMoreVert />} aria-label="Actions" />
    </Whisper>
  );
};

export default RowActionsMenu;
