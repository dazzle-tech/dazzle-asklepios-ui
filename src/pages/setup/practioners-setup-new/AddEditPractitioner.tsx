import React, { useEffect, useState } from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNurse } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import clsx from 'clsx';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetUserQuery } from '@/services/userService';
import { AppUser } from '@/types/model-types';
import MyButton from '@/components/MyButton/MyButton';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import {
  useCreatePractitionerDepartmentMutation,
  useDeletePractitionerDepartmentMutation,
  useGetDepartmentsByPractitionerQuery,
} from '@/services/setup/practitioner/PractitionerDepartmentService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
const AddEditPractitioner = ({
  open,
  setOpen,
  practitioner,
  handleAddNew,
  handleUpdate,
  setPractitioner,
  width,
}) => {
  const dispatch = useAppDispatch();

  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [recordOfSearch, setRecordOfSearch] = useState({ searchKeyword: '' });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [localSelection, setLocalSelection] = useState({ selectedDepartment: null });

  // Facilities
  const { data: allFacilities = [] } = useGetAllFacilitiesQuery(null);
  const [deptPage, setDeptPage] = useState(0);
  const { data: deptResponse, isFetching: loadingDepartments } = useGetDepartmentsQuery({
    page: deptPage,
    size: 3,
  });


  // Practitioner Departments API
  const {
    data: linkedDepartments = [],
    refetch: refetchLinkedDepartments,
  } = useGetDepartmentsByPractitionerQuery(practitioner?.id, {
    skip: !practitioner?.id,
  });

  const [createPractitionerDepartment] = useCreatePractitionerDepartmentMutation();
  const [deletePractitionerDepartment] = useDeletePractitionerDepartmentMutation();

  // LOV lists
  const { data: eduLvlLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');
  const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');



  // Enums
  const specility = useEnumOptions('Specialty');
  const genders = useEnumOptions('Gender');
  const jobRoles = useEnumOptions('JobRole');
  

  // Users
  const { data: userListResponse = [], isLoading } = useGetUserQuery();

  

  const [allDepartments, setAllDepartments] = useState([]);

  useEffect(() => {
    if (deptResponse?.data) {
      setAllDepartments((prev) =>
        deptPage === 0 ? deptResponse.data : [...prev, ...deptResponse.data]
      );
    }
  }, [deptResponse]);


  // Required fields validation
  const validateRequiredFields = () => {
    const fieldLabels = {
      firstName: 'First Name',
      lastName: 'Last Name',
      facilityId: 'Facility',
      specialty: 'Specialty',
    };

    const missingFields = Object.keys(fieldLabels).filter((key) => !practitioner[key]);

    if (missingFields.length > 0) {
      const messages = missingFields.map(
        (key) => `Field '${fieldLabels[key]}' is required`
      );

      dispatch(
        notify({
          msg: messages.join(', '),
          sev: 'error',
        })
      );

      return false;
    }

    return true;
  };

  const handleSaveOrUpdate = async () => {
    if (!validateRequiredFields()) return;

    if (practitioner?.id) {
      await handleUpdate();
      refetchLinkedDepartments(); // refresh departments after update
    } else {
      await handleAddNew();
    }
  };

  // Table columns for user search
  const tableColumns = [
    { key: 'login', title: <Translate>User Name </Translate>, flexGrow: 2 },
    { key: 'firstName', title: <Translate>Full Name</Translate>, flexGrow: 3 },
    { key: 'phoneNumber', title: <Translate>Mobile Number</Translate>, flexGrow: 2 },
    { key: 'email', title: <Translate>Email</Translate>, flexGrow: 3 },
  ];


const handleSearchUsers = () => {
  const keyword = recordOfSearch.searchKeyword?.trim()?.toLowerCase() ?? '';
  if (keyword.length < 2) {
    dispatch(notify({ msg: 'Please type at least 2 characters', sev: 'warn' }));
    return;
  }

  const results = userListResponse.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(keyword) ||
      user.lastName?.toLowerCase().includes(keyword) ||
      user.login?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword)
  );

  setFilteredUsers(results);
setSearchResultVisible(true);
};


  // Main modal content
  const conjureFormContentOfMainModal = (stepNumber) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            {/* User Search */}

          <SectionContainer title="Facility"
          content={<>
          <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>
                        <MyInput
                          width={250}
                          column
                          fieldLabel="Facility"
                          fieldType="select"
                          fieldName="facilityId"
                          selectData={allFacilities ?? []}
                          selectDataLabel="name"
                          selectDataValue="id"
                          record={practitioner}
                          setRecord={setPractitioner}
                          required
                        />
                        <MyInput
                          width={250}
                          column
                          fieldLabel="Appointable"
                          fieldType="checkbox"
                          fieldName="appointable"
                          record={practitioner}
                          setRecord={setPractitioner}
                        />
          </div>
          </>}/>

          <SectionContainer title="Basic Information"
            content={<>
          <MyInput
            fieldName="searchKeyword"
            record={recordOfSearch}
            setRecord={setRecordOfSearch}
            showLabel
            placeholder="Search Users to link"
            column
            width={245}
            rightAddon={
            <FontAwesomeIcon
              icon={faSearch}
              style={{ cursor: 'pointer' }}
              onClick={handleSearchUsers}
            />
            }
          />
            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>
              <MyInput
                column
                fieldName="firstName"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                column
                fieldName="lastName"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>

            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>
              <MyInput
                width={250}
                fieldLabel="Sex at Birth"
                fieldType="select"
                fieldName="gender"
                selectData={genders ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={practitioner}
                setRecord={setPractitioner}
                searchable={false}
              />
              <MyInput
                column
                fieldType="date"
                fieldLabel="DOB"
                fieldName="dateOfBirth"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>

            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>
              <MyInput
                column
                fieldName="email"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                column
                fieldName="phoneNumber"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>
          </>}/>

          <SectionContainer title="Specialty/Job Information"
          content={<>
                      {/* Job Info */}
                      <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>
                        <MyInput
                          column
                          fieldLabel="Job Role"
                          fieldType="select"
                          fieldName="jobRole"
                          selectData={jobRoles ?? []}
                          selectDataLabel="label"
                          selectDataValue="value"
                          record={practitioner}
                          setRecord={setPractitioner}
                          width={250}
                        />
                        <MyInput
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
                      </div>

                      {/* Specialty */}
                      <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>
                        <MyInput
                          width={250}
                          fieldLabel="Specialty"
                          fieldType="select"
                          fieldName="specialty"
                          selectData={specility ?? []}
                          selectDataLabel="label"
                          selectDataValue="value"
                          record={practitioner}
                          setRecord={setPractitioner}
                          required
                        />
                        <MyInput
                          column
                          fieldLabel="Sub Specialty"
                          fieldType="select"
                          fieldName="subSpecialty"
                          selectData={subSpecialityLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          record={practitioner}
                          setRecord={setPractitioner}
                          width={250}
                        />
                      </div>
          </>}/>


          <SectionContainer title="Medical License Information"
          content={<>             <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>
                      
                                    <MyInput
                                      column
                                      fieldLabel="Default Medical License"
                                      fieldName="defaultMedicalLicense"
                                      record={practitioner}
                                      setRecord={setPractitioner}
                                      width={250}
                                    />
                                    <MyInput
                                      column
                                      fieldType="date"
                                      fieldLabel="Valid Until"
                                      fieldName="defaultLicenseValidUntil"
                                      record={practitioner}
                                      setRecord={setPractitioner}
                                      width={250}
                                    />
                                  </div>
                                  <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>
                      
                                    <MyInput
                                      column
                                      fieldLabel="Secondary License"
                                      fieldName="secondaryMedicalLicense"
                                      record={practitioner}
                                      setRecord={setPractitioner}
                                      width={250}
                                    />
                                    <MyInput
                                      column
                                      fieldType="date"
                                      fieldLabel="Valid Until"
                                      fieldName="secondaryLicenseValidUntil"
                                      record={practitioner}
                                      setRecord={setPractitioner}
                                      width={250}
                                    />
            </div></>}/>



          </Form>
        );

      case 1:
        return (
          <Form layout="inline" fluid>
            {/* Department Linking */}
            <MyInput
              fieldType="selectPagination"
              fieldLabel="Add Department"
              fieldName="selectedDepartment"
              selectData={allDepartments} 
              selectDataLabel="name"
              selectDataValue="id"
              record={localSelection}
              setRecord={setLocalSelection}
              searchable
              width={520}
              hasMore={deptResponse?.links?.next?true:false} 
              onFetchMore={() => {
                if (deptResponse?.links?.next) {
                  const { page } = extractPaginationFromLink(deptResponse.links.next);
                  setDeptPage(page);
                }
              }}
            />





            <MyButton
             
              disabled={!practitioner?.id || !localSelection.selectedDepartment}
              onClick={async () => {
                if (!practitioner?.id) return;
                try {
                  console.log('Creating link with', {
                    practitionerId: practitioner.id,
                    departmentId: localSelection.selectedDepartment,
                  });
                  await createPractitionerDepartment({
                    practitionerId: practitioner.id,
                    departmentId: localSelection.selectedDepartment,
                  }).unwrap();
                  refetchLinkedDepartments();
                  dispatch(notify({ msg: 'Department linked successfully', sev: 'success' }));
                } catch (err) {
                  dispatch(
                    notify({
                      msg: err?.data?.message || 'Failed to link department',
                      sev: 'error',
                    })
                  );
                }
              }}
            >
              Link
            </MyButton>

            {practitioner?.id && (
              <div style={{ marginTop: 16 }}>
                <Translate>Linked Departments:</Translate>
                <MyTable
                  height={300}
                  data={linkedDepartments ?? []}
                  columns={[
                    { key: 'departmentName', title: 'Department Name' },
                    { key: 'practitionerName', title: 'Practitioner Name' },
                    {
                      key: 'actions',
                      title: 'Actions',
                      render: (row) => (
                        <MyButton
                          color="red"
                          size="xs"
                          onClick={async () => {
                            try {
                              await deletePractitionerDepartment({
                                practitionerId: practitioner.id,
                                departmentId: row.departmentId,
                              }).unwrap();
                              refetchLinkedDepartments();
                              dispatch(
                                notify({
                                  msg: 'Department unlinked successfully',
                                  sev: 'success',
                                })
                              );
                            } catch (err) {
                              dispatch(
                                notify({
                                  msg: err?.data?.message || 'Failed to unlink department',
                                  sev: 'error',
                                })
                              );
                            }
                          }}
                        >
                          Remove
                        </MyButton>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </Form>
        );
      default:
        return null;
    }
  };

  // Child modal (user linking)
  const conjureFormContentOfChildModal = () => (
    <Form layout="inline" fluid>
      <small>* <Translate>Click to select User</Translate></small>
      <MyTable
        height={450}
        data={filteredUsers}
        columns={tableColumns}
        onRowClick={(rowData) => {
          setSearchResultVisible(false);
          setPractitioner({
            ...practitioner,
            firstName: rowData?.firstName,
            lastName: rowData?.lastName,
            email: rowData?.email,
            phoneNumber: rowData?.phoneNumber,
            userId: rowData?.id,
            gender: rowData?.gender,
            dateOfBirth: rowData?.birthDate,
          });
        }}
        loading={isLoading}
      />
    </Form>
  );

  return (
    <ChildModal
      actionButtonLabel={practitioner?.id ? 'Save' : 'Create'}
      
      open={open}
      setOpen={setOpen}
      showChild={searchResultVisible}
      setShowChild={setSearchResultVisible}
      title={practitioner?.id ? 'Edit Practitioner' : 'New Practitioner'}
      mainContent={conjureFormContentOfMainModal}
      mainStep={[
        {
          title: 'Practitioner Details',
          icon: <FontAwesomeIcon icon={faUserNurse} />,
           disabledNext: !practitioner?.id,
          footer: <MyButton onClick={handleSaveOrUpdate}>Save</MyButton>
        },
        { title: 'Practitioner Departments', icon: <FontAwesomeIcon icon={faUserNurse} /> },
      ]}
      childTitle="User List - Search Results"
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
      childSize="sm"
    />
  );
};

export default AddEditPractitioner;
