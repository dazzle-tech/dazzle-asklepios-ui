import React from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarsProgress } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

const AddPurchaseApprovalSetup = ({
  open,
  setOpen,
  purchaseLovQueryResponse,
  record,
  setRecord
}) => {
  // modal content
  const ModalContent = (
    <Form fluid>
      <div>
        <MyInput
          width={'100%'}
          fieldType="select"
          fieldLabel="Types of Purchase"
          fieldName={'key001'}
          selectData={purchaseLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={''}
        />

        <MyInput
          width={'100%'}
          fieldType="select"
          fieldLabel="Responsible Department"
          fieldName={'key002'}
          selectData={[
            { label: 'IT', key: 1 },
            { label: 'Procurement', key: 2 }
          ]}
          selectDataLabel="label"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />

        <MyInput
          width={'100%'}
          fieldType="select"
          fieldLabel="Approval by"
          fieldName={'key003'}
          selectData={[
            { label: 'IT Manager', key: 1 },
            { label: 'Department Head', key: 2 },
            { label: 'Department HR', key: 3 }
          ]}
          selectDataLabel="label"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />

        <MyInput
          width={'100%'}
          fieldType="select"
          fieldLabel="Hierarchy of approval"
          fieldName={'key004'}
          selectData={purchaseLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={''}
        />
      </div>
    </Form>
  );
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Purchasing requisition"
      steps={[
        {
          title: 'Purchasing requisition',
          icon: <FontAwesomeIcon icon={faBarsProgress} />
        }
      ]}
      size="28vw"
      position="right"
      actionButtonLabel="Save"
      content={ModalContent}
    />
  );
};

export default AddPurchaseApprovalSetup;
