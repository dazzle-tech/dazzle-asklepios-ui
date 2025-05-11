
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
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
const AddEditUser = ({
  open,
  setOpen,
  width,
  practitioner,
  setPractitioner,
  readyUser,
  setReadyUser,
  handleSave,
  facilityListResponse
}) => {
 
     const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
     const { data: eduLvlLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');
     const { data: specialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALTY');
     const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');

  //Table columns
      const tableColumns = [
        {
          key: 'fullName',
          title: <Translate>User Name</Translate>,
          flexGrow: 3,
        },
        {
          key: 'phoneNumber',
          title: <Translate>Mobile Number</Translate>,
          flexGrow: 3,
        }
      ];
  

  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
            <Form layout="inline" fluid>
            <small>
              * <Translate>Click to select User</Translate>
            </small>
            <MyTable
                        height={450}
                        data={userListResponse?.object ?? []}
                        // loading={isFetching || load}
                        columns={tableColumns}
                        rowClassName={isSelected}
                        // filters={filters()}
                        onRowClick={rowData => {
                            handleSelectLinkedUser(rowData);
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
                              jobRole: rowData.jobRoleKey,
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
    }
  };

  return (
    // <MyModal
    //   open={open}
    //   setOpen={setOpen}
    //   title="User List - Search Results"
    //   position="right"
    //   content={conjureFormContent}
    //   actionButtonLabel={user?.key ? 'Save' : 'Create'}
    //   actionButtonFunction={handleSave}
    //   size={width > 600 ? '570px' : '300px'}
    //   steps={[{ title: 'practitioner Details', icon:<FontAwesomeIcon icon={ faUser }/> }]}
    // />
  );
};
export default AddEditUser;
