import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useSetDiagnosticTestForRequestMutation } from '@/services/diagnosic-order/diagnosticTestRequestService';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCreateDiagnosticTestMutation,
  useGetAllDiagnosticTestsQuery,
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { MdDelete, MdModeEdit, MdOutlineDescription, MdLocalOffer } from 'react-icons/md';
import { RiFileList2Fill } from 'react-icons/ri';
import { Panel } from 'rsuite';
import AddEditDiagnosticTest from './AddEditDiagnosticTest';
import PriceListPrompt, { usePriceListPrompt } from '@/components/PriceListPrompt';
import Coding from './Coding';
import DefaultProfileIndicator from './DefaultProfileIndicator';
import DiagnosticTestTemplate from './DiagnosticTestTemplate';
import PolicyAssignmentManager from '@/components/PolicyAssignment';
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
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { type: '', name: '', shortName: '', internalCode: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter =
    statusFilter === 'all' ? undefined : statusFilter === 'active';
  const [openConfirmDiagnosticTest, setOpenConfirmDeleteDiagnosticTest] = useState<boolean>(false);
  const [stateOfDeleteDiagnosticTest, setStateOfDeleteDiagnosticTest] = useState<string>('delete');
  const [openCodingModal, setOpenCodingModal] = useState<boolean>(false);
  const [openTemplateModal, setOpenTemplateModal] = useState<boolean>(false);
  const [openProfileModal, setOpenProfileModal] = useState<boolean>(false);
  const [openPolicyAssignmentModal, setOpenPolicyAssignmentModal] = useState<boolean>(false);
  const [selectedDiagnosticTestForPolicyAssignment, setSelectedDiagnosticTestForPolicyAssignment] =
    useState<DiagnosticTest | null>(null);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openAddEditDiagnosticTestPopup, setOpenAddEditDiagnosticTestPopup] =
    useState<boolean>(false);
  const priceListPrompt = usePriceListPrompt();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const {
    data: diagnodticsTestList,
    refetch: refetchDiagnostics,
    isFetching
  } = useGetAllDiagnosticTestsQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter
  });

  const testType = useEnumOptions('TestType');

  const [addDiagnosticTest, addDiagnosticTestMutation] = useCreateDiagnosticTestMutation();
  const [updateDiagnosticTest, updateDiagnosticTestMutation] = useUpdateDiagnosticTestMutation();
  const [toggleDiagnosticTestActive, togglePractitionerActiveMutation] =
    useToggleDiagnosticTestActiveMutation();
  const [setDiagnosticTestForRequest] =
    useSetDiagnosticTestForRequestMutation();
  const [openNormalRangesDirectly, setOpenNormalRangesDirectly] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null); // 🔥
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
        shortName: diagnosticsTest.name?.trim(),
        hl7IntegrationCode: diagnosticsTest.hl7IntegrationCode?.trim(),
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
        modality: diagnosticsTest?.modality,
        loincCodeId:
          diagnosticsTest.type === 'LABORATORY' ? diagnosticsTest.loincCodeId ?? null : null

      };

      const response = await addDiagnosticTest(payload).unwrap();
      priceListPrompt.prompt({
        itemType: response?.type ?? diagnosticsTest.type,
        sourceId: response?.id ?? diagnosticsTest.id,
        itemCode: response?.internalCode ?? payload.internalCode,
        itemName: response?.name ?? payload.name,
        unitPrice: response?.price ?? payload.price,
        currency: response?.currency ?? payload.currency
      });
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

      await refetchDiagnostics();
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
        shortName: diagnosticsTest.shortName?.trim(),
        hl7IntegrationCode: diagnosticsTest.hl7IntegrationCode?.trim(),
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
        modality: diagnosticsTest?.modality,
        loincCodeId:
          diagnosticsTest.type === 'LABORATORY' ? diagnosticsTest.loincCodeId ?? null : null

      };

      const response = await updateDiagnosticTest(payload).unwrap();
      priceListPrompt.prompt({
        itemType: response?.type ?? diagnosticsTest.type,
        sourceId: response?.id ?? diagnosticsTest.id,
        itemCode: response?.internalCode ?? payload.internalCode,
        itemName: response?.name ?? payload.name,
        unitPrice: response?.price ?? payload.price,
        currency: response?.currency ?? payload.currency
      });

      await refetchDiagnostics();
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
      const currentItem = (diagnodticsTestList?.data ?? []).find(item => item.id === id);

      if (!currentItem) return;

      const newActiveStatus = !currentItem.isActive;


      await toggleDiagnosticTestActive(id).unwrap();

      setDiagnosticsTest(prev => ({
        ...prev,
        isActive: newActiveStatus
      }));

      await refetchDiagnostics();

      dispatch(
        notify({
          msg: newActiveStatus
            ? 'Diagnostic Test activated successfully'
            : 'Diagnostic Test deactivated successfully',
          sev: 'success'
        })
      );
    } catch (error) {
      console.error(error);

      dispatch(
        notify({
          msg: 'Failed to update status',
          sev: 'error'
        })
      );
    }
  };

  const handleDeactiveReactivateDiagnostic = async () => {
    if (!diagnosticsTest?.id) return;

    try {
      await handleToggleActive(diagnosticsTest.id);
    } finally {
      setOpenConfirmDeleteDiagnosticTest(false);
    }
  };


  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  // Pagination values
  const totalCount = diagnodticsTestList?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;


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
        <MdLocalOffer
          className="icons-style"
          title="Price Lists"
          size={24}
          fill="var(--primary-gray)"
          onClick={() =>
            priceListPrompt.view({
              itemType: rowData.type,
              sourceId: rowData.id,
              itemCode: rowData.internalCode,
              itemName: rowData.name,
              unitPrice: rowData.price,
              currency: rowData.currency
            })
          }
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

        <FontAwesomeIcon
          icon={faClipboardList}
          title="Policy Assignment"
          className="icons-style"
          color="var(--primary-gray)"
          size="lg"
          onClick={() => {
            setSelectedDiagnosticTestForPolicyAssignment(rowData);
            setOpenPolicyAssignmentModal(true);
          }}
        />

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
            onClick={(profile) => {
              if (disabled) return;

              setDiagnosticsTest(rowData);
              setSelectedProfile(profile);
              setOpenNormalRangesDirectly(true);
            }}
          />
        )}


      </div>
    );
  }

  //Table columns
  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  const tableColumns = [
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      width: 150,
      ...headerSearch('type'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(testType ?? [])],
      render: rowData => <p>{formatEnumString(rowData?.type)}</p>
    },

    {
      key: 'name',
      title: <Translate>Name</Translate>,
      width: 220,
      ...headerSearch('name', 'Search name'),
      render: rowData => <p>{rowData?.name}</p>
    },
    {
      key: 'shortName',
      title: <Translate>Short Name</Translate>,
      width: 170,
      ...headerSearch('shortName', 'Search short name'),
      render: rowData => <p>{rowData?.shortName}</p>
    },
    {
      key: 'internalCode',
      title: <Translate>Internal Code</Translate>,
      width: 150,
      ...headerSearch('internalCode', 'Search code')
    },
    {
      key: 'loincCode',
      title: <Translate>LOINC</Translate>,
      flexGrow: 2,
      render: (rowData: DiagnosticTest) => {
        if (!rowData?.loincCode) return <p>—</p>;
        return (
          <p>
            {rowData.loincCode}
            {rowData.loincDescription ? ` — ${rowData.loincDescription}` : ''}
          </p>
        );
      }
    },

    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) =>
        setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: (rowData: DiagnosticTest) => <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

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
      setSelectedProfile(null);
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


  useEffect(() => {
    if (selectedProfile) {
      setOpenProfileModal(true);
    }
  }, [selectedProfile]);


  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel dir={dir}>
      <MyTable
        key={paginationParams.timestamp}
        height={450}
        data={diagnodticsTestList?.data ?? []}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
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
          setSortColumn(column);
          setSortType(nextSortType);
          setPaginationParams(prev => ({
            ...prev,
            sort: sortValue,
            page: 0,
            timestamp: Date.now()
          }));
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={event => {
          const newSize = Number(event.target.value);
          if (Number.isNaN(newSize) || newSize <= 0) {
            return;
          }
          setPaginationParams(prev => ({
            ...prev,
            size: newSize,
            page: 0,
            timestamp: Date.now()
          }));
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
      <PriceListPrompt prompt={priceListPrompt} />

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
        selectedProfile={selectedProfile}
        openNormalRanges={openNormalRangesDirectly}
      />

      <MyModal
        open={openPolicyAssignmentModal}
        setOpen={setOpenPolicyAssignmentModal}
        title="Policy Assignment"
        bodyheight="70vh"
        size="70vw"
        hideBack
        content={
          selectedDiagnosticTestForPolicyAssignment?.id ? (
            <PolicyAssignmentManager
              resourceType="DIAGNOSTIC_TEST"
              resourceId={selectedDiagnosticTestForPolicyAssignment.id}
              facilityId={selectedDiagnosticTestForPolicyAssignment.facilityId}
              showHeader={false}
              onSaved={() => {
                refetchDiagnostics();
              }}
            />
          ) : (
            <div style={{ padding: 16 }}>Please select a diagnostic test.</div>
          )
        }
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