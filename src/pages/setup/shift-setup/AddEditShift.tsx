import React, { useState } from 'react';
import {
  useGetFacilitiesQuery,
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';

const AddEditShift = ({ open, setOpen, shift, setShift, width }) => {
  const [listRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch shifts Type Lov Response
  const { data: shiftsTypeLovQueryResponse } = useGetLovValuesByCodeQuery('SHIFTS');
   const { data: facilityListResponse } = useGetFacilitiesQuery(listRequest);
  
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
             <MyInput
              fieldName="facilityKey"
              fieldType="select"
              selectData={facilityListResponse?.object ?? []}
              selectDataLabel="facilityName"
              selectDataValue="key"
              record=""
              setRecord=""
              width="100%"
            />
           <MyInput
              width="100%"
              fieldName="shiftType"
              fieldType="select"
              selectData={shiftsTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={shift}
              setRecord={setShift}
                menuMaxHeight={200}
            />
            <MyInput
              width="100%"
              fieldName="startTime"
              fieldType="time"
              record={shift}
              setRecord={setShift}
            />
           <MyInput
              width="100%"
              fieldName="endTime"
              fieldType="time"
              record={shift}
              setRecord={setShift}
            />
          </Form>
        );
      
    }
  };
  return (
    <MyModal
      actionButtonLabel={shift?.key ? 'Save' : 'Create'} 
      actionButtonFunction=""
      open={open}
      setOpen={setOpen}
      position="right"
      title={shift?.key ? 'Edit Shift' : 'New Shift'}
      content={conjureFormContentOfMainModal}
      steps={[
        {
          title: 'Shift Info',
          icon: <FontAwesomeIcon icon={faClockRotateLeft} />,
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditShift;
