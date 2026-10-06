import React from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Message } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClockRotateLeft,
  faPenToSquare,
  faUserPen,
  faCalendarDays,
  faCircleCheck,
  faFilePen
} from '@fortawesome/free-solid-svg-icons';

import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import UserDateCell, {
  UserFullNameCell
} from '@/components/UserDateCell/UserDateCell';

import { useGetAmendmentHistoryQuery } from '@/services/encounters/patientEncounterService';
import {
  formatDateWithoutSeconds,
  formatEnumString
} from '@/utils';

import './styles.less';

const ACTION_COLOR: Record<string, string> = {
  ADDED: '#16a34a',
  CHANGED: '#2563eb',
  REMOVED: '#dc2626',
  CANCELLED: '#d97706',
  OPEN: '#2563eb',
  CLOSED: '#6b7280'
};

const AmendmentHistoryModal = ({
  encounterId,
  open,
  onClose
}: {
  encounterId: number | null;
  open: boolean;
  onClose: () => void;
}) => {
  const dir = localStorage.getItem('direction') || 'ltr';

  const { currentData, isFetching, isError } =
    useGetAmendmentHistoryQuery(
      open && encounterId != null
        ? encounterId
        : skipToken
    );

  const sessions = currentData ?? [];

  return (
    <MyModal
      open={open}
      setOpen={next => {
        if (!next) {
          onClose();
        }
      }}
      title={
        <div className="amendment-modal-title">
          <FontAwesomeIcon icon={faClockRotateLeft} />

          <Translate>Amendment History</Translate>
        </div>
      }
      size="80vw"
      bodyheight="75vh"
      hideActionBtn
      content={
        <div
          className="amendment-history"
          dir={dir}
        >
          {isError && (
            <Message
              type="error"
              showIcon
              className="amendment-history-message"
            >
              <Translate>
                Unable to load amendment history.
              </Translate>
            </Message>
          )}

          {isFetching && (
            <div className="amendment-history-state">
              <FontAwesomeIcon
                icon={faClockRotateLeft}
                spin
              />

              <span>
                <Translate>Loading...</Translate>
              </span>
            </div>
          )}

          {!isFetching &&
            !isError &&
            sessions.length === 0 && (
              <div className="amendment-history-empty">
                <div className="amendment-history-empty-icon">
                  <FontAwesomeIcon
                    icon={faClockRotateLeft}
                  />
                </div>

                <strong>
                  <Translate>
                    No amendments recorded.
                  </Translate>
                </strong>

                <span>
                  <Translate>
                    There is no amendment history for this encounter.
                  </Translate>
                </span>
              </div>
            )}

          {!isFetching &&
            !isError &&
            sessions.map(session => {
              const changesCount =
                session.changes?.length ?? 0;

              return (
                <div
                  key={session.sessionId}
                  className="amendment-session-wrapper"
                >
                  <SectionContainer
                    collapsible={true}
                    defaultCollapsed={true}
                    title={
                      <div className="amendment-session-header">
                        <div className="amendment-session-title">
                          <div className="amendment-session-number">
                            <FontAwesomeIcon
                              icon={faFilePen}
                            />
                          </div>

                          <div>
                            <div className="amendment-session-name">
                              <Translate>
                                Amendment
                              </Translate>

                              <span>
                                #{session.sessionNumber}
                              </span>
                            </div>

                            <div className="amendment-session-subtitle">
                              {changesCount}{' '}
                              <Translate>
                                Changes
                              </Translate>
                            </div>
                          </div>
                        </div>

                        <MyBadgeStatus
                          contant={session.status}
                          color={
                            ACTION_COLOR[
                            session.status
                            ] || '#6b7280'
                          }
                        />
                      </div>
                    }
                    content={
                      <div className="amendment-history-session">

                        {/* Amendment information */}
                        <div className="amendment-info-grid">
                          <div className="amendment-info-item">
                            <div className="amendment-info-icon">
                              <FontAwesomeIcon
                                icon={faPenToSquare}
                              />
                            </div>

                            <div>
                              <span className="amendment-info-label">
                                <Translate>
                                  Type Of Reopen
                                </Translate>
                              </span>

                              <strong>
                                {session.typeOfReopen
                                  ? formatEnumString(
                                    session.typeOfReopen
                                  )
                                  : '-'}
                              </strong>
                            </div>
                          </div>

                          <div className="amendment-info-item">
                            <div className="amendment-info-icon">
                              <FontAwesomeIcon
                                icon={faUserPen}
                              />
                            </div>

                            <div>
                              <span className="amendment-info-label">
                                <Translate>
                                  Amended By
                                </Translate>
                              </span>

                              <strong>
                                {session.amendedBy ? (
                                  <UserFullNameCell
                                    login={
                                      session.amendedBy
                                    }
                                  />
                                ) : (
                                  '-'
                                )}
                              </strong>
                            </div>
                          </div>

                          <div className="amendment-info-item">
                            <div className="amendment-info-icon">
                              <FontAwesomeIcon
                                icon={faCalendarDays}
                              />
                            </div>

                            <div>
                              <span className="amendment-info-label">
                                <Translate>
                                  Amended At
                                </Translate>
                              </span>

                              <strong>
                                {session.amendedAt
                                  ? formatDateWithoutSeconds(
                                    session.amendedAt
                                  )
                                  : '-'}
                              </strong>
                            </div>
                          </div>

                          <div className="amendment-info-item">
                            <div className="amendment-info-icon">
                              <FontAwesomeIcon
                                icon={faCircleCheck}
                              />
                            </div>

                            <div>
                              <span className="amendment-info-label">
                                <Translate>
                                  Finished By
                                </Translate>
                              </span>

                              <strong>
                                {session.closedBy ? (
                                  <UserFullNameCell
                                    login={
                                      session.closedBy
                                    }
                                  />
                                ) : (
                                  '-'
                                )}
                              </strong>
                            </div>
                          </div>

                          <div className="amendment-info-item">
                            <div className="amendment-info-icon">
                              <FontAwesomeIcon
                                icon={faCalendarDays}
                              />
                            </div>

                            <div>
                              <span className="amendment-info-label">
                                <Translate>
                                  Finished At
                                </Translate>
                              </span>

                              <strong>
                                {session.closedAt
                                  ? formatDateWithoutSeconds(
                                    session.closedAt
                                  )
                                  : '-'}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="amendment-reason">
                          <span className="amendment-info-label">
                            <Translate>
                              Reason
                            </Translate>
                          </span>

                          <div className="amendment-reason-value">
                            {session.reason || '-'}
                          </div>
                        </div>

                        {/* Changes */}
                        <div className="amendment-changes-section">
                          <div className="amendment-changes-title">
                            <Translate>
                              Clinical Changes
                            </Translate>

                            <span className="amendment-changes-count">
                              {changesCount}
                            </span>
                          </div>

                          {changesCount === 0 && (
                            <div className="amendment-no-changes">
                              <Translate>
                                No clinical changes recorded.
                              </Translate>
                            </div>
                          )}

                          {session.changes?.map(
                            (change, index) => (
                              <div
                                key={`${session.sessionId}-${change.module}-${change.recordId}-${index}`}
                                className="amendment-change-card"
                              >
                                <div className="amendment-change-header">
                                  <div className="amendment-change-left">
                                    <div className="amendment-change-index">
                                      {index + 1}
                                    </div>

                                    <div className="amendment-change-module">
                                      <Translate>
                                        {change.module}
                                      </Translate>
                                    </div>

                                    <MyBadgeStatus
                                      contant={
                                        change.action
                                      }
                                      color={
                                        ACTION_COLOR[
                                        change.action
                                        ] || '#2563eb'
                                      }
                                    />
                                  </div>

                                  <div className="amendment-change-user">
                                    <UserDateCell
                                      login={
                                        change.changedBy
                                      }
                                      date={
                                        change.changedAt
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="amendment-change-table">
                                  <MyTable
                                    height={Math.min(
                                      Math.max(
                                        (change.changes
                                          ?.length ??
                                          1) *
                                        48 +
                                        55,
                                        120
                                      ),
                                      320
                                    )}
                                    dontTranslateData
                                    data={(
                                      change.changes ??
                                      []
                                    ).map(
                                      (
                                        field,
                                        fieldIndex
                                      ) => ({
                                        ...field,
                                        key: `${index}-${fieldIndex}`
                                      })
                                    )}
                                    columns={[
                                      {
                                        key: 'field',
                                        title: (
                                          <Translate>
                                            Field
                                          </Translate>
                                        ),
                                        minWidth: 180,
                                        render: (row: {
                                          field: string;
                                        }) => (
                                          <strong className="amendment-field-name">
                                            <Translate>
                                              {
                                                row.field
                                              }
                                            </Translate>
                                          </strong>
                                        )
                                      },
                                      {
                                        key: 'oldValue',
                                        title: (
                                          <Translate>
                                            Old Value
                                          </Translate>
                                        ),
                                        minWidth: 250,
                                        render: (row: {
                                          oldValue?:
                                          | string
                                          | null;
                                        }) => (
                                          <div className="amendment-old-value">
                                            {row.oldValue ||
                                              '-'}
                                          </div>
                                        )
                                      },
                                      {
                                        key: 'newValue',
                                        title: (
                                          <Translate>
                                            New Value
                                          </Translate>
                                        ),
                                        minWidth: 250,
                                        render: (row: {
                                          newValue?:
                                          | string
                                          | null;
                                        }) => (
                                          <div className="amendment-new-value">
                                            {row.newValue ||
                                              '-'}
                                          </div>
                                        )
                                      }
                                    ]}
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    }
                  />
                </div>
              );
            })}
        </div>
      }
    />
  );
};

export default AmendmentHistoryModal;