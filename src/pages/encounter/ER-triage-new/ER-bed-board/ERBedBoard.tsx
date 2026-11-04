import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Form, Loader, Panel } from 'rsuite';
import BedMap from './BedMap';
import BoardIcon from './BoardIcon';
import BoardSummary from './BoardSummary';
import {
  CTAS_COLOR_VAR,
  CTAS_TARGET_MINUTES
} from './erBedBoardUtils';
import './styles.less';
import TriageQueue from './TriageQueue';
import useERBedBoardData from './useERBedBoardData';

const ERBedBoard = () => {
  const dispatch = useDispatch();
  const boardRef = useRef<HTMLDivElement>(null);

  const dir =
    localStorage.getItem('direction') === 'RTL' ? 'rtl' : 'ltr';

  const [fullscreenError, setFullscreenError] = useState(false);
  const [searchRecord, setSearchRecord] = useState<{
    boardSearch?: string;
  }>({ boardSearch: '' });

  const searchQuery = String(searchRecord?.boardSearch ?? '');

  const {
    departmentId,
    departmentData,
    departmentName,
    isEmergencyDepartment,
    isDepartmentFetching,

    nowMs,
    clockTime,
    clockDate,

    bedCards,
    filteredBedCards,
    triageQueueItems,
    filteredTriageQueue,
    triageEncounterRows,

    metrics,
    occupancyPct,
    occupiedForSummary,
    availableForSummary,
    cleaningForSummary,
    outOfServiceForSummary,
    waitingOverTarget,

    isLoading,
    refreshing,
    hasError,
    diagError,
    diagStale,
    assignmentsError,
    encountersError,
    triageError,
    queueTriageBulkError,
    bedCountsError,
    assignmentInconsistencies,
    triageLoading,
    triageFetching,

    handleRefresh
  } = useERBedBoardData(searchQuery);

  useEffect(() => {
    dispatch(setPageCode('ER_BED_BOARD'));
    dispatch(setDivContent('ER Bed Board'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);

  const handleFullscreen = async () => {
    setFullscreenError(false);

    try {
      if (document.fullscreenElement === boardRef.current) {
        await document.exitFullscreen();
      } else if (boardRef.current) {
        await boardRef.current.requestFullscreen();
      }
    } catch {
      setFullscreenError(true);
    }
  };

  if (!departmentId) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>
            <Translate>
              Please select a department to view the bed board.
            </Translate>
          </p>
        </div>
      </Panel>
    );
  }

  if (
    !isDepartmentFetching &&
    departmentData &&
    !isEmergencyDepartment
  ) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>
            <Translate>
              User Current Department should be Emergency to view ER Bed
              Board.
            </Translate>
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="er-bed-board" dir={dir} ref={boardRef}>
      <div className="ebb-board">
        <header className="ebb-header">
          <div className="ebb-heading">
            <div className="ebb-brand-icon">
              <BoardIcon name="pulse" />
            </div>

            <div>
              <div className="ebb-eyebrow">
                EMERGENCY OPERATIONS <span> / </span> BED BOARD
              </div>
              <h1>{departmentName}</h1>
              <p>
                <Translate>
                  A clear view of every bed. A better view of patient
                  flow.
                </Translate>
              </p>
            </div>
          </div>

          <div className="ebb-header-side">
            <div className="ebb-clock">
              <strong>{clockTime}</strong>
              <span>{clockDate}</span>
            </div>

            <button
              type="button"
              className="ebb-btn ebb-fullscreen"
              onClick={handleFullscreen}
            >
              <BoardIcon name="expand" />
              <Translate>Full screen</Translate>
            </button>
          </div>
        </header>

        <BoardSummary metrics={metrics} occupancyPct={occupancyPct} />

        <div className="ebb-toolbar">
          <div className="ebb-search-wrap">
            <BoardIcon name="search" />

            <Form
              className="ebb-search"
              fluid
              onSubmit={() => undefined}
            >
              <MyInput
                fieldName="boardSearch"
                fieldLabel="Search board"
                placeholder="Search name, MRN, encounter or bed..."
                record={searchRecord}
                setRecord={setSearchRecord}
                height={40}
                width="100%"
              />
            </Form>
          </div>

          <div className="ebb-toolbar-right">
            <span className="ebb-auto">
              <span className={refreshing ? 'syncing' : ''} />
              {refreshing ? 'Updating board' : 'Auto-refresh · 30s'}
            </span>

            <button
              type="button"
              className="ebb-btn"
              onClick={handleRefresh}
              disabled={!isEmergencyDepartment || refreshing}
            >
              <BoardIcon name="refresh" />
              <Translate>Refresh</Translate>
            </button>
          </div>
        </div>

        {(hasError ||
          diagError ||
          diagStale ||
          assignmentInconsistencies.length > 0) && (
          <div className="ebb-state error" role="alert">
            <BoardIcon name="alert" />

            {(hasError || diagError) && (
              <Translate>
                Some board data could not be loaded. Refresh to try
                again.
              </Translate>
            )}

            {assignmentsError && (
              <span>
                Active bed assignments failed to load. Occupied beds
                still use bed status; patient details may be incomplete.
              </span>
            )}

            {encountersError && (
              <span>
                Encounter details failed to load for some occupied beds.
              </span>
            )}

            {(triageError || queueTriageBulkError) && (
              <span>Triage queue data failed to load.</span>
            )}

            {bedCountsError && (
              <span>Bed status counts failed to load.</span>
            )}

            {diagError && (
              <span>
                Diagnostic status failed to load. Prior values were kept
                when available.
              </span>
            )}

            {diagStale && !diagError && (
              <span>
                Lab/Radiology test details could not be refreshed;
                order-level statuses are shown instead and may be
                incomplete.
              </span>
            )}

            {assignmentInconsistencies.map(note => (
              <span key={note}>{note}</span>
            ))}
          </div>
        )}

        {fullscreenError && (
          <div className="ebb-state error" role="alert">
            Full screen is unavailable in this browser or embedded view.
          </div>
        )}

        {isLoading && !bedCards.length && !triageEncounterRows.length ? (
          <div className="ebb-state">
            <Loader
              content={<Translate>Loading bed board…</Translate>}
            />
          </div>
        ) : (
          <main className="ebb-main">
            <BedMap
              cards={bedCards}
              filteredCards={filteredBedCards}
              searchQuery={searchQuery}
              occupiedCount={occupiedForSummary}
              readyCount={availableForSummary}
              cleaningCount={cleaningForSummary}
              outOfServiceCount={outOfServiceForSummary}
              autoScrollEnabled={!searchQuery.trim()}
              autoScrollScopeKey={String(departmentId ?? '')}
            />

            <TriageQueue
              items={triageQueueItems}
              filteredItems={filteredTriageQueue}
              waitingOverTarget={waitingOverTarget}
              nowMs={nowMs}
              hasError={Boolean(triageError || queueTriageBulkError)}
              isLoading={triageLoading}
              isFetching={triageFetching}
            />
          </main>
        )}

        <footer className="ebb-legend">
          <div className="ebb-legend-levels">
            <strong>CTAS PRIORITY</strong>

            {[1, 2, 3, 4, 5].map(level => (
              <span key={level}>
                <i style={{ background: CTAS_COLOR_VAR[level] }} />
                {level}
                <small>
                  {level === 1
                    ? 'Immediate'
                    : `${CTAS_TARGET_MINUTES[level]} min`}
                </small>
              </span>
            ))}
          </div>

          <div className="ebb-los-legend">
            <BoardIcon name="clock" />
            <span>LOS alerts</span>
            <b className="warn">4+ hours</b>
            <b className="crit">6+ hours</b>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ERBedBoard;
