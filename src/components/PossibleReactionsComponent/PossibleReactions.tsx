import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Button, Whisper, Tooltip, Stack, Text } from 'rsuite';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import CheckIcon from '@rsuite/icons/Check';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import './styles.less';

type Props = {
  object: any;
  setOpject: (next: any | ((prev: any) => any)) => void;
  fieldName: string; // e.g., 'possibleReactions' -> STORED AS STRING
  label?: string;
  disabled?: boolean;
};

// Accept English & Arabic commas + new lines
const DELIMS = /[,،\n]+/g;
const SEPARATOR = ', ';

const PossibleReactions: React.FC<Props> = ({
  object,
  setOpject,
  fieldName,
  label,
  disabled
}) => {
  const [isTextareaEditable, setIsTextareaEditable] = useState(false);
  const [localText, setLocalText] = useState(''); // the visible text while editing

  // Fetch enum options
  const hookResult: any = useEnumOptions('PossibleReaction');

  const options = useMemo(() => {
    const raw = Array.isArray(hookResult) ? hookResult : hookResult?.data ?? [];
    return (raw ?? []).map((o: any) => ({
      label: String(o?.label ?? o?.value ?? ''),
      value: String(o?.value ?? '')
    }));
  }, [hookResult]);

  // value<->label maps
  const valueToLabel = useMemo(() => new Map(options.map(o => [o.value, o.label])), [options]);
  const labelToValue = useMemo(
    () => new Map(options.map(o => [o.label.toLowerCase(), o.value])),
    [options]
  );

  // ---- String storage helpers ----

  // Get current stored string
  const storedString = String(object?.[fieldName] ?? '');

  // Turn VALUES array -> pretty "Label, Label, ..." text
  const valuesToPrettyText = (vals: string[]) =>
    vals.map(v => valueToLabel.get(v) || v).join(SEPARATOR);

  // Parse free text into VALUES array (accept label or value)
  const parseToValues = (raw: string): string[] => {
    const tokens = (raw ?? '')
      .split(DELIMS)
      .map(t => t.trim())
      .filter(Boolean);

    const next: string[] = [];
    for (const t of tokens) {
      const val = labelToValue.get(t.toLowerCase()) ?? t;
      if (!next.includes(val)) next.push(val);
    }
    return next;
  };

  // Convert current STORED STRING -> VALUES array (for MyInput selection reflecting)
  const selectedValuesForSelect: string[] = useMemo(() => {
    return parseToValues(storedString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedString, options]);

  // Keep localText synced from stored string when not actively editing
  useEffect(() => {
    if (!isTextareaEditable) {
      setLocalText(valuesToPrettyText(selectedValuesForSelect));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedString, isTextareaEditable]);

  // ---- Handlers ----

  // Text editing: keep raw text to preserve user spaces; keep object field as STRING
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value ?? '';
    setLocalText(raw);
    setOpject((prev: any) => ({ ...prev, [fieldName]: raw }));
  };

  // On blur: normalize the stored text to "Label, Label, ..."
  const handleBlur = () => {
    const values = parseToValues(localText);
    const pretty = valuesToPrettyText(values);
    setOpject((prev: any) => ({ ...prev, [fieldName]: pretty }));
    setLocalText(pretty);
  };

  // Selecting from MyInput: append to EXISTING (no duplicates) and store as STRING
  const handleSelectChange = (val: any) => {
    const picked = Array.isArray(val) ? val.map(String) : val ? [String(val)] : [];
    if (!picked.length) return;

    setOpject((prev: any) => {
      const currentRaw = String(prev?.[fieldName] ?? '');
      const currentValues = parseToValues(currentRaw);

      const set = new Set(currentValues);
      picked.forEach(v => set.add(v));

      const nextValues = Array.from(set);
      const pretty = valuesToPrettyText(nextValues);

      if (!isTextareaEditable) setLocalText(pretty);
      return { ...prev, [fieldName]: pretty }; // store as STRING
    });
  };

  const clearAll = () => {
    setOpject((prev: any) => ({ ...prev, [fieldName]: '' }));
    setLocalText('');
  };

  return (
    <div className="icd10-root possible-reactions-root">
      <Row>
        <Text>
          <Translate>{label ?? 'Possible Reactions'}</Translate>
        </Text>
        <Col md={24}>
          <div className="search-wrap">
            <MyInput
              width="100%"
              fieldLabel={''}
              fieldType="select"
              fieldName={fieldName}
              selectData={options}
              selectDataLabel="label"
              selectDataValue="value"
              // For the select UI, we pass the VALUES array; but storage remains STRING
              record={{ [fieldName]: selectedValuesForSelect }}
              setRecord={(rec: any) => handleSelectChange(rec[fieldName])}
              disabled={disabled}
              // If your MyInput needs a multi prop (e.g., isMulti or mode="multiple"), add it here.
              menuMaxHeight={300}
            />
          </div>
        </Col>
      </Row>

      {/* textarea */}
      <Row style={{ marginTop: 12 }}>
        <Col md={24}>
          <div className="indications-wrap">
            <div className="indications-editor">
              <textarea
                placeholder={'Add reactions separated by commas (Arabic comma supported), or one per line.'}
                value={localText}
                readOnly={!isTextareaEditable || !!disabled}
                disabled={!!disabled}
                className={`indications-textarea ${
                  (!isTextareaEditable && !disabled) ? 'readonly' : ''
                }`}
                onChange={handleTextChange}
                onBlur={handleBlur}
                onFocus={(e) => {
                  if (isTextareaEditable && !disabled) {
                    e.currentTarget.classList.add('focus');
                  }
                }}
              />
              {!!selectedValuesForSelect.length && (
                <div className="counter-badge">
                  {selectedValuesForSelect.length}{' '}
                  {selectedValuesForSelect.length === 1 ? 'reaction' : 'reactions'}
                </div>
              )}
            </div>

            <Stack direction="column" spacing={8}>
              <Whisper
                placement="left"
                speaker={<Tooltip><Translate>{isTextareaEditable ? 'Disable editing' : 'Enable editing'}</Translate></Tooltip>}
              >
                <Button
                  appearance={isTextareaEditable ? 'primary' : 'subtle'}
                  onClick={() => setIsTextareaEditable(!isTextareaEditable)}
                  disabled={!!disabled}
                  className={`toggle-edit ${isTextareaEditable ? 'on' : ''}`}
                  aria-label={isTextareaEditable ? 'Disable editing' : 'Enable editing'}
                >
                  <EditIcon />
                </Button>
              </Whisper>

              <Whisper
                placement="left"
                speaker={<Tooltip><Translate>Clear all Possible Reactions</Translate></Tooltip>}
              >
                <Button
                  appearance="primary"
                  color="red"
                  onClick={clearAll}
                  disabled={!!disabled || !storedString.trim()}
                  className={`clear-all ${storedString.trim() ? 'enabled' : 'disabled'}`}
                  aria-label="Clear all"
                >
                  <TrashIcon />
                </Button>
              </Whisper>
            </Stack>
          </div>

          <div className="tip">
            <CheckIcon className="tip-icon" />
            <span>
              <strong><Translate>Tip:</Translate></strong>{' '}
              <Translate>
                We store as a single string: selections are appended and shown as “Label, Label, …”. While typing, your spacing is preserved; on blur, we normalize the display.
              </Translate>
            </span>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PossibleReactions;
