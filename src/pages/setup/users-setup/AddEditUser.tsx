import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useGetAccessRolesQuery, useGetFacilitiesQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { initialListRequest, ListRequest } from '@/types/types';
import './styles.less';
import { newApUser } from '@/types/model-types-constructor';
const AddEditUser = ({
  open,
  setOpen,
//   width,
  user,
  setUser,
  readyUser,
  setReadyUser,
  handleSave,
  facilityListResponse,
//   accessRoleListResponse
}) => {
 
    const { data: accessRoleListResponse } = useGetAccessRolesQuery({
        ...initialListRequest,
        pageSize: 1000
      });

   const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
     const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');
     console.log("ready user in popup: " + readyUser);
     console.log("ruser in popup: " + user);
       setReadyUser(newApUser);
         setUser(newApUser);

  // Modal content
  const conjureFormContent = stepNumber => {
      switch (stepNumber) {
        case 0:
          return (
            <div>
          <Form layout="inline" fluid>
            <div style={{display: "flex", gap:"20px"}}>
            <MyInput
            //   disabled={!editing}
              column
              fieldName="firstName"
              required
              record={user}
              setRecord={setUser}
              width={160}
            />
            <MyInput
            //   disabled={!editing}
              column
              fieldName="secondName"
              required
              record={user}
              setRecord={setUser}
              width={160}
            />
            <MyInput
            //   disabled={!editing}
              column
              fieldName="lastName"
              required
              record={user}
              setRecord={setUser}
              width={160}
            />
            </div>
            <Form layout="inline" fluid>
            <div className='container-of-two-fields-users'>
            <MyInput
            //   disabled={!editing}
              column
              fieldName="username"
              required
              record={readyUser}
              setRecord={setReadyUser}
              width={250}
            />
  
            <MyInput
            //   disabled={!editing}
              column
              fieldName="password"
              required
              fieldType="password"
              record={user}
              setRecord={setUser}
              width={250}
            />
            </div>
          </Form>
            <div className='container-of-two-fields-users'>
            <MyInput
            //   disabled={!editing}
              column
              fieldLabel="sex at birth"
              fieldType="select"
              fieldName="sexAtBirthLkey"
              selectData={gndrLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={user}
              setRecord={setUser}
              width={250}
            />
  
            <MyInput
            //   disabled={!editing}
              column
              fieldType="date"
              fieldLabel="DOB"
              fieldName="dob"
              record={user}
              setRecord={setUser}
              width={250}
            />
            </div>

          </Form>
  
          
  
          <Form layout="inline" fluid>
            <div className='container-of-two-fields-users'>
            <MyInput
            //   disabled={!editing}
              column
              fieldName="email"
              required
              record={user}
              setRecord={setUser}
              width={250}
            />
            <MyInput
            //   disabled={!editing}
              column
              fieldName="phoneNumber"
              required
              record={user}
              setRecord={setUser}
              width={250}
            />
            </div>
            
          </Form>
  
          <Form
            // onClick={() => {
            //   const filterKeys = user._facilitiesInput; // This is the array you want to filter on ['3', '32260644964500']
  
            //   const filteredFacilities = facilityListResponse?.object?.filter(facility =>
            //     filterKeys.includes(facility.key)
            //   ) ?? [];
  
            //   console.log(filteredFacilities); // This will log the filtered facilities based on user._facilitiesInput
            // }}
            layout="inline"
            fluid
          >
            <MyInput
            //   disabled={!editing}
              width={520}
              column
              fieldLabel="Facility"
              selectData={facilityListResponse?.object ?? []}
              fieldType="multyPicker"
              selectDataLabel="facilityName"
              selectDataValue="key"
              fieldName="_facilitiesInput"
              record={user}
              setRecord={setUser}
            />
            <div className='container-of-two-fields-users'>
            <MyInput
            //   disabled={!editing}
              column
              fieldName="accessRoleKey"
              fieldType="select"
              selectData={accessRoleListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={user}
              setRecord={setUser}
              width={250}
            />
  
            <MyInput
            //   disabled={!editing}
              column
              fieldLabel="job role"
              fieldType="select"
              fieldName="jobRoleLkey"
              selectData={jobRoleLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={user}
              setRecord={setUser}
              width={250}
            />
             </div>
            <MyInput
            //   disabled={!editing}
              column
              fieldName="jobDescription"
              fieldType='textarea'
              required
              record={user}
              setRecord={setUser}
              width={520}
            />
          </Form>
        </div>
          );
        }
    };
 
  return (
    <MyModal
    open={open}
                 setOpen={setOpen}
                 title={user?.key ? 'Edit User' : 'New User'}
                 position="right"
                 content={conjureFormContent}
                 actionButtonLabel={user?.key ? 'Save' : 'Create'}
                 actionButtonFunction={handleSave}
                 // size={width > 600 ? '570px' : '300px'}
                 steps={[
                        { title: 'User Info', icon: faUser }
                 ]}
    />
  );
};
export default AddEditUser;