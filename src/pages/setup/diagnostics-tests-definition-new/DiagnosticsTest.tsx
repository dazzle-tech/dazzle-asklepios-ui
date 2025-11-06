import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useCreateDiagnosticTestMutation, useGetAllDiagnosticTestsQuery, useLazyGetDiagnosticTestsByTypeQuery, useToggleDiagnosticTestActiveMutation, useUpdateDiagnosticTestMutation,useLazyGetDiagnosticTestsByNameQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';

import { newDiagnosticTest } from '@/types/model-types-constructor-new';
import { DiagnosticTest } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { notify } from '@/utils/uiReducerActions';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { FaChartLine, FaUndo } from 'react-icons/fa';
import { FaNewspaper } from 'react-icons/fa6';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { RiFileList2Fill } from 'react-icons/ri';
import { Form, Panel } from 'rsuite';
import AddEditDiagnosticTest from './AddEditDiagnosticTest';
import Coding from './Coding';
import NormalRangeSetupModal from './NormalRangeSetUpModal';
import Profile from './Profile';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
const DiagnosticsTest = () => {
  const dispatch = useAppDispatch();
  const [diagnosticsTest, setDiagnosticsTest] = useState<DiagnosticTest>({
    ...newDiagnosticTest
  });
  const [normalRangePopupOpen, setNormalRangePopupOpen] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [openConfirmDiagnosticTest, setOpenConfirmDeleteDiagnosticTest] = useState<boolean>(false);
  const [stateOfDeleteDiagnosticTest, setStateOfDeleteDiagnosticTest] = useState<string>('delete');
  const [openCodingModal, setOpenCodingModal] = useState<boolean>(false);
  const [openProfileModal, setOpenProfileModal] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openAddEditDiagnosticTestPopup, setOpenAddEditDiagnosticTestPopup] =
    useState<boolean>(false);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5
    ,
    sort: "id,asc",
    timestamp: Date.now(),
  });
  const { data: diagnodticsTestList, refetch: refetchDiagnostics, isFetching } = useGetAllDiagnosticTestsQuery(paginationParams);
  const testType = useEnumOptions('TestType');
  // save Diagnostics Test

  const [addDiagnosticTest, addDiagnosticTestMutation] = useCreateDiagnosticTestMutation();
  const [updateDiagnosticTest, updateDiagnosticTestMutation] = useUpdateDiagnosticTestMutation();
  const [toggleDiagnosticTestActive, togglePractitionerActiveMutation] = useToggleDiagnosticTestActiveMutation();
  const [diagnosticTestByTypes] = useLazyGetDiagnosticTestsByTypeQuery();
 const [diagnosticTestByName] = useLazyGetDiagnosticTestsByNameQuery();


 const extractErrorMessage = (error: any): string => {
  const detail =
    error?.data?.detail ||
    error?.data?.message ||
    error?.error ||
    "Unexpected server error";

  // 🔹 لو تحتوي الرسالة على interpolatedMessage=... فاستخرجها فقط
  const match = detail.match(/interpolatedMessage='([^']+)'/);
  if (match && match[1]) return match[1]; // يرجّع "Type cannot be null"

  // 🔹 fallback للرسالة الكاملة لو ما في match
  return detail;
};

const handleAddNewDiagnosticTest = async () => {
  try {
    const payload = {
      type: diagnosticsTest.type,
      name: diagnosticsTest.name,
      internalCode: diagnosticsTest.internalCode,
      ageSpecific: diagnosticsTest.ageSpecific,
      ageGroupList: diagnosticsTest.ageGroupList || [],
      genderSpecific: diagnosticsTest.genderSpecific,
      gender: diagnosticsTest.gender,
      specialPopulation: diagnosticsTest.specialPopulation,
      specialPopulationValues: diagnosticsTest.specialPopulationValues || [],
      price: diagnosticsTest.price,
      currency: diagnosticsTest.currency,
      specialNotes: diagnosticsTest.specialNotes,
      isActive: true,
      isProfile: diagnosticsTest.isProfile ?? false,
      appointable: diagnosticsTest.appointable ?? false,
    };

    const response = await addDiagnosticTest(payload).unwrap();
    refetchDiagnostics();
    setDiagnosticsTest({ ...response });

    dispatch(
      notify({
        msg: "The Diagnostic Test was successfully added",
        sev: "success",
      })
    );
  } catch (error: any) {
    console.error("Error adding Diagnostic Test:", error);
    dispatch(
      notify({
        msg: extractErrorMessage(error),
        sev: "error",
      })
    );
  }
};

const handleUpdateDiagnosticTest = async () => {
  try {
    const payload = {
      id: diagnosticsTest.id,
      type: diagnosticsTest.type,
      name: diagnosticsTest.name,
      internalCode: diagnosticsTest.internalCode,
      ageSpecific: diagnosticsTest.ageSpecific,
      ageGroupList: diagnosticsTest.ageGroupList,
      genderSpecific: diagnosticsTest.genderSpecific,
      gender: diagnosticsTest.gender,
      specialPopulation: diagnosticsTest.specialPopulation,
      specialPopulationValues: diagnosticsTest.specialPopulationValues,
      price: diagnosticsTest.price,
      currency: diagnosticsTest.currency,
      specialNotes: diagnosticsTest.specialNotes,
      isActive: diagnosticsTest.isActive,
      isProfile: diagnosticsTest.isProfile,
      appointable: diagnosticsTest.appointable,
    };

    const response = await updateDiagnosticTest(payload).unwrap();
    refetchDiagnostics();
    setDiagnosticsTest({ ...response });

    dispatch(
      notify({
        msg: "The Diagnostic Test was successfully updated",
        sev: "success",
      })
    );
  } catch (error: any) {
    console.error("Error updating Diagnostic Test:", error);
    dispatch(
      notify({
        msg: extractErrorMessage(error),
        sev: "error",
      })
    );
  }
};



  const handleToggleActive = async (id: number) => {
    try {
      await toggleDiagnosticTestActive(id).unwrap();
      dispatch(notify({ msg: "Status updated successfully", sev: "success" }));
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
    } catch {
      dispatch(notify({ msg: "Failed to update status", sev: "error" }));
    }
  };

  const handleDeactiveReactivateDiagnostic = () => {
    handleToggleActive(diagnosticsTest.id);
    setOpenConfirmDeleteDiagnosticTest(false);
  };

  // Pagination values
  const totalCount = diagnodticsTestList?.totalCount ?? 0;
  const links = diagnodticsTestList?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;


  // Available fields for filtering
  const filterFields = [
    { label: 'Type', value: 'type' },
    { label: 'Name', value: 'name' },

  ];


  // Handle filter change
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<DiagnosticTest[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [valueType, setValueType] = useState({ type: '' });
 const handleFilterChange = async (field: string, value: string) => {
  try {
    

    
    if ((!value || value.trim() === "") && valueType.type === "") {
      setIsFiltered(false);
      setFilteredList([]);
      return;
    }

    let response;

    if (field === "type") {
      if (!valueType.type) return;
      response = await diagnosticTestByTypes({
        type: valueType.type,
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();
  
    } else if (field === "name") {
      response = await diagnosticTestByName({
        name: value,
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();

    } else {
      
      setIsFiltered(false);
      return;
    }

    setFilteredList(response.data ?? []);
    setFilteredTotal(response.totalCount ?? 0);
    setIsFiltered(true);
  } catch (error) {
    console.error("Error filtering diagnostic tests:", error);
    dispatch(
      notify({
        msg: "Failed to filter Diagnostic Tests",
        sev: "error",
      })
    );
    setIsFiltered(false);
  }
};

  // Header page setUp
  const divContent = (
    "Diagnostics Tests Definition"
  );
  dispatch(setPageCode('Diagnostics_Tests'));
  dispatch(setDivContent(divContent));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && diagnosticsTest && rowData.id === diagnosticsTest.id) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit, normalRange/profile, coding ,reactive/Deactivate)
  const iconsForActions = (rowData: any) => (
    <div className="container-of-icons">
      {/* Edit */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setDiagnosticsTest(rowData);
          setOpenAddEditDiagnosticTestPopup(true);
        }}
      />

      {/* Activate / Deactivate */}
      {rowData?.isActive ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setDiagnosticsTest(rowData);
            setOpenConfirmDeleteDiagnosticTest(true);
            setStateOfDeleteDiagnosticTest("deactivate");
          }}
        />
      ) : (
        <FaUndo
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          className="icons-style"
          onClick={() => {
            setDiagnosticsTest(rowData);
            setOpenConfirmDeleteDiagnosticTest(true);
            setStateOfDeleteDiagnosticTest("reactivate");
          }}
        />
      )}

      {/* Profile or Normal Range */}
      {rowData?.isProfile ? (
        <RiFileList2Fill
          className="icons-style"
          title="Profile Setup"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setOpenProfileModal(true);
          }}
        />
      ) : (
        <FaChartLine
          className="icons-style"
          title="Normal Range Setup"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setNormalRangePopupOpen(true);
          }}
        />
      )}

      {/* Code */}
      <FaNewspaper
        className="icons-style"
        title="Code"
        size={22}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenCodingModal(true);
        }}
      />
    </div>);


  //Table columns
  const tableColumns = [
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      render: (rowData) => <p>{formatEnumString(rowData?.type)}</p>,
    },


    {
      key: 'name',
      title: <Translate>Name</Translate>,
      render: (rowData) => <p>{formatEnumString(rowData?.name)}</p>,

    },
    {
      key: 'internalCode',
      title: <Translate>Internal Code</Translate>
    },

    {
      key: 'profile',
      title: <Translate>Is Profile</Translate>,
      render: rowData => (rowData.isProfile ? 'Yes' : 'No')
    },

    {
      key: "isActive",
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: DiagnosticTest) => (
        <p>{rowData?.isActive ? "Active" : "Inactive"}</p>
      ),
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

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
          setRecordOfFilter({
            filter: updatedRecord.filter,
            value: "",
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />

      {recordOfFilter.filter !== 'type' && (<MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />)}
      
      {
        //if can field filter == 'type', show dropdown of test types

        recordOfFilter.filter === 'type' && (
          <MyInput
            width="9vw"
            fieldLabel="Test Type"
            fieldType="select"
            fieldName="type"
            selectData={testType ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={valueType}
            setRecord={(updatedRecord) => {
              setValueType({ type: updatedRecord.type });
            }}
            showLabel={false}
            searchable={false}
          />

        )
      }
      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() =>
          handleFilterChange(recordOfFilter.filter, recordOfFilter.value)
        }
      >
        Search
      </MyButton>
    </Form>
  );

  // handle click on add new button
  const handleNew = () => {
    setOpenAddEditDiagnosticTestPopup(true);
    setDiagnosticsTest({ ...newDiagnosticTest });
  };



  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    let targetLink: string | null | undefined = null;

    if (newPage > paginationParams.page && links.next) targetLink = links.next;
    else if (newPage < paginationParams.page && links.prev)
      targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > paginationParams.page + 1 && links.last)
      targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams({
        ...paginationParams,
        page,
        size,
        timestamp: Date.now(),
      });
    }
  };




  // Effects
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
  // update list when filter is changed


  return (
    <Panel>
      <MyTable
        height={450}
        data={isFiltered ? filteredList : diagnodticsTestList?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setDiagnosticsTest(rowData);
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}

        onPageChange={handlePageChange}

        onRowsPerPageChange={(e) => {
          setPaginationParams({
            ...paginationParams,
            size: Number(e.target.value),
            page: 0,
            timestamp: Date.now(),
          });
        }}
        tableButtons={<div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>}
      />
      <AddEditDiagnosticTest
        open={openAddEditDiagnosticTestPopup}
        setOpen={setOpenAddEditDiagnosticTestPopup}
        diagnosticsTest={diagnosticsTest}
        setDiagnosticsTest={setDiagnosticsTest}
        handleSave={
          diagnosticsTest.id ? handleUpdateDiagnosticTest : handleAddNewDiagnosticTest
        }
        width={width}
      />
      <NormalRangeSetupModal
        open={normalRangePopupOpen}
        setOpen={setNormalRangePopupOpen}
        diagnosticsTest={diagnosticsTest}
      />
      <DeletionConfirmationModal
        open={openConfirmDiagnosticTest}
        setOpen={setOpenConfirmDeleteDiagnosticTest}
        itemToDelete="Diagnostic Test"
        actionButtonFunction={handleDeactiveReactivateDiagnostic}
        actionType={stateOfDeleteDiagnosticTest}
      />
      <Coding
        open={openCodingModal}
        setOpen={setOpenCodingModal}
        diagnosticsTest={diagnosticsTest}
      />
      <Profile
        open={openProfileModal}
        setOpen={setOpenProfileModal}
        diagnosticsTest={diagnosticsTest}
      />
    </Panel>
  );
};

export default DiagnosticsTest;
