import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { MdClose, MdPhoneAndroid } from 'react-icons/md';
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

const existingImageUrls = (config: MobileAppConfigResponseVM): string[] => {
  if (config?.configValues?.length) {
    return config.configValues.filter(Boolean);
  }
  if (config?.configValue) {
    return [config.configValue];
  }
  return [];
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [keptUrls, setKeptUrls] = useState<string[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [createConfig, { isLoading: isCreating }] = useCreateMobileAppConfigMutation();
  const [updateConfig, { isLoading: isUpdating }] = useUpdateMobileAppConfigMutation();
  const [createImage, { isLoading: isCreatingImage }] = useCreateMobileAppConfigImageMutation();
  const [updateImage, { isLoading: isUpdatingImage }] = useUpdateMobileAppConfigImageMutation();

  const isEdit = Boolean(config?.id);
  const isImageType = record.configType === 'IMAGE';
  const isSaving = isCreating || isUpdating || isCreatingImage || isUpdatingImage;

  useEffect(() => {
    if (!open) return;
    setImageFiles([]);
    if (config?.id) {
      setRecord({
        configKey: config.configKey,
        configType: config.configType ?? '',
        configValue: config.configValue ?? '',
        description: config.description ?? '',
      });
      setKeptUrls(existingImageUrls(config));
    } else {
      setRecord({ ...newMobileAppConfigCreateDTO });
      setKeptUrls([]);
    }
  }, [open, config]);

  useEffect(() => {
    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setNewPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [imageFiles]);

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
      if (keptUrls.length + imageFiles.length === 0) {
        dispatch(notify({ msg: 'At least one image is required', sev: 'warning' }));
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
            files: imageFiles,
            keptValues: keptUrls,
            description: description || '',
          }).unwrap();
        } else {
          await createImage({
            configKey,
            files: imageFiles,
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
      actionButtonLoading={isSaving}
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
                <div className="mobile-app-config-images-editor">
                  {(keptUrls.length > 0 || newPreviews.length > 0) && (
                    <div className="mobile-app-config-images-grid">
                      {keptUrls.map(url => (
                        <div key={url} className="mobile-app-config-image-item">
                          <img
                            className="mobile-app-config-image-preview"
                            src={url}
                            alt={record.configKey}
                          />
                          <button
                            type="button"
                            className="mobile-app-config-image-remove"
                            disabled={isSaving}
                            onClick={() => setKeptUrls(prev => prev.filter(item => item !== url))}
                            title="Remove"
                          >
                            <MdClose size={16} />
                          </button>
                        </div>
                      ))}
                      {newPreviews.map((url, index) => (
                        <div key={url} className="mobile-app-config-image-item">
                          <img
                            className="mobile-app-config-image-preview"
                            src={url}
                            alt={`${record.configKey}-${index + 1}`}
                          />
                          <button
                            type="button"
                            className="mobile-app-config-image-remove"
                            disabled={isSaving}
                            onClick={() =>
                              setImageFiles(prev => prev.filter((_, i) => i !== index))
                            }
                            title="Remove"
                          >
                            <MdClose size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isSaving}
                    onChange={event => {
                      const selected = Array.from(event.target.files ?? []);
                      if (selected.length) {
                        setImageFiles(prev => [...prev, ...selected]);
                      }
                      event.target.value = '';
                    }}
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
