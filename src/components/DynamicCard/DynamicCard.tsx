import { Card, Avatar } from 'rsuite';
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
  backgroundColor?: string;
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
  backgroundColor,
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
            {item.showLabel !== false && item.label && (
  <>
    {typeof item.label === 'string' ? (
      <span style={{ color: item.color}}>{item.label}:</span>
    ) : (
      React.cloneElement(item.label as React.ReactElement, {}, `${(item.label as React.ReactElement).props.children}:`)
    )}
  </>
)}

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
            {item.showLabel !== false && item.label && (
  <>
    {typeof item.label === 'string' ? (
      <span style={{ color: item.color}}>{item.label}:</span>
    ) : (
      React.cloneElement(item.label as React.ReactElement, {}, `${(item.label as React.ReactElement).props.children}:`)
    )}
  </>
)}

            {item.value}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      width={width || 280}
      height={height}
      style={{ backgroundColor: backgroundColor || 'inherit' }}
      className={`dynamic-card ${mode === 'light' ? 'light' : 'dark'}`}
      {...props}
    >
      {/* Header */}
      {(avatar || showMore) && (
        <Card.Header className="card-header">
          {avatar && <Avatar circle src={avatar} className="avatar" />}
          {showMore && (
            <MyButton
              className="more-button"
              appearance="subtle"
              size="xsmall"
              color="var(--primary-gray)"
              onClick={moreClick}
              radius="8px"
            >
              <FontAwesomeIcon icon={faEllipsis} />
            </MyButton>
          )}
        </Card.Header>
      )}

      {/* Body */}
      <Card.Body className="card-body">
        <div className="card-body-left">{leftItems.map(renderItem)}</div>
        <div className="card-body-center">{centerItems.map(renderItem)}</div>
        <div className="card-body-right">{rightItems.map(renderItem)}</div>
      </Card.Body>

      {/* Footer */}
      <Card.Footer className="card-footer">
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
