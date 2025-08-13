import React from 'react';
import { Tag, Whisper, Tooltip } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faStopCircle, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import MyCard from '@/components/MyCard/MyCard';
import './bedcard.less';

const BedCards = ({ data = [], handleChangeToOutService, handleChangeToReady }) => {
  // Get text color for status
  const getStatusColor = status => {
    if (!status) return 'var(----primary-gray)';
    switch (status.toLowerCase()) {
      case 'empty':
        return 'var(--primary-green)';
      case 'in cleaning':
        return 'var(--primary-orange)';
      case 'occupied':
        return 'var(--very-deep-blue)';
      case 'out of service':
        return 'var(--primary-red)';
      default:
        return 'var(----primary-gray)';
    }
  };

  // Get background color for status
  const getStatusBackColor = status => {
    if (!status) return 'var(--background-gray)';
    switch (status.toLowerCase()) {
      case 'empty':
        return 'var(--light-green)';
      case 'in cleaning':
        return 'var(--light-orange)';
      case 'occupied':
        return 'var(--light-blue)';
      case 'out of service':
        return 'var(--light-red)';
      default:
        return 'var(--background-gray)';
    }
  };

  return (
    <div className="bedcards">
      {data.map((item, i) => {
        const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '-';

        return (
          <MyCard
            key={i}
            width="250px"
            height="180px"
            contant={
              <>
                {/* Bed icon at top */}
                <div className='bed-icon'>
                  <FontAwesomeIcon icon={faBed} />
                </div>

                {/* Room name */}
                <p className="bedcard-name">
                  <strong>
                    <Translate>Room Name</Translate>:
                  </strong>
                  {item?.roomName || '-'}
                </p>

                {/* Bed name */}
                <p className="bedcard-name">
                  <strong>
                    <Translate>Bed Name</Translate>:
                  </strong>
                  {item?.bed?.name || '-'}
                </p>
              </>
            }
            // Footer: buttons on left, status on right
            footerContant={
              <div className="bedcard-footer">
                {/* Action buttons (left) */}
                <div className="bedcard-actions" style={{ display: 'flex', gap: '5px' }}>
                  {/* Out of Service button */}
                  {(item?.bed?.statusLkey === '5258572711068224' ||
                    item?.bed?.statusLkey === '5258243122289092') && (
                    <Whisper
                      trigger="hover"
                      placement="top"
                      speaker={<Tooltip>Deactivate</Tooltip>}
                    >
                      <div>
                        <MyButton size="small" onClick={() => handleChangeToOutService(item.bed)}>
                          <FontAwesomeIcon icon={faStopCircle} />
                        </MyButton>
                      </div>
                    </Whisper>
                  )}

                  {/* Ready button */}
                  {(item?.bed?.statusLkey === '5258572711068224' ||
                    item?.bed?.statusLkey === '5258592140444674') && (
                    <Whisper trigger="hover" placement="top" speaker={<Tooltip>Ready</Tooltip>}>
                      <div>
                        <MyButton
                          size="small"
                          backgroundColor="black"
                          onClick={() => handleChangeToReady(item.bed)}
                        >
                          <FontAwesomeIcon icon={faThumbsUp} />
                        </MyButton>
                      </div>
                    </Whisper>
                  )}
                </div>

                {/* Status Tag (right) */}
                <Tag
                  className="bedcard-status-tag"
                  style={{
                    backgroundColor: getStatusBackColor(status),
                    color: getStatusColor(status)
                  }}
                >
                  {status}
                </Tag>
              </div>
            }
          />
        );
      })}
    </div>
  );
};

export default BedCards;
