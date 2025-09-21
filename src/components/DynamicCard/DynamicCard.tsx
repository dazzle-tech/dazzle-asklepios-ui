import { Card, Avatar, HStack } from 'rsuite';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import MyButton from '../MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './styles.less';

interface CardItem {
  label?: string;
  value?: string | React.ReactNode;
  type?: 'text' | 'badge' | 'strong';
  color?: string;
  position?: 'left' | 'center' | 'right';
  vertical?: 'top' | 'center' | 'bottom';
  showLabel?: boolean;
  section?: 'left' | 'center' | 'right';
  labelGap?: string | number;
}

interface MyCardProps {
  title?: string;
  avatar?: string | null;
  showMore?: boolean;
  moreClick?: () => void;
  showArrow?: boolean;
  leftArrow?: boolean;
  arrowClick?: () => void;
  width?: string | number | null;
  height?: string | number | null;
  margin?: string | number | null;
  data?: CardItem[];
  variant?: 'basic' | 'secondary';
}

const DynamicCard: React.FC<MyCardProps> = ({
  title,
  avatar = null,
  showMore = false,
  moreClick = () => {},
  showArrow = false,
  leftArrow = true,
  arrowClick = () => {},
  width = null,
  height = null,
  margin = '0px',
  data = [],
  variant = 'basic',
  ...props
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  const leftItems = data.filter(item => item.section === 'left' || !item.section);
  const centerItems = data.filter(item => item.section === 'center');
  const rightItems = data.filter(item => item.section === 'right');

  const renderItem = (item: CardItem, index: number) => {
    return (
      <div
        key={index}
        style={{
          display: 'flex',
          justifyContent:
            item.position === 'center'
              ? 'center'
              : item.position === 'right'
              ? 'flex-end'
              : 'flex-start',
          alignSelf:
            item.vertical === 'center'
              ? 'center'
              : item.vertical === 'bottom'
              ? 'flex-end'
              : 'flex-start',
          margin: '0 4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}
      >
        {item.type === 'badge' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: item.labelGap || 4 }}>
            {item.showLabel !== false && item.label && <span>{item.label}:</span>}
            <MyBadgeStatus contant={item.value} color={item.color || '#555'} />
          </div>
        ) : item.type === 'strong' ? (
          <strong className="title-style-dynamic-card">{item.value}</strong>
        ) : item.labelGap === 'auto' ? (
          <>
            {item.showLabel !== false && item.label && (
              <div style={{ flex: 1, minWidth: 0 }}>{item.label}:</div>
            )}
            <div style={{ flexShrink: 0 }}>{item.value}</div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: item.labelGap || 4 }}>
            {item.showLabel !== false && item.label && <span>{item.label}:</span>}
            {item.value}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      width={width || 280}
      style={{ minHeight: '45px', height, margin }}
      shaded
      className={`dynamic-card ${mode === 'light' ? 'light' : 'dark'}`}
      {...props}
    >
      {/* Header */}
      {(avatar || showMore) && (
        <Card.Header>
          <HStack alignItems="center" justifyContent="space-between">
            {avatar && <Avatar circle src={avatar} />}
            {showMore && (
              <MyButton
                style={{ marginLeft: 'auto' }}
                appearance="subtle"
                size="xsmall"
                color="var(--primary-gray)"
                onClick={moreClick}
                radius="8px"
              >
                <FontAwesomeIcon icon={faEllipsis} />
              </MyButton>
            )}
          </HStack>
        </Card.Header>
      )}

      {/* Body */}
      <Card.Body
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {/* Left section */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {leftItems.map(renderItem)}
        </div>

        {/* Center section */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center' }}>
          {centerItems.map(renderItem)}
        </div>

        {/* Right section */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
          {rightItems.map(renderItem)}
        </div>
      </Card.Body>

      {/* Footer */}
      <Card.Footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {showArrow && (
          <MyButton
            onClick={arrowClick}
            className="arrow-style"
            appearance="subtle"
            size="xsmall"
            color="var(--primary-gray)"
            radius="8px"
          >
            <FontAwesomeIcon icon={leftArrow ? faArrowLeft : faArrowRight} />
          </MyButton>
        )}
      </Card.Footer>
    </Card>
  );
};

export default DynamicCard;
