import React, { useEffect, useState } from 'react';
import {
  useGetDiagnosticsTestNormalRangeListQuery,
  useGetLovValuesByCodeQuery,
  useRemoveDiagnosticsTestProfileMutation,
  useSaveDiagnosticsTestNormalRangeMutation,
 
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
  
} from '@/types/model-types-constructor';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddNormalRange from './AddNormalRange';
import {  useGetAllDiagnosticTestProfilesQuery,
  useGetDiagnosticTestProfilesByTestIdQuery,
  useCreateDiagnosticTestProfileMutation,
  useUpdateDiagnosticTestProfileMutation,
  useDeleteDiagnosticTestProfileMutation,
  useDeleteDiagnosticTestProfilesByTestIdMutation } from '@/services/setup/diagnosticTestProfileService';
import { DiagnosticTestProfile } from '@/types/model-types-new';
import { newDiagnosticTestProfile } from '@/types/model-types-constructor-new';
import { conjureValueBasedOnKeyFromList } from '@/utils';
const Profile = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  const [selectedLOVs, setSelectedLOVs] = useState([]);
  const [diagnosticsTestProfile, setDiagnosticsTestProfile] = useState<DiagnosticTestProfile>({
    ...newDiagnosticTestProfile
  });
  const [openConfirmDeleteProfile, setOpenConfirmDeleteProfile] = useState<boolean>(false);
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [openSubChild, setOpenSubChild] = useState<boolean>(false);
  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<ApDiagnosticTestNormalRange>({
      ...newApDiagnosticTestNormalRange
    });
  // const [newDiagnosticsTestProfile, setNewDiagnosticsTestProfile] =
  //   useState<ApDiagnosticTestProfile>({
  //     ...newApDiagnosticTestProfile
  //   });
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


  const [paginationParams, setPaginationParams] = useState({
  page: 0,
  size: 5,
  sort: "id,asc",
  timestamp: Date.now(),
});

const { data: allDiagnosticTestProfiles ,refetch:refetchDiagnosticsTestProfile,isFetching} = useGetDiagnosticTestProfilesByTestIdQuery({
  testId: diagnosticsTest?.id ,
  page: paginationParams.page,
  size: paginationParams.size,
  sort: paginationParams.sort,
}, { skip: !diagnosticsTest?.id });

  // Fetch normal range List response
  const {
    data: normalRangeListResponse,
    refetch: refetchNormalRange,
    isFetching: isFetchingNormalRanges
  } = useGetDiagnosticsTestNormalRangeListQuery(normalRangeListRequest);
  // save diagnostics Test Profile

  const [addTestProfile]=useCreateDiagnosticTestProfileMutation();
  const [updateTestProfile]=useUpdateDiagnosticTestProfileMutation();
  const [deleteTestProfile]=useDeleteDiagnosticTestProfileMutation();
  // remove diagnostics Test Profile
  const [removeDiagnosticsTestProfile] = useRemoveDiagnosticsTestProfileMutation();
   // save diagnostics test normal range
  const [saveDiagnosticsTestNormalRange] = useSaveDiagnosticsTestNormalRangeMutation();
  // class name for selected row 
  const isSelected = rowData => {
    if (rowData && diagnosticsTestProfile && rowData.id === diagnosticsTestProfile.id) {
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
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Remove"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteProfile(true);
        }}
      />
      <FaChartLine
        className="icons-style"
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
      key: 'name',
      title: <Translate>Test Name</Translate>,
      render: rowData => <span>{rowData.name}</span>
    },
    {
      key: 'LovValues',
      title: <Translate>Result Unit</Translate>,
      render: rowData => (
        <span>
         {conjureValueBasedOnKeyFromList(
                    unitsLovQueryResponse?.object?? [],
                    rowData.resultUnit,
                    'lovDisplayVale'
                  )}
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
   if(diagnosticsTestProfile.id){
    updateTestProfile({
      id:diagnosticsTestProfile.id,
      body:{
      ...diagnosticsTestProfile,
      testId: diagnosticsTest.id}
    })
      .unwrap()
      .then(() => refetchDiagnosticsTestProfile());
    dispatch(notify('Updated Successfully '));
   }
    else{
    addTestProfile({
      ...diagnosticsTestProfile,
      testId: diagnosticsTest.id
    })
      .unwrap()
      .then(() => refetchDiagnosticsTestProfile());
    dispatch(notify('Added Successfully '));
   }
  };

  // handle remove diagnostics test profile
  const handleRemove = () => {
    setOpenConfirmDeleteProfile(false);
    deleteTestProfile(diagnosticsTestProfile.id)
      .unwrap()
      .then(() => {
        refetchDiagnosticsTestProfile();
        setDiagnosticsTestProfile({
          ...newDiagnosticTestProfile
        });
        dispatch(notify('Deleted Successfully '));
      });
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
                  fieldName="name"
                  record={diagnosticsTestProfile}
                  setRecord={setDiagnosticsTestProfile}
                />
                <MyInput
                  showLabel={false}
                  placeholder="Select Result Unit"
                  width={160}
                  menuMaxHeight={200}
                  fieldName="resultUnit"
                  fieldType="select"
                  selectData={unitsLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                 record={diagnosticsTestProfile}
                  setRecord={setDiagnosticsTestProfile}
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
              data={allDiagnosticTestProfiles?.data ?? []}
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
        <div className="container-of-add-new-button">
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
          testKey: diagnosticsTest.id,
          profileTestKey: diagnosticsTestProfile.id,
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
          value: diagnosticsTestProfile.id || undefined
        }
      ]
    });
    refetchNormalRange();
  }, [diagnosticsTestProfile, diagnosticsTest]);



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
