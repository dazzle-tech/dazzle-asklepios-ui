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
import {
  useGetActiveDentalToothNumberingMethodsQuery,
  useGetAllDentalToothNumberingMethodsQuery
} from '@/services/setup/dental-tooth-numbering/dentalToothNumberingService';
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

  // Built-in systems stay as-is; active custom methods are offered alongside them.
  const { data: activeMethods = [], isSuccess: activeMethodsLoaded } =
    useGetActiveDentalToothNumberingMethodsQuery();
  // Same arguments as the Dental Chart Setup list, so this reuses its cache entry.
  const { data: allMethods } = useGetAllDentalToothNumberingMethodsQuery({
    page: 0,
    size: 500,
    sort: 'name,asc'
  });
  const methodId = rule?.numberingMethodId ?? null;
  const selectedMethod = methodId
    ? activeMethods.find((m: any) => m.id === methodId) ??
      (allMethods?.data ?? []).find((m: any) => m.id === methodId) ??
      null
    : null;
  const methodIsInactive =
    activeMethodsLoaded && !!methodId && !activeMethods.some((m: any) => m.id === methodId);
  const numberingOptions = [
    ...NUMBERING_SYSTEM_OPTIONS,
    ...activeMethods.map((m: any) => ({ label: m.name, value: `METHOD:${m.id}` })),
    // A saved reference stays visible and is preserved when unrelated fields are edited, even if its
    // method is now inactive; choosing a different method requires an active one.
    ...(methodIsInactive
      ? [{ label: `${selectedMethod?.name ?? `Method #${methodId}`} (inactive)`, value: `METHOD:${methodId}` }]
      : [])
  ];
  const numberingChoice = {
    numberingChoice: methodId ? `METHOD:${methodId}` : rule?.numberingSystem || 'UNIVERSAL'
  };

  // Only the numbering fields change; the selected teeth are never touched.
  const handleNumberingChange = (updated: { numberingChoice?: string }) => {
    const value = updated.numberingChoice || 'UNIVERSAL';
    if (value.startsWith('METHOD:')) {
      setRule((prev: any) => ({
        ...prev,
        numberingMethodId: Number(value.replace('METHOD:', '')),
        numberingSystem: 'UNIVERSAL'
      }));
    } else {
      setRule((prev: any) => ({ ...prev, numberingMethodId: null, numberingSystem: value }));
    }
  };

  const handleChartTypeChange = (updated: any) => {
    const nextType = updated.chartType;
    const prevType = rule?.chartType;
    if (nextType && nextType !== prevType) {
      setRule((prev: any) => ({
        ...prev,
        ...updated,
        toothNumbers: defaultToothIdsForChartType(nextType)
      }));
      return;
    }
    setRule((prev: any) => ({ ...prev, ...updated }));
  };

  const handleToothNumbersChange = (
    updater: string[] | ((prev: string[]) => string[])
  ) => {
    setRule((prev: any) => {
      const current = Array.isArray(prev?.toothNumbers) ? prev.toothNumbers : [];
      const next =
        typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, toothNumbers: next };
    });
  };

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <p className="dental-chart-setup-hint">
              Ages are in completed years. Age From is inclusive; Age To is exclusive.
              Leave Age To empty for an open-ended range.
              {rule?.chartType === 'MIXED'
                ? ' For Mixed, use the + at each end of an arch and × to configure the inventory (max 16 per arch, 32 total);'
                : ' Click teeth to select them;'}{' '}
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
              fieldName="numberingChoice"
              fieldLabel="Tooth Numbering System"
              fieldType="select"
              selectData={numberingOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={numberingChoice}
              setRecord={handleNumberingChange}
              searchable={false}
            />
            {methodIsInactive && (
              <p className="dental-chart-setup-hint">
                This numbering method is inactive. The reference is kept, but new charts from this rule use
                the built-in numbering until the method is reactivated or another one is selected.
              </p>
            )}
            {rule?.chartType && (
              <SetupToothSelector
                chartType={rule.chartType}
                numberingSystem={rule.numberingSystem}
                numberingLabels={selectedMethod?.toothLabels ?? null}
                selectedToothIds={selectedIds}
                onChange={handleToothNumbersChange}
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
