import React, { useMemo, useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Form } from 'rsuite';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { RadioGroup, Radio } from 'rsuite';


type FormType = {
  medicationId?: number | string;
  medicationClass?: string;
  isHighAlert?: string;
  instructions?: string;
  instructionType?: 'MANUAL' | 'CUSTOM';
  predefinedInstruction?: string;
  customInstruction?: string;
};

import './styles.less';
import Instructions from '../prescription-new/Instructions';

const UccMedicationOrderAddModal = ({ open, setOpen, onAdd }) => {
  const dispatch = useAppDispatch();

const [form, setForm] = useState<FormType>({});

const [selectedOption, setSelectedOption] = useState(null);
const [customeinst, setCustomeinst] = useState({
  dose: null,
  unit: null,
  frequency: null,
  roa: null
});
const [inst, setInst] = useState(null);

const { data: activeIngredientsAll } = useGetActiveIngredientsQuery({
  page: 0,
  size: 1000
});

const { data: medClassList } = useGetAllMedicationCategoriesClassesQuery({});

const options = useMemo(() => {
  const list = activeIngredientsAll?.data || [];

  return list
    .filter(item => item?.isActive)
    .map(item => ({
      label: item?.name,
      value: item?.id,
      raw: item
    }));
}, [activeIngredientsAll]);


  useEffect(() => {
    const selected = options.find(
      o => String(o.value) === String(form.medicationId)
    )?.raw;

    if (selected) {
      const medClass = medClassList?.find(
        c => c.id === selected?.drugClassId
      );

      setForm(prev => ({
        ...prev,
        medicationClass: medClass?.name || '',
        isHighAlert: selected?.highRiskMed ? 'Yes' : 'No'
      }));
    } else {
      // 🔥 مهم جدًا
      setForm(prev => ({
        ...prev,
        medicationClass: '',
        isHighAlert: ''
      }));
    }
  }, [form.medicationId, options, medClassList]);

// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Add Medication</Translate>}
      actionButtonLabel="Save"
      actionButtonFunction={() =>{}}
      position="right"
      size="33vw"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Form fluid dir={dir}>
            
                    <MyInput
                      width="100%"
                      fieldType="select"
                      fieldLabel="ACTIVE_INGREDIENT"
                      fieldName="medicationId"
                      selectData={options}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={form}
                      setRecord={setForm}
                    />
                      <div className="add-medication-info-container"> 
                    <MyInput
                      width="14.5vw"
                      fieldType="text"
                      fieldLabel="Medication Class"
                      fieldName="medicationClass"
                      record={form}
                      setRecord={setForm}
                      disabled
                    />
                    <MyInput
                      width="14.5vw"
                      fieldType="text"
                      fieldLabel="High Risk Med"
                      fieldName="isHighAlert"
                      record={form}
                      setRecord={setForm}
                      disabled
                    />
                      </div>

                      <div className="prescription-radio-group">
                        <RadioGroup
                          value={selectedOption}
                          inline
                          onChange={(value) => {
                            setSelectedOption(value);
                          }}
                        >
                          <Radio value="MANUAL_INSTRUCTIONS">Manual Instructions</Radio>
                          <Radio value="CUSTOM_INSTRUCTIONS">Custom Instructions</Radio>
                        </RadioGroup>
                      </div>


                      <Instructions
                        selectedOption={selectedOption}
                        setCustomeinst={setCustomeinst}
                        customeinst={customeinst}
                        selectedGeneric={null}
                        setInst={setInst}
                        prescriptionMedication={{ instructions: inst }}
                      />


          </Form>
        </div>
      }
    />
  );
};

export default UccMedicationOrderAddModal;