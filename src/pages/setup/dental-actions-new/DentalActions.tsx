import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import './styles.less';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { PiToothFill } from 'react-icons/pi';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import AddEditDentalAction from './AddEditDentalAction';
import MyButton from '@/components/MyButton/MyButton';
import TreatmentLinkedProcedures from './TreatmentLinkedProcedures';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { newDentalAction } from '@/types/model-types-constructor-new';
import { DentalAction } from '@/types/model-types-new';
import { useGetAllDentalActionsQuery,
         useCreateDentalActionMutation,
         useUpdateDentalActionMutation, 
         useToggleDiagnosticTestActiveMutation,
         useGetDentalActionsByTypeQuery,
         useGetDentalActionsByDescriptionQuery} from '@/services/setup/dentalActionService';
import { formatEnumString } from '@/utils';
import { skipToken } from "@reduxjs/toolkit/query";
import { useEnumOptions } from '@/services/enumsApi';
import { PaginationPerPage } from "@/utils/paginationPerPage";

const DentalActions = () => {
  const dispatch = useAppDispatch();
  const [dentalAction, setDentalAction] = useState<DentalAction>({ ...newDentalAction});
  const [popupOpen, setPopupOpen] = useState(false); // open add/edit dental action pop up
  const [proceduresOpen, setProceduresOpen] = useState(false);
  const [openConfirmDeleteDentalAction, setOpenConfirmDeleteDentalAction] =
    useState<boolean>(false);
  const [stateOfDeleteDentalAction, setStateOfDeleteDentalAction] = useState<string>('delete');
  const [width, setWidth] = useState<number>(window.innerWidth);

  // ───────────── NEW FILTER & SORT STATES ─────────────
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<DentalAction[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [link, setLink] = useState({});
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 5,
    sort: "id,asc",
  });
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");


  const [createDentalAction] = useCreateDentalActionMutation();
  const [updateDentalAction] = useUpdateDentalActionMutation();
const [toggleDentalActionActive] = useToggleDiagnosticTestActiveMutation();

 const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5
    ,
    sort: "id,asc",
  });
  // Fetch dental action list response




  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  // Available fields for filtering
  const filterFields = [
    { label: 'Description', value: 'description' },
    { label: 'Type', value: 'type' }
  ];


  // Header page setUp
    useEffect(() => {
      dispatch(setPageCode('Dental_Actions'));
      dispatch(setDivContent("Dental Actions"));
      
      return () => {
        dispatch(setPageCode(''));
        dispatch(setDivContent(''));
      };
    }, [dispatch]);

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && dentalAction && rowData.key === dentalAction.id) {
      return 'selected-row';
    } else return '';
  };

  // Handle page change in navigation
const handlePageChange = (event, newPage) => {
  if (isFiltered) {
    setFilterPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  } else {
    setPaginationParams((prev) => ({
      ...prev,
      page: newPage,
    }));
  }
};




  // handle click on add new button (open the pop up of add/edit dental action)
  const handleNew = () => {
    setDentalAction({ ...newDentalAction });
    setPopupOpen(true);
  };

    const {
      data: dentalActionListResponse,
      isLoading: isDentalActionLoading,
      isFetching: isDentalActionFetching,
    } = useGetAllDentalActionsQuery(!isFiltered ? paginationParams : skipToken);


  // handle save dental action and close the pop up
    const handleSave = async () => {
      try {
        dispatch(showSystemLoader());

        const basePayload: any = {
          description: dentalAction.description?.trim(),
          type:
            typeof dentalAction.type === 'object'
              ? dentalAction.type.value
              : dentalAction.type,
          imageName: dentalAction.imageName || null,
          isActive: dentalAction.isActive ?? true,
        };

        if (dentalAction.id) {
          // ✅ Update requires id IN the body
          const payload = { ...basePayload, id: dentalAction.id };

          await updateDentalAction({ id: dentalAction.id, body: payload }).unwrap();
          dispatch(notify({ msg: 'Dental Action updated successfully', sev: 'success' }));
        } else {
          // ✅ Create → NEVER send id
          await createDentalAction(basePayload).unwrap();
          dispatch(notify({ msg: 'Dental Action created successfully', sev: 'success' }));
        }

        setPopupOpen(false);

      } catch (err) {
        console.log("Dental Action Save Error:", err);
        dispatch(notify({ msg: 'Failed to save Dental Action', sev: 'error' }));
      } finally {
        dispatch(hideSystemLoader());
      }
    };







  // handle deactivate/reactivate dental action (need to handle from the back)
    const handleDeactiveReactivateDentalAction = async () => {
      try {
        dispatch(showSystemLoader());

        await toggleDentalActionActive(dentalAction.id).unwrap();

        dispatch(
          notify({
            msg:
              stateOfDeleteDentalAction === "deactivate"
                ? "Dental Action deactivated successfully"
                : "Dental Action reactivated successfully",
            sev: "success",
          })
        );

        setOpenConfirmDeleteDentalAction(false);
      } catch (error) {
        dispatch(
          notify({
            msg: "Action failed, please try again",
            sev: "error",
          })
        );
      } finally {
        dispatch(hideSystemLoader());
      }
    };

  // Icons column (Linked Procedures, Edit, reactive/Deactivate)
  const iconsForActions = (rowData: DentalAction) => (
    <div className="container-of-icons">
      <PiToothFill
        className="icons-style"
        title="Linked Procedures"
        size={24}
        fill="var(--primary-gray)"
        style={{
          cursor: !rowData.id || rowData.type !== 'treatment' ? 'not-allowed' : 'pointer',
          color: 'var(--primary-gray)'
        }}
        onClick={() => {
          if (!(!rowData.id || rowData.type !== 'treatment')) setProceduresOpen(true);
        }}
      />
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setDentalAction(rowData);
          setPopupOpen(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
           onClick={() => {
            setDentalAction(rowData);
            setStateOfDeleteDentalAction('deactivate');
            setOpenConfirmDeleteDentalAction(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setDentalAction(rowData);
            setStateOfDeleteDentalAction('reactivate');
            setOpenConfirmDeleteDentalAction(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 4,
      render: (rowData) => <p>{formatEnumString(rowData?.type)}</p>,
    },
    {
      key: 'imageName',
      title: <Translate>Image Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  const actiontype = useEnumOptions('DentalActionType');

  // Filter table
const filters = () => (
  <Form layout="inline" fluid>
    <MyInput
      selectDataValue="value"
      selectDataLabel="label"
      selectData={filterFields}
      fieldName="filter"
      fieldType="select"
      record={recordOfFilter}
      setRecord={updatedRecord => {
        setRecordOfFilter({ filter: updatedRecord.filter, value: "" });
      }}
      showLabel={false}
      placeholder="Select Filter"
      searchable={false}
    />

    {recordOfFilter.filter === "type" ? (
      <MyInput
        width="9vw"
        fieldName="value"
        fieldType="select"
        selectData={actiontype ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        searchable={false}
      />
    ) : (
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    )}

    <MyButton
      color="var(--deep-blue)"
      width="80px"
      onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
    >
      Search
    </MyButton>

  </Form>
);



  // change the width variable when the size of window is changed
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


    const {
      data: filteredDescriptionResponse,
      isFetching: isFetchingFilteredDescription,
    } = useGetDentalActionsByDescriptionQuery(
      isFiltered && recordOfFilter.filter === "description"
        ? {
            description: recordOfFilter.value,
            page: filterPagination.page,
            size: filterPagination.size,
          }
        : skipToken
    );

    const {
      data: filteredTypeResponse,
      isFetching: isFetchingFilteredType,
    } = useGetDentalActionsByTypeQuery(
      isFiltered && recordOfFilter.filter === "type"
        ? {
            type: recordOfFilter.value?.toUpperCase(),
            page: filterPagination.page,
            size: filterPagination.size,
          }
        : skipToken
    );



  const handleFilterChange = (field: string, value: string, page = 0, size?: number) => {
    if (!field || !value) {
      setIsFiltered(false);
      setFilteredList([]);
      return;
    }

    setIsFiltered(true);
    setFilterPagination({
      ...filterPagination,
      page: 0,
      size: size ?? filterPagination.size,
    });
    setRecordOfFilter({ filter: field, value });
  };



// ───────────── SORT HANDLER ─────────────
const handleSortChange = (sortColumn: string, sortType: "asc" | "desc") => {
  setSortColumn(sortColumn);
  setSortType(sortType);

  const sortValue = `${sortColumn},${sortType}`;

  if (isFiltered) {
    setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
    handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
  } else {
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
    });
  }
};




  // Pagination values
  const totalCount = dentalActionListResponse?.totalCount ?? 0;
  const links = dentalActionListResponse?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  return (
    <Panel>

    <MyTable
      data={
        isFiltered
          ? recordOfFilter.filter === "type"
            ? filteredTypeResponse?.data ?? []
            : filteredDescriptionResponse?.data ?? []
          : dentalActionListResponse?.data ?? []
      }
      totalCount={
        isFiltered
          ? recordOfFilter.filter === "type"
            ? filteredTypeResponse?.totalCount ?? 0
            : filteredDescriptionResponse?.totalCount ?? 0
          : dentalActionListResponse?.totalCount ?? 0
      }
      loading={isDentalActionFetching || isFetchingFilteredType || isFetchingFilteredDescription}
      columns={tableColumns}
      rowClassName={isSelected}
      onRowClick={(rowData) => setDentalAction(rowData)}
      filters={filters()}
      page={isFiltered ? filterPagination.page : pageIndex}
      rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
      onPageChange={handlePageChange}
      onRowsPerPageChange={(e) => {
        const newSize = Number(e.target.value);
        if (isFiltered) {
          setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
          handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
        } else {
          setPaginationParams({
            ...paginationParams,
            size: newSize,
            page: 0,
          });
        }
      }}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortChange={handleSortChange}
      tableButtons={
        <div className="container-of-add-new-button">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleNew}
            width="109px"
          >
            Add New
          </MyButton>
        </div>
      }
    />

      <DeletionConfirmationModal
        open={openConfirmDeleteDentalAction}
        setOpen={setOpenConfirmDeleteDentalAction}
        itemToDelete="Dental Action"
        actionButtonFunction={handleDeactiveReactivateDentalAction}
        actionType={stateOfDeleteDentalAction}
      />
      <AddEditDentalAction
        open={popupOpen}
        setOpen={setPopupOpen}
        dentalAction={dentalAction}
        setDentalAction={setDentalAction}
        handleSave={handleSave}
        width={width}
      />
      <TreatmentLinkedProcedures
        open={proceduresOpen}
        setOpen={setProceduresOpen}
        dentalAction={dentalAction}
        setDentalAction={setDentalAction}
        width={width}
        //  refetch={refetch}
      />
    </Panel>
  );
};

export default DentalActions;
