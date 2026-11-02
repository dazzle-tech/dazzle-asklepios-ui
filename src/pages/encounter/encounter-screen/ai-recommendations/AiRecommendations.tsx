import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useSelector } from 'react-redux';
import { Tooltip, Whisper } from 'rsuite';
import { FaPrint, FaRegCopy, FaRegLightbulb, FaSyncAlt, FaTimes } from 'react-icons/fa';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { calculateAgeFormat } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { Patient, PatientEncounter } from '@/types/model-types-new';
import AiFab from './AiFab';
import RecommendationRow from './RecommendationRow';
import { EmptyState, ErrorState, LoadingState } from './RecommendationStates';
import useRecommendations from './useRecommendations';
import {
  buildCopyText,
  DEFAULT_FOCUS_AREAS,
  Filter,
  formatTime,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  printFileName,
  toBucket
} from './utils';
import './aiRecommendations.less';

type Props = {
  patient?: Patient;
  encounter?: PatientEncounter;
  focusAreas?: string[];
};

const HeaderButton = ({
  label,
  disabled,
  onClick,
  children
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Whisper placement="bottom" speaker={<Tooltip>{label}</Tooltip>}>
    <button type="button" className="ai-rec-icon-btn" aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  </Whisper>
);

const AiRecommendations: React.FC<Props> = ({ patient, encounter, focusAreas = DEFAULT_FOCUS_AREAS }) => {
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui.mode);

  const { phase, step, result, errorText, generatedAt, canRequest, start, cancel } = useRecommendations({
    patientId: patient?.id,
    encounterId: encounter?.id,
    focusAreas
  });

  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [summaryOpen, setSummaryOpen] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const recommendations = useMemo(() => result?.recommendations ?? [], [result]);

  const patientLine = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    const age = patient?.dateOfBirth ? calculateAgeFormat(patient.dateOfBirth) : '';
    const visit = encounter?.encounterDate ? new Date(encounter.encounterDate).toLocaleDateString() : null;
    return [name, age, patient?.sexAtBirth, visit ? `Visit ${visit}` : null].filter(Boolean).join(' · ');
  }, [patient, encounter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: recommendations.length, critical: 0, high: 0, moderate: 0, low: 0, routine: 0 };
    recommendations.forEach(r => (c[toBucket(r.priority)] += 1));
    return c;
  }, [recommendations]);

  const visible = recommendations.filter(r => filter === 'all' || toBucket(r.priority) === filter);
  // Like print, copy ignores the selected tab
  const copyable = recommendations.filter(r => !dismissed.has(r.recommendation_id));

  // Every new result starts with all tabs, nothing dismissed and the first row open
  useEffect(() => {
    setFilter('all');
    setDismissed(new Set());
    setSummaryOpen(false);
    setOpenId(result?.recommendations?.[0]?.recommendation_id ?? null);
  }, [result]);

  // A new encounter closes the drawer
  useEffect(() => setOpen(false), [patient?.id, encounter?.id]);

  // Keep the drawer mounted while it slides out
  useEffect(() => {
    if (open) {
      setShown(true);
      const timer = setTimeout(() => closeRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setShown(false), 220);
    return () => clearTimeout(timer);
  }, [open]);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeDrawer]);

  const onFabClick = () => {
    setOpen(true);
    if (phase === 'idle') start();
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(result?.summary, copyable));
      dispatch(notify({ msg: 'Copied', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Could not copy', sev: 'error' }));
    }
  };

  // Always print every recommendation, whatever tab is selected, then restore the tab and title
  const printDrawer = () => {
    const previousFilter = filter;
    const previousTitle = document.title;
    document.title = printFileName(patient?.firstName, patient?.lastName);
    flushSync(() => setFilter('all'));
    document.body.classList.add('ai-rec-printing');
    const cleanup = () => {
      document.body.classList.remove('ai-rec-printing');
      window.removeEventListener('afterprint', cleanup);
      document.title = previousTitle;
      setFilter(previousFilter);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    if (openId === id) setOpenId(null);
  };

  const undoDismiss = (id: string) =>
    setDismissed(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const renderSuccess = () => (
    <>
      {result?.summary && (
        <div className={`ai-rec-summary${summaryOpen ? '' : ' clamp'}`}>
          <div className="label">
            <Translate>Summary</Translate>
          </div>
          <p>{result.summary}</p>
          <button type="button" className="more" onClick={() => setSummaryOpen(o => !o)}>
            <Translate>{summaryOpen ? 'Show less' : 'Show more'}</Translate>
          </button>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="ai-rec-filters" role="group" aria-label="Priority filter">
          {(['all', ...PRIORITY_ORDER] as Filter[]).map(key => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              disabled={counts[key] === 0}
              onClick={() => setFilter(key)}
            >
              <Translate>{key === 'all' ? 'All' : PRIORITY_LABELS[key]}</Translate> {counts[key]}
            </button>
          ))}
        </div>
      )}

      <div className="ai-rec-list">
        {visible.map((r, index) => {
          const id = r.recommendation_id;
          return (
            <RecommendationRow
              key={id}
              recommendation={r}
              index={index}
              isOpen={openId === id}
              isDismissed={dismissed.has(id)}
              onToggle={() => setOpenId(openId === id ? null : id)}
              onDismiss={() => dismiss(id)}
              onUndo={() => undoDismiss(id)}
            />
          );
        })}
      </div>
    </>
  );

  return createPortal(
    <div className={`ai-rec ai-rec-portal${mode === 'dark' ? ' dark' : ''}`}>
      <AiFab
        ref={fabRef}
        open={open}
        loading={phase === 'loading'}
        ready={phase === 'success'}
        disabled={!canRequest}
        onClick={onFabClick}
      />

      {shown && (
        <>
          <div className={`ai-rec-scrim${open ? ' on' : ''}`} onClick={closeDrawer} />
          {/* div, not aside: the global "aside { z-index: 102 !important }" would put it under the scrim */}
          <div className={`ai-rec-drawer${open ? ' on' : ''}`} role="dialog" aria-modal="true" aria-labelledby="ai-rec-title">
            <div className="ai-rec-head">
              <div className="ai-rec-head__row">
                <FaRegLightbulb size={16} color="var(--ai-blue)" />
                <h2 id="ai-rec-title">
                  <Translate>AI Recommendations</Translate>
                </h2>
                <span className="ai-rec-chip">AI</span>
                <HeaderButton label="Regenerate" disabled={phase === 'loading'} onClick={start}>
                  <FaSyncAlt />
                </HeaderButton>
                <HeaderButton label="Copy" disabled={phase !== 'success'} onClick={copyAll}>
                  <FaRegCopy />
                </HeaderButton>
                <HeaderButton label="Print" disabled={phase !== 'success'} onClick={printDrawer}>
                  <FaPrint />
                </HeaderButton>
                {/* No Whisper here: it replaces the child's ref, and focus needs closeRef */}
                <button
                  ref={closeRef}
                  type="button"
                  className="ai-rec-icon-btn"
                  title="Close"
                  aria-label="Close"
                  onClick={closeDrawer}
                >
                  <FaTimes />
                </button>
              </div>
              {patientLine && <p className="ai-rec-head__sub">{patientLine}</p>}
            </div>

            <div className="ai-rec-body">
              {phase === 'loading' && <LoadingState step={step} onCancel={cancel} />}
              {phase === 'empty' && <EmptyState onRetry={start} />}
              {phase === 'error' && <ErrorState errorText={errorText} onRetry={start} onClose={closeDrawer} />}
              {phase === 'success' && renderSuccess()}
            </div>

            <div className="ai-rec-foot">
              <span className="disc">
                <Translate>AI suggestions support, not replace, clinical judgment.</Translate>
              </span>
              {generatedAt && phase === 'success' && (
                <span className="gen">
                  <Translate>Generated</Translate> {formatTime(generatedAt)}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  );
};

export default AiRecommendations;
