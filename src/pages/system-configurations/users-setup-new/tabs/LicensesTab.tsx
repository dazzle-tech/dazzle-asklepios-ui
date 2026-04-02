import React, { useEffect, useState,useMemo  } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetLicenseQuery, useRemoveUserMidicalLicenseMutation, useSaveUserMidicalLicenseMutation } from '@/services/setupService';
import { ApUserMedicalLicense } from '@/types/model-types';
import { newApUserMedicalLicense } from '@/types/model-types-constructor';
import { ApUser } from '@/types/model-types-new';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';

interface LicensesTabProps {
  user: ApUser;
}

const LicensesTab: React.FC<LicensesTabProps> = ({ user }) => {
  const dispatch = useAppDispatch();
  const userId = user?.id;

  const [license, setLicense] = useState<any>();
  const [userLicense, setUserLicense] = useState<ApUserMedicalLicense>({ ...newApUserMedicalLicense });
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [openConfirmDeleteLicenseModal, setOpenConfirmDeleteLicenseModal] = useState<boolean>(false);
  const [stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>('delete');
  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  const [licenseListRequest, setLicenseListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'user_key',
        operator: 'match',
        value: userId?.toString() ?? '',
      },
    ],
  });

  const [saveUserMidicalLicense] = useSaveUserMidicalLicenseMutation();
  const [removeUserMidicalLicense] = useRemoveUserMidicalLicenseMutation();
  const { data: licenseListResponse, refetch: refetchLicense } = useGetLicenseQuery(licenseListRequest, {
    skip: !userId,
  });

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'user_key',
        operator: 'match',
        value: userId?.toString() || undefined,
      },
    ];
    setLicenseListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters,
    }));
  }, [userId]);

  const isSelected = (rowData: any) => {
    if (rowData && license && rowData.key === license?.key) {
      return 'selected-row';
    }
    return '';
  };

  const handleRemoveLicense = (rowData: any) => {
    removeUserMidicalLicense(rowData)
      .unwrap()
      .then(() => {
        setOpenConfirmDeleteLicenseModal(false);
        dispatch(notify({ msg: 'The License was successfully Deactivated', sev: 'success' }));
        refetchLicense();
      })
      .catch(() => {
        setOpenConfirmDeleteLicenseModal(false);
        dispatch(notify({ msg: 'Failed to Deactivate this License', sev: 'error' }));
        refetchLicense();
      });
  };

  const handleSaveLicense = () => {
    if (!userId) {
      dispatch(notify({ msg: 'Please select a user first', sev: 'error' }));
      return;
    }

    saveUserMidicalLicense({
      ...userLicense,
      userKey: userId.toString(),
    })
      .unwrap()
      .then(() => {
        setOpenForm(false);
        dispatch(notify({ msg: 'The License has been saved successfully', sev: 'success' }));
        setUserLicense({ ...newApUserMedicalLicense });
        refetchLicense();
      })
      .catch(() => {
        setOpenForm(false);
        setUserLicense({ ...newApUserMedicalLicense });
        dispatch(notify({ msg: 'Failed to save this License', sev: 'error' }));
      });
  };

  const licensesTableColumns = [
    {
      key: 'licenseName',
      title: <Translate>License Name</Translate>,
      flexGrow: 4,
    },
    {
      key: 'licenseNumber',
      title: <Translate>License Number</Translate>,
      flexGrow: 4,
    },
    {
      key: 'validTo',
      title: <Translate>Valid To</Translate>,
      flexGrow: 4,
    },
    {
      key: 'icon',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        return (
          <div className="container-of-icons">
            <MdModeEdit
              className="icons-style"
              title="Edit"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setUserLicense(rowData);
                setOpenForm(true);
              }}
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
                onClick={() => {
                  setLicense(rowData);
                  setStateOfDeleteUserModal('deactivate');
                  setOpenConfirmDeleteLicenseModal(true);
                }}
              />
            )}
          </div>
        );
      },
    },
  ];

  const licenses = licenseListResponse?.object ?? [];

  const handlePageChange = (_: unknown, newPage: number) => {
    setPageIndex(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };

  const paginatedData = useMemo(() => {
    const start = pageIndex * rowsPerPage;
    const end = start + rowsPerPage;
    return licenses.slice(start, end);
  }, [licenses, pageIndex, rowsPerPage]);

  const totalCount = licenses.length;

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      {openForm && (
        <Form
          fluid
          layout="inline"
          style={{
            marginBottom: '20px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <MyInput
            column
            fieldLabel="License Name"
            fieldName="licenseName"
            required
            record={userLicense}
            setRecord={setUserLicense}
            width={350}
          />
          <MyInput
            column
            fieldLabel="License Number"
            fieldName="licenseNumber"
            required
            record={userLicense}
            setRecord={setUserLicense}
            width={350}
          />
          <MyInput
            column
            fieldType="date"
            fieldLabel="Valid To"
            fieldName="validTo"
            record={userLicense}
            setRecord={setUserLicense}
            width={350}
          />
          <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: '10px' }}>
            <MyButton onClick={handleSaveLicense} appearance="primary">
              {userLicense?.key ? 'Update' : 'Save'}
            </MyButton>
            <MyButton
              onClick={() => {
                setOpenForm(false);
                setUserLicense({ ...newApUserMedicalLicense });
              }}
              appearance="subtle"
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </MyButton>
          </div>
        </Form>
      )}
      {!openForm && (
        <div className="container-of-add-new-button" style={{ marginBottom: '20px' }}>
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setUserLicense({ ...newApUserMedicalLicense });
              setOpenForm(true);
            }}
            width="120px"
            disabled={!userId}
          >
            New License
          </MyButton>
        </div>
      )}
        <MyTable
          data={paginatedData}
          columns={licensesTableColumns}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      <DeletionConfirmationModal
        open={openConfirmDeleteLicenseModal}
        setOpen={setOpenConfirmDeleteLicenseModal}
        itemToDelete="License"
        actionButtonFunction={() => handleRemoveLicense(license)}
        actionType={stateOfDeleteUserModal}
      />
    </div>
  );
};

export default LicensesTab;


