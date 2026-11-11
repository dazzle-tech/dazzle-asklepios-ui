import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import React from 'react';
import { Form } from 'rsuite';
import { FaTeeth } from 'react-icons/fa6';
import {
  NUMBERING_SYSTEM_OPTIONS,
  defaultToothIdsForChartType
} from '@/utils/toothNumberingSystems';
import SetupToothSelector from './SetupToothSelector';
import './styles.less';

const chartTypeOptions = [
  { label: 'Adult', value: 'ADULT' },
  { label: 'Pediatric', value: 'CHILD' },
  { label: 'Mixed', value: 'MIXED' }
];

const AddEditDentalChartAgeRule = ({
  open,
  setOpen,
  width,
  rule,
  setRule,
  handleSave
}) => {
  const selectedIds: string[] = Array.isArray(rule?.toothNumbers)
    ? rule.toothNumbers
    : [];

  const handleChartTypeChange = (updated: any) => {
    const nextType = updated.chartType;
    const prevType = rule?.chartType;
    if (nextType && nextType !== prevType) {
      setRule({
        ...updated,
        toothNumbers: defaultToothIdsForChartType(nextType)
      });
      return;
    }
    setRule(updated);
  };

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <p className="dental-chart-setup-hint">
              Ages are in completed years. Age From is inclusive; Age To is exclusive.
              Leave Age To empty for an open-ended range. Click teeth to select them;
              changing the numbering system only updates labels.
            </p>
            <MyInput width="100%" fieldName="name" fieldLabel="Name" record={rule} setRecord={setRule} />
            <MyInput
              width="100%"
              fieldName="ageFrom"
              fieldLabel="Age From (years, inclusive)"
              fieldType="number"
              record={rule}
              setRecord={setRule}
            />
            <MyInput
              width="100%"
              fieldName="ageTo"
              fieldLabel="Age To (years, exclusive, optional)"
              fieldType="number"
              record={rule}
              setRecord={setRule}
            />
            <MyInput
              width="100%"
              fieldName="chartType"
              fieldLabel="Chart Type"
              fieldType="select"
              selectData={chartTypeOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={rule}
              setRecord={handleChartTypeChange}
              searchable={false}
            />
            <MyInput
              width="100%"
              fieldName="numberingSystem"
              fieldLabel="Tooth Numbering System"
              fieldType="select"
              selectData={NUMBERING_SYSTEM_OPTIONS}
              selectDataLabel="label"
              selectDataValue="value"
              record={rule}
              setRecord={setRule}
              searchable={false}
            />
            {rule?.chartType && (
              <SetupToothSelector
                chartType={rule.chartType}
                numberingSystem={rule.numberingSystem}
                selectedToothIds={selectedIds}
                onChange={toothNumbers => setRule({ ...rule, toothNumbers })}
              />
            )}
            <MyInput
              width="100%"
              fieldName="isActive"
              fieldLabel="Active"
              fieldType="checkbox"
              record={rule}
              setRecord={setRule}
            />
          </Form>
        );
      default:
        return null;
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={rule?.id ? 'Edit Dental Chart Rule' : 'New Dental Chart Rule'}
      position="right"
      content={stepNumber => <div dir={dir}>{conjureFormContent(stepNumber)}</div>}
      actionButtonLabel={rule?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Dental Chart Setup', icon: <FaTeeth /> }]}
      size={width > 900 ? '56vw' : width > 600 ? '72vw' : '92vw'}
    />
  );
};

export default AddEditDentalChartAgeRule;
