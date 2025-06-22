import React, { useEffect, useState } from 'react';
import {
  useGetDiagnosticsTestNormalRangeListQuery,
  useGetDiagnosticsTestProfileListQuery,
  useGetLovValuesByCodeQuery,
  useRemoveDiagnosticsTestProfileMutation,
  useSaveDiagnosticsTestNormalRangeMutation,
  useSaveDiagnosticsTestProfileMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { initialListRequest } from '@/types/types';
import { MdDelete } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaChartLine } from 'react-icons/fa';
import { ApDiagnosticTestNormalRange, ApDiagnosticTestProfile } from '@/types/model-types';
import {
  newApDiagnosticTestNormalRange,
  newApDiagnosticTestProfile
} from '@/types/model-types-constructor';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddNormalRange from './AddNormalRange';
const Profile = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  const [selectedLOVs, setSelectedLOVs] = useState([]);
  const [diagnosticsTestProfile, setDiagnosticsTestProfile] = useState<ApDiagnosticTestProfile>({
    ...newApDiagnosticTestProfile
  });
  const [openConfirmDeleteProfile, setOpenConfirmDeleteProfile] = useState<boolean>(false);
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [openSubChild, setOpenSubChild] = useState<boolean>(false);
  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<ApDiagnosticTestNormalRange>({
      ...newApDiagnosticTestNormalRange
    });
  const [newDiagnosticsTestProfile, setNewDiagnosticsTestProfile] =
    useState<ApDiagnosticTestProfile>({
      ...newApDiagnosticTestProfile
    });
  const [listRequestQuery] = useState({
    ...initialListRequest,
    pageSize: 100,
    filters: [
      {
        fieldName: 'test_key',
        operator: 'match',
        value: diagnosticsTest.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    filters: [
      {
        fieldName: 'diagnostic_test_key',
        operator: 'match',
        value: diagnosticsTest?.key || undefined || null
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  const [normalRangeListRequest, setNormalRangeListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    filters: [
      {
        fieldName: 'test_key',
        operator: 'match',
        value: diagnosticsTest.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'is_profile',
        operator: 'match',
        value: true
      },
      {
        fieldName: 'profile_test_key',
        operator: 'match',
        value: diagnosticsTestProfile.key || undefined
      }
    ]
  });
  // Fetch units Lov response
  const { data: unitsLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch diagnostics test profile List response
  const {
    data: diagnosticsTestProfileListResponse,
    refetch: refetchDiagnosticsTestProfile,
    isFetching
  } = useGetDiagnosticsTestProfileListQuery(listRequest);
  // Fetch normal range List response
  const {
    data: normalRangeListResponse,
    refetch: refetchNormalRange,
    isFetching: isFetchingNormalRanges
  } = useGetDiagnosticsTestNormalRangeListQuery(normalRangeListRequest);
  // save diagnostics Test Profile
  const [saveDiagnosticsTestProfile] = useSaveDiagnosticsTestProfileMutation();
  // remove diagnostics Test Profile
  const [removeDiagnosticsTestProfile] = useRemoveDiagnosticsTestProfileMutation();
   // save diagnostics test normal range
  const [saveDiagnosticsTestNormalRange] = useSaveDiagnosticsTestNormalRangeMutation();
  // class name for selected row 
  const isSelected = rowData => {
    if (rowData && diagnosticsTestProfile && rowData.key === diagnosticsTestProfile.key) {
      return 'selected-row';
    } else return '';
  };
   // class name for selected row 
  const isSelectedDiagnosticTestNormalRange = rowData => {
    if (rowData && diagnosticTestNormalRange && rowData.key === diagnosticTestNormalRange.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Remove, Test Normal Ranges)
  const iconsForActions = () => (
    <div className="container-of-icons-diagnostic">
      <MdDelete
        className="icons-diagnostic"
        title="Remove"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteProfile(true);
        }}
      />
      <FaChartLine
        className="icons-diagnostic"
        title="Test Normal Ranges"
        size={21}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenChild(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'testName',
      title: <Translate>Test Name</Translate>,
      render: rowData => <span>{rowData.testName}</span>
    },
    {
      key: 'LovValues',
      title: <Translate>Result Unit</Translate>,
      render: rowData => (
        <span>
          {rowData.resultUnitLvalue
            ? rowData.resultUnitLvalue.lovDisplayVale
            : rowData.resultUnitLkey}
        </span>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  //Table columns
  const tableNormalRangesColumns = [
    {
      key: 'gender',
      title: <Translate>Gender</Translate>,
      render: rowData =>
        rowData.genderLvalue ? rowData.genderLvalue.lovDisplayVale : rowData.genderLkey
    },
    {
      key: 'ageFromTo',
      title: <Translate>Age From - To</Translate>,
      render: rowData => (
        <span>
          {rowData.ageFrom}
          {rowData.ageFromUnitLvalue
            ? rowData.ageFromUnitLvalue.lovDisplayVale
            : rowData.ageFromUnitLkey}{' '}
          - {rowData.ageTo}
          {rowData.ageToUnitLvalue ? rowData.ageToUnitLvalue.lovDisplayVale : rowData.ageToUnitLkey}
        </span>
      )
    },
    {
      key: 'normalRange',
      title: <Translate>Normal Range</Translate>,
      render: rowData =>
        rowData.resultTypeLkey === '6209569237704618' ? (
          <span>
            {rowData.rangeFrom} - {rowData.rangeTo}
          </span>
        ) : (
          <span>
            {rowData.rangeFrom} {rowData.rangeTo}
          </span>
        )
    },
    {
      key: 'lovValues',
      title: <Translate>LOV Values</Translate>,
      render: rowData => <span>{rowData.lovList}</span>
    },
    {
      key: 'condition',
      title: <Translate>Condition</Translate>,
      render: rowData =>
        rowData.conditionLvalue ? rowData.conditionLvalue.lovDisplayVale : rowData.conditionLkey
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    }
  ];

  // handle save diagnostics test profile
  const handleSave = () => {
    saveDiagnosticsTestProfile({
      ...newDiagnosticsTestProfile,
      diagnosticTestKey: diagnosticsTest.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => refetchDiagnosticsTestProfile());
    dispatch(notify('Added Successfully '));

    setNewDiagnosticsTestProfile({
      ...newApDiagnosticTestProfile,
      diagnosticTestKey: diagnosticsTest.key,
      resultUnitLkey: null
    });
  };

  // handle remove diagnostics test profile
  const handleRemove = () => {
    setOpenConfirmDeleteProfile(false);
    removeDiagnosticsTestProfile({
      ...diagnosticsTestProfile,
      deletedBy: 'Administrator'
    })
      .unwrap()
      .then(() => refetchDiagnosticsTestProfile());
    dispatch(notify('Deleted Successfully '));
  };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className='container-of-add-bar-diagnostic'>
              <div className='container-of-two-fields-diagnostic' >
                <MyInput
                  width={150}
                  showLabel={false}
                  placeholder="Test Name"
                  fieldName="testName"
                  record={newDiagnosticsTestProfile}
                  setRecord={setNewDiagnosticsTestProfile}
                />
                <MyInput
                  showLabel={false}
                  placeholder="Select Result Unit"
                  width={160}
                  menuMaxHeight={200}
                  fieldName="resultUnitLkey"
                  fieldType="select"
                  selectData={unitsLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={newDiagnosticsTestProfile}
                  setRecord={setNewDiagnosticsTestProfile}
                />
              </div>
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleSave}
                width="109px"
              >
                Add
              </MyButton>
            </div>
            <MyTable
              height={380}
              data={diagnosticsTestProfileListResponse?.object ?? []}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setDiagnosticsTestProfile(rowData);
              }}
            
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteProfile}
              setOpen={setOpenConfirmDeleteProfile}
              itemToDelete="Profile Test"
              actionButtonFunction={handleRemove}
              actionType="Delete"
            />
          </Form>
        );
    }
  };
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <Form fluid>
        <div className="container-of-add-new-button-diagnostic">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setOpenSubChild(true);
            }}
            width="109px"
          >
            Add New
          </MyButton>
        </div>
        <MyTable
          height={380}
          data={normalRangeListResponse?.object ?? []}
          loading={isFetchingNormalRanges}
          columns={tableNormalRangesColumns}
          rowClassName={isSelectedDiagnosticTestNormalRange}
          onRowClick={rowData => {
            setDiagnosticTestNormalRange(rowData);
          }}
        />
      </Form>
    );
  };
  // Child modal content
  const conjureFormContentOfSecondChildModal = () => {
    return (
      <AddNormalRange
        diagnosticTestNormalRange={diagnosticTestNormalRange}
        setDiagnosticTestNormalRange={setDiagnosticTestNormalRange}
        listRequestQuery={listRequestQuery}
      />
    );
  };
   // handle save normal range
   const handleSaveNormalRange = async () => {
    try {
      await saveDiagnosticsTestNormalRange({
        diagnosticTestNormalRange: {
          ...diagnosticTestNormalRange,
          testKey: diagnosticsTest.key,
          profileTestKey: diagnosticsTestProfile.key,
          isProfile: true
        },
        lov: selectedLOVs
      }).unwrap();
      refetchNormalRange();
      setDiagnosticTestNormalRange({
        ...newApDiagnosticTestNormalRange,
        ageToUnitLkey: null,
        ageFromUnitLkey: null,
        normalRangeTypeLkey: null,
        resultLovKey: null
      });
      dispatch(notify('Normal Range Saved Successfully'));
    } catch (error) {
      console.error('Error saving Normal Range:', error);
    }
  };

   // Effects
  useEffect(() => {
    refetchDiagnosticsTestProfile();
    setListRequest({
      ...initialListRequest,
      pageSize: 100,
      filters: [
        {
          fieldName: 'diagnostic_test_key',
          operator: 'match',
          value: diagnosticsTest?.key || undefined || null
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });
  }, [diagnosticsTest]);

  useEffect(() => {
    setNormalRangeListRequest({
      ...initialListRequest,
      pageSize: 100,
      filters: [
        {
          fieldName: 'test_key',
          operator: 'match',
          value: diagnosticsTest.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        {
          fieldName: 'is_profile',
          operator: 'match',
          value: true
        },
        {
          fieldName: 'profile_test_key',
          operator: 'match',
          value: diagnosticsTestProfile.key || undefined
        }
      ]
    });
    refetchNormalRange();
  }, [diagnosticsTestProfile, diagnosticsTest]);

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'diagnostic_test_key',
        operator: 'match',
        value: diagnosticsTest?.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));

    const updatedFilters2 = [
      {
        fieldName: 'test_key',
        operator: 'match',
        value: diagnosticsTest.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'profile_test_key',
        operator: 'match',
        value: diagnosticsTestProfile.key || undefined
      }
    ];

    setNormalRangeListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters2
    }));

    setDiagnosticTestNormalRange(prevState => ({
      ...prevState,
      testKey: diagnosticsTest.key
    }));
  }, [diagnosticsTest.key]);

  useEffect(() => {
    if (diagnosticTestNormalRange) {
      setSelectedLOVs(diagnosticTestNormalRange.lovList);
    } else {
      setDiagnosticTestNormalRange(newApDiagnosticTestNormalRange);
    }
  }, [diagnosticTestNormalRange]);
  
 

  return (
    <ChildModal
      actionButtonLabel="Save"
      hideActionBtn
      open={open}
      setOpen={setOpen}
      showChild={openChild}
      setShowChild={setOpenChild}
      showSubChild={openSubChild}
      setShowSubChild={setOpenSubChild}
      title="Profiles"
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Profile', icon: <FaChartLine /> }]}
      childStep={[{ title: 'Normal Range Info', icon: <FaChartLine /> }]} 
      childTitle="Nothin currently"
      childContent={conjureFormContentOfChildModal}
      actionSubChildButtonFunction={handleSaveNormalRange}
      subChildTitle="Add Normal Range"
      subChildContent={conjureFormContentOfSecondChildModal}
      mainSize="sm"

    />
  );
};
export default Profile;
