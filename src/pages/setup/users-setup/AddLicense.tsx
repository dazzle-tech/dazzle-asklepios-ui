import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { useSaveUserMidicalLicenseMutation } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import clsx from 'clsx';
import './styles.less';
import { newApUserMedicalLicense } from '@/types/model-types-constructor';
import { ApUserMedicalLicense } from '@/types/model-types';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const AddLicense = ({
  open,
  setOpen,
  user
}) => {
  const dispatch = useAppDispatch();

  const [userLicense, setUserLicense] = useState<ApUserMedicalLicense>({
    ...newApUserMedicalLicense
  });
  // Save MidicalLicense
  const [saveUserMidicalLicense] = useSaveUserMidicalLicenseMutation();

  // Handle Save License
  const handleSaveLicense = () => {
    saveUserMidicalLicense({
      ...userLicense,
      userKey: user.key
    })
      .unwrap()
      .then(() => {
        console.log('addedSuccessfully');
        setOpen(false);
        dispatch(notify({ msg: 'The License has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        setOpen(false);
        dispatch(notify({ msg: 'Failed to save this License', sev: 'error' }));
      });
  };
  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <MyInput
              fieldName="licenseName"
              required
              record={userLicense}
              setRecord={setUserLicense}
              width={520}
            />
            <MyInput
              fieldName="licenseNumber"
              required
              record={userLicense}
              setRecord={setUserLicense}
              width={520}
            />
            <MyInput
              fieldType="date"
              fieldLabel="Valid To"
              fieldName="validTo"
              record={userLicense}
              setRecord={setUserLicense}
              width={520}
            />
          </Form>
        );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New License"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Create"
      actionButtonFunction={handleSaveLicense}
      // size={width > 600 ? '570px' : '300px'}
      //   steps={[{ title: 'User Info', icon: faUser }]}
    />
  );
};
export default AddLicense;
