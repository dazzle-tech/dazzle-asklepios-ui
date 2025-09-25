import { Card, Avatar } from 'rsuite';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import MyButton from '../MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './styles.less';

interface CardItem {
  label?: string | React.ReactNode;
  value?: string | React.ReactNode;
  type?: 'text' | 'badge' | 'strong' | 'week';
  color?: string;
  valueColor?: string;
  position?: 'left' | 'center' | 'right';
  vertical?: 'top' | 'center' | 'bottom';
  showLabel?: boolean;
  section?: 'left' | 'center' | 'right';
  labelDirection?: 'row' | 'column';
  labelIcon?: React.ReactNode;
  columnGap?: number;
  verticalGap?: number;
  labelGap?: number;
  showColon?: boolean;
  sectionDirection?: 'row' | 'column';
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
    const isColumn = item.labelDirection === 'column';
    const showColon = item.showColon !== false;

    const valueMarginBottom = item.columnGap ?? 0;
    const verticalMarginBottom = item.verticalGap ?? 0;
    const labelGap = item.labelGap ?? 4;

    return (
      <div
        key={index}
        style={{
          display: 'flex',
          flexDirection: isColumn ? 'column' : 'row',
          gap: isColumn ? 0 : labelGap,
          width: 'auto',
          marginBottom: verticalMarginBottom,
        }}
      >
        {item.showLabel !== false && item.label && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {item.labelIcon && <span>{item.labelIcon}</span>}
            <span style={{ color: item.color }}>
              {item.label}{showColon ? ':' : ''}
            </span>
          </div>
        )}

        {item.type === 'badge' ? (
          <div style={{ marginBottom: valueMarginBottom }}>
            <MyBadgeStatus contant={item.value} color={item.valueColor || item.color || '#555'} />
          </div>
        ) : (
          <div
            style={{
              fontSize: item.type === 'week' ? 12 : undefined,
              fontWeight: item.type === 'strong' ? '700' : undefined,
              fontFamily: item.type === 'week' ? 'Inter Regular' : undefined,
              color: item.valueColor || (item.type === 'week' ? 'var(--primary-gray)' : undefined),
              marginBottom: valueMarginBottom,
            }}
          >
            {item.value}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (items: CardItem[], direction?: 'row' | 'column') => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: direction ?? 'column',
          width: 'auto',
        }}
      >
        {items.map(renderItem)}
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

      <Card.Body className="card-body">
        {leftItems.length > 0 && renderSection(leftItems, leftItems[0].sectionDirection)}
        {centerItems.length > 0 && renderSection(centerItems, centerItems[0].sectionDirection)}
        {rightItems.length > 0 && renderSection(rightItems, rightItems[0].sectionDirection)}
      </Card.Body>

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
