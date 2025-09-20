import { Card, Avatar, HStack } from 'rsuite';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import MyButton from '../MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './styles.less';

interface MyCardProps {
  cardType?: 'patient' | 'todayAppointment' | 'upcomingAppointment' | 'custom';

  name?: string;
  plan?: string;
  lastVisit?: string;
  status?: string;
  statusColor?: string;

  time?: string;
  duration?: string;
  patientName?: string;
  visitType?: string;

  date?: string;

  leftArrow?: boolean;
  showArrow?: boolean;
  showMore?: boolean;
  arrowClick?: () => void;
  moreClick?: () => void;
  width?: string | number | null;
  height?: string | number | null;
  margin?: string | number | null;
  avatar?: string | null;
  contant?: React.ReactNode;
  footerContant?: React.ReactNode;
  title?: React.ReactNode;
  variant?: 'basic' | 'secondary';
}

const MyCard: React.FC<MyCardProps> = ({
  cardType = 'custom',

  name,
  plan,
  lastVisit,
  status,
  statusColor,

  time,
  duration,
  patientName,
  visitType,

  date,

  leftArrow = true,
  showArrow = false,
  showMore = false,
  arrowClick = () => {},
  moreClick = () => {},
  width = null,
  height = null,
  margin = '0px',
  avatar = null,
  contant = null,
  footerContant = null,
  title = null,
  variant = 'basic',
  ...props
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <Card
      width={width || 280}
      style={{ minHeight: '80px', height, margin }}
      shaded
      className={`my-card ${mode === 'light' ? 'light' : 'dark'}`}
      {...props}
    >
      {/* Header */}
      {(avatar || showMore) && (
        <Card.Header>
          <HStack>
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
      <Card.Body>
        {/* 🟢 Patient card */}
        {cardType === 'patient' && (
          <section className="patient-card">
            <article className="patient-info">
              {name && <h4 className="patient-name">{name}</h4>}
              {plan && <p className="patient-plan">{plan}</p>}
              {lastVisit && (
                <p className="patient-last-visit">
                  Last visit: <strong>{lastVisit}</strong>
                </p>
              )}
            </article>
            {status && (
              <aside className="status-card-position-handle">
                <MyBadgeStatus contant={status} color={statusColor || '#555'} />
              </aside>
            )}
          </section>
        )}

{/* 🟡 Today appointment */}
{cardType === 'todayAppointment' && (
  <section className="mini-appointment-card">
    <article className="mini-appointment-time">
      <strong className='title-style'>{time}</strong>
      <span>{duration}</span>
    </article>
    <article className="mini-appointment-info">
      <h4 className='title-style'>{patientName}</h4>
      <p>{visitType}</p>
    </article>
  </section>
)}

{/* 🔵 Upcoming appointment */}
{cardType === 'upcomingAppointment' && (
  <section className="upcoming-appointment-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <article className="upcoming-appointment-left">
      <strong className="date ">{date}</strong>
      <h4 className="name title-style">{patientName}</h4>
      <p className="visit">{visitType}</p>
    </article>
    <article className="upcoming-appointment-right">
      <span className="time">{time}</span>
    </article>
  </section>
)}


        {/* ⚪ Custom card */}
        {cardType === 'custom' && (
          <section>
            {title && <header className="title-style">{title}</header>}
            {contant && <article className={`contant-text-${variant}`}>{contant}</article>}
          </section>
        )}
      </Card.Body>

      {/* Footer */}
      <Card.Footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {footerContant && <div className={`footer-contant-text-${variant}`}>{footerContant}</div>}
        {showArrow && (
          <>
            {leftArrow ? (
              <MyButton
                onClick={arrowClick}
                className="arrow-style"
                appearance="subtle"
                size="xsmall"
                color="var(--primary-gray)"
                radius="8px"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </MyButton>
            ) : (
              <MyButton
                onClick={arrowClick}
                className="arrow-style"
                appearance="subtle"
                size="xsmall"
                color="var(--primary-gray)"
                radius="8px"
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </MyButton>
            )}
          </>
        )}
      </Card.Footer>
    </Card>
  );
};

export default MyCard;
