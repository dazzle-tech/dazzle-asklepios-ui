import React, { useEffect, useState } from 'react';
import {
  useDeactiveActivVaccineBrandsMutation,
  useGetDepartmentsQuery,
  useGetIcdListQuery,
  useGetLovValuesByCodeQuery,
  useGetVaccineBrandsListQuery,
  useSaveVaccineBrandMutation,
  useSaveVaccineMutation,
  useSaveWarehouseMutation
} from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { Dropdown, Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdVaccines } from 'react-icons/md';
import { MdMedication } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApVaccineBrands } from '@/types/model-types';
import { newApVaccineBrands } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyModal from '@/components/MyModal/MyModal';
import { FaBabyCarriage, FaWarehouse } from 'react-icons/fa6';
const AddEditWarehouse = ({ open, setOpen, warehouse, setWarehouse, edit_new, setEdit_new, refetch }) => {
  const dispatch = useAppDispatch();
  const [saveWarehouse, saveWarehouseMutation] = useSaveWarehouseMutation();
  const [generateCode, setGenerateCode] = useState();
  const [recordOfWarehouseCode, setRecordOfWarehouseCode] = useState({warehouseId:  '' });
  // Generate code for Warehouse
  const generateFiveDigitCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000);
    setWarehouse({...warehouse, warehouseId: code})
  };
  const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined,
      },
    ],
  });


  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);

    const handleSave = () => {
      const response = saveWarehouse({
        ...warehouse,
      }).unwrap().then(() => {
        console.log(response)
        setWarehouse(response);
        refetch();
        dispatch(
          notify({
            msg: 'The Warehouse Added/Edited successfully ',
            sev: 'success'
          })
        );
      }).catch((e) => {
  
        if (e.status === 422) {
          console.log("Validation error: Unprocessable Entity", e);
  
        } else {
          console.log("An unexpected error occurred", e);
          dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
        }
      });;
  
    };
  

  useEffect(() => {
    if (warehouse?.warehouseId){
      setRecordOfWarehouseCode({ warehouseId: warehouse.warehouseId });
      return;
    }
    generateFiveDigitCode();
    setRecordOfWarehouseCode({ warehouseId: warehouse?.warehouseId ?? generateCode });
       console.log(recordOfWarehouseCode);
  }, [warehouse?.warehouseId?.length]);




  // Main modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
              <MyInput
              fieldName="warehouseId"
              record={recordOfWarehouseCode}
              setRecord={setRecordOfWarehouseCode}
              disabled={true}
            />
            <MyInput
              width="100%"
              disabled={warehouse.key ? true : false}
              fieldName="departmentKey"
              fieldType="select"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={warehouse}
              setRecord={setWarehouse}
            />
          
            <div className='container-of-three-fields' >
                <div className='container-of-field' >
               <MyInput
                  width="100%"
                  fieldName="warehouseName"
                  record={warehouse}
                  setRecord={setWarehouse}
                />
                </div>
               
                  <MyInput
                 fieldLabel="Close Warehouse"
                  fieldName="closeWarehouse"
                  fieldType="checkbox"
                  record={warehouse}
                  setRecord={setWarehouse}
                />
                    <MyInput
                 fieldLabel="Default Warehouse"
                  fieldName="isdefault"
                  fieldType="checkbox"
                  record={warehouse}
                  setRecord={setWarehouse}
                />
            </div>
            <div className='container-of-two-fields'>
              <div className='container-of-field' >
              
                <MyInput width="100%" fieldName="capacity" record={warehouse} setRecord={setWarehouse} />
              </div>
              <div className='container-of-field' >
                <MyInput
                  width="100%"
                  fieldName="locationKey"
                  fieldType="select"
                  selectData={[]}
                  selectDataLabel=""
                  selectDataValue=""
                  record={warehouse}
                  setRecord={setWarehouse}
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
      title={warehouse?.key ? 'Edit Warehouse' : 'New Warehouse'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={warehouse?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Warehouse Info', icon: <FaWarehouse /> }]}
    />
  );
};
export default AddEditWarehouse;
