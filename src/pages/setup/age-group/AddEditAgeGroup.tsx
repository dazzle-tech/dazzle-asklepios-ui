import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaBabyCarriage } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';

import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { initialListRequest, ListRequest } from '@/types/types';

const AddEditAgeGroup = ({ open, setOpen, agegroups, setAgeGroups, handleSave, width }) => {
  const ageGroupOptions = useEnumOptions('AgeGroupType');
  const ageUnitOptions = useEnumOptions('AgeUnit');

  const [facilityListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(facilityListRequest);

  // Main modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldLabel="Facility"
              fieldName="facilityId"
              fieldType="select"
              selectData={facilityListResponse ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={agegroups}
              setRecord={setAgeGroups}
              required
            />

            <MyInput
              width="100%"
              disabled={agegroups.key ? true : false}
              fieldName="ageGroup"
              fieldType="select"
              selectData={ageGroupOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={agegroups}
              setRecord={setAgeGroups}
            />

            <div className='container-of-two-fields-age-groups'>
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
                  fieldName="fromAgeUnit"
                  fieldType="select"
                  selectData={ageUnitOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={agegroups}
                  setRecord={setAgeGroups}
                />
              </div>
            </div>

            <br />

            <div className='container-of-two-fields-age-groups'>
              <div className='container-of-field-age-group'>
                <MyInput
                  width="100%"
                  fieldName="toAge"
                  record={agegroups}
                  setRecord={setAgeGroups}
                />
              </div>
              <div className='container-of-field-age-group'>
                <MyInput
                  width="100%"
                  fieldName="toAgeUnit"
                  fieldType="select"
                  selectData={ageUnitOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
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
