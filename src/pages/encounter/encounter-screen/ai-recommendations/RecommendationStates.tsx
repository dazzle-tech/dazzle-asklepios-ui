import React from 'react';
import { FaCheck, FaExclamationCircle, FaRegMinusSquare } from 'react-icons/fa';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { LOADING_STEPS } from './utils';

export const LoadingState = ({ step, onCancel }: { step: number; onCancel: () => void }) => (
  <div className="ai-rec-load">
    <div className="ai-rec-progress" aria-hidden="true" />
    <ol className="ai-rec-steps">
      {LOADING_STEPS.map((label, i) => (
        <li key={label} className={i < step ? 'done' : i === step ? 'cur' : ''}>
          <span className="mark">{i < step && <FaCheck />}</span>
          <Translate>{label}</Translate>
        </li>
      ))}
    </ol>
    {[0, 1, 2].map(i => (
      <div key={i} className="ai-rec-skel" />
    ))}
    <p>
      <Translate>Usually takes a few seconds</Translate>
    </p>
    <div>
      <MyButton appearance="link" size="xs" onClick={onCancel}>
        Cancel
      </MyButton>
    </div>
  </div>
);

export const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="ai-rec-state">
    <FaRegMinusSquare size={32} />
    <h3>
      <Translate>Not enough information yet</Translate>
    </h3>
    <p>
      <Translate>Add more visit details or vitals, then try again.</Translate>
    </p>
    <MyButton onClick={onRetry}>Try again</MyButton>
  </div>
);

export const ErrorState = ({
  errorText,
  onRetry,
  onClose
}: {
  errorText: string;
  onRetry: () => void;
  onClose: () => void;
}) => (
  <div className="ai-rec-state">
    <FaExclamationCircle size={32} />
    <h3>
      <Translate>AI recommendations are temporarily unavailable.</Translate>
    </h3>
    <p>
      <Translate>Your visit data is safe. You can continue with the visit.</Translate>
    </p>
    <div className="actions">
      <MyButton onClick={onRetry}>Retry</MyButton>
      <MyButton appearance="ghost" onClick={onClose}>
        Close
      </MyButton>
    </div>
    {errorText && (
      <details className="tech">
        <summary>
          <Translate>Technical details</Translate>
        </summary>
        <pre>{errorText}</pre>
      </details>
    )}
  </div>
);
