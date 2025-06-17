import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import {Panel} from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useAppDispatch } from '@/hooks';
import { HiDocumentDuplicate } from 'react-icons/hi2';
import { notify } from '@/utils/uiReducerActions';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import './styles.less';
import {
  useGetDuplicationCandidateSetupListQuery,
  useSaveDuplicationCandidateSetupMutation
} from '@/services/setupService';
import { ApDuplicationCandidateSetup } from '@/types/model-types';
import { newApDuplicationCandidateSetup } from '@/types/model-types-constructor';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditRule from './AddEditRule';
import LinkedFacility from './LinkedFacilities';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

const PotintialDuplicate = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [OpenFacilityModal, setOpenFacilityModal] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [candidate, setCandidate] = useState<ApDuplicationCandidateSetup>({
    ...newApDuplicationCandidateSetup
  });
  const [openConfirmDeleteRole, setOpenConfirmDeleteRole] = useState<boolean>(false);
  const [stateOfDeleteRole, setStateOfDeleteRole] = useState<string>('delete');
   const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // save Candidate
  const [saveCandidate] = useSaveDuplicationCandidateSetupMutation();
  // Fetch Candidate list response
  const { data: CandidateListResponse, refetch: candfetch, isFetching } =
    useGetDuplicationCandidateSetupListQuery(listRequest);
     // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = CandidateListResponse?.extraNumeric ?? 0;
   // Header page setUp
  const divContent = (
    <div className='title-potintial'>
      <h5>Potintial Duplicate</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Potintial_Duplicate'));
  dispatch(setDivContent(divContentHTML));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && candidate && rowData.key === candidate.key) {
      return 'selected-row';
    } else return '';
  };
  
  // Icons column (Edit,Linked facilities, reactive/Deactivate)
  const iconsForActions = (rowData: ApDuplicationCandidateSetup) => (
    <div className="container-of-icons-potintial">
      <MdModeEdit
        className="icons-potintial"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-potintial"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteRole('deactivate');
            setOpenConfirmDeleteRole(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-potintial"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteRole('reactivate');
            setOpenConfirmDeleteRole(true);
          }}
        />
      )}
      <HiDocumentDuplicate
        className="icons-potintial"
        title="Linked Facilities"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenFacilityModal(true)}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'role',
      title: <Translate>Role</Translate>,
      render: rowData => rowData.role
    },
    {
      key: 'dob',
      title: <Translate>Date Of Barith</Translate>,
      render: rowData => (rowData.dob ? 'True' : 'False')
    },
    {
      key: 'lastName',
      title: <Translate>Last Name</Translate>,
      render: rowData => (rowData.lastName ? 'True' : 'False')
    },
    {
      key: 'mobileNumber',
      title: <Translate>Mobile Number</Translate>,
      render: rowData => (rowData.mobileNumber ? 'True' : 'False')
    },
    {
      key: 'sexAtBarith',
      title: <Translate>Sex At Barith</Translate>,
      render: rowData => (rowData.gender ? 'True' : 'False')
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => (rowData.deletedAt ? 'invalid' : 'valid')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

   // Handle page change in navigation
    const handlePageChange = (_: unknown, newPage: number) => {
      setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };
    // Handle change rows per page in navigation
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setListRequest({
        ...listRequest,
        pageSize: parseInt(event.target.value, 10),
        pageNumber: 1
      });
    };

  // handle click on add new button
  const handleNew = () => {
    setCandidate({ ...newApDuplicationCandidateSetup });
    setPopupOpen(true);
  };

  // handle save role
  const handleSave = async () => {
    setPopupOpen(false);
    //if you want to use response object write response.object
    try {
       await saveCandidate(candidate)
        .unwrap()
        .then(() => {
          candfetch();
        });
       dispatch(notify({ msg: 'The Role has been saved successfully', sev: 'success' }));
    } catch (error) {
      if (error.data && error.data.message) {
        // Display error message from server
        dispatch(notify(error.data.message));
      } else {
        // Generic error notification
        dispatch(notify('An unexpected error occurred'));
      }
    }
  };

   // handle Deactivate
  const handleDeactivate = () => {
    setOpenConfirmDeleteRole(false);
    saveCandidate({ ...candidate, deletedAt: Date.now() })
      .unwrap()
      .then(() => {
         candfetch();
              dispatch(
                notify({
                  msg: 'The Role was successfully Deactivated',
                  sev: 'success'
                })
              );
            })
            .catch(() => {
              dispatch(
                notify({
                  msg: 'Faild to Deactivate this Role',
                  sev: 'error'
                })
              );
            });
  };

  // handle Reactivate
  const handleReactivate = () => {
    setOpenConfirmDeleteRole(false);
    saveCandidate({ ...candidate, deletedAt: null })
      .unwrap()
       .then(() => {
         candfetch();
              dispatch(
                notify({
                  msg: 'The Role was successfully Reactivated',
                  sev: 'success'
                })
              );
            })
            .catch(() => {
              dispatch(
                notify({
                  msg: 'Faild to Reactivate this Role',
                  sev: 'error'
                })
              );
            });
  };

  // Effects
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Panel>
      <div className="container-of-add-new-button-potintial">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        height={450}
        data={CandidateListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setCandidate(rowData);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <AddEditRule
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        candidate={candidate}
        setCandidate={setCandidate}
        handleSave={handleSave}
      />
      <LinkedFacility
        open={OpenFacilityModal}
        setOpen={setOpenFacilityModal}
        width={width}
        Candidate={candidate}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteRole}
        setOpen={setOpenConfirmDeleteRole}
        itemToDelete="Role"
        actionButtonFunction={
          stateOfDeleteRole == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteRole}
      />
    </Panel>
  );
};
export default PotintialDuplicate;
