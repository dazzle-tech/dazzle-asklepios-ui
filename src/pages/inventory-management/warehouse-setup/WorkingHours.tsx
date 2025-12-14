import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form, Grid, InputGroup, Row, Stack, Col, Panel, Modal, Button, Divider, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import { faBan, faBold, faBox, faBoxesPacking, faBoxesStacked, faBroom, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import ChildModal from '@/components/ChildModal';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import MyTable from '@/components/MyTable';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useAppDispatch } from '@/hooks';
import { newApProducts, newApUomGroups, newApUomGroupsRelation, newApUomGroupsUnits } from '@/types/model-types-constructor';
import { ApUomGroupsRelation, ApUomGroupsUnits } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetLovValuesByCodeQuery, useGetUomGroupsQuery, useGetUomGroupsRelationQuery, useGetUomGroupsUnitsQuery, useRemoveProductMutation, useSaveProductMutation, useSaveUomGroupMutation, useSaveUomGroupRelationMutation, useSaveUomGroupUnitsMutation, useSaveWarehouseMutation } from '@/services/setupService';
import { set } from 'lodash';
import MyModal from '@/components/MyModal/MyModal';
import { FaClock } from 'react-icons/fa6';


const WorkingHours = ({
    
    open,
    setOpen,
    warehouse,
    setWarehouse,
    refetch
})=> {

    
     const dispatch = useAppDispatch();
     const [saveWarehouse, saveWarehouseMutation] = useSaveWarehouseMutation();
  
const mergeDateAndTimeToMillis = (
  dateSource: string | Date,
  timeSource: string | Date
): number => {
  const date = new Date(dateSource);
  const time = new Date(timeSource);

  if (isNaN(date.getTime()) || isNaN(time.getTime())) {
    console.error("Invalid date or time:", dateSource, timeSource);
    return 0; // or return null if your backend allows null
  }

  const merged = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds()
  );

  return merged.getTime();
};

     const handleSave = () => {
        const fromTimeStr = warehouse.workingHoursFromTime?.time;
const toTimeStr = warehouse.workingHoursToTime?.time;

const workingHoursFromTime = fromTimeStr
  ? mergeDateAndTimeToMillis(new Date("1970-01-01"), new Date(`1970-01-01T${fromTimeStr}:00`))
  : null;

const workingHoursToTime = toTimeStr
  ? mergeDateAndTimeToMillis(new Date("1970-01-01"), new Date(`1970-01-01T${toTimeStr}:00`))
  : null;
          const response = saveWarehouse({
            ...warehouse,
            workingHoursFromTime: workingHoursFromTime,
            workingHoursToTime: workingHoursToTime
          }).unwrap().then(() => {
            setWarehouse(response);
            refetch();
            dispatch(
              notify({
                msg: 'The Warehouse Added/Edited successfully ',
                sev: 'success'
              })
            );
            setOpen(false);
          }).catch((e) => {
      
            if (e.status === 422) {
              console.log("Validation error: Unprocessable Entity", e);
      
            } else {
              console.log("An unexpected error occurred", e);
              dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
            }
          });;
      
        };

  // Main modal content
  const conjureFormContent = () => {
    return (
          <Form>
               <MyInput
              column
              fieldLabel="From Time"
              fieldName="workingHoursFromTime"
              fieldType="time"      
              record={warehouse}
              setRecord={setWarehouse}
               width={300}
            />
                 <MyInput
              column
              fieldLabel="To Time"
              fieldName="workingHoursToTime"
              fieldType="time"
              record={warehouse}
              setRecord={setWarehouse}
              width={300}
            />
          </Form>
        );

  };
  
     

          return (
            <MyModal
              open={open}
              setOpen={setOpen}
              title={warehouse?.key ? 'Edit working hours' : 'New working hours'}
              position="right"
              content={conjureFormContent}
              actionButtonLabel={warehouse?.key ? 'Save' : 'Create'}
              actionButtonFunction={handleSave}
              steps={[{ title: 'Warehouse Working Hours', icon: <FaClock /> }]}
              size='36vw'
            />
          );
};

export default WorkingHours;