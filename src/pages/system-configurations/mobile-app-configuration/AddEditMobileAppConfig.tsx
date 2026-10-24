import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { MdPhoneAndroid } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCreateMobileAppConfigMutation,
  useUpdateMobileAppConfigMutation,
} from '@/services/system-configurations/mobileAppConfigService';
import { MobileAppConfigResponseVM } from '@/types/model-types-new';
import { newMobileAppConfigCreateDTO } from '@/types/model-types-constructor-new';
import './styles.less';

const VALUE_MAX_LENGTH = 4000;

type AddEditMobileAppConfigProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  config: MobileAppConfigResponseVM;
  refetch: () => void;
};

const AddEditMobileAppConfig = ({
  open,
  setOpen,
  config,
  refetch,
}: AddEditMobileAppConfigProps) => {
  const dispatch = useAppDispatch();
  const enumOptions = useEnumOptions('MobileAppConfigKey');
  const [record, setRecord] = useState({ ...newMobileAppConfigCreateDTO });
  const [createConfig, { isLoading: isCreating }] = useCreateMobileAppConfigMutation();
  const [updateConfig, { isLoading: isUpdating }] = useUpdateMobileAppConfigMutation();

  const isEdit = Boolean(config?.id);

  useEffect(() => {
    if (!open) return;
    if (config?.id) {
      setRecord({
        configKey: config.configKey,
        configValue: config.configValue ?? '',
      });
    } else {
      setRecord({ ...newMobileAppConfigCreateDTO });
    }
  }, [open, config]);

  const handleSubmit = async () => {
    const configKey = String(record.configKey ?? '').trim();
    const configValue = String(record.configValue ?? '').trim();

    if (!configKey) {
      dispatch(notify({ msg: 'Key is required', sev: 'warning' }));
      return;
    }
    if (!configValue) {
      dispatch(notify({ msg: 'Value is required', sev: 'warning' }));
      return;
    }
    if (configValue.length > VALUE_MAX_LENGTH) {
      dispatch(
        notify({
          msg: `Value must be at most ${VALUE_MAX_LENGTH} characters`,
          sev: 'warning',
        })
      );
      return;
    }

    try {
      if (isEdit && config.id) {
        await updateConfig({ id: config.id, configValue }).unwrap();
        dispatch(notify({ msg: 'The configuration was successfully updated', sev: 'success' }));
      } else {
        await createConfig({ configKey, configValue }).unwrap();
        dispatch(notify({ msg: 'The configuration was successfully created', sev: 'success' }));
      }
      refetch();
      setOpen(false);
    } catch (error) {
      const message = extractErrorMessage(error);
      dispatch(
        notify({
          msg: message || (isEdit ? 'Failed to update configuration' : 'Failed to create configuration'),
          sev: 'warning',
        })
      );
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      actionButtonLabel={isEdit ? 'Save' : 'Create'}
      actionButtonFunction={handleSubmit}
      open={open}
      setOpen={setOpen}
      position="right"
      title={isEdit ? 'Edit Configuration' : 'New Configuration'}
      content={() => (
        <div dir={dir}>
          <Form fluid>
            <div className="container-of-add-edit-mobile-app-config">
              <MyInput
                fieldName="configKey"
                fieldLabel="Key"
                fieldType="select"
                selectData={enumOptions}
                selectDataLabel="value"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                width="100%"
                required
                disabled={isEdit || isCreating || isUpdating}
              />
              <MyInput
                fieldName="configValue"
                fieldLabel="Value"
                fieldType="textarea"
                record={record}
                setRecord={setRecord}
                width="100%"
                required
                disabled={isCreating || isUpdating}
              />
            </div>
          </Form>
        </div>
      )}
      steps={[{ title: 'Configuration', icon: <MdPhoneAndroid /> }]}
      size="sm"
    />
  );
};

export default AddEditMobileAppConfig;
