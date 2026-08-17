import React from 'react';
import { Message } from 'rsuite';

export const UNCOVERED_INSURANCE_WARNING_TEXT =
  "This item is not on the patient's insurance price list. If you continue, it will be billed as cash to the patient and will not be sent on a claim.";

export type UncoveredInsuranceWarningItem = {
  itemName?: string | null;
  itemCode?: string | null;
  cashUnitPrice?: number | string | null;
  currency?: string | null;
};

const formatCashPrice = (price?: number | string | null, currency?: string | null) => {
  if (price == null || price === '') {
    return null;
  }

  const numeric = Number(price);
  const amount = Number.isFinite(numeric) ? numeric.toFixed(2) : String(price);
  return currency ? `${amount} ${currency}` : amount;
};

export const UncoveredInsuranceWarning = ({
  items
}: {
  items?: UncoveredInsuranceWarningItem[] | null;
}) => {
  if (!items?.length) {
    return null;
  }

  return (
    <Message type="warning" showIcon style={{ marginBottom: 12 }}>
      <div>{UNCOVERED_INSURANCE_WARNING_TEXT}</div>
      <ul style={{ margin: '8px 0 0', paddingInlineStart: 18 }}>
        {items.map((item, index) => {
          const cashPrice = formatCashPrice(item.cashUnitPrice, item.currency);
          return (
            <li key={`${item.itemCode ?? item.itemName ?? index}`}>
              {item.itemName || item.itemCode || 'Item'}
              {item.itemCode ? ` (${item.itemCode})` : ''}
              {cashPrice ? ` — ${cashPrice}` : ''}
            </li>
          );
        })}
      </ul>
    </Message>
  );
};

export default UncoveredInsuranceWarning;
