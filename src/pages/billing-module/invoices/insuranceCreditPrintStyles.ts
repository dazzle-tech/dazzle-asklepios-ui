export const INSURANCE_CREDIT_PRINT_CSS = `
  .credit-invoice {
    width: 100%;
    min-width: 980px;
    color: #111;
    background: #fff;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    line-height: 1.25;
  }

  .credit-invoice__sheet {
    border: 1px solid #222;
    padding: 14px 16px 10px;
  }

  .credit-invoice__facility {
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .credit-invoice__title {
    margin: 2px 0 10px;
    padding-bottom: 4px;
    border-bottom: 1.5px solid #111;
    text-align: center;
    font-size: 16px;
    font-weight: 700;
  }

  .credit-invoice__identity {
    display: grid;
    grid-template-columns: 1.15fr 0.95fr;
    gap: 28px;
    margin-bottom: 8px;
  }

  .credit-invoice__field {
    display: grid;
    grid-template-columns: 124px 118px minmax(0, 1fr);
    column-gap: 6px;
    align-items: start;
    min-height: 16px;
    margin-bottom: 1px;
  }

  .credit-invoice__label {
    font-weight: 700;
    white-space: nowrap;
  }

  .credit-invoice__label-ar {
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
  }

  .credit-invoice__value {
    min-width: 0;
    white-space: pre-wrap;
  }

  .credit-invoice__value--name {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .credit-invoice__seller {
    display: grid;
    grid-template-columns: 124px 118px minmax(0, 1fr);
    column-gap: 6px;
    align-items: start;
    margin: 6px 0 8px;
    font-weight: 700;
  }

  .credit-invoice__seller-ar {
    text-align: right;
  }

  .credit-invoice__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 8.5px;
  }

  .credit-invoice__table col.col-date { width: 5.5%; }
  .credit-invoice__table col.col-code { width: 7%; }
  .credit-invoice__table col.col-desc { width: 15%; }
  .credit-invoice__table col.col-qty { width: 3.5%; }
  .credit-invoice__table col.col-money { width: 6.5%; }
  .credit-invoice__table col.col-money-wide { width: 8.5%; }
  .credit-invoice__table col.col-vatpct { width: 3.5%; }

  .credit-invoice__table th,
  .credit-invoice__table td {
    padding: 2px 2px;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }

  .credit-invoice__table thead th {
    border-top: 1px solid #111;
    border-bottom: 1px solid #111;
    font-weight: 700;
    text-align: center;
    vertical-align: bottom;
    font-size: 7px;
    line-height: 1.1;
    white-space: normal;
    padding: 4px 1px 3px;
    overflow: hidden;
  }

  .credit-invoice__table thead th .ar {
    display: block;
    font-weight: 700;
    line-height: 1.1;
    margin-top: 1px;
    font-size: 6.5px;
  }

  .credit-invoice__table .col-text {
    text-align: left;
  }

  .credit-invoice__table thead th.col-text {
    text-align: left;
  }

  .credit-invoice__table .num {
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .credit-invoice__table thead th.num {
    text-align: center;
  }

  .credit-invoice__group td {
    padding-top: 10px;
    padding-bottom: 3px;
    font-weight: 700;
    text-align: left;
    border-top: 1px solid #111;
    font-size: 10px;
  }

  .credit-invoice__group:first-child td {
    border-top: none;
    padding-top: 6px;
  }

  .credit-invoice__subtotal td,
  .credit-invoice__grand td {
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
  }

  .credit-invoice__subtotal td {
    border-top: 1px solid #111;
    padding-top: 3px;
    padding-bottom: 6px;
  }

  .credit-invoice__subtotal .label,
  .credit-invoice__grand .label {
    text-align: right;
    white-space: nowrap;
    padding-right: 8px;
  }

  .credit-invoice__grand td {
    border-top: 1.5px solid #111;
    border-bottom: 3px double #111;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .credit-invoice__empty {
    padding: 12px 4px;
    text-align: center;
  }

  .credit-invoice__page {
    margin-top: 28px;
    padding-top: 4px;
    border-top: 1px solid #111;
    text-align: center;
    font-size: 11px;
  }
`;

export const INSURANCE_CREDIT_PRINT_PAGE_CSS = `
  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }

  ${INSURANCE_CREDIT_PRINT_CSS}

  .credit-invoice {
    min-width: 0;
  }
`;
