import React, { useMemo, useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Form } from 'rsuite';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
type FormType = {
  medicationId?: number | string;
  medicationClass?: string;
  isHighAlert?: string;
  instructions?: string;
};
import './styles.less';

const UccMedicationOrderAddModal = ({ open, setOpen, onAdd }) => {
  const dispatch = useAppDispatch();

const [form, setForm] = useState<FormType>({});

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
      size="23vw"
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
                      fieldType="text"
                      fieldLabel="Medication Class"
                      fieldName="medicationClass"
                      record={form}
                      setRecord={setForm}
                      disabled
                    />
                    <MyInput
                      fieldType="text"
                      fieldLabel="High Risk Med"
                      fieldName="isHighAlert"
                      record={form}
                      setRecord={setForm}
                      disabled
                    />
                      </div>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldLabel="INSTRUCTIONS"
                      fieldName="instructions"
                      record={form}
                      setRecord={setForm}
                    />
          </Form>
        </div>
      }
    />
  );
};

export default UccMedicationOrderAddModal;