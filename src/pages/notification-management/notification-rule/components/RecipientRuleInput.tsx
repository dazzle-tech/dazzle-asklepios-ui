import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import { useEnumOptions } from '@/services/enumsApi';
import PlusIcon from '@rsuite/icons/Plus';
import TrashIcon from '@rsuite/icons/Trash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildRecipientRuleTypeOptions,
  isCustomRecipientRuleType,
  RECIPIENT_RULE_LABEL_OVERRIDES,
} from '../notificationTemplateValidation';

type RecipientRuleEntry = {
  id: string;
  ruleType: string;
  customValue: string;
};

const createEntryId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptyEntry = (): RecipientRuleEntry => ({
  id: createEntryId(),
  ruleType: '',
  customValue: '',
});

const parseRuleString = (rule?: string | null): RecipientRuleEntry[] => {
  if (!rule?.trim()) return [createEmptyEntry()];

  return rule.split(',').map(part => {
    const value = part.trim();
    if (value.startsWith('DATA:')) {
      return {
        id: createEntryId(),
        ruleType: 'DATA',
        customValue: value.slice('DATA:'.length).trim(),
      };
    }
    if (value.startsWith('STATIC:')) {
      return {
        id: createEntryId(),
        ruleType: 'STATIC',
        customValue: value.slice('STATIC:'.length).trim(),
      };
    }
    return {
      id: createEntryId(),
      ruleType: value,
      customValue: '',
    };
  });
};

const serializeRuleEntries = (entries: RecipientRuleEntry[]): string =>
  entries
    .map(entry => {
      if (!entry.ruleType) return '';

      if (entry.ruleType === 'DATA') {
        const value = entry.customValue.trim();
        return value ? `DATA:${value}` : '';
      }

      if (entry.ruleType === 'STATIC') {
        const value = entry.customValue.trim();
        return value ? `STATIC:${value}` : '';
      }

      return entry.ruleType;
    })
    .filter(Boolean)
    .join(',');

interface RecipientRuleInputProps {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  required?: boolean;
}

const RecipientRuleInput: React.FC<RecipientRuleInputProps> = ({
  label,
  value,
  onChange,
  required = false,
}) => {
  const recipientRuleEnumOptions = useEnumOptions('RecipientRule', {
    labelOverrides: RECIPIENT_RULE_LABEL_OVERRIDES,
  });
  const ruleTypeOptions = useMemo(
    () =>
      recipientRuleEnumOptions.length > 0
        ? recipientRuleEnumOptions
        : buildRecipientRuleTypeOptions(),
    [recipientRuleEnumOptions]
  );

  const lastEmittedValueRef = useRef(value ?? '');
  const [entries, setEntries] = useState<RecipientRuleEntry[]>(() => parseRuleString(value));

  useEffect(() => {
    const incoming = value ?? '';
    if (incoming === lastEmittedValueRef.current) return;
    lastEmittedValueRef.current = incoming;
    setEntries(parseRuleString(incoming));
  }, [value]);

  const serializedPreview = useMemo(() => serializeRuleEntries(entries), [entries]);

  const updateEntries = (nextEntries: RecipientRuleEntry[]) => {
    const serialized = serializeRuleEntries(nextEntries);
    lastEmittedValueRef.current = serialized;
    setEntries(nextEntries);
    onChange(serialized);
  };

  const updateEntry = (id: string, patch: Partial<RecipientRuleEntry>) => {
    updateEntries(entries.map(entry => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const addEntry = () => {
    updateEntries([...entries, createEmptyEntry()]);
  };

  const removeEntry = (id: string) => {
    const nextEntries = entries.filter(entry => entry.id !== id);
    updateEntries(nextEntries.length > 0 ? nextEntries : [createEmptyEntry()]);
  };

  return (
    <div className="recipient-rule-input">
      <MyLabel label={label} required={required} />

      <div className="recipient-rule-input__entries">
        {entries.map((entry, index) => {
          const rowRecord = {
            ruleType: entry.ruleType,
            customValue: entry.customValue,
          };

          return (
            <div key={entry.id} className="recipient-rule-input__row">
              <MyInput
                fieldName="ruleType"
                fieldType="select"
                fieldLabel="Recipient Rule"
                selectData={ruleTypeOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={rowRecord}
                setRecord={next => {
                  const ruleType = next.ruleType ?? '';
                  updateEntry(entry.id, {
                    ruleType,
                    customValue: isCustomRecipientRuleType(ruleType)
                      ? (next.customValue ?? entry.customValue)
                      : '',
                  });
                }}
                placeholder="Select recipient rule"
                showLabel={false}
                width="100%"
              />

              {entry.ruleType === 'DATA' && (
                <MyInput
                  fieldName="customValue"
                  fieldType="text"
                  fieldLabel="Data Field"
                  record={rowRecord}
                  setRecord={next =>
                    updateEntry(entry.id, { customValue: next.customValue ?? '' })
                  }
                  placeholder="e.g. practitionerEmail"
                  showLabel={false}
                  width="100%"
                />
              )}

              {entry.ruleType === 'STATIC' && (
                <MyInput
                  fieldName="customValue"
                  fieldType="text"
                  fieldLabel="Static Value"
                  record={rowRecord}
                  setRecord={next =>
                    updateEntry(entry.id, { customValue: next.customValue ?? '' })
                  }
                  placeholder="e.g. example@gmail.com"
                  showLabel={false}
                  width="100%"
                />
              )}

              <MyButton
                appearance="subtle"
                color="var(--primary-pink)"
                prefixIcon={TrashIcon}
                disabled={entries.length === 1 && index === 0 && !entry.ruleType}
                onClick={() => removeEntry(entry.id)}
              />
            </div>
          );
        })}
      </div>

      <div className="recipient-rule-input__add-btn">
        <MyButton appearance="ghost" size="sm" prefixIcon={PlusIcon} onClick={addEntry}>
          Add Rule
        </MyButton>
      </div>

      {serializedPreview && (
        <div className="recipient-rule-input__preview">
          <span className="recipient-rule-input__preview-label">Saved as:</span>
          <code>{serializedPreview}</code>
        </div>
      )}

      <div className="recipient-rule-input__hint">
        Choose a predefined rule, or select <strong>Data Field</strong> / <strong>Static Value</strong> and
        enter the value after the prefix (for example <code>DATA: practitionerEmail</code> or{' '}
        <code>STATIC: sondos@gmail.com</code>).
      </div>
    </div>
  );
};

export default RecipientRuleInput;
