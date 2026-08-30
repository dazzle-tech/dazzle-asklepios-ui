import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { Form } from 'rsuite';

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  configuration: any;
  setConfiguration: React.Dispatch<
    React.SetStateAction<any>
  >;
  handleSave: () => void;
};

const AddEditPointOfSaleConfiguration = ({
  open,
  setOpen,
  configuration,
  setConfiguration,
  handleSave,
}: Props) => {
  const content = (

    <Form>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: '24px',
          rowGap: '16px',
        }}
      >
        <MyInput
          required
          fieldName="name"
          fieldLabel="Name"
          fieldType="text"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          required
          fieldName="clientId"
          fieldLabel="Client Id"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          required
          fieldName="terminalId"
          fieldLabel="Terminal Id"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          fieldName="terminalSerialNo"
          fieldLabel="Terminal Serial No"
          fieldType="text"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          fieldName="terminalType"
          fieldLabel="Terminal Type"
          fieldType="text"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          fieldName="counterNumber"
          fieldLabel="Counter Number"
          fieldType="text"
          record={configuration}
          setRecord={setConfiguration}
        />

        <MyInput
          fieldName="cashRegisterNo"
          fieldLabel="Cash Register No"
          fieldType="text"
          record={configuration}
          setRecord={setConfiguration}
        />

      </div>
    </Form >

  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        configuration?.id
          ? 'Edit POS Configuration'
          : 'Add POS Configuration'
      }
      size="60vw"
      content={content}
      actionButtonFunction={handleSave}
    />
  );
};

export default AddEditPointOfSaleConfiguration;