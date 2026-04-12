import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useSetDiagnosticTestForRequestMutation } from '@/services/diagnosic-order/diagnosticTestRequestService';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCreateDiagnosticTestMutation,
  useGetAllActiveDiagnosticTestsQuery,
  useLazyGetDiagnosticTestsByNameQuery,
  useLazyGetDiagnosticTestsByTypeQuery,
  useToggleDiagnosticTestActiveMutation,
  useUpdateDiagnosticTestMutation
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import { newDiagnosticTest } from '@/types/model-types-constructor-new';
import { DiagnosticTest } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { FaUndo } from 'react-icons/fa';
import { FaNewspaper } from 'react-icons/fa6';
import { MdDelete, MdModeEdit, MdOutlineDescription } from 'react-icons/md';
import { RiFileList2Fill } from 'react-icons/ri';
import { Form, Panel } from 'rsuite';
import AddEditDiagnosticTest from './AddEditDiagnosticTest';
import Coding from './Coding';
import DefaultProfileIndicator from './DefaultProfileIndicator';
import DiagnosticTestTemplate from './DiagnosticTestTemplate';
import Profile from './Profile';
import './styles.less';

interface DiagnosticsTestProps {
  testRequest?: {
    id: number;
    diagnosticTestId?: number;
    type?: string;
  };
}

const DiagnosticsTest: React.FC<DiagnosticsTestProps> = ({ testRequest }) => {
  const dispatch = useAppDispatch();
  const [diagnosticsTest, setDiagnosticsTest] = useState<DiagnosticTest>({
    ...newDiagnosticTest
  });
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [openConfirmDiagnosticTest, setOpenConfirmDeleteDiagnosticTest] = useState<boolean>(false);
  const [stateOfDeleteDiagnosticTest, setStateOfDeleteDiagnosticTest] = useState<string>('delete');
  const [openCodingModal, setOpenCodingModal] = useState<boolean>(false);
  const [openTemplateModal, setOpenTemplateModal] = useState<boolean>(false);
  const [openProfileModal, setOpenProfileModal] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openAddEditDiagnosticTestPopup, setOpenAddEditDiagnosticTestPopup] =
    useState<boolean>(false);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const {
    data: diagnodticsTestList,
    refetch: refetchDiagnostics,
    isFetching
  } = useGetAllActiveDiagnosticTestsQuery(paginationParams);

  const testType = useEnumOptions('TestType');

  const [addDiagnosticTest, addDiagnosticTestMutation] = useCreateDiagnosticTestMutation();
  const [updateDiagnosticTest, updateDiagnosticTestMutation] = useUpdateDiagnosticTestMutation();
  const [toggleDiagnosticTestActive, togglePractitionerActiveMutation] =
    useToggleDiagnosticTestActiveMutation();
  const [diagnosticTestByTypes] = useLazyGetDiagnosticTestsByTypeQuery();
  const [diagnosticTestByName] = useLazyGetDiagnosticTestsByNameQuery();
  const [setDiagnosticTestForRequest] =
    useSetDiagnosticTestForRequestMutation();
  const [openNormalRangesDirectly, setOpenNormalRangesDirectly] = useState(false);

  const extractErrorMessage = (error: any): string => {
    const data = error?.data;

    const fieldErrors = data?.fieldErrors;
    if (Array.isArray(fieldErrors) && fieldErrors.length) {
      const msgs = fieldErrors
        .map((fe: any) => fe?.message || fe?.defaultMessage)
        .filter(Boolean);

      if (msgs.length) return msgs.map(m => `• ${m}`).join('\n');
    }

    const detail = data?.detail || data?.message || error?.error || 'Unexpected server error';

    const matches = [...String(detail).matchAll(/default message \[([^\]]+)\]/g)]
      .map(m => m[1])
      .filter(Boolean);

    if (matches.length) return matches.map(m => `• ${m}`).join('\n');

    return '• Validation error';
  };


  const validateDiagnosticTest = (test: DiagnosticTest): string[] => {
    const missingFields: string[] = [];

    if (!test.type) missingFields.push('Test Type');
    if (!test.name?.trim()) missingFields.push('Name');
    if (!test.internalCode?.trim()) missingFields.push('Internal Code');
    if (!test.price && test.price !== 0) missingFields.push('Price');

    if (test.type === 'LABORATORY' && !test.defaultProfileResultType) {
      missingFields.push('Result Type');
    }

    if (missingFields.length) {
      return [`${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required`];
    }

    return [];
  };


  const handleAddNewDiagnosticTest = async () => {
    try {
      // Frontend validations (before calling API)
      const errors: string[] = [];

      if (!diagnosticsTest.name?.trim()) errors.push('Name is required');
      if (!diagnosticsTest.internalCode?.trim()) errors.push('Internal Code is required');

      if (diagnosticsTest.type === 'LABORATORY' && !diagnosticsTest.defaultProfileResultType) {
        errors.push('Default Result Type is required for Laboratory tests');
      }

      const isEmpty = (val) => val === null || val === undefined || val === '';
      const isNotEmpty = (val) => val !== null && val !== undefined && val !== '';
      if (
        diagnosticsTest?.parallelCapacityValue === null ||
        diagnosticsTest?.parallelCapacityValue === undefined ||
        diagnosticsTest?.parallelCapacityValue < 1
      ) {
        errors.push(
          'Field Parallel Capacity Value is required and should be greater than or equal to 1'
        );
      }
      if (diagnosticsTest?.appointable) {
        if (isEmpty(diagnosticsTest?.defaultDurationMinutes) || diagnosticsTest?.defaultDurationMinutes <= 0) {
          errors.push('Field Default Duration Minutes is required and should be greater than 0')
        }
        if (isEmpty(diagnosticsTest?.defaultBufferBeforeMinutes) || diagnosticsTest?.defaultBufferBeforeMinutes < 0) {
          errors.push('Field Default Buffer Before Minutes is required and should be greater then or equal 0')
        }
        if (isEmpty(diagnosticsTest?.defaultBufferAfterMinutes) || diagnosticsTest?.defaultBufferAfterMinutes < 0) {
          errors.push('Field Default Buffer After Minutes is required and should be greater then or equal 0')
        }
      }
      else {
        if (isNotEmpty(diagnosticsTest?.defaultDurationMinutes) && diagnosticsTest?.defaultDurationMinutes <= 0) {
          errors.push('Field Default Duration Minutes should be greater than 0')
        }
        if (isNotEmpty(diagnosticsTest?.defaultBufferBeforeMinutes) && diagnosticsTest?.defaultBufferBeforeMinutes < 0) {
          errors.push('Field Default Buffer Before Minutes should be greater then or equal 0')
        }
        if (isNotEmpty(diagnosticsTest?.defaultBufferAfterMinutes) && diagnosticsTest?.defaultBufferAfterMinutes < 0) {
          errors.push('Field Default Buffer After Minutes should be greater then or equal 0')
        }
      }

      if (errors.length) {
        dispatch(
          notify({
            msg: errors.map(e => `• ${e}`).join('\n'),
            sev: 'warning'
          })
        );
        return;
      }

      const payload = {
        type: diagnosticsTest.type,
        name: diagnosticsTest.name?.trim(),
        internalCode: diagnosticsTest.internalCode?.trim(),

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
        appointable: diagnosticsTest.appointable ?? false,

        defaultProfileResultType:
          diagnosticsTest.type === 'LABORATORY' ? diagnosticsTest.defaultProfileResultType : null,

        defaultProfileResultUnit:
          diagnosticsTest.type === 'LABORATORY' ? diagnosticsTest.defaultProfileResultUnit : null,

        listOfValueId: diagnosticsTest.listOfValueId ?? null,

         parallelCapacityValue: diagnosticsTest?.parallelCapacityValue ?? 1,
        defaultDurationMinutes: diagnosticsTest?.defaultDurationMinutes,
        defaultBufferBeforeMinutes: diagnosticsTest?.defaultBufferBeforeMinutes ?? 0,
        defaultBufferAfterMinutes: diagnosticsTest?.defaultBufferAfterMinutes ?? 0,
        
      };

      const response = await addDiagnosticTest(payload).unwrap();
      if (testRequest?.id && response?.id) {
        try {
          await setDiagnosticTestForRequest({
            id: testRequest.id,
            diagnosticTestId: response.id
          }).unwrap();
        } catch (e) {
          console.error('Failed to link test with request', e);
        }
      }

      refetchDiagnostics();
      setDiagnosticsTest(response);

      dispatch(
        notify({
          msg: 'The Diagnostic Test was successfully added',
          sev: 'success'
        })
      );
    } catch (error: any) {
      console.error('Error adding Diagnostic Test:', error);
      dispatch(
        notify({
          msg: extractErrorMessage(error),
          sev: 'error'
        })
      );
    }
  };


  const handleUpdateDiagnosticTest = async () => {
    try {
      const errors = validateDiagnosticTest(diagnosticsTest);

      const isEmpty = (val) => val === null || val === undefined || val === '';
      const isNotEmpty = (val) => val !== null && val !== undefined && val !== '';
      if (
        diagnosticsTest?.parallelCapacityValue === null ||
        diagnosticsTest?.parallelCapacityValue === undefined ||
        diagnosticsTest?.parallelCapacityValue < 1
      ) {
        errors.push(
          'Field Parallel Capacity Value is required and should be greater than or equal to 1'
        );
      }
      if (diagnosticsTest?.appointable) {
        if (isEmpty(diagnosticsTest?.defaultDurationMinutes) || diagnosticsTest?.defaultDurationMinutes <= 0) {
          errors.push('Field Default Duration Minutes is required and should be greater than 0')
        }
        if (isEmpty(diagnosticsTest?.defaultBufferBeforeMinutes) || diagnosticsTest?.defaultBufferBeforeMinutes < 0) {
          errors.push('Field Default Buffer Before Minutes is required and should be greater then or equal 0')
        }
        if (isEmpty(diagnosticsTest?.defaultBufferAfterMinutes) || diagnosticsTest?.defaultBufferAfterMinutes < 0) {
          errors.push('Field Default Buffer After Minutes is required and should be greater then or equal 0')
        }
      }
      else {
        if (isNotEmpty(diagnosticsTest?.defaultDurationMinutes) && diagnosticsTest?.defaultDurationMinutes <= 0) {
          errors.push('Field Default Duration Minutes should be greater than 0')
        }
        if (isNotEmpty(diagnosticsTest?.defaultBufferBeforeMinutes) && diagnosticsTest?.defaultBufferBeforeMinutes < 0) {
          errors.push('Field Default Buffer Before Minutes should be greater then or equal 0')
        }
        if (isNotEmpty(diagnosticsTest?.defaultBufferAfterMinutes) && diagnosticsTest?.defaultBufferAfterMinutes < 0) {
          errors.push('Field Default Buffer After Minutes should be greater then or equal 0')
        }
      }

      if (errors.length > 0) {
        dispatch(
          notify({
            msg: errors.map(e => `• ${e}`).join('\n'),
            sev: 'warning'
          })
        );
        return;
      }

      const payload = {
        id: diagnosticsTest.id,
        type: diagnosticsTest.type,
        name: diagnosticsTest.name?.trim(),
        internalCode: diagnosticsTest.internalCode?.trim(),

        ageSpecific: diagnosticsTest.ageSpecific,
        ageGroupList: diagnosticsTest.ageGroupList || [],

        genderSpecific: diagnosticsTest.genderSpecific,
        gender: diagnosticsTest.gender,

        specialPopulation: diagnosticsTest.specialPopulation,
        specialPopulationValues: diagnosticsTest.specialPopulationValues || [],

        price: diagnosticsTest.price,
        currency: diagnosticsTest.currency,
        specialNotes: diagnosticsTest.specialNotes,

        isActive: diagnosticsTest.isActive,
        appointable: diagnosticsTest.appointable ?? false,

        defaultProfileResultType:
          diagnosticsTest.type === 'LABORATORY' ? diagnosticsTest.defaultProfileResultType : null,

        defaultProfileResultUnit:
          diagnosticsTest.type === 'LABORATORY' ? diagnosticsTest.defaultProfileResultUnit : null,

        listOfValueId: diagnosticsTest.listOfValueId ?? null,

       parallelCapacityValue: diagnosticsTest.parallelCapacityValue ?? 1,
        defaultDurationMinutes: diagnosticsTest?.defaultDurationMinutes,
        defaultBufferBeforeMinutes: diagnosticsTest.defaultBufferBeforeMinutes ?? 0,
        defaultBufferAfterMinutes: diagnosticsTest.defaultBufferAfterMinutes ?? 0,
      };

      const response = await updateDiagnosticTest(payload).unwrap();

      refetchDiagnostics();
      setDiagnosticsTest({ ...response });

      dispatch(
        notify({
          msg: 'The Diagnostic Test was successfully updated',
          sev: 'success'
        })
      );
    } catch (error: any) {
      console.error('Error updating Diagnostic Test:', error);
      dispatch(
        notify({
          msg: extractErrorMessage(error),
          sev: 'error'
        })
      );
    }
  };


  const handleToggleActive = async (id: number) => {
    try {
      await toggleDiagnosticTestActive(id).unwrap();
      dispatch(notify({ msg: 'Status updated successfully', sev: 'success' }));
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
    } catch {
      dispatch(notify({ msg: 'Failed to update status', sev: 'error' }));
    }
  };

  const handleDeactiveReactivateDiagnostic = () => {
    handleToggleActive(diagnosticsTest.id);
    setOpenConfirmDeleteDiagnosticTest(false);
  };


  // Handle filter change
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<DiagnosticTest[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [valueType, setValueType] = useState({ type: '' });
  const handleFilterChange = async (
    field: string,
    value: string,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    try {
      if (!field) {
        setIsFiltered(false);
        setFilteredList([]);
        setFilteredTotal(0);
        setFilterPagination(prev => ({ ...prev, page: 0 }));
        return;
      }

      const trimmedValue = value?.trim?.() ?? '';
      if (field === 'type' && !trimmedValue) {
        setIsFiltered(false);
        setFilteredList([]);
        setFilteredTotal(0);
        setFilterPagination(prev => ({ ...prev, page: 0 }));
        return;
      }
      if (field !== 'type' && !trimmedValue) {
        setIsFiltered(false);
        setFilteredList([]);
        setFilteredTotal(0);
        setFilterPagination(prev => ({ ...prev, page: 0 }));
        return;
      }

      let response;

      if (field === 'type') {
        response = await diagnosticTestByTypes({
          type: trimmedValue,
          page,
          size,
          sort
        }).unwrap();
      } else if (field === 'name') {
        response = await diagnosticTestByName({
          name: trimmedValue,
          page,
          size,
          sort
        }).unwrap();
      } else {
        setIsFiltered(false);
        setFilteredTotal(0);
        setFilterPagination(prev => ({ ...prev, page: 0 }));
        return;
      }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setFilterPagination(prev => ({
        ...prev,
        page,
        size,
        sort
      }));
      setIsFiltered(true);
    } catch (error) {
      console.error('Error filtering diagnostic tests:', error);
      dispatch(
        notify({
          msg: 'Failed to filter Diagnostic Tests',
          sev: 'error'
        })
      );
      setIsFiltered(false);
      setFilteredTotal(0);
      setFilterPagination(prev => ({ ...prev, page: 0 }));
    }
  };

  // Pagination values
  const totalCount = diagnodticsTestList?.totalCount ?? 0;
  const pageIndex = isFiltered ? filterPagination.page : paginationParams.page;
  const rowsPerPage = isFiltered ? filterPagination.size : paginationParams.size;

  // Available fields for filtering
  const filterFields = [
    { label: 'Type', value: 'type' },
    { label: 'Name', value: 'name' }
  ];

  // Header page setUp
  const divContent = 'Diagnostics Tests Definition';


useEffect(() => {
  dispatch(setPageCode('Diagnostics_Tests'));
  dispatch(setDivContent(divContent));

  return () => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(''));
  };
}, [dispatch]);

  const isSelected = rowData => {
    if (rowData && diagnosticsTest && rowData.id === diagnosticsTest.id) {
      return 'selected-row';
    } else return '';
  };

  const isRowDisabled = (rowData: DiagnosticTest) => {
    if (!testRequest) return false;
    if (diagnosticsTest?.id) {
      return rowData.id !== diagnosticsTest.id;
    }

    return false;
  };

  const iconsForActions = (rowData: any) => {
    const disabled = isRowDisabled(rowData);



    return (
      <div className="container-of-icons">
        {/* Edit */}
        <MdModeEdit
          className="icons-style"
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            if (disabled) return;
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
              if (disabled) return;
              setDiagnosticsTest(rowData);
              setOpenConfirmDeleteDiagnosticTest(true);
              setStateOfDeleteDiagnosticTest('deactivate');
            }}
          />
        ) : (
          <FaUndo
            title="Activate"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => {
              if (disabled) return;
              setDiagnosticsTest(rowData);
              setOpenConfirmDeleteDiagnosticTest(true);
              setStateOfDeleteDiagnosticTest('reactivate');
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
            if (disabled) return;
            setOpenCodingModal(true);
          }}
        />

        {rowData?.type !== 'LABORATORY' && (
          <MdOutlineDescription
            className="icons-style"
            title="Template"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              if (disabled) return;
              setDiagnosticsTest(rowData);
              setOpenTemplateModal(true);
            }}
          />
        )}

        {/* Profile or Normal Range */}
        {rowData?.type === 'LABORATORY' && (
          <RiFileList2Fill
            className="icons-style"
            title="Profile Setup"
            size={21}
            fill="var(--primary-gray)"
            onClick={() => {
              if (disabled) return;
              setOpenProfileModal(true);
            }}
          />
        )}

        {rowData?.type === 'LABORATORY' && (
          <DefaultProfileIndicator
            testId={rowData.id}
            testType={rowData.type}
            onClick={() => {
              if (disabled) return;
              setDiagnosticsTest(rowData);
              setOpenNormalRangesDirectly(true);
              setOpenProfileModal(true);
            }}
          />
        )}


      </div>
    );
  }

  //Table columns
  const tableColumns = [
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      render: rowData => <p>{formatEnumString(rowData?.type)}</p>
    },

    {
      key: 'name',
      title: <Translate>Name</Translate>,
      render: rowData => <p>{rowData?.name}</p>
    },
    {
      key: 'internalCode',
      title: <Translate>Internal Code</Translate>
    },

    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: DiagnosticTest) => <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>
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
          setRecordOfFilter(prev => {
            if (prev.filter !== updatedRecord.filter) {
              setIsFiltered(false);
              setFilteredList([]);
              setFilteredTotal(0);
              setFilterPagination(fp => ({ ...fp, page: 0 }));
            }
            return {
              filter: updatedRecord.filter,
              value: ''
            };
          });
          if (updatedRecord.filter !== 'type') {
            setValueType({ type: '' });
          }
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />

      {recordOfFilter.filter !== 'type' && (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />
      )}

      {recordOfFilter.filter === 'type' && (
        <MyInput
          width="9vw"
          fieldLabel="Test Type"
          fieldType="select"
          fieldName="type"
          selectData={testType ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={valueType}
          setRecord={updatedRecord => {
            setValueType({ type: updatedRecord.type });
          }}
          showLabel={false}
          searchable={false}
        />
      )}
      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() => {
          const valueForFilter =
            recordOfFilter.filter === 'type' ? valueType.type : recordOfFilter.value;
          handleFilterChange(recordOfFilter.filter, valueForFilter);
        }}
      >
        Search
      </MyButton>
    </Form>
  );

  // handle click on add new button
  const handleNew = () => {
    setOpenAddEditDiagnosticTestPopup(true);

    setDiagnosticsTest({
      ...newDiagnosticTest,
      type: testRequest?.type ?? newDiagnosticTest.type
    });
  };

  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    if (!openProfileModal) {
      setOpenNormalRangesDirectly(false);
    }
  }, [openProfileModal]);

  useEffect(() => {
    if (testRequest?.type) {

      setDiagnosticsTest(prev => ({
        ...prev,
        type: testRequest.type
      }));
    }
  }, [testRequest?.type]);

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={isFiltered ? filteredList : diagnodticsTestList?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          if (isRowDisabled(rowData)) return;
          setDiagnosticsTest(rowData);
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(column, type) => {
          if (!column) return;
          const nextSortType = (type ?? 'asc') as 'asc' | 'desc';
          const sortValue = `${column},${nextSortType}`;
          const currentlyFiltered = isFiltered;
          setSortColumn(column);
          setSortType(nextSortType);
          setPaginationParams(prev => ({
            ...prev,
            sort: sortValue,
            page: currentlyFiltered ? prev.page : 0,
            timestamp: currentlyFiltered ? prev.timestamp : Date.now()
          }));
          if (currentlyFiltered) {
            setFilterPagination(prev => ({
              ...prev,
              sort: sortValue,
              page: 0
            }));
            const valueForFilter =
              recordOfFilter.filter === 'type' ? valueType.type : recordOfFilter.value;
            handleFilterChange(
              recordOfFilter.filter,
              valueForFilter,
              0,
              filterPagination.size,
              sortValue
            );
          }
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={event => {
          const newSize = Number(event.target.value);
          if (Number.isNaN(newSize) || newSize <= 0) {
            return;
          }
          if (isFiltered) {
            setFilterPagination(prev => ({
              ...prev,
              size: newSize,
              page: 0
            }));
            const valueForFilter =
              recordOfFilter.filter === 'type' ? valueType.type : recordOfFilter.value;
            handleFilterChange(recordOfFilter.filter, valueForFilter, 0, newSize);
          } else {
            setPaginationParams(prev => ({
              ...prev,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            }));
          }
        }}
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
      <AddEditDiagnosticTest
        open={openAddEditDiagnosticTestPopup}
        setOpen={setOpenAddEditDiagnosticTestPopup}
        diagnosticsTest={diagnosticsTest}
        setDiagnosticsTest={setDiagnosticsTest}
        handleSave={() =>
          diagnosticsTest.id
            ? handleUpdateDiagnosticTest()
            : handleAddNewDiagnosticTest()
        }
        width={width}
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
        openNormalRanges={openNormalRangesDirectly}
      />

      {openTemplateModal && diagnosticsTest?.id && (
        <DiagnosticTestTemplate
          open={openTemplateModal}
          setOpen={setOpenTemplateModal}
          testId={diagnosticsTest.id}
          testName={diagnosticsTest.name}
        />
      )}
    </Panel>
  );
};

export default DiagnosticsTest;
