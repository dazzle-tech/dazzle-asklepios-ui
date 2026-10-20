import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FaClock } from 'react-icons/fa';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import {
  MedFrequencySetup,
  useCreateMedFrequencySetupMutation,
  useUpdateMedFrequencySetupMutation
} from '@/services/setup/med-frequency-setup/medFrequencySetupService';
import './styles.less';

const SETUP_ERROR_MAP: Record<string, string> = {
  frequencyexists: 'A setup already exists for this frequency.',
  statnotallowed: 'STAT is a single immediate dose and cannot be split.',
  frequencynumberinvalid: 'Frequency Number must be at least 1.',
  notfound: 'Frequency setup not found.'
};

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  width: number;
  setup: MedFrequencySetup;
  setSetup: (v: MedFrequencySetup) => void;
};

const AddEditMedFrequencySetup = ({ open, setOpen, width, setup, setSetup }: Props) => {
  const dispatch = useAppDispatch();

  const medFrequencyOptions = useEnumOptions('MedFrequency');
  const frequencyUnitOptions = useEnumOptions('FrequencyList');

  const [createSetup, { isLoading: isCreating }] = useCreateMedFrequencySetupMutation();
  const [updateSetup, { isLoading: isUpdating }] = useUpdateMedFrequencySetupMutation();

  // STAT is never split
  const frequencyOptions = useMemo(
    () => (medFrequencyOptions ?? []).filter(option => option.value !== 'STAT'),
    [medFrequencyOptions]
  );

  const handleSave = async () => {
    const missing: string[] = [];
    if (!setup?.frequency) missing.push('Frequency');
    if (!setup?.frequencyNumber) missing.push('Frequency Number');
    if (!setup?.frequencyUnit) missing.push('Frequency Unit');

    if (missing.length > 0) {
      dispatch(notify({ msg: `Please fill required fields:\n${missing.join(', ')}`, sev: 'warning' }));
      return;
    }

    if (Number(setup.frequencyNumber) < 1) {
      dispatch(notify({ msg: 'Frequency Number must be at least 1', sev: 'warning' }));
      return;
    }

    const body = {
      frequency: setup.frequency as string,
      frequencyNumber: Number(setup.frequencyNumber),
      frequencyUnit: setup.frequencyUnit as string
    };

    try {
      if (setup?.id) {
        await updateSetup({ id: setup.id, ...body }).unwrap();
        dispatch(notify({ msg: 'Frequency setup updated successfully', sev: 'success' }));
      } else {
        await createSetup(body).unwrap();
        dispatch(notify({ msg: 'Frequency setup created successfully', sev: 'success' }));
      }
      setOpen(false);
    } catch (err: any) {
      const key = String(err?.data?.message ?? '').replace(/^error\./, '');
      dispatch(
        notify({
          msg: SETUP_ERROR_MAP[key] || err?.data?.detail || err?.data?.title || 'Failed to save frequency setup',
          sev: 'error'
        })
      );
    }
  };

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  const content = () => (
    <Form fluid dir={dir}>
      <MyInput
        width="100%"
        fieldType="select"
        fieldName="frequency"
        fieldLabel="Frequency"
        selectData={frequencyOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={setup}
        setRecord={setSetup}
        required
      />

      <div className="med-frequency-setup-fields">
        <MyInput
          width="100%"
          fieldType="number"
          fieldName="frequencyNumber"
          fieldLabel="Frequency Number"
          record={setup}
          setRecord={setSetup}
          required
        />

        <MyInput
          width="100%"
          fieldType="select"
          fieldName="frequencyUnit"
          fieldLabel="Frequency Unit"
          selectData={frequencyUnitOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={setup}
          setRecord={setSetup}
          searchable={false}
          required
        />
      </div>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={setup?.id ? 'Edit Frequency Setup' : 'New Frequency Setup'}
      position="right"
      content={() => content()}
      actionButtonLabel={setup?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      isDisabledActionBtn={isCreating || isUpdating}
      steps={[{ title: 'Frequency Setup Info', icon: <FaClock /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditMedFrequencySetup;
