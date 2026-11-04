import React, { useMemo, useState } from 'react';
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

  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];

    if (options.length && typeof options[0] === 'string') {
      return options.map(v => ({ value: v, label: v }));
    }

    return options;
  }, [options]);

  const valueKey = optionValue || 'value';
  const labelKey = optionLabel || 'label';

  const values = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          String(object ?? '')
            .split(separator)
            .map(value => value.trim())
            .filter(Boolean)
        )
      ),
    [object, separator]
  );

  const findLabel = (value: string) => {
    const option = normalizedOptions.find(
      (item: any) => String(item[valueKey]) === value
    );

    return option ? String(option[labelKey]) : value;
  };

  const handleSelect = (record: any) => {
    setSelected({ item: null });

    if (disabled) return;

    const item = record?.item;
    if (item === null || item === undefined || item === '') return;

    const value = String(item).trim();
    if (!value || values.includes(value)) return;

    setObject([...values, value].join(separator));
  };

  const removeTag = (value: string) => {
    if (disabled) return;

    setObject(values.filter(item => item !== value).join(separator));
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
        setRecord={handleSelect}
        disabled={disabled}
      />

      <div className="multi-select-tags-container">
        <TagGroup>
          {values.map(value => (
            <Tag
              key={value}
              closable={!disabled}
              onClose={() => removeTag(value)}
            >
              {findLabel(value)}
            </Tag>
          ))}
        </TagGroup>
      </div>
    </div>
  );
};

export default MultiSelectAppender;