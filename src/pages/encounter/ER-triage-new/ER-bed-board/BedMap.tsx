import Translate from '@/components/Translate';
import React from 'react';
import { formatEnumString } from '@/utils';
import BoardIcon from './BoardIcon';
import {
  CTAS_COLOR_VAR,
  formatLosOrDash,
  losTone
} from './erBedBoardUtils';
import useBedMapAutoScroll from './useBedMapAutoScroll';
import type { BedCardModel, DiagBadge } from './useERBedBoardData';
import './bedMap.less';

type BedMapProps = {
  cards: BedCardModel[];
  filteredCards: BedCardModel[];
  searchQuery: string;
  occupiedCount: number;
  readyCount: number;
  cleaningCount: number;
  outOfServiceCount: number;
  autoScrollEnabled: boolean;
  autoScrollScopeKey: string;
};

const StatusBadge = ({ badge }: { badge: DiagBadge }) => (
  <span className={`ebb-st ${badge.className}`}>
    <i />
    {badge.label}
  </span>
);

type EmptyBedCardProps = {
  card: Pick<
    BedCardModel,
    | 'bedLabel'
    | 'zone'
    | 'bedStatus'
    | 'isReady'
    | 'isCleaning'
    | 'isOutOfService'
  >;
};

const EmptyBedCard = ({ card }: EmptyBedCardProps) => {
  const status = card.isReady
    ? {
        tile: 'free',
        pill: 'ebb-availability',
        icon: 'bed',
        iconTone: '',
        label: 'Available',
        heading: 'Ready for a patient',
        detail: 'This bed is currently available'
      }
    : card.isCleaning
      ? {
          tile: 'status-tile cleaning',
          pill: 'ebb-status-pill cleaning',
          icon: 'refresh',
          iconTone: 'cleaning',
          label: 'In cleaning',
          heading: 'In cleaning',
          detail: 'Not ready for a patient'
        }
      : card.isOutOfService
        ? {
            tile: 'status-tile out-of-service',
            pill: 'ebb-status-pill oos',
            icon: 'alert',
            iconTone: 'oos',
            label: 'Out of service',
            heading: 'Out of service',
            detail: 'Unavailable for assignment'
          }
        : {
            tile: 'status-tile unknown',
            pill: 'ebb-status-pill',
            icon: 'alert',
            iconTone: '',
            label: card.bedStatus
              ? formatEnumString(card.bedStatus)
              : 'Unknown',
            heading: 'Status unavailable',
            detail: 'Not counted as ready'
          };

  return (
    <article
      className={`ebb-tile ${status.tile}`}
      aria-label={`Bed ${card.bedLabel}, ${status.label}`}
    >
      <div className="ebb-card-top">
        <div>
          <span className="ebb-label">BED</span>
          <h3>{card.bedLabel}</h3>
          <span className="ebb-zone" title={card.zone}>
            {card.zone}
          </span>
        </div>

        <span className={status.pill}>
          <i />
          {status.label}
        </span>
      </div>

      <div className="ebb-free-center">
        <div className={`ebb-free-icon ${status.iconTone}`}>
          <BoardIcon name={status.icon} />
        </div>
        <strong>{status.heading}</strong>
        <span>{status.detail}</span>
      </div>

      <div className="ebb-free-footer">
        <BoardIcon name={card.isReady ? 'check' : 'shield'} />
        {formatEnumString(card.bedStatus) || status.label}
      </div>
    </article>
  );
};

type BedCardProps = {
  card: BedCardModel;
};

const BedCard = ({ card }: BedCardProps) => {
  if (!card.isOccupied) {
    return <EmptyBedCard card={card} />;
  }

  const tone = losTone(card.elapsedMs);
  const levelColor =
    card.ctas != null ? CTAS_COLOR_VAR[card.ctas] : 'var(--ebb-dim)';

  return (
    <article
      className={`ebb-tile occ ${tone === 'crit' ? 'longstay' : ''}`}
      style={
        {
          '--ebb-lvl': levelColor
        } as React.CSSProperties
      }
    >
      <div className="ebb-card-top">
        <div>
          <span className="ebb-label">BED</span>
          <h3>{card.bedLabel}</h3>
          <span className="ebb-zone" title={card.zone}>
            {card.zone}
          </span>
        </div>

        <span className="ebb-ctas-badge">
          CTAS <strong>{card.ctasDisplay}</strong>
        </span>
      </div>

      <div className="ebb-patient">
        <div className="ebb-avatar">{card.initials || '—'}</div>

        <div>
          <strong
            className="ebb-patient-name"
            title={
              card.fullName &&
              card.fullName !== '—' &&
              card.fullName !== '…' &&
              card.fullName !== 'Unavailable'
                ? card.fullName
                : undefined
            }
          >
            {card.fullName || '—'}
          </strong>

          <strong className="ebb-mrn" dir="ltr">
            {card.mrn}
          </strong>

          <span>{card.ageSex}</span>

          <span
            className="ebb-visit-no"
            dir="ltr"
            title={
              card.encounterNumber
                ? `Visit No. ${card.encounterNumber}`
                : undefined
            }
          >
            Visit No. <strong>{card.visitNo}</strong>
          </span>
        </div>
      </div>

      {card.assignmentMissing && (
        <p className="ebb-complaint">
          Occupied — assignment details unavailable
        </p>
      )}

      <p className="ebb-complaint" title={card.chiefComplaint}>
        Cheif Complaint: {card.chiefComplaint}
      </p>

      <div className={`ebb-los-box ${tone}`}>
        <span>
          <BoardIcon name="clock" />
          Length of stay
        </span>
        <strong className="ebb-num">
          {formatLosOrDash(card.elapsedMs)}
        </strong>
      </div>

      <dl className="ebb-care-team">
        <div>
          <dt>
            <BoardIcon name="doctor" />
            Doctor
          </dt>
          <dd title={card.doctor}>{card.doctor}</dd>
        </div>

        <div>
          <dt>
            <BoardIcon name="users" />
            Nurse
          </dt>
          <dd title={card.nurse}>{card.nurse}</dd>
        </div>
      </dl>

      <div className="ebb-diagnostics">
        <div>
          <span>
            <BoardIcon name="lab" />
            Lab
          </span>
          <StatusBadge badge={card.lab} />
        </div>

        <div>
          <span>
            <BoardIcon name="scan" />
            Radiology
          </span>
          <StatusBadge badge={card.rad} />
        </div>
      </div>

      <div className="ebb-card-footer">
        <span>Visit status</span>
        <strong
          className="ebb-visit-status"
          title={
            card.visitStatus !== '—' ? card.visitStatus : undefined
          }
          style={
            card.visitStatusCode
              ? {
                  color: card.visitStatusColor,
                  background: `${card.visitStatusColor}14`,
                  borderColor: `${card.visitStatusColor}55`
                }
              : undefined
          }
        >
          {card.visitStatus}
        </strong>
      </div>
    </article>
  );
};

const BedMap = ({
  cards,
  filteredCards,
  searchQuery,
  occupiedCount,
  readyCount,
  cleaningCount,
  outOfServiceCount,
  autoScrollEnabled,
  autoScrollScopeKey
}: BedMapProps) => {
  const mapRef = useBedMapAutoScroll(
    autoScrollEnabled,
    autoScrollScopeKey
  );

  return (
    <section
      className="ebb-panel ebb-map-panel"
      aria-labelledby="ebb-beds-title"
    >
      <div className="ebb-panel-heading">
        <div className="ebb-section-title">
          <div className="ebb-section-icon">
            <BoardIcon name="bed" />
          </div>

          <div>
            <h2 id="ebb-beds-title">
              <Translate>Department beds</Translate>
              <span className="ebb-count">{cards.length}</span>
            </h2>

            <p>
              {searchQuery.trim()
                ? `${filteredCards.length} of ${cards.length} beds match your search`
                : 'Real-time bed availability and patient overview'}
            </p>
          </div>
        </div>

        <div className="ebb-bed-key">
          <span>
            <i className="occupied" />
            Occupied {occupiedCount}
          </span>
          <span>
            <i className="available" />
            Ready {readyCount}
          </span>
          <span>
            <i className="cleaning" />
            Cleaning {cleaningCount}
          </span>
          <span>
            <i className="oos" />
            Out of service {outOfServiceCount}
          </span>
        </div>
      </div>

      <div
        className="ebb-bedgrid"
        ref={mapRef}
        tabIndex={0}
        role="region"
        aria-label="Department bed map"
      >
        {!filteredCards.length ? (
          <div className="ebb-empty">
            <BoardIcon name="bed" />
            <strong>
              {cards.length ? 'No matching beds' : 'No beds configured'}
            </strong>
            <span>
              {cards.length
                ? 'Try another name, MRN or bed label.'
                : 'Beds will appear here when configured for this department.'}
            </span>
          </div>
        ) : (
          filteredCards.map(card => (
            <BedCard key={card.bed.id} card={card} />
          ))
        )}
      </div>
    </section>
  );
};

export default BedMap;
