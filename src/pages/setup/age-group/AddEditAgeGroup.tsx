import React from 'react';
import {
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaBabyCarriage } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
const AddEditAgeGroup = ({ open, setOpen, agegroups, setAgeGroups, handleSave, width }) => {
  // Fetch age groups Lov list response
  const { data: agegroupsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_GROUPS');
  // Fetch age units Lov list response
  const { data: ageunitsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');

  // Main modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              disabled={agegroups.key ? true : false}
              fieldName="ageGroupLkey"
              fieldType="select"
              selectData={agegroupsLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={agegroups}
              setRecord={setAgeGroups}
            />
            <div className='container-of-two-fields-age-groups' >
                <div className='container-of-field-age-group'>
              <MyInput
                width="100%"
                fieldName="fromAge"
                record={agegroups}
                setRecord={setAgeGroups}
              />
              </div>
               <div className='container-of-field-age-group'>
              <MyInput
                width="100%"
                fieldName="fromAgeUnitLkey"
                fieldType="select"
                selectData={ageunitsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={agegroups}
                setRecord={setAgeGroups}
              />
              </div>
            </div>
            <br/>
            <div className='container-of-two-fields-age-groups'>
                 <div className='container-of-field-age-group' >
              <MyInput width="100%" fieldName="toAge" record={agegroups} setRecord={setAgeGroups} />
              </div>
               <div className='container-of-field-age-group' >
              <MyInput
                 width="100%"
                fieldName="toAgeUnitLkey"
                fieldType="select"
                selectData={ageunitsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={agegroups}
                setRecord={setAgeGroups}
              />
              </div>
            </div>
          </Form>
        );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={agegroups?.key ? 'Edit Age Group' : 'New Age Group'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={agegroups?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Age Group Info', icon: <FaBabyCarriage /> }]}
      size={width > 600 ? '36vw' : '70vw'} 
    />
  );
};
export default AddEditAgeGroup;
