import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useGetAccessRolesQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { initialListRequest } from '@/types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles.less';
const AddEditUser = ({
  open,
  setOpen,
  width,
  user,
  setUser,
  readyUser,
  setReadyUser,
  handleSave,
  facilityListResponse
}) => {
  console.log("USERE",user)
  // Fetch accessRoles list response
  const { data: accessRoleListResponse } = useGetAccessRolesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  // Fetch gender lov list response
  const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  // Fetch jobRole lov list response
  const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');

  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                column
                fieldName="firstName"
                required
                record={user}
                setRecord={setUser}
                width={width > 600 ? 160 : 250}
              />
              {/* <MyInput
                  column
                  fieldName="secondName"
                  required
                  record={user}
                  setRecord={setUser}
                  width={width > 600 ? 160 : 250}
                /> */}
              <MyInput
                column
                fieldName="lastName"
                required
                record={user}
                setRecord={setUser}
                width={width > 600 ? 160 : 250}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                column
                fieldName="login"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />

            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                column
                fieldLabel="sex at birth"
                fieldType="select"
                fieldName="genderLkey"
                selectData={gndrLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={user}
                setRecord={setUser}
                width={250}
              />
              <MyInput
                column
                fieldType="date"
                fieldLabel="DOB"
                fieldName="birthDate"
                record={user}
                setRecord={setUser}
                width={250}
              />
            </div>
            <div className={clsx('', { 'container-of-two-fields-users': width > 600 })}>
              <MyInput
                column
                fieldName="email"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />
              <MyInput
                column
                fieldName="phoneNumber"
                required
                record={user}
                setRecord={setUser}
                width={250}
              />
            </div>
            <MyInput
              width={width > 600 ? 520 : 250}
              column
              fieldLabel="job role"
              fieldType="select"
              fieldName="jobRoleLkey"
              selectData={jobRoleLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={user}
              setRecord={setUser}
            />
          
            <MyInput
              column
              fieldName="jobDescription"
              fieldType="textarea"
              required
              record={user}
              setRecord={setUser}
              width={width > 600 ? 520 : 250}
            />
          </Form>
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
      size={width > 600 ? '38vw' : '25vw'}
      steps={[{ title: 'User Info', icon: <FontAwesomeIcon icon={faUser} /> }]}
    />
  );
};
export default AddEditUser;
