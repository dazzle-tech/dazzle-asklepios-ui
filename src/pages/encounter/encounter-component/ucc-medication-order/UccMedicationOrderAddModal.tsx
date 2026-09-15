import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Form, RadioGroup, Radio } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './styles.less';
import {
  newActiveIngredient,
  newPatientUccMedicationOrder
} from '@/types/model-types-constructor-new';
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
    frequencyNumber: '',
    frequencyUnit: null,
    duration: '',
    startTime: new Date().toTimeString().slice(0, 5),
    roa: null
  };

  const [record, setRecord] = useState<any>({ ...emptyRecord });

  const [selectedActiveIngredient, setSelectedActiveIngredient] = useState({
    ...newActiveIngredient,
    drugClassName: ''
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

console.log('unitLov', unitLov);

  const roaOptions = useEnumOptions('RouteOfAdministration');

  const { data: classData } = useGetMedicationCategoryClassByClassIdQuery(
    selectedActiveIngredient?.drugClassId,
    { skip: !selectedActiveIngredient?.drugClassId }
  );

  // ================= effects =================
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
      setSelectedActiveIngredient({
        ...newActiveIngredient,
        drugClassName: ''
      });
      return;
    }

    const selected = activeIngredientsAll?.data?.find(
      o => o.id === record.activeIngredientId
    );

    if (!selected) {
      setSelectedActiveIngredient({
        ...newActiveIngredient,
        drugClassName: ''
      });
      return;
    }

    setSelectedActiveIngredient({
      ...selected,
      drugClassName: ''
    });
  }, [record.activeIngredientId, activeIngredientsAll?.data]);

  // ================= save =================
  const handleSave = () => {
    if (!record.activeIngredientId) {
      dispatch(
        notify({
          msg: 'Please select active ingredient',
          sev: 'warning'
        })
      );
      return;
    }

    if (!patient?.id || !encounter?.id) {
      dispatch(
        notify({
          msg: 'Missing patient or encounter',
          sev: 'warning'
        })
      );
      return;
    }

    let finalInstruction = record.instructionText;

    if (selectedOption === 'MANUAL_INSTRUCTIONS') {
      if (!record.instructionText?.trim()) {
        dispatch(
          notify({
            msg: 'Please enter instructions',
            sev: 'warning'
          })
        );
        return;
      }
    }

    if (selectedOption === 'CUSTOM_INSTRUCTIONS') {
      const missing: string[] = [];

      if (!record?.dose) missing.push('Dose');
      if (!record?.unit) missing.push('Unit');
      if (!record?.frequencyNumber) missing.push('Frequency Number');
      if (!record?.frequencyUnit) missing.push('Frequency Unit');
      if (!record?.duration) missing.push('Duration');
      if (!record?.startTime) missing.push('Start Time');
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

      if (Number(record.dose) <= 0) {
        dispatch(
          notify({
            msg: 'Dose must be greater than 0',
            sev: 'warning'
          })
        );
        return;
      }

      if (Number(record.frequencyNumber) <= 0) {
        dispatch(
          notify({
            msg: 'Frequency Number must be greater than 0',
            sev: 'warning'
          })
        );
        return;
      }

      if (Number(record.duration) <= 0) {
        dispatch(
          notify({
            msg: 'Duration must be greater than 0',
            sev: 'warning'
          })
        );
        return;
      }

      finalInstruction = [
        record.dose,
        record.unit,
        `${record.frequencyNumber} ${record.frequencyUnit}`,
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
      dose: record?.dose ? Number(record.dose) : null,
      doseUnit: record?.unit || null,
      route: record?.roa || null,

      frequencyNumber:
        selectedOption === 'CUSTOM_INSTRUCTIONS'
          ? Number(record.frequencyNumber)
          : null,

      frequencyUnit:
        selectedOption === 'CUSTOM_INSTRUCTIONS'
          ? record.frequencyUnit
          : null,

      duration:
        selectedOption === 'CUSTOM_INSTRUCTIONS'
          ? Number(record.duration)
          : null,

      startTime:
        selectedOption === 'CUSTOM_INSTRUCTIONS'
          ? record.startTime
          : null
    };

    try {
      if (editRow?.id) {
        onAdd({
          ...payload,
          id: editRow.id,
          isEdit: true
        });
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

  const dir =
    (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  // ================= edit =================
  useEffect(() => {
    if (!editRow) return;

    setRecord({
      ...emptyRecord,
      activeIngredientId: editRow.activeIngredientId ?? null,
      instructionText: editRow.instructionText ?? '',
      dose: editRow.dose ?? '',
      unit: editRow.doseUnit ?? null,
      frequencyNumber: editRow.frequencyNumber ?? '',
      frequencyUnit: editRow.frequencyUnit ?? null,
      duration: editRow.duration ?? '',
      startTime: editRow.startTime ?? '',
      roa: editRow.route ?? null
    });

    setSelectedOption(
      editRow.instructionType || 'MANUAL_INSTRUCTIONS'
    );
  }, [editRow, open]);

  useEffect(() => {
    if (!open) {
      setRecord({ ...emptyRecord });
      setSelectedOption('MANUAL_INSTRUCTIONS');
    }
  }, [open]);

  // ================= render =================
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        <Translate>
          {editRow
            ? 'Edit UCC medication order'
            : 'Add UCC medication order'}
        </Translate>
      }
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
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

            {/* Instruction Type */}
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
              <div className="custom-instruction-container">

                <MyInput
                  width="12vw"
                  fieldType="number"
                  fieldName="dose"
                  fieldLabel="Dose"
                  record={record}
                  setRecord={setRecord}
                  required
                />

                    <MyInput
                      width="12vw"
                      fieldType="select"
                      fieldLabel="Unit"
                      selectData={unitLov?.object || []}
                       selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                      selectDataValue="key"
                      fieldName="unit"
                      record={record}
                      setRecord={setRecord}
                      required
                    />

                <MyInput
                  width="12vw"
                  fieldType="number"
                  fieldName="frequencyNumber"
                  fieldLabel="Frequency Number"
                  record={record}
                  setRecord={setRecord}
                  required
                />

                <MyInput
                  width="12vw"
                  fieldType="select"
                  fieldLabel="Frequency Unit"
                  selectData={[
                    {
                      value: 'MINUTES',
                      label: 'Minutes'
                    },
                    {
                      value: 'HOURS',
                      label: 'Hours'
                    }
                  ]}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="frequencyUnit"
                  record={record}
                  setRecord={setRecord}
                  required
                />

                <MyInput
                  width="12vw"
                  fieldType="number"
                  fieldName="duration"
                  fieldLabel="Duration"
                  record={record}
                  setRecord={setRecord}
                  required
                />

                <MyInput
                  width="12vw"
                  fieldType="time"
                  fieldName="startTime"
                  fieldLabel="Start Time"
                  record={record}
                  setRecord={setRecord}
                  required
                />

                <MyInput
                  width="12vw"
                  fieldType="select"
                  fieldLabel="ROA"
                  selectData={roaOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="roa"
                  record={record}
                  setRecord={setRecord}
                  required
                />

              </div>
            )}

          </Form>
        </div>
      }
    />
  );
};

export default UccMedicationOrderAddModal;