import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { useGetModulesQuery, useSaveModuleMutation } from '@/services/setupService';
import { Carousel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaUndo } from 'react-icons/fa';
import { ApModule } from '@/types/model-types';
import { MdOutlineChecklistRtl } from 'react-icons/md';
import { newApModule } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { MdDelete } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import { Icon } from '@rsuite/icons';
import MyButton from '@/components/MyButton/MyButton';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import { isValid } from 'date-fns';
import AddEditCheckList from './AddEditCheckList';
const Checklist = () => {
  const dispatch = useAppDispatch();
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [checklist, setChecklist] = useState({});
  const [openAddEditPopup, setOpenAddEditPopup] = useState<boolean>(false);
  //  const [openAddEditPopup, setOpenAddEditPopup] = useState<boolean>(false);
  const [openConfirmDeleteChecklist, setOpenConfirmDeleteChecklist] = useState<boolean>(false);
  const [stateOfDeleteChecklist, setStateOfDeleteChecklist] = useState<string>('delete');
  const data = [
    { key: '1', operationName: 'op1', checkListName: 'ch1', isValid: true },
    { key: '2', operationName: 'op2', checkListName: 'ch2', isValid: true },
    { key: '3', operationName: 'op2', checkListName: 'ch3', isValid: true },
    { key: '4', operationName: 'op2', checkListName: 'ch4', isValid: false }
  ];

  // Pagination values
  //   const pageIndex = listRequest.pageNumber - 1;
  //   const rowsPerPage = listRequest.pageSize;
  //   const totalCount = moduleListResponse?.extraNumeric ?? 0;
  const divContent = (
    <div className="title">
      <h5>Checklists</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Checklists'));
  dispatch(setDivContent(divContentHTML));

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // handling click on Add New Button
  const handleAddNew = () => {
    setOpenAddEditPopup(true);
    setChecklist({});
  };
  // className for selected row
  const isSelected = rowData => {
    if (rowData && checklist && rowData.key === checklist.key) {
      return 'selected-row';
    } else return '';
  };

  //   // Handle page change in navigation
  //   const handlePageChange = (_: unknown, newPage: number) => {
  //     setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  //   };
  //   // Handle change rows per page in navigation
  //   const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //     setListRequest({
  //       ...listRequest,
  //       pageSize: parseInt(event.target.value, 10),
  //       pageNumber: 1
  //     });
  //   };

  // handle deactivate module
  const handleDeactivate = () => {
    setOpenConfirmDeleteChecklist(false);
    // saveModule({ ...module, isValid: false })
    //   .unwrap()
    //   .then(() => {
    //     refetch();
    //     dispatch(
    //       notify({
    //         msg: 'The Module was successfully Deactivated',
    //         sev: 'success'
    //       })
    //     );
    //   })
    //   .catch(() => {
    //     dispatch(
    //       notify({
    //         msg: 'Faild to Deactivate this Module',
    //         sev: 'error'
    //       })
    //     );
    //   });
  };
  // handle reactivate module
  const handleReactivate = () => {
    setOpenConfirmDeleteChecklist(false);
    // saveModule({ ...module, isValid: true })
    //   .unwrap()
    //   .then(() => {
    //     refetch();
    //     dispatch(
    //       notify({
    //         msg: 'The Module was successfully Reactivated',
    //         sev: 'success'
    //       })
    //     );
    //   })
    //   .catch(() => {
    //     dispatch(
    //       notify({
    //         msg: 'Faild to Reactivate this Module',
    //         sev: 'error'
    //       })
    //     );
    //   });
  };

  //icons column for(edit, deactivate and setup module screens)
  const iconsForActions = (rowData: ApModule) => (
    <div className="container-of-icons">
      <MdOutlineChecklistRtl
        title="Link cheklist"
        size={24}
        fill="var(--primary-gray)"
        className="icons-modules"
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-modules"
        onClick={() => setOpenAddEditPopup(true)}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-modules"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteChecklist('deactivate');
            setOpenConfirmDeleteChecklist(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-modules"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteChecklist('reactivate');
            setOpenConfirmDeleteChecklist(true);
          }}
        />
      )}
    </div>
  );

  //table columns
  const tableColumns = [
    {
      key: 'operationName',
      title: <Translate>Operation Name</Translate>
    },
    {
      key: 'checkListName',
      title: <Translate>cheklist Name</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];
  return (
    <Panel>
      <div className="container-of-add-new-button-vaccine">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleAddNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        //   loading={isFetching}
        onRowClick={rowData => {
          setChecklist(rowData);
        }}
        //   sortColumn={listRequest.sortBy}
        //   sortType={listRequest.sortType}
        //   onSortChange={(sortBy, sortType) => {
        //     if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        //   }}
        //   page={pageIndex}
        //   rowsPerPage={rowsPerPage}
        //   totalCount={totalCount}
        //   onPageChange={handlePageChange}
        //   onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* <DeletionConfirmationModal
          open={openConfirmDeleteModule}
          setOpen={setOpenConfirmDeleteModule}
          itemToDelete="Module"
          actionButtonFunction={
            stateOfDeleteModule == 'deactivate' ? handleDeactivate : handleReactivate
          }
          actionType={stateOfDeleteModule}
        /> */}
      <AddEditCheckList
        open={openAddEditPopup}
        setOpen={setOpenAddEditPopup}
        width={width}
        checklist={checklist}
        setChecklist={setChecklist}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteChecklist}
        setOpen={setOpenConfirmDeleteChecklist}
        itemToDelete="CheckList"
        actionButtonFunction={
          stateOfDeleteChecklist == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteChecklist}
      />
    </Panel>
  );
};
export default Checklist;
