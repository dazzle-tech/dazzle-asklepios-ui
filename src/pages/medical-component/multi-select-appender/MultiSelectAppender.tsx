import React, { useEffect, useMemo, useState } from 'react';
import { Tag, TagGroup } from 'rsuite';
import MyInput from '@/components/MyInput';
import './styles.less';

const MultiSelectAppender = ({
  label = 'Select',
  options = [],
  optionLabel,
  optionValue,
  setObject,
  object,
  separator = ', ',
  disabled = false
}) => {
  const [selected, setSelected] = useState({ item: null });
  const [values, setValues] = useState<string[]>([]);

  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    if (options.length && typeof options[0] === 'string') {
      return options.map(v => ({ value: v, label: v }));
    }
    return options;
  }, [options]);

  const valueKey = optionValue || 'value';
  const labelKey = optionLabel || 'label';

  const parseCsv = (text: string) =>
    (text || '')
      .split(separator)
      .map(s => s.trim())
      .filter(Boolean);

  const joinCsv = (arr: string[]) => (arr || []).filter(Boolean).join(separator);

  const findLabel = (val: string) => {
    const opt = normalizedOptions.find((o: any) => String(o[valueKey]) === String(val));
    return opt ? String(opt[labelKey]) : val;
  };

  useEffect(() => {
    if (!object) return;
    setValues(parseCsv(object));
  }, [object]);

  useEffect(() => {
    setObject(joinCsv(values));
  }, [values]);

  useEffect(() => {
    if (!selected?.item) return;
    const raw = String(selected.item);
    setValues(prev => {
      if (prev.includes(raw)) return prev;
      return [...prev, raw];
    });
    setSelected({ item: null });
  }, [selected?.item]);

  const removeTag = (value: string) => {
    setValues(prev => prev.filter(v => v !== value));
  };

  return (
    <div className="margin-bottom-00">
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
      <div className="multi-select-tags-container">
        <TagGroup>
          {values.map(v => (
            <Tag key={v} closable={!disabled} onClose={() => removeTag(v)}>
              {findLabel(v)}
            </Tag>
          ))}
        </TagGroup>
      </div>
    </div>
  );
};

export default MultiSelectAppender;
