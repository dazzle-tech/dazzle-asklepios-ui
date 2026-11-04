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
  useCreateMobileAppConfigImageMutation,
  useCreateMobileAppConfigMutation,
  useUpdateMobileAppConfigImageMutation,
  useUpdateMobileAppConfigMutation,
} from '@/services/system-configurations/mobileAppConfigService';
import { MobileAppConfigResponseVM } from '@/types/model-types-new';
import { newMobileAppConfigCreateDTO } from '@/types/model-types-constructor-new';
import './styles.less';

const VALUE_MAX_LENGTH = 4000;
const DESCRIPTION_MAX_LENGTH = 1000;

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
  const typeOptions = useEnumOptions('MobileAppConfigType');
  const [record, setRecord] = useState({ ...newMobileAppConfigCreateDTO });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [createConfig, { isLoading: isCreating }] = useCreateMobileAppConfigMutation();
  const [updateConfig, { isLoading: isUpdating }] = useUpdateMobileAppConfigMutation();
  const [createImage, { isLoading: isCreatingImage }] = useCreateMobileAppConfigImageMutation();
  const [updateImage, { isLoading: isUpdatingImage }] = useUpdateMobileAppConfigImageMutation();

  const isEdit = Boolean(config?.id);
  const isImageType = record.configType === 'IMAGE';
  const isSaving = isCreating || isUpdating || isCreatingImage || isUpdatingImage;

  useEffect(() => {
    if (!open) return;
    setImageFile(null);
    setImagePreview('');
    if (config?.id) {
      setRecord({
        configKey: config.configKey,
        configType: config.configType ?? '',
        configValue: config.configValue ?? '',
        description: config.description ?? '',
      });
    } else {
      setRecord({ ...newMobileAppConfigCreateDTO });
    }
  }, [open, config]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleSubmit = async () => {
    const configKey = String(record.configKey ?? '').trim();
    const configType = String(record.configType ?? '').trim();
    const configValue = String(record.configValue ?? '').trim();
    const description = String(record.description ?? '').trim();

    if (!configKey) {
      dispatch(notify({ msg: 'Key is required', sev: 'warning' }));
      return;
    }
    if (!configType) {
      dispatch(notify({ msg: 'Type is required', sev: 'warning' }));
      return;
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      dispatch(
        notify({
          msg: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
          sev: 'warning',
        })
      );
      return;
    }
    if (isImageType) {
      const hasCurrentImage = isEdit && config.configType === 'IMAGE' && config.configValue;
      if (!imageFile && !hasCurrentImage) {
        dispatch(notify({ msg: 'Image is required', sev: 'warning' }));
        return;
      }
    } else {
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
    }

    try {
      if (isImageType) {
        if (isEdit && config.id) {
          await updateImage({
            id: config.id,
            file: imageFile,
            description: description || '',
          }).unwrap();
        } else {
          await createImage({
            configKey,
            file: imageFile as File,
            description: description || '',
          }).unwrap();
        }
      } else if (isEdit && config.id) {
        await updateConfig({
          id: config.id,
          configType,
          configValue,
          description: description || null,
        }).unwrap();
      } else {
        await createConfig({
          configKey,
          configType,
          configValue,
          description: description || null,
        }).unwrap();
      }
      dispatch(
        notify({
          msg: isEdit
            ? 'The configuration was successfully updated'
            : 'The configuration was successfully created',
          sev: 'success',
        })
      );
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
                disabled={isEdit || isSaving}
              />
              <MyInput
                fieldName="configType"
                fieldLabel="Type"
                fieldType="select"
                selectData={typeOptions}
                selectDataLabel="value"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                width="100%"
                required
                disabled={isSaving}
              />
              {isImageType ? (
                <div>
                  {(imagePreview || (isEdit && config.configValue)) && (
                    <img
                      className="mobile-app-config-image-preview"
                      src={imagePreview || config.configValue}
                      alt={record.configKey}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSaving}
                    onChange={event => setImageFile(event.target.files?.[0] ?? null)}
                  />
                </div>
              ) : (
                <MyInput
                  fieldName="configValue"
                  fieldLabel="Value"
                  fieldType="textarea"
                  record={record}
                  setRecord={setRecord}
                  width="100%"
                  required
                  disabled={isSaving}
                />
              )}
              <MyInput
                fieldName="description"
                fieldLabel="Description"
                fieldType="textarea"
                record={record}
                setRecord={setRecord}
                width="100%"
                disabled={isSaving}
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
