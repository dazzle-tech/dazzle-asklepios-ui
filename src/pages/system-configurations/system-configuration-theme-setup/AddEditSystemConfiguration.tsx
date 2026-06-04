import React from 'react';
import { Form } from 'rsuite';
import { FaCog } from 'react-icons/fa';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import {
  SystemConfigKey,
  useUploadFaviconMutation,
  useUploadSystemLogoMutation
} from '@/services/systemConfigService';
import './styles.less';

const fontOptions = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Tahoma', value: 'Tahoma' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' }
];

const AddEditSystemConfiguration = ({
  open,
  setOpen,
  systemConfig,
  setSystemConfig,
  handleSave,
  width
}) => {
  const [uploadFavicon] = useUploadFaviconMutation();
  const [uploadSystemLogo] = useUploadSystemLogoMutation();

  const handleUpload = async (
    file: File,
    type: SystemConfigKey.FAVICON | SystemConfigKey.SYSTEM_LOGO
  ) => {
    if (type === SystemConfigKey.FAVICON) {
      await uploadFavicon(file).unwrap();
    }

    if (type === SystemConfigKey.SYSTEM_LOGO) {
      await uploadSystemLogo(file).unwrap();
    }
  };

  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldLabel="System Title"
              fieldName="SYSTEM_TITLE"
              record={systemConfig}
              setRecord={setSystemConfig}
            />

            <MyInput
              width="100%"
              fieldLabel="Primary Color"
              fieldName="PRIMARY_COLOR"
              fieldType="color"
              record={systemConfig}
              setRecord={setSystemConfig}
            />

            <MyInput
              width="100%"
              fieldLabel="Font Family"
              fieldName="FONT_FAMILY"
              fieldType="select"
              selectData={fontOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={systemConfig}
              setRecord={setSystemConfig}
            />

            <div className="system-config-upload-row">
              <label>Favicon</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUpload(file, SystemConfigKey.FAVICON);
                  }
                }}
              />
            </div>

            <div className="system-config-upload-row">
              <label>System Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUpload(file, SystemConfigKey.SYSTEM_LOGO);
                  }
                }}
              />
            </div>
          </Form>
        );
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="System Configuration"
      position="right"
      content={stepNumber => <div dir={dir}>{conjureFormContent(stepNumber)}</div>}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      steps={[{ title: 'Configuration Info', icon: <FaCog /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditSystemConfiguration;