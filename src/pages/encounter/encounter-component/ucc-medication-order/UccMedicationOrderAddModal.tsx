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
import { newActiveIngredient, newPatientUccMedicationOrder } from '@/types/model-types-constructor-new';
import { useGetMedicationCategoryClassByClassIdQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { useEnumOptions } from '@/services/enumsApi';
const UccMedicationOrderAddModal = ({
  open,
  setOpen,
  onAdd,
  encounter,
  patient,
  editRow
}) => {
  const dispatch = useAppDispatch();

  // ================= state =================
  const emptyRecord = {
    ...newPatientUccMedicationOrder,
    instructionText: '',
    dose: '',
    unit: null,
    frequency: null,
    roa: null,
  };

  const [record, setRecord] = useState<any>({ ...emptyRecord });
  const [selectedActiveIngredient, setSelectedActiveIngredient] = useState({
    ...newActiveIngredient,
    drugClassName: '',
  })
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
  const roaOptions = useEnumOptions("RouteOfAdministration");


  const { data: classData } = useGetMedicationCategoryClassByClassIdQuery(
    selectedActiveIngredient?.drugClassId,
    { skip: !selectedActiveIngredient?.drugClassId }
  );


  useEffect(() => {
    if (!selectedActiveIngredient?.drugClassId) {
      setSelectedActiveIngredient(prev => ({
        ...prev,
        drugClassName: ''
      }));
      return;
    }

    if (!classData) return;

    setSelectedActiveIngredient(prev => ({
      ...prev,
      drugClassName: classData.name
    }));
  }, [classData, selectedActiveIngredient?.drugClassId]);

  useEffect(() => {
    if (!record.activeIngredientId) {
      setSelectedActiveIngredient({ ...newActiveIngredient, drugClassName: '' });
      return;
    }

    const selected = activeIngredientsAll?.data?.find(
      o => o.id === record.activeIngredientId
    );

    if (!selected) {
      setSelectedActiveIngredient({ ...newActiveIngredient, drugClassName: '' });
      return;
    }

    setSelectedActiveIngredient({
      ...selected,
      drugClassName: '' // 🔥 reset مؤقت لحد ما API يرجع
    });
  }, [record.activeIngredientId, activeIngredientsAll?.data]);

  const handleSave = () => {
    if (!record.activeIngredientId) {
      dispatch(notify({ msg: 'Please select active ingredient', sev: 'warning' }));
      return;
    }

    if (!patient?.id || !encounter?.id) {
      dispatch(notify({ msg: 'Missing patient or encounter', sev: 'warning' }));
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
      dispatch(notify({ msg: 'Please enter instructions', sev: 'warning' }));
      return;
    }

    if (selectedOption === 'CUSTOM_INSTRUCTIONS') {
      const missing: string[] = [];

      if (!record?.dose) missing.push('Dose');
      if (!record?.unit) missing.push('Unit');
      if (!record?.frequency) missing.push('Frequency');
      if (!record?.roa) missing.push('ROA');

      if (missing.length > 0) {
        dispatch(
          notify({
            msg: `Please fill required fields:\n${missing.join(', ')}`,
            sev: 'warning'
          })
        );
        return;
      }

      finalInstruction = [
        record.dose,
        record.unit,
        record.frequency,
        record.roa
      ]
        .filter(Boolean)
        .join(', ');
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
    };

    try {
      if (editRow?.id) {
        onAdd({ ...payload, id: editRow.id, isEdit: true });
      } else {
        onAdd(payload);
      }

      setRecord({ ...emptyRecord });

      setSelectedOption('MANUAL_INSTRUCTIONS');
      setOpen(false);
    } catch (e) {
      dispatch(
        notify({
          msg: 'Failed to add medication',
          sev: 'warning'
        })
      );
    }
  };

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';


useEffect(() => {
  if (!editRow) return;

  setRecord({
    ...emptyRecord,
    activeIngredientId: editRow.activeIngredientId ?? null,
    instructionText: editRow.instructionText ?? '',
    dose: editRow.dose ?? '',
    unit: editRow.doseUnit ?? null,
    frequency: editRow.frequency ?? null,
    roa: editRow.route ?? null,
  });

  setSelectedOption(editRow.instructionType || 'MANUAL_INSTRUCTIONS');
}, [editRow, open]);

useEffect(() => {
  if (!open) {
    setRecord({ ...emptyRecord });
    setSelectedOption('MANUAL_INSTRUCTIONS');
  }
}, [open]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        <Translate>
          {editRow ? 'Edit Medication' : 'Add Medication'}
        </Translate>
      }
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
              selectData={activeIngredientsAll?.data ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={record}
              setRecord={setRecord}
              required
            />

            <div className="add-medication-info-container">
              <MyInput
                width="14.5vw"
                fieldType="text"
                fieldLabel="Medication Class"
                fieldName="drugClassName"
                record={selectedActiveIngredient}
                setRecord={setSelectedActiveIngredient}
                disabled
              />

              <MyInput
                width="14.5vw"
                fieldType="checkbox"
                fieldLabel="High Alert"
                fieldName="highAlert"
                record={selectedActiveIngredient}
                setRecord={setSelectedActiveIngredient}
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
                required
              />
            )}

            {/* Custom */}
            {selectedOption === 'CUSTOM_INSTRUCTIONS' && (
              <div style={{ marginTop: 10 }}>
                <Row gutter={16}>

                  <Col md={6}>
                    <MyInput
                      fieldType="number"
                      fieldName="dose"
                      fieldLabel="Dose"
                      record={record}
                      setRecord={setRecord}
                      required
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
                      required
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
                      required
                    />
                  </Col>

                  <Col md={6}>
                    <MyInput
                      fieldType="select" // 🔥 بدل text خليها select زي النظام
                      fieldLabel="ROA"
                      selectData={roaOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      fieldName="roa"
                      record={record}
                      setRecord={setRecord}
                      required
                    />
                  </Col>
                </Row>
              </div>
            )}
          </Form>
        </div>
      }
    />
  );
};


export default UccMedicationOrderAddModal;