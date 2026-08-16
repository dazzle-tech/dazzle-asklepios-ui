import React from 'react';
import { Table } from 'rsuite';

import type { ClaimValidationError } from '@/types/model-types-new';

type ClaimErrorsPanelProps = {
  errors?: ClaimValidationError[] | null;
  status?: string | null;
  outcome?: string | null;
  statusDescription?: string | null;
  compact?: boolean;
};

const ClaimErrorsPanel: React.FC<ClaimErrorsPanelProps> = ({
  errors,
  status,
  outcome,
  statusDescription,
  compact = false
}) => {
  const rows = (errors ?? []).filter(error => error?.message);
  const isRejected =
    String(status ?? '').toUpperCase() === 'REJECTED' ||
    String(outcome ?? '').toUpperCase() === 'NOT_ACCEPTED';

  if (!isRejected && rows.length === 0) {
    return null;
  }

  return (
    <section className={`bc-errors${compact ? ' bc-errors--compact' : ''}`}>
      <div className="bc-errors__banner">
        <div>
          <div className="bc-errors__label">Waseel validation</div>
          <div className="bc-errors__title">
            {isRejected ? 'Not Accepted' : 'Validation warnings'}
          </div>
          {statusDescription ? (
            <div className="bc-errors__description">{statusDescription}</div>
          ) : null}
        </div>
        {rows.length > 0 ? (
          <div className="bc-errors__count">
            {rows.length} issue{rows.length === 1 ? '' : 's'}
          </div>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="bc-empty">No detailed validation rows returned yet. Refresh from Waseel.</div>
      ) : (
        <div className="bc-errors__table">
          <Table data={rows} autoHeight rowHeight={compact ? 38 : 44} headerHeight={34}>
            <Table.Column flexGrow={1} minWidth={180}>
              <Table.HeaderCell>Code</Table.HeaderCell>
              <Table.Cell dataKey="code" />
            </Table.Column>
            <Table.Column flexGrow={2} minWidth={240}>
              <Table.HeaderCell>Message</Table.HeaderCell>
              <Table.Cell dataKey="message" />
            </Table.Column>
          </Table>
        </div>
      )}
    </section>
  );
};

export default ClaimErrorsPanel;
