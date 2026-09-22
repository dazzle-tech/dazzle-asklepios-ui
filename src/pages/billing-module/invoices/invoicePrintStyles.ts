export const INVOICE_PRINT_CSS = `
  .invoice-print {
    max-width: 820px;
    margin: 0 auto;
    font-family: Arial, sans-serif;
    color: #1c1c1e;
  }

  .invoice-print__header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 10px;
    margin-bottom: 16px;
  }

  .invoice-print__header-main {
    min-width: 0;
  }

  .invoice-print__brand {
    font-size: 18px;
    font-weight: 700;
    color: #0f766e;
    line-height: 1.2;
  }

  .invoice-print__subtitle {
    margin-top: 2px;
    font-size: 12px;
    color: #64748b;
  }

  .invoice-print__facility-meta {
    margin-top: 4px;
    font-size: 11px;
    line-height: 1.4;
    color: #64748b;
  }

  .invoice-print__facility-meta-sep {
    color: #94a3b8;
  }

  .invoice-print__meta {
    text-align: right;
    font-size: 12px;
    line-height: 1.35;
    color: #374151;
    min-width: 180px;
  }

  .invoice-print__meta-grid {
    display: grid;
    gap: 4px;
    margin-top: 6px;
  }

  .invoice-print__meta-item {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
    gap: 8px;
  }

  .invoice-print__meta-label {
    color: #64748b;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .invoice-print__version {
    display: inline-block;
    padding: 2px 8px;
    border: 1.5px solid #0f766e;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #0f766e;
    background: #f0fdfa;
  }

  .invoice-print__version--copy {
    border-color: #64748b;
    color: #475569;
    background: #f8fafc;
  }

  .invoice-print__sequence {
    font-family: Consolas, monospace;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  }

  .invoice-print__qr {
    flex-shrink: 0;
  }

  .invoice-print__qr img {
    display: block;
    width: 72px;
    height: 72px;
  }

  .invoice-print__qr--placeholder {
    width: 72px;
    height: 72px;
  }

  .invoice-print__section {
    margin-bottom: 18px;
  }

  .invoice-print__section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .invoice-print__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    font-size: 13px;
  }

  .invoice-print__table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }

  .invoice-print__table th,
  .invoice-print__table td {
    border-bottom: 1px solid #e5e7eb;
    padding: 10px 8px;
    text-align: left;
    font-size: 13px;
  }

  .invoice-print__table th {
    background: #f8fafc;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
  }

  .invoice-print__totals {
    margin-top: 18px;
    border-top: 2px solid #e5e7eb;
    padding-top: 12px;
  }

  .invoice-print__total-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 0;
    font-size: 14px;
    color: #374151;
  }

  .invoice-print__total-row--highlight {
    font-size: 18px;
    font-weight: 700;
    color: #0f766e;
    border-top: 1px dashed #cbd5e1;
    margin-top: 8px;
    padding-top: 12px;
  }

  .invoice-print__footer {
    margin-top: 28px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
  }

  .invoice-print__status {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #047857;
    font-size: 11px;
    font-weight: 600;
  }

  .invoice-print--unofficial {
    position: relative;
    overflow: hidden;
  }

  .invoice-print--unofficial .invoice-print__header {
    border-bottom-color: #b45309;
  }

  .invoice-print--unofficial .invoice-print__brand {
    color: #92400e;
  }

  .invoice-print__unofficial-banner {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
    padding: 10px 12px;
    border: 2px solid #b45309;
    border-radius: 8px;
    background: #fffbeb;
    color: #92400e;
  }

  .invoice-print__unofficial-banner strong {
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .invoice-print__unofficial-banner span {
    font-size: 12px;
    line-height: 1.45;
    color: #78350f;
  }

  .invoice-print__stamp {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 86px;
    min-height: 72px;
    padding: 6px;
    border: 2px solid #b45309;
    border-radius: 6px;
    color: #b45309;
    background: #fff7ed;
    text-align: center;
    transform: rotate(-8deg);
  }

  .invoice-print__stamp-title {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1.2;
  }

  .invoice-print__stamp-sub {
    margin-top: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.2;
  }

  .invoice-print__watermark {
    position: absolute;
    inset: 28% 0 auto;
    text-align: center;
    font-size: 64px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(180, 83, 9, 0.08);
    transform: rotate(-18deg);
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }

  .invoice-print--unofficial > *:not(.invoice-print__watermark) {
    position: relative;
    z-index: 1;
  }

  .invoice-print__status--estimate {
    background: #fff7ed;
    color: #c2410c;
  }

  .invoice-print__total-row--due {
    color: #b45309;
  }

  .invoice-print__footer--unofficial {
    color: #92400e;
    font-weight: 600;
  }
`;

export const INVOICE_PRINT_PAGE_CSS = `
  body {
    font-family: Arial, sans-serif;
    color: #1c1c1e;
    margin: 24px;
  }
  ${INVOICE_PRINT_CSS}
`;
