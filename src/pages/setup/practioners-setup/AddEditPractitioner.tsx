import React, { useEffect, useState } from 'react';
import { useGetLovValuesByCodeQuery, useSavePractitionerMutation } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNurse } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import clsx from 'clsx';
const AddEditPractitioner = ({
  open,
  setOpen,
  practitioner,
  setPractitioner,
  refetchPractitioners,
  userListResponse,
  listRequest,
  setListRequest,
  width
}) => {
  const dispatch = useAppDispatch();

  const [searchResultVisible, setSearchResultVisible] = useState<boolean>(false);
  const [linkedUserName, setLinkedUserName] = useState('');
  const [recordOfSearch, setRecordOfSearch] = useState({ searchKeyword: linkedUserName });

  // Fetch gender Lov list response
  const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  // Fetch educational level Lov list response
  const { data: eduLvlLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');
  // Fetch Specialty Lov list response
  const { data: specialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALTY');
  // Fetch Sub Specialty Lov list response
  const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');
  // Fetch Job role Lov list response
  const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');
  // Save practitiner
  const [savePractitioner, savePractitionerMutation] = useSavePractitionerMutation();

  // Effects
  useEffect(() => {
    if (savePractitionerMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [savePractitionerMutation.data]);

  useEffect(() => {
    setLinkedUserName(
      conjureValueBasedOnKeyFromList(
        userListResponse?.object ?? [],
        practitioner?.linkedUser,
        'fullName'
      )
    );
  }, [practitioner]);

  useEffect(() => {
    console.log("link: " + linkedUserName);
    setRecordOfSearch({ searchKeyword: linkedUserName });
  }, [linkedUserName]);

  // Handle Search In User List
  const search = () => {
    if (recordOfSearch['searchKeyword'] && recordOfSearch['searchKeyword'].length >= 3) {
      setSearchResultVisible(true); 

      setListRequest({
        ...listRequest,
        ignore: false,
        filters: [
          {
            operator: 'containsIgnoreCase',
            value: recordOfSearch['searchKeyword'],
            fieldName: 'full_name'
          }
        ]
      });
    }
  };

  //Table columns
  const tableColumns = [
    {
      key: 'fullName',
      title: <Translate>User Name</Translate>,
      flexGrow: 3
    },
    {
      key: 'phoneNumber',
      title: <Translate>Mobile Number</Translate>,
      flexGrow: 3
    }
  ];
  // Handle save practitioner
  const handleSave = () => {
    savePractitioner(practitioner)
      .unwrap()
      .then(() => {
        setOpen(false);
        dispatch(notify({ msg: 'The Practitioner has been saved successfully', sev: 'success' }));
        refetchPractitioners();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Practitioner', sev: 'error' }));
      });
  };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            {practitioner?.linkedUser ? (
              <div>
                <MyInput
                  column
                  fieldLabel="Linked Users"
                  fieldName={'searchKeyword'}
                  record={recordOfSearch}
                  setRecord={setRecordOfSearch}
                  showLabel={true}
                  enterClick={search}
                  placeholder="Search Users to link"
                  width={width > 600 ? 520 : 250}
                />
              </div>
            ) : (
              <div>
                <MyInput
                  fieldName={'searchKeyword'}
                  record={recordOfSearch}
                  setRecord={setRecordOfSearch}
                  showLabel={false}
                  enterClick={search}
                  placeholder="Search Users to link"
                  width={width > 600 ? 520 : 250}
                />
              </div>
            )}
            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>

              <MyInput
                column
                fieldName="practitionerFirstName"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                column
                fieldName="practitionerLastName"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>
            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>

              <MyInput
                column
                fieldLabel="Gender"
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
                column
                fieldType="date"
                fieldLabel="DOB"
                fieldName="dob"
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>
            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>

              <MyInput
                column
                fieldName="practitionerEmail"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
              <MyInput
                column
                fieldName="practitionerPhoneNumber"
                required
                record={practitioner}
                setRecord={setPractitioner}
                width={250}
              />
            </div>
            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>

              <MyInput
                column
                fieldLabel="job role"
                fieldType="select"
                fieldName="jobRoleLkey"
                selectData={jobRoleLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
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
            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>

              <MyInput
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
            </div>
            <div className={clsx({ 'container-of-two-fields-practitioner': width > 600 })}>

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
            </div>
            <MyInput
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
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <Form layout="inline" fluid>
        <small>
          * <Translate>Click to select User</Translate>
        </small>
        <MyTable
          height={450}
          data={userListResponse?.object ?? []}
          columns={tableColumns}
          onRowClick={rowData => {
            setSearchResultVisible(false);
            setPractitioner({
              ...practitioner,
              practitionerFirstName: rowData?.firstName,
              practitionerLastName: rowData?.lastName,
              practitionerFullName: rowData?.fullName,
              practitionerPhoneNumber: rowData?.phoneNumber,
              practitionerEmail: rowData?.email,
              linkedUser: rowData?.key,
              genderLkey: rowData.sexAtBirthLkey,
              dob: rowData.dob
            });
          }}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortChange={(sortBy, sortType) => {
            if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
          }}
        />
      </Form>
    );
  };
  return (
    <ChildModal
      actionButtonLabel={practitioner?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      open={open}
      setOpen={setOpen}
      showChild={searchResultVisible}
      setShowChild={setSearchResultVisible}
      title={practitioner?.key ? 'Edit Practitioner' : 'New Practitioner'}
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Practitioner Details', icon: <FontAwesomeIcon icon={faUserNurse} /> }]}
      childTitle="User List - Search Results"
      childContent={conjureFormContentOfChildModal}
      //   mainSize = {width > 600 ? '570px' : '300px'}
      mainSize="sm"
      childSize="sm"
    />
  );
};
export default AddEditPractitioner;
