import React from 'react';
import { Checkbox, Form } from 'rsuite';
import { faTags } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import type { PriceListSetup } from '@/types/model-types-new';
import type { PriceListDraft, PriceListPromptController, PriceListRow } from './usePriceListPrompt';
import { isInsuranceList, resolveDraft } from './usePriceListPrompt';
import './styles.less';

type Props = {
  prompt: PriceListPromptController;
};

const TYPE_LABELS: Record<string, string> = {
  CASH: 'Cash',
  SELF_PAY: 'Self Pay',
  INSURANCE: 'Insurance',
  CORPORATE: 'Corporate',
  PACKAGE: 'Package',
  EMPLOYEE: 'Employee'
};

const listChips = (list: PriceListSetup, facilityNames: Record<number, string>) =>
  [
    TYPE_LABELS[String(list.type)] ?? list.type,
    list.payerName,
    list.facilityName ?? (list.facilityId != null ? facilityNames[Number(list.facilityId)] : null),
    list.versionNumber != null ? `v${list.versionNumber}` : null,
    list.currency,
    list.status && list.status !== 'ACTIVE' ? list.status : null
  ].filter(Boolean) as string[];

const formatAmount = (value: unknown) =>
  value === undefined || value === null || String(value) === '' ? '-' : String(value);

type CardProps = {
  row: PriceListRow;
  prompt: PriceListPromptController;
  facilityNames: Record<number, string>;
};

const PriceListCard: React.FC<CardProps> = ({ row, prompt, facilityNames }) => {
  const { list, existing } = row;
  const listId = Number(list.id);
  const insurance = isInsuranceList(list);
  // Insurance needs the item's Waseel (SBS) mapping
  const blocked = !existing && insurance && !prompt.mapping;
  const draft = prompt.drafts[listId];
  const error = prompt.errors[listId];
  const values = draft ? resolveDraft(draft, prompt.item, insurance, prompt.mapping) : null;

  // MyInput hands back the whole record: keep only the field the user changed
  const handleChange = (next: Record<string, any>) => {
    if (!values) return;
    const patch: PriceListDraft = {};
    (Object.keys(next) as (keyof PriceListDraft)[]).forEach(key => {
      if (next[key] !== values[key]) (patch as any)[key] = next[key];
    });
    prompt.updateDraft(listId, patch);
  };

  const cardClass = [
    'price-list-prompt-card',
    existing ? 'is-linked' : '',
    draft ? 'is-selected' : '',
    blocked ? 'is-blocked' : '',
    error ? 'has-error' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      <div className="price-list-prompt-card-head">
        <Checkbox
          checked={!!existing || !!draft}
          disabled={!!existing || blocked || prompt.isSaving}
          onChange={(_value, checked) => prompt.toggleList(listId, checked)}
        />
        <div className="price-list-prompt-card-title">
          <span className="price-list-prompt-card-name">{list.name}</span>
          <span className="price-list-prompt-chips">
            {listChips(list, facilityNames).map(chip => (
              <span
                key={chip}
                className={`price-list-prompt-chip ${insurance ? 'is-insurance' : ''}`}
              >
                {chip}
              </span>
            ))}
          </span>
        </div>
        {existing ? (
          <span className="price-list-prompt-status is-linked">
            <Translate>Linked</Translate>
          </span>
        ) : draft ? (
          <span className="price-list-prompt-status is-new">
            <Translate>Will be added</Translate>
          </span>
        ) : null}
      </div>

      {existing && (
        <div className="price-list-prompt-summary">
          <span>
            <Translate>Price</Translate> <b>{formatAmount(existing.unitPrice)}</b>
          </span>
          <span>
            <Translate>Discount</Translate> <b>{formatAmount(existing.discountPercentage ?? 0)}%</b>
          </span>
          <span>
            <Translate>Code</Translate> <b>{formatAmount(existing.itemCode)}</b>
          </span>
          {insurance && (
            <span>
              <Translate>Pre-Authorization</Translate>{' '}
              <b>
                <Translate>{existing.requiresPreAuthorization ? 'Required' : 'Not required'}</Translate>
              </b>
            </span>
          )}
        </div>
      )}

      {blocked && (
        <div className="price-list-prompt-note">
          <Translate>
            Map this item to an SBS code in Waseel SBS Setup to add it to insurance price lists.
          </Translate>
        </div>
      )}

      {values && insurance && prompt.mapping && (
        <div className="price-list-prompt-sbs">
          <Translate>SBS</Translate> <b>{prompt.mapping.sbsCode}</b>
          {prompt.mapping.sbsDescription ? ` — ${prompt.mapping.sbsDescription}` : ''}
        </div>
      )}

      {values && (
        <Form fluid className="price-list-prompt-fields">
          <MyInput
            required
            width="100%"
            fieldLabel="Price"
            fieldName="unitPrice"
            fieldType="number"
            allowDecimal
            showZero
            record={values}
            setRecord={handleChange}
            disabled={prompt.isSaving}
          />
          <MyInput
            width="100%"
            fieldLabel="Discount %"
            fieldName="discountPercentage"
            fieldType="number"
            allowDecimal
            showZero
            record={values}
            setRecord={handleChange}
            disabled={prompt.isSaving}
          />
          <MyInput
            required
            width="100%"
            fieldLabel="Item Code"
            fieldName="itemCode"
            record={values}
            setRecord={handleChange}
            disabled={prompt.isSaving}
          />
          <MyInput
            width="100%"
            fieldLabel="Non-Standard Code"
            fieldName="nonStandardCode"
            record={values}
            setRecord={handleChange}
            disabled={prompt.isSaving}
          />
          {insurance && (
            <MyInput
              width="100%"
              fieldLabel="Requires Pre-Authorization"
              fieldName="requiresPreAuthorization"
              fieldType="checkbox"
              record={values}
              setRecord={handleChange}
              disabled={prompt.isSaving}
            />
          )}
        </Form>
      )}

      {error && <div className="price-list-prompt-error">{error}</div>}
    </div>
  );
};

/**
 * Links a catalog item to the cash and insurance price lists of the logged-in facility.
 * Pair it with usePriceListPrompt: call prompt(...) after a save, or view(...) from a table icon.
 */
const PriceListPrompt: React.FC<Props> = ({ prompt }) => {
  const { item, rows, selectedCount } = prompt;
  const isManage = prompt.mode === 'manage';
  const linkedRows = rows.filter(row => row.existing);
  const missingRows = rows.filter(row => !row.existing);
  const missingCount = missingRows.length;

  const { data: facilities } = useGetAllFacilitiesQuery({}, { skip: !prompt.open });
  const facilityNames: Record<number, string> = {};
  (Array.isArray(facilities) ? facilities : []).forEach((facility: any) => {
    if (facility?.id != null) facilityNames[Number(facility.id)] = facility.name;
  });

  const hint = prompt.otherFacility
    ? 'This item belongs to another facility: it can only be added to price lists while logged in to its facility.'
    : !isManage
      ? 'This item is not on every price list of this facility yet. Select the lists to add it to — the fields are filled from the item and can be changed per list.'
      : missingCount > 0
        ? 'The price lists this item is on are read only. You can add it to the price lists of this facility it is missing from below.'
        : 'The price lists this item is on (read only).';

  const renderCards = (cards: PriceListRow[]) =>
    cards.map(row => (
      <PriceListCard key={row.list.id} row={row} prompt={prompt} facilityNames={facilityNames} />
    ));

  const content = () => (
    <div className="price-list-prompt">
      <div className="price-list-prompt-item">
        <div className="price-list-prompt-item-name">{item?.itemName || '-'}</div>
        <div className="price-list-prompt-item-meta">
          <span>
            <Translate>Code</Translate> <b>{formatAmount(item?.itemCode)}</b>
          </span>
          <span>
            <Translate>Price</Translate>{' '}
            <b>
              {formatAmount(item?.unitPrice)}
              {item?.currency ? ` ${item.currency}` : ''}
            </b>
          </span>
          {prompt.mapping?.sbsCode && (
            <span>
              <Translate>SBS</Translate> <b>{prompt.mapping.sbsCode}</b>
            </span>
          )}
        </div>
        <p className="price-list-prompt-hint">
          <Translate>{hint}</Translate>
        </p>
      </div>

      {missingCount > 0 && (
        <div className="price-list-prompt-toolbar">
          <span>
            {selectedCount} / {missingCount} <Translate>selected</Translate>
          </span>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="price-list-prompt-empty">
          <Translate>This item is not on any price list yet.</Translate>
        </div>
      ) : (
        <div className="price-list-prompt-list">
          {isManage ? (
            <>
              {linkedRows.length > 0 && (
                <div className="price-list-prompt-group">
                  <Translate>Linked</Translate> ({linkedRows.length})
                </div>
              )}
              {renderCards(linkedRows)}
              {missingRows.length > 0 && (
                <div className="price-list-prompt-group">
                  <Translate>Can be added</Translate> ({missingRows.length})
                </div>
              )}
              {renderCards(missingRows)}
            </>
          ) : (
            renderCards(rows)
          )}
        </div>
      )}

      <div className="price-list-prompt-footnote">
        <Translate>Lists the item is already on are changed or removed from Price List Setup.</Translate>
      </div>
    </div>
  );

  return (
    <MyModal
      open={prompt.open}
      setOpen={prompt.setOpen}
      title={<Translate>{isManage ? 'Price Lists' : 'Add to Price Lists'}</Translate>}
      icon={faTags}
      size="760px"
      bodyheight="auto"
      content={content}
      cancelButtonLabel={isManage ? 'Close' : 'Skip'}
      hideActionBtn={missingCount === 0}
      actionButtonLabel={
        selectedCount > 1 ? `Add to ${selectedCount} lists` : selectedCount === 1 ? 'Add to 1 list' : 'Add'
      }
      actionButtonFunction={prompt.submit}
      isDisabledActionBtn={selectedCount === 0 || prompt.isSaving}
      actionButtonLoading={prompt.isSaving}
    />
  );
};

export default PriceListPrompt;
