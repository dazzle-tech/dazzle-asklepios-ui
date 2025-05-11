import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { useGetLicenseQuery, useRemoveUserMidicalLicenseMutation } from '@/services/setupService';
import { MdModeEdit } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import './styles.less';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FaAddressCard } from 'react-icons/fa';

const ViewLicenses = ({ open, setOpen, user, width }) => {
  const dispatch = useAppDispatch();
  const userKey = user.key;
  const [license, setLicense] = useState();
  const [openConfirmDeleteLicenseModal, setOpenConfirmDeleteLicenseModal] = useState<boolean>(false);
  const[stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>("delete");

  const [licenseListRequest, setLicenseListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'user_key',
        operator: 'match',
        value: userKey ?? ''
      }
    ]
  });
  // Remove user medical license
  const [removeUserMidicalLicense] = useRemoveUserMidicalLicenseMutation();
  // Fetch licenses list response
  const { data: licenseListResponse, refetch: refetchLicense } = useGetLicenseQuery(
    licenseListRequest,
    { skip: !user.key }
  );
  // Class Name for selected row
  const isSelected = rowData => {
    if (rowData && license && rowData.key === license?.key) {
      return 'selected-row';
    } else return '';
  };
 
  // Effects
  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'user_key',
        operator: 'match',
        value: userKey || undefined
      }
    ];
    setLicenseListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [user]);

  // Handle remove license
  const handleRemoveLicense = rowData => {
    removeUserMidicalLicense(rowData)
      .unwrap()
      .then(() => {
        setOpenConfirmDeleteLicenseModal(false);
        dispatch(notify({ msg: 'The License was successfully Deactivated', sev: 'success' }));
        console.log('removed');
        refetchLicense();
      })
      .catch(() => {
        setOpenConfirmDeleteLicenseModal(false);
        dispatch(notify({ msg: 'Failed to Deactivated this License', sev: 'error' }));
        console.log('error in remove');
        refetchLicense();
      });
  };
  //Table columns
  const licensesTableColumns = [
    {
      key: 'licenseName',
      title: <Translate>License Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'licenseNumber',
      title: <Translate>License Number</Translate>,
      flexGrow: 4
    },
    {
      key: 'validTo',
      title: <Translate>Valid To</Translate>,
      flexGrow: 4
    },
    {
      key: 'icon',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: rowData => {
        return (
          <div className='container-of-icons-users'>
            <MdModeEdit
              style={{ cursor: 'pointer' }}
              title="Edit"
              size={24}
              fill="var(--primary-gray)"
            />
            {rowData?.deletedAt ? (
              <FaUndo
                style={{ cursor: 'pointer' }}
                title="Activate"
                size={24}
                fill="var(--primary-gray)"
              />
            ) : (
              <MdDelete
                style={{ cursor: 'pointer' }}
                title="Deactivate"
                size={24}
                fill="var(--primary-pink)"
                onClick={() => {setStateOfDeleteUserModal("deactivate"); setOpenConfirmDeleteLicenseModal(true);}}
              />
            )}
          </div>
        );
      }
    }
  ];
  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <div className='container-of-add-button-user'>
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                // onClick={handleAddNew}
                width="120px"
              >
                New License
              </MyButton>
            </div>
            <MyTable
              height={250}
              data={licenseListResponse?.object ?? []}
              columns={licensesTableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setLicense(rowData);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteLicenseModal}
              setOpen={setOpenConfirmDeleteLicenseModal}
              itemToDelete="User"
              actionButtonFunction={() => handleRemoveLicense(license)}
              actionType={stateOfDeleteUserModal}
            />
          </div>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Licenses & Certifications"
      position="right"
      content={conjureFormContent}
      hideActionBtn
      size={width > 600 ? '570px' : '300px'}
      steps={[{ title: 'License', icon: <FaAddressCard /> }]}
    />
  );
};
export default ViewLicenses;
