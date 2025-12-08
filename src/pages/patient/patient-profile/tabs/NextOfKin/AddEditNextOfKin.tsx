import React from 'react';
import { Form } from 'rsuite';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import { GiRelationshipBounds } from "react-icons/gi";


const AddEditNextOfKin = ({ open, setOpen, nextOfKin, setNextOfKin, data, setData, id, setId }) => {
  const dispatch = useAppDispatch();

  const relationships = [
    { label: 'Friend', value: 'Friend' },
    { label: 'Brother', value: 'Brother' },
    { label: 'Sister', value: 'Sister' },
    { label: 'Cousin', value: 'Cousin' },
    { label: 'Colleague', value: 'Colleague' },
    { label: 'Parent', value: 'Parent' },
    { label: 'Spouse', value: 'Spouse' },
    { label: 'Uncle', value: 'Uncle' },
    { label: 'Aunt', value: 'Aunt' },
    { label: 'Neighbor', value: 'Neighbor' },
    { label: 'Classmate', value: 'Classmate' },
    { label: 'Partner', value: 'Partner' },
    { label: 'Grandparent', value: 'Grandparent' },
    { label: 'Child', value: 'Child' },
    { label: 'Relative', value: 'Relative' }
  ];

const handleSave = () => {
  let newData = [...data];

  if (nextOfKin?.id) {
    newData = newData.map(item =>
      item.id === nextOfKin.id ? nextOfKin : item
    );
  } else {
    newData.push({ ...nextOfKin, id: id + 1 });
    setId(id + 1);
  }

  setData(newData);
  setNextOfKin({});
  dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
  setOpen(false);
};


  //MyModal content
  const content = () => (
    <Form layout="inline" className="ph-main-container" fluid>
      <MyInput column fieldName="name" record={nextOfKin} setRecord={setNextOfKin} />
      <MyInput
        column
        fieldType="select"
        fieldName="relationship"
        selectData={relationships ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />
      <MyInput column fieldName="address" record={nextOfKin} setRecord={setNextOfKin} />
      <MyInput column fieldName="email" record={nextOfKin} setRecord={setNextOfKin} />
      <MyInput
        column
        fieldType="number"
        fieldName="mobileNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />
      <MyInput
        column
        fieldType="number"
        fieldName="telephone"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />
      <MyInput
        column
        fieldType="number"
        fieldName="internationalNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />
      <MyInput
        column
        fieldType="number"
        fieldName="landlineNumber"
        record={nextOfKin}
        setRecord={setNextOfKin}
      />
    </Form>
  );
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New/Edit Next Of Kin"
      actionButtonLabel="Save"
      bodyheight="65vh"
      actionButtonFunction={handleSave}
      steps={[
        { title: 'Next Of Kin', icon: <GiRelationshipBounds />
 }
      ]}
      size="35vw"
      content={content}
    />
  );
};
export default AddEditNextOfKin;
