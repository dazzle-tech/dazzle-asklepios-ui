import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useGetAccessRolesQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { initialListRequest } from '@/types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNurse } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
const AddEditPractitioner = ({
  open,
  setOpen,
//   width,
  practitioner,
  setPractitioner,
//   handleSave,
}) => {
  const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: eduLvlLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');
  const { data: specialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALTY');
  const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');

  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>

            {/* { practitioner?.linkedUser ? (
                        <div style={{ marginBottom: '10px' }}>
                          <label
                            htmlFor="searchInput"
                            style={{ display: 'block', marginBottom: '7px', fontWeight: 'bold' }}
                          >
                            Linked Users
                          </label>
                          <InputGroup inside style={{ width: '350px', direction: 'ltr' }}>
                            <Input
                              id="searchInput"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  search();
                                }
                              }}
                              placeholder="Search Users to link"
                              value={practitioner?.linkedUser ? linkedUserName : searchKeyword}
                              onChange={e => setSearchKeyword(e)}
                            />
                            <InputGroup.Button onClick={() => changeLinkedUser()}>
                              <UserChangeIcon style={{ scale: '1.2' }} />
                            </InputGroup.Button>
                          </InputGroup>
                        </div>
                      ) : (
                        <InputGroup inside style={{ width: '350px', direction: 'ltr' }}>
                          <Input
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                search();
                              }
                            }}
                            placeholder={'Search Users to link '}
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e)}
                          />
                          <InputGroup.Button onClick={() => search()}>
                            <SearchIcon />
                          </InputGroup.Button>
                        </InputGroup>
                      )} */}

            <div className="container-of-two-fields-practitioner">
              <MyInput
                // disabled={!editing}
                column
                fieldName="practitionerFirstName"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />

              <MyInput
                // disabled={!editing}
                column
                fieldName="practitionerLastName"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>
            <div className="container-of-two-fields-practitioner">
              <MyInput
                // disabled={!editing}
                column
                fieldLabel="sex at birth"
                fieldType="select"
                fieldName="sexAtBirthLkey"
                selectData={gndrLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />

              <MyInput
                // disabled={!editing}
                column
                fieldType="date"
                fieldLabel="DOB"
                fieldName="dob"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>
            <div className="container-of-two-fields-practitioner">
              <MyInput
                // disabled={!editing}
                column
                fieldName="practitionerEmail"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                // disabled={!editing}
                column
                fieldName="practitionerPhoneNumber"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>

            {/* <Form
          onClick={() => {
            const filterKeys = user._facilitiesInput; // This is the array you want to filter on ['3', '32260644964500']

            const filteredFacilities = facilityListResponse?.object?.filter(facility =>
              filterKeys.includes(facility.key)
            ) ?? [];

            console.log(filteredFacilities); // This will log the filtered facilities based on user._facilitiesInput
          }}
          layout="inline"
          fluid
        > */}
            <div className="container-of-two-fields-practitioner">
              <MyInput
                // disabled={!editing}
                column
                fieldLabel="job role"
                fieldType="select"
                fieldName="jobRoleLkey"
                selectData={
                  // jobRoleLovQueryResponse?.object ??
                  []
                }
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                //   disabled={!editing}
                column
                fieldLabel="Educational Level"
                fieldType="select"
                fieldName="educationalLevel"
                selectData={eduLvlLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              {/* <MyInput
                //   disabled={!editing}
                column
                fieldLabel="Speciality"
                fieldType="select"
                fieldName="speciality"
                selectData={specialityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              /> */}
            </div>
            <div className="container-of-two-fields-practitioner">
            <MyInput
                //   disabled={!editing}
                column
                fieldLabel="Speciality"
                fieldType="select"
                fieldName="speciality"
                selectData={specialityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                //   disabled={!editing}
                column
                fieldLabel="Sub Speciality"
                fieldType="select"
                fieldName="subSpeciality"
                selectData={subSpecialityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />

              {/* <MyInput
                //   disabled={!editing}
                column
                fieldLabel="Default Medical License"
                fieldName="defaultMedicalLicense"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              /> */}
            </div>
            <div className="container-of-two-fields-practitioner">
            <MyInput
                //   disabled={!editing}
                column
                fieldLabel="Default Medical License"
                fieldName="defaultMedicalLicense"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                //   disabled={!editing}
                column
                fieldType="date"
                fieldLabel="Valid Until"
                fieldName="defaultLicenseValidUntil"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />

             
            </div>
            <div className="container-of-two-fields-practitioner">
            <MyInput
                //   disabled={!editing}
                column
                fieldLabel="Secondary License"
                fieldName="secondaryMedicalLicense"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                //   disabled={!editing}
                column
                fieldType="date"
                fieldLabel="Valid Until"
                fieldName="secondaryLicenseValidUntil"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />

              {/* <MyInput
            //   disabled={!editing}
              column
              fieldLabel="Educational Level"
              fieldType="select"
              fieldName="educationalLevel"
              selectData={eduLvlLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={practitioner}
              setRecord={setPractitioner}
              width={250}
            /> */}
            </div>
            <MyInput
              // disabled={!editing}
              width={165}
              column
              fieldLabel="Appointable"
              fieldType="checkbox"
              fieldName="appointable"
              record={practitioner}
              setRecord={setPractitioner}
            />
          </Form>
        );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={practitioner?.key ? 'Edit Practitioner' : 'New Practitioner'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={practitioner?.key ? 'Save' : 'Create'}
    //   actionButtonFunction={handleSave}
    //   size={width > 600 ? '570px' : '300px'}
      steps={[{ title: 'Practitioner Details', icon: <FontAwesomeIcon icon={faUserNurse} /> }]}
    />
  );
};
export default AddEditPractitioner;
