import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Popover, Whisper } from 'rsuite';
import type { OverlayTriggerHandle } from 'rsuite/esm/internals/Overlay/OverlayTrigger';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaPills } from 'react-icons/fa';
import Translate from '@/components/Translate';
import LovValueCell from '@/components/LovValueCell';
import { useLazyGetActiveIngredientByIdQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { ActiveIngredient } from '@/types/model-types-new';
import { formatControlledEnumLabel } from '@/utils';
import ActiveIngredientMoreDetails from './ActiveIngredientMoreDetails';
import './styles.less';

type Placement = React.ComponentProps<typeof Whisper>['placement'];

type ActiveIngredientLinkProps = {
  activeIngredientId?: number | string | null;
  // Pass the record when the screen already has it, so the card opens without a request
  activeIngredient?: ActiveIngredient | null;
  // Text to show; defaults to the ingredient name
  label?: React.ReactNode;
  placement?: Placement;
};

type FlagTone = 'danger' | 'warning' | 'dark' | 'purple' | 'info' | 'success' | 'neutral';

const buildFlags = (ai: ActiveIngredient): { label: string; tone: FlagTone }[] => {
  const flags: { label: string; tone: FlagTone }[] = [];
  if (ai.highAlert) flags.push({ label: 'High Alert', tone: 'danger' });
  if (ai.isControlled) {
    const schedule = formatControlledEnumLabel(ai.controlled);
    flags.push({ label: schedule ? `Controlled · ${schedule}` : 'Controlled', tone: 'warning' });
  }
  if (ai.hasBlackBoxWarning) flags.push({ label: 'Black Box', tone: 'dark' });
  if (ai.isLookAlikeSoundAlike) flags.push({ label: 'LASA', tone: 'purple' });
  if (ai.antimicrobial) flags.push({ label: 'Antimicrobial', tone: 'info' });
  if (ai.abortiveMedication) flags.push({ label: 'Abortive', tone: 'danger' });
  if (ai.laborInducingMed) flags.push({ label: 'Labor Inducing', tone: 'warning' });
  if (ai.otc) flags.push({ label: 'OTC', tone: 'success' });
  return flags;
};

const yesNo = (value?: boolean | null) => (value ? 'Yes' : 'No');

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="ai-card__field">
    <div className="ai-card__field-label">
      <Translate>{label}</Translate>
    </div>
    <div className="ai-card__field-value">{children}</div>
  </div>
);

const CardContent = ({
  ai,
  bodyMaxHeight,
  onLayoutChange
}: {
  ai: ActiveIngredient;
  bodyMaxHeight?: number;
  onLayoutChange?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const flags = buildFlags(ai);

  // The card changes height when collapsed again, so its position is recalculated
  useEffect(() => {
    if (expanded) return;
    const frame = requestAnimationFrame(() => onLayoutChange?.());
    return () => cancelAnimationFrame(frame);
  }, [expanded, onLayoutChange]);
  const maxDose = [ai.toxicityMaximumDose, ai.toxicityMaximumDosePerUnit].filter(Boolean).join(' ');

  return (
    <>
      <div className="ai-card__header">
        <span className="ai-card__icon">
          <FaPills size={14} aria-hidden="true" />
        </span>
        <div className="ai-card__title-wrap">
          <div className="ai-card__title">{ai.name}</div>
          <div className="ai-card__subtitle">
            {ai.atcCode ? <span className="ai-card__code">ATC {ai.atcCode}</span> : null}
            {ai.isActive === false && (
              <span className="ai-card__inactive">
                <Translate>Inactive</Translate>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="ai-card__body" style={{ maxHeight: bodyMaxHeight }}>
        {flags.length > 0 && (
          <div className="ai-card__flags">
            {flags.map(flag => (
              <span key={flag.label} className={`ai-card__flag ai-card__flag--${flag.tone}`}>
                <Translate>{flag.label}</Translate>
              </span>
            ))}
          </div>
        )}

        {ai.hasBlackBoxWarning && ai.blackBoxWarning && (
          <div className="ai-card__warning">{ai.blackBoxWarning}</div>
        )}

        <div className="ai-card__grid">
          <Field label="Pregnancy Category">
            <LovValueCell valueKey={ai.pregnancyCategory} />
          </Field>
          <Field label="Breastfeeding">
            <LovValueCell valueKey={ai.lactationRisk} />
          </Field>
          <Field label="Renal Adjustment">
            <Translate>{yesNo(ai.doseAdjustmentRenal)}</Translate>
          </Field>
          <Field label="Hepatic Adjustment">
            <Translate>{yesNo(ai.doseAdjustmentHepatic)}</Translate>
          </Field>
          <Field label="Max Dose">{maxDose || '-'}</Field>
          <Field label="Half-life">{ai.pharmaHalfLife || '-'}</Field>
        </div>

        {!expanded && ai.mechanismOfAction && (
          <div className="ai-card__section">
            <div className="ai-card__field-label">
              <Translate>Mechanism of Action</Translate>
            </div>
            <div className="ai-card__text" title={ai.mechanismOfAction}>
              {ai.mechanismOfAction}
            </div>
          </div>
        )}

        {expanded && ai.id != null && (
          <ActiveIngredientMoreDetails ai={ai} onRendered={onLayoutChange} />
        )}

        {ai.id != null && (
          <button
            type="button"
            className="ai-card__toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded(value => !value)}
          >
            <Translate>{expanded ? 'Show less' : 'Show more'}</Translate>
            {expanded ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
          </button>
        )}
      </div>
    </>
  );
};

// Space kept between the card and the screen edge, plus the card header height
const EDGE_GAP = 12;
const HEADER_HEIGHT = 64;
const MIN_BODY_HEIGHT = 120;

type CardProps = {
  ai?: ActiveIngredient | null;
  failed?: boolean;
  bodyMaxHeight?: number;
  onLayoutChange?: () => void;
  className?: string;
};

// Whisper passes its own show/animation classes, so ours must be merged, not replace them
const ActiveIngredientCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ ai, failed, bodyMaxHeight, onLayoutChange, className, ...props }, ref) => (
    <Popover
      ref={ref}
      {...props}
      full
      arrow={false}
      className={['ai-card', className].filter(Boolean).join(' ')}
      onClick={event => event.stopPropagation()}
    >
      {ai && !failed ? (
        <CardContent ai={ai} bodyMaxHeight={bodyMaxHeight} onLayoutChange={onLayoutChange} />
      ) : (
        <div className="ai-card__state">
          <Translate>Could not load active ingredient</Translate>
        </div>
      )}
    </Popover>
  )
);

ActiveIngredientCard.displayName = 'ActiveIngredientCard';

// Active ingredient name shown as a link; clicking it opens a card with the ingredient's key data.
// The data is loaded before the card opens, so the card is placed at its real size:
// on the side of the link with more room, with its body capped to the room left.
const ActiveIngredientLink: React.FC<ActiveIngredientLinkProps> = ({
  activeIngredientId,
  activeIngredient,
  label,
  placement
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fetched, setFetched] = useState<ActiveIngredient | null>(null);
  const [autoPlacement, setAutoPlacement] = useState<Placement>('bottomStart');
  const [bodyMaxHeight, setBodyMaxHeight] = useState<number>();
  const [fetchActiveIngredient] = useLazyGetActiveIngredientByIdQuery();
  const whisperRef = useRef<OverlayTriggerHandle>(null);
  const updatePosition = useCallback(() => whisperRef.current?.updatePosition(), []);

  // The card is placed once when it opens, so it closes when the page or a scroll area moves
  // under it, instead of staying behind while the link scrolls away. Scrolling inside the card is fine.
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const target = event.target as Element | null;
      if (target instanceof Element && target.closest('.ai-card')) return;
      setOpen(false);
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const id = activeIngredient?.id ?? activeIngredientId;
  const text = label ?? activeIngredient?.name;

  if (id == null || id === '') {
    return <>{text || '-'}</>;
  }

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Keeps the click from selecting the table row underneath
    event.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    if (loading) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const below = spaceBelow >= spaceAbove;
    setAutoPlacement(below ? 'bottomStart' : 'topStart');
    setBodyMaxHeight(
      Math.max(MIN_BODY_HEIGHT, (below ? spaceBelow : spaceAbove) - HEADER_HEIGHT - EDGE_GAP * 2)
    );

    if (!activeIngredient) {
      setLoading(true);
      try {
        // Uses the cached record when the card was opened before
        setFetched(await fetchActiveIngredient(id, true).unwrap());
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }
    setOpen(true);
  };

  return (
    <Whisper
      ref={whisperRef}
      open={open}
      trigger="none"
      rootClose
      onClose={() => setOpen(false)}
      placement={placement ?? autoPlacement}
      speaker={
        <ActiveIngredientCard
          ai={activeIngredient ?? fetched}
          failed={!activeIngredient && failed}
          bodyMaxHeight={bodyMaxHeight}
          onLayoutChange={updatePosition}
        />
      }
    >
      <button
        type="button"
        className={['ai-link', loading ? 'ai-link--loading' : ''].filter(Boolean).join(' ')}
        aria-busy={loading}
        onClick={handleClick}
      >
        {text || '-'}
      </button>
    </Whisper>
  );
};

export default ActiveIngredientLink;
