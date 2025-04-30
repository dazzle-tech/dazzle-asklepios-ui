import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useGetFacilitiesQuery, useGetLovValuesByCodeQuery, useSaveModuleMutation } from '@/services/setupService';
import MyIconInput from '@/components/MyInput/MyIconInput';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import clsx from 'clsx';
import { initialListRequest, ListRequest } from '@/types/types';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
const AddEditDepartment = ({
  open,
  setOpen,
//   width,
  department,
  setDepartment,
  saveDepartment,
  recordOfDepartmentCode,
  setRecordOfDepartmentCode
//   refetch, 
}) => {
  
    const dispatch = useDispatch();
    const [facilityListRequest, setFacilityListRequest] = useState<ListRequest>({
        ...initialListRequest
      });
    const { data: facilityListResponse } = useGetFacilitiesQuery(facilityListRequest);
    const { data: encTypesLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
      const { data: depTTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');
    //   const [recordOfDepartmentCode, setRecordOfDepartmentCode] = useState({ departmentCode: '' });
    //   const [generateCode, setGenerateCode] = useState();

    //    useEffect(() => {
    //       setRecordOfDepartmentCode({ departmentCode: department?.departmentCode ?? generateCode });
    //     }, [recordOfDepartmentCode]);

        const handleSave = () => {
            setOpen(false);
            saveDepartment({ ...department, departmentCode: generateCode })
              .unwrap()
              .then(() => {
                dispatch(notify({ msg: 'Departments Saved successfully' }));
              });
          };
    


const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form
            fluid
          >
            <div className="container-of-two-fields-departments">
              <MyInput
                width={250}
                fieldName="facilityKey"
                required
                fieldType="select"
                selectData={facilityListResponse?.object ?? []}
                selectDataLabel="facilityName"
                selectDataValue="key"
                record={department}
                setRecord={setDepartment}
              />
              <MyInput
                width={250}
                fieldName="departmentTypeLkey"
                fieldLabel="Department Type"
                fieldType="select"
                selectData={depTTypesLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={department}
                setRecord={setDepartment}
              />
            </div>

            <MyInput width={520} fieldName="name" record={department} setRecord={setDepartment} />
            <div className="container-of-two-fields-departments">
              <MyInput
                width={250}
                fieldName="phoneNumber"
                record={department}
                setRecord={setDepartment}
              />
              <MyInput
                width={250}
                fieldName="email"
                record={department}
                setRecord={setDepartment}
              />
            </div>

            <MyInput
              width={520}
              fieldName="departmentCode"
              record={recordOfDepartmentCode}
              setRecord={setRecordOfDepartmentCode}
              disabled={true}
            />

            <div className="container-of-two-fields-departments">
              <Form style={{ width: 250 }}>
                <MyInput
                  fieldLabel="Appointable"
                  fieldType="checkbox"
                  fieldName="appointable"
                  record={department}
                  setRecord={setDepartment}
                />
              </Form>
              {department?.appointable ? (
                <MyInput
                  width={250}
                  fieldName="encountertypelkey"
                  fieldType="select"
                  fieldLabel="Encounter Type"
                  selectData={encTypesLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={department}
                  setRecord={setDepartment}
                />
              ) : null}
            </div>
          </Form>
        );
    }
  };

 


  return (
    <MyModal
    open={open}
    setOpen={setOpen}
    title={department?.key ? 'Edit Department' : 'New Department'}
    position="right"
    content={conjureFormContent}
    actionButtonLabel={department?.key ? 'Save' : 'Create'}
    actionButtonFunction={handleSave}
    steps={[{ title: 'Department Info', icon: faLaptop }]}
    />
  );
};
export default AddEditDepartment;