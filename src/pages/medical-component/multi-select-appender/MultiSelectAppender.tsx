import React, { useEffect, useMemo, useState } from 'react';
import { Col, Form, Input, Row } from 'rsuite';
import MyInput from '@/components/MyInput';


const MultiSelectAppender = ({
  label = 'Select',
  options = [],
  optionLabel,
  optionValue,
  setObject,
  object,
  storeMode = 'value',
  displayMode = 'label',
  separator = ', ',
  disabled = false,
  dedupe = true
}) => {
  const [selected, setSelected] = useState<{ item: any }>({ item: null });
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const detectMapping = (opts: any[]) => {
    const first = Array.isArray(opts) ? opts.find(Boolean) : null;
    if (!first || typeof first !== 'object') return { valueKey: 'value', labelKey: 'label' };

    // LOV shape
    if ('key' in first && 'lovDisplayVale' in first) return { valueKey: 'key', labelKey: 'lovDisplayVale' };

    // Enum shape
    if ('value' in first && 'label' in first) return { valueKey: 'value', labelKey: 'label' };

    // Fallback
    return { valueKey: 'value', labelKey: 'label' };
  };

  const normalizedOptions = useMemo(() => {
    if (options && !Array.isArray(options) && typeof options === 'object') {
      return Object.keys(options).map(k => ({ value: k, label: String(options[k] ?? k) }));
    }

    if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'string') {
      return (options as any[]).map(v => ({ value: v, label: v }));
    }

    return Array.isArray(options) ? options : [];
  }, [options]);

  const { valueKey, labelKey } = useMemo(() => {
    const detected = detectMapping(normalizedOptions);
    return {
      valueKey: optionValue ?? detected.valueKey,
      labelKey: optionLabel ?? detected.labelKey
    };
  }, [normalizedOptions, optionLabel, optionValue]);

  const parseCsv = (csv: string) =>
    (csv || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const joinCsv = (arr: string[]) => (arr || []).filter(Boolean).join(separator);

  const findOptionByValue = (val: string) =>
    normalizedOptions.find((opt: any) => String(opt?.[valueKey]) === String(val));

  // init from stored CSV once
  useEffect(() => {
    if (object && selectedValues.length === 0) {
      setSelectedValues(parseCsv(object));
    }
  }, [object]);

  // push to parent object (storeMode)
  useEffect(() => {
    if (storeMode === 'label') {
      const labels = selectedValues
        .map(v => {
          const opt = findOptionByValue(v);
          return String(opt?.[labelKey] ?? v);
        })
        .filter(Boolean);
      setObject(joinCsv(labels));
    } else {
      // default: store values (key/value)
      setObject(joinCsv(selectedValues));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValues, storeMode, valueKey, labelKey, separator]);

  // append on select
  useEffect(() => {
    if (selected?.item == null) return;

    const raw = String(selected.item);
    setSelectedValues(prev => {
      if (!dedupe) return [...prev, raw];
      return prev.includes(raw) ? prev : [...prev, raw];
    });

    setSelected({ item: null });
  }, [selected?.item, dedupe]);

  // textarea value (displayMode)
  const displayText = useMemo(() => {
    if (displayMode === 'value') return joinCsv(selectedValues);

    const labels = selectedValues
      .map(v => {
        const opt = findOptionByValue(v);
        return String(opt?.[labelKey] ?? v);
      })
      .filter(Boolean);

    return joinCsv(labels);
  }, [selectedValues, displayMode, labelKey, valueKey, separator, normalizedOptions]);

  return (
    <Form fluid>
      <Col md={24}>
        <Row>
          <MyInput
            width="100%"
            fieldType="select"
            fieldLabel={label}
            selectData={normalizedOptions}
            selectDataLabel={labelKey}
            selectDataValue={valueKey}
            fieldName="item"
            record={selected}
            setRecord={setSelected}
            disabled={disabled}
          />
        </Row>

        <Row>
          <Input
            as="textarea"
            value={displayText}
            rows={3}
            readOnly
            style={{ width: '100%', marginTop: '6px' }}
          />
        </Row>
      </Col>
    </Form>
  );
};

export default MultiSelectAppender;
