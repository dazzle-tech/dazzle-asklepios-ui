import React, { useMemo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
  faVial,
  faXRay
} from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import type {
  DiagnosticCheckoutApproval,
  DiagnosticCheckoutResultLine
} from '@/services/encounters/patientEncounterService';
import type { EncounterBillingItemSummary } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';

type InsuranceCheckoutValidationModalProps = {
  open: boolean;
  onClose: () => void;
  missing: string[];
  diagnostics: DiagnosticCheckoutApproval[];
  billingItems?: EncounterBillingItemSummary[] | null;
};

const InsuranceCheckoutValidationModal: React.FC<InsuranceCheckoutValidationModalProps> = ({
  open,
  onClose,
  missing,
  diagnostics,
  billingItems
}) => {
  const nameBySourceId = useMemo(() => {
    const names = new Map<number, string>();
    for (const item of billingItems ?? []) {
      const type = String(item?.billingItemType ?? item?.serviceSource ?? '').toUpperCase();
      if (type !== 'LABORATORY' && type !== 'RADIOLOGY') {
        continue;
      }
      if (item?.sourceId == null) {
        continue;
      }
      const name = item.itemName?.trim() || item.itemDescription?.trim();
      if (name && name !== '-') {
        names.set(Number(item.sourceId), name);
      }
    }
    return names;
  }, [billingItems]);

  const laboratory = diagnostics.filter(item => item.orderType !== 'RADIOLOGY');
  const radiology = diagnostics.filter(item => item.orderType === 'RADIOLOGY');
  const issueCount = missing.length + diagnostics.length;

  return (
    <MyModal
      open={open}
      setOpen={value => {
        if (!value) {
          onClose();
        }
      }}
      title="Insurance checkout"
      size="760px"
      bodyheight="auto"
      hideActionBtn
      hideCancel
      customClassName="insurance-checkout-validation-modal"
      content={
        <div className="insurance-checkout-validation">
          <div className="insurance-checkout-validation__hero">
            <div className="insurance-checkout-validation__hero-mark">
              <FontAwesomeIcon icon={faCircleExclamation} />
            </div>
            <div className="insurance-checkout-validation__hero-copy">
              <div className="insurance-checkout-validation__kicker">
                <Translate>Checkout is on hold</Translate>
              </div>
              <p>
                <Translate>
                  Approve the laboratory results and radiology reports, and finish the visit
                  requirements, before this insurance visit can be checked out.
                </Translate>
              </p>
            </div>
            <div className="insurance-checkout-validation__count">
              <strong>{issueCount}</strong>
              <span>
                <Translate>{issueCount === 1 ? 'item' : 'items'}</Translate>
              </span>
            </div>
          </div>

          {missing.length > 0 && (
            <section className="insurance-checkout-validation__section">
              <header>
                <h4>
                  <Translate>Visit requirements</Translate>
                </h4>
                <span>{missing.length}</span>
              </header>
              <ul className="insurance-checkout-validation__requirements">
                {missing.map((item, index) => (
                  <li key={item}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {laboratory.length > 0 && (
            <DiagnosticSection
              title="Laboratory"
              icon={faVial}
              items={laboratory}
              nameBySourceId={nameBySourceId}
              emptyName="Laboratory test"
            />
          )}

          {radiology.length > 0 && (
            <DiagnosticSection
              title="Radiology"
              icon={faXRay}
              items={radiology}
              nameBySourceId={nameBySourceId}
              emptyName="Radiology test"
            />
          )}

          <div className="insurance-checkout-validation__footer">
            <MyButton appearance="ghost" onClick={onClose}>
              <Translate>Close</Translate>
            </MyButton>
          </div>
        </div>
      }
    />
  );
};

const DiagnosticSection = ({
  title,
  icon,
  items,
  nameBySourceId,
  emptyName
}: {
  title: string;
  icon: typeof faVial;
  items: DiagnosticCheckoutApproval[];
  nameBySourceId: Map<number, string>;
  emptyName: string;
}) => (
  <section className="insurance-checkout-validation__section">
    <header>
      <h4>
        <FontAwesomeIcon icon={icon} />
        <Translate>{title}</Translate>
      </h4>
      <span>{items.length}</span>
    </header>
    <div className="insurance-checkout-validation__tests">
      {items.map(item => (
        <TestCard
          key={item.orderTestId}
          item={item}
          name={resolveTestName(item, nameBySourceId, emptyName)}
        />
      ))}
    </div>
  </section>
);

const TestCard = ({
  item,
  name
}: {
  item: DiagnosticCheckoutApproval;
  name: string;
}) => {
  const isRadiology = item.orderType === 'RADIOLOGY';
  const lines = item.results ?? [];
  const reportLabel = item.approvalStatus
    ? formatEnumString(item.approvalStatus)
    : isRadiology
      ? 'No report'
      : lines.length > 0
        ? 'Pending'
        : 'No result';

  return (
    <article className="insurance-checkout-validation__card">
      <div className="insurance-checkout-validation__card-top">
        <div>
          <div className="insurance-checkout-validation__identity">
            {item.orderNumber ? <span>{item.orderNumber}</span> : null}
            <span>{isRadiology ? 'Radiology' : 'Laboratory'}</span>
            {item.urgent ? (
              <span className="insurance-checkout-validation__urgent">Urgent</span>
            ) : null}
          </div>
          <h5>{name}</h5>
        </div>
        <StatusPill status={item.processingStatus || item.approvalStatus} />
      </div>

      <div className="insurance-checkout-validation__facts">
        <Fact label="Processing" value={formatStatus(item.processingStatus)} />
        <Fact label={isRadiology ? 'Report' : 'Result'} value={reportLabel} />
        {isRadiology ? (
          <Fact label="Images" value={formatStatus(item.imageStatus)} />
        ) : (
          <Fact
            label="Components"
            value={lines.length > 0 ? String(lines.length) : 'None entered'}
          />
        )}
        <Fact label="Order line" value={formatStatus(item.testStatus)} />
        {item.accessionNumber ? (
          <Fact label="Accession" value={item.accessionNumber} />
        ) : null}
      </div>

      {lines.length > 0 && (
        <div className="insurance-checkout-validation__results">
          <div className="insurance-checkout-validation__results-head">
            <span>Component</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {lines.map((line, index) => (
            <ResultRow key={`${item.orderTestId}-${line.name}-${index}`} line={line} />
          ))}
        </div>
      )}

      {item.message ? (
        <div className="insurance-checkout-validation__message">{item.message}</div>
      ) : null}
    </article>
  );
};

const ResultRow = ({ line }: { line: DiagnosticCheckoutResultLine }) => {
  const value = [line.value, line.unit].filter(Boolean).join(' ');
  return (
    <div className="insurance-checkout-validation__results-row">
      <span>{line.name || 'Result'}</span>
      <span>{value || '—'}</span>
      <StatusPill status={line.status} compact />
    </div>
  );
};

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="insurance-checkout-validation__fact">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const StatusPill = ({
  status,
  compact = false
}: {
  status?: string | null;
  compact?: boolean;
}) => (
  <span
    className={`insurance-checkout-validation__pill insurance-checkout-validation__pill--${statusTone(
      status
    )}${compact ? ' insurance-checkout-validation__pill--compact' : ''}`}
  >
    {formatStatus(status)}
  </span>
);

const resolveTestName = (
  item: DiagnosticCheckoutApproval,
  nameBySourceId: Map<number, string>,
  emptyName: string
) => {
  const fromApi = item.testName?.trim();
  if (fromApi) {
    return fromApi;
  }
  return (
    nameBySourceId.get(Number(item.orderTestId)) ||
    (item.testId != null ? nameBySourceId.get(Number(item.testId)) : undefined) ||
    emptyName
  );
};

const formatStatus = (status?: string | null) => {
  const value = status?.trim();
  return value ? formatEnumString(value) : '—';
};

const statusTone = (status?: string | null) => {
  const value = String(status ?? '').toUpperCase();
  if (value.includes('REJECT')) {
    return 'danger';
  }
  if (value.includes('APPROV') || value === 'FINISHED' || value === 'RESULT_READY') {
    return 'ok';
  }
  if (value === 'ACCEPTED' || value === 'PATIENT_ARRIVED' || value === 'SAMPLE_COLLECTED') {
    return 'info';
  }
  return 'wait';
};

export default InsuranceCheckoutValidationModal;
