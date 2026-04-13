import React, { useEffect, useMemo, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Form, RadioGroup, Radio, Row, Col } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './styles.less';
import Instructions from '../prescription-new/Instructions';

const UccMedicationOrderAddModal = ({
  open,
  setOpen,
  onAdd,
  encounter,
  patient
}) => {
  const dispatch = useAppDispatch();

  // ================= state =================
  const [record, setRecord] = useState<any>({
    activeIngredientId: null,
    medicationClass: '',
    isHighAlert: '',
    instructionText: '',
    dose: null,
    unit: null,
    frequency: null,
    roa: null
  });

  const [selectedOption, setSelectedOption] = useState<
    'MANUAL_INSTRUCTIONS' | 'CUSTOM_INSTRUCTIONS'
  >('MANUAL_INSTRUCTIONS');

  // ================= APIs =================
  const { data: activeIngredientsAll } = useGetActiveIngredientsQuery({
    page: 0,
    size: 1000
  });

  const { data: unitLov } = useGetLovValuesByCodeQuery('UOM');
  const { data: frequencyLov } = useGetLovValuesByCodeQuery('MED_FREQUENCY');

  // ================= options =================
  const options = useMemo(() => {
    const list = Array.isArray(activeIngredientsAll?.data)
      ? activeIngredientsAll.data
      : [];

    return list
      .filter(item => item?.isActive)
      .map(item => ({
        label: item?.name,
        value: Number(item?.id),
        raw: item
      }));
  }, [activeIngredientsAll]);

  // ================= AUTO FILL =================
  useEffect(() => {
    if (!record.activeIngredientId) return;

    const selected = options.find(
      o => o.value === record.activeIngredientId
    );

    if (!selected?.raw) return;

    const raw = selected.raw;

    setRecord(prev => ({
      ...prev,

      // ❌ ما في class name → بس id
      medicationClass: raw?.drugClassId
        ? `Class #${raw.drugClassId}`
        : '',

      // ✅ الصح
      isHighAlert: raw?.highRiskMed ? 'Yes' : 'No'
    }));
  }, [record.activeIngredientId, options]);

  // ================= SAVE =================
  const handleSave = () => {
    if (!record.activeIngredientId) {
      dispatch(notify({ msg: 'Please select active ingredient', sev: 'error' }));
      return;
    }

    if (!patient?.id || !encounter?.id) {
      dispatch(notify({ msg: 'Missing patient or encounter', sev: 'error' }));
      return;
    }

    let finalInstruction = record.instructionText;

    if (selectedOption === 'CUSTOM_INSTRUCTIONS') {
      finalInstruction = [
        record.dose,
        record.unit,
        record.frequency,
        record.roa
      ]
        .filter(Boolean)
        .join(', ');
    }

    if (!finalInstruction) {
      dispatch(notify({ msg: 'Please enter instructions', sev: 'error' }));
      return;
    }

      const payload = {
        patientId: patient.id,
        encounterId: encounter.id,
        activeIngredientId: record.activeIngredientId,
        instructionType: selectedOption,
        instructionText: finalInstruction,
        dose: record?.dose || null,
        doseUnit: record?.unit || null,
        frequency: record?.frequency || null,
        route: record?.roa || null,
        isHighAlert: record.isHighAlert === 'Yes'
      };

    try {
      onAdd(payload);

      dispatch(
        notify({
          msg: 'Medication added successfully',
          sev: 'success'
        })
      );

      setRecord({
        activeIngredientId: null,
        medicationClass: '',
        isHighAlert: '',
        instructionText: '',
        dose: null,
        unit: null,
        frequency: null,
        roa: null
      });

      setSelectedOption('MANUAL_INSTRUCTIONS');
      setOpen(false);
    } catch (e) {
      dispatch(
        notify({
          msg: 'Failed to add medication',
          sev: 'error'
        })
      );
    }
  };

  // ================= RTL =================
  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  // ================= UI =================
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Add Medication</Translate>}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Form fluid dir={dir}>

            {/* Active Ingredient */}
            <MyInput
              width="100%"
              fieldType="select"
              fieldLabel="Active Ingredient"
              fieldName="activeIngredientId"
              selectData={options}
              selectDataLabel="label"
              selectDataValue="value"
              record={record}
              setRecord={setRecord}
            />

            {/* Info */}
            <div className="add-medication-info-container">
              <MyInput
                width="14.5vw"
                fieldType="text"
                fieldLabel="Medication Class"
                fieldName="medicationClass"
                record={record}
                setRecord={setRecord}
                disabled
              />

              <MyInput
                width="14.5vw"
                fieldType="text"
                fieldLabel="High Risk Med"
                fieldName="isHighAlert"
                record={record}
                setRecord={setRecord}
                disabled
              />
            </div>

            {/* Radio */}
            <RadioGroup
              value={selectedOption}
              inline
              onChange={value => setSelectedOption(value)}
            >
              <Radio value="MANUAL_INSTRUCTIONS">Manual</Radio>
              <Radio value="CUSTOM_INSTRUCTIONS">Custom</Radio>
            </RadioGroup>

            {/* Manual */}
            {selectedOption === 'MANUAL_INSTRUCTIONS' && (
              <MyInput
                fieldName="instructionText"
                fieldType="textarea"
                fieldLabel="Instructions"
                record={record}
                setRecord={setRecord}
                width="100%"
                height={80}
              />
            )}

            {/* Custom */}
            {selectedOption === 'CUSTOM_INSTRUCTIONS' && (
              <Row gutter={16}>
                <Col md={6}>
                  <MyInput
                    fieldType="number"
                    fieldName="dose"
                    fieldLabel="Dose"
                    record={record}
                    setRecord={setRecord}
                  />
                </Col>

                <Col md={6}>
                  <MyInput
                    fieldType="select"
                    fieldLabel="Unit"
                    selectData={unitLov?.object || []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName="unit"
                    record={record}
                    setRecord={setRecord}
                  />
                </Col>

                <Col md={6}>
                  <MyInput
                    fieldType="select"
                    fieldLabel="Frequency"
                    selectData={frequencyLov?.object || []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName="frequency"
                    record={record}
                    setRecord={setRecord}
                  />
                </Col>

                <Col md={6}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="ROA"
                    fieldName="roa"
                    record={record}
                    setRecord={setRecord}
                  />
                </Col>
              </Row>
            )}
          </Form>
        </div>
      }
    />
  );
};

export default UccMedicationOrderAddModal;