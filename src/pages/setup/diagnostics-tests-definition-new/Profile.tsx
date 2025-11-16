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
import { MdDelete } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaChartLine } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddNormalRange from './AddNormalRange';
import {
  useGetDiagnosticTestProfilesByTestIdQuery,
  useCreateDiagnosticTestProfileMutation,
  useUpdateDiagnosticTestProfileMutation,
  useDeleteDiagnosticTestProfileMutation} from '@/services/setup/diagnosticTestProfileService';

  import {
    useGetDiagnosticTestNormalRangesByTestIdQuery,
    useCreateDiagnosticTestNormalRangeMutation,
    useUpdateDiagnosticTestNormalRangeMutation,
    useDeleteDiagnosticTestNormalRangeMutation,
    useGetDiagnosticTestNormalRangesByProfileTestIdQuery} from '@/services/setup/diagnosticTest/diagnosticTestNormalRangeService';

import { DiagnosticTestNormalRange, DiagnosticTestProfile } from '@/types/model-types-new';
import { newDiagnosticTestNormalRange, newDiagnosticTestProfile, newLaboratory, newPathology } from '@/types/model-types-constructor-new';
import { conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';
const Profile = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  const [diagnosticsTestProfile, setDiagnosticsTestProfile] = useState<DiagnosticTestProfile>({
    ...newDiagnosticTestProfile
  });
  const [openConfirmDeleteProfile, setOpenConfirmDeleteProfile] = useState<boolean>(false);
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [openSubChild, setOpenSubChild] = useState<boolean>(false);
  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<DiagnosticTestNormalRange>({
      ...newDiagnosticTestNormalRange
    });
 

    const [createDiagnosticTestNormalRange] = useCreateDiagnosticTestNormalRangeMutation();
    const [updateDiagnosticTestNormalRange] = useUpdateDiagnosticTestNormalRangeMutation();
    
    const [laboratory,setLaboratory]=useState({...newLaboratory});

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
} = useGetDiagnosticTestNormalRangesByProfileTestIdQuery(
  {
    profileTestId: diagnosticsTestProfile?.id,
    page: paginationParams.page,
    size: paginationParams.size,
  },
  { skip: !diagnosticsTestProfile?.id }
);


  // save diagnostics Test Profile

  const [addTestProfile]=useCreateDiagnosticTestProfileMutation();
  const [updateTestProfile]=useUpdateDiagnosticTestProfileMutation();
  const [deleteTestProfile]=useDeleteDiagnosticTestProfileMutation();

  // class name for selected row 
  const isSelected = rowData => {
    if (rowData && diagnosticsTestProfile && rowData.id === diagnosticsTestProfile.id) {
      return 'selected-row';
    } else return '';
  };
   // class name for selected row 
  const isSelectedDiagnosticTestNormalRange = rowData => {
    if (rowData && diagnosticTestNormalRange && rowData.key === diagnosticTestNormalRange.id) {
      return 'selected-row';
    } else return '';
  };


  const { data: allLovValues } = useGetLovValuesByCodeQuery("LAB_NORMRANGE_VALUE_TYPE");

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
      title: <Translate>Name</Translate>,
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
      render: (rowData) => <p>{formatEnumString(rowData?.gender)}</p>,
    },
    {
      key: "ageFromTo",
      title: <Translate>Age From - To</Translate>,
      render: (rowData) => (
        <span>
          {rowData.ageFrom ?? "-"} {formatEnumString(rowData.ageFromUnit)}
          {"  -  "}
          {rowData.ageTo ?? "-"} {formatEnumString(rowData.ageToUnit)}
        </span>
      ),
    },
    {
      key: 'resultType',
      title: <Translate>Normal Range</Translate>,
      render: (rowData) => <p>{formatEnumString(rowData?.resultType)}</p>,
    },
    {
      key: "lovKeys",
      title: <Translate>LOV Values</Translate>,
      render: (rowData) => {
        if (!rowData.lovKeys || !allLovValues?.object) return "-";

        const names = rowData.lovKeys
          .map(key => allLovValues.object.find(lov => lov.key === key)?.lovDisplayVale)
          .filter(Boolean);

        return names.length ? names.join(", ") : "-";
      },
    },
    {
      key: 'condition',
      title: <Translate>Condition</Translate>,
      render: (rowData) => <p>{formatEnumString(rowData?.condition)}</p>,
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    }
  ];

  // handle save diagnostics test profile
const handleSave = async () => {
  try {
    if (diagnosticsTestProfile.id) {
      await updateTestProfile({
        id: diagnosticsTestProfile.id,
        body: {
          ...diagnosticsTestProfile,
          testId: diagnosticsTest.id,
        },
      }).unwrap();

      dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      await refetchDiagnosticsTestProfile();
     setDiagnosticsTestProfile({ ...newDiagnosticTestProfile });
    } else {
      await addTestProfile({
        ...diagnosticsTestProfile,
        testId: diagnosticsTest.id,
      }).unwrap();
 
      dispatch(notify({ msg: 'Added Successfully', sev: 'success' }));
      await refetchDiagnosticsTestProfile();
      setDiagnosticsTestProfile({ ...newDiagnosticTestProfile});
    }
  } 
  catch (error: any) {
  console.error('Error saving test profile:', error);
    console.error('Error saving test', error?.data.fieldErrors);
 
  let errorMessage =
    error?.data?.detail ||
    error?.data?.message ||
    error?.error ||
    error?.statusText ||
    'Failed to save Test Profile';


  if (error?.data?.fieldErrors?.length > 0) {
    const fieldError = error.data.fieldErrors[0];
    if (fieldError.field === "name") {
      errorMessage = "Name cannot be empty";
    } else {
      errorMessage = fieldError.message;
    }
  dispatch(
    notify({
      msg: errorMessage,
      sev: 'error',
    })
  );
}
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
                  required
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
                setOpenChild(true); // ✅ افتح Child Modal مباشرة
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
          data={normalRangeListResponse?.data ?? []}
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
        laboratory={laboratory}
      />
    );
  };
   // handle save normal range
   const handleSaveNormalRange = async () => {
      try {

          if (!diagnosticTestNormalRange.resultType) {
            return dispatch(notify({ msg: "Please select Result Type", sev: "error" }));
          }

          const payload = {
            ...(diagnosticTestNormalRange.id && { id: diagnosticTestNormalRange.id }),
            testId: diagnosticsTest.id,
            profileTestId: diagnosticsTestProfile?.id,

            gender: diagnosticTestNormalRange.gender ?? null,
            condition: diagnosticTestNormalRange.condition ?? null,

            ageFrom: diagnosticTestNormalRange.ageFrom,
            ageFromUnit: diagnosticTestNormalRange.ageFromUnit ?? null,
            ageTo:diagnosticTestNormalRange.ageTo,
            ageToUnit: diagnosticTestNormalRange.ageToUnit ?? null,

            resultType: diagnosticTestNormalRange.resultType ?? null,
            resultLov: diagnosticTestNormalRange.resultLov ?? null,

            normalRangeType: diagnosticTestNormalRange.normalRangeType ?? null,
            rangeFrom: diagnosticTestNormalRange.rangeFrom,
            rangeTo: diagnosticTestNormalRange.rangeTo,

            criticalValue: diagnosticTestNormalRange.criticalValue ?? false,
            criticalValueLessThan: diagnosticTestNormalRange.criticalValueLessThan,
            criticalValueMoreThan: diagnosticTestNormalRange.criticalValueMoreThan,
            lovKeys: diagnosticTestNormalRange.lovKeys ?? [],
          };

          if (diagnosticTestNormalRange.id) {
            await updateDiagnosticTestNormalRange({ id: diagnosticTestNormalRange.id, body: payload });
            dispatch(notify({ msg: "Normal Range Updated", sev: "success" }));
          } else {
            await createDiagnosticTestNormalRange(payload);
            dispatch(notify({ msg: "Normal Range Created", sev: "success" }));
          }


setDiagnosticTestNormalRange({ ...newDiagnosticTestNormalRange, testId: diagnosticsTest.id });


      } catch (err) {
        console.log("HANDLE SAVE ERROR", err);
        dispatch(notify({ msg: "Failed to Save Normal Range", sev: "error" }));
      }
    };


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
      childTitle="Normal Ranges"
      childContent={conjureFormContentOfChildModal}
      actionSubChildButtonFunction={handleSaveNormalRange}
      subChildTitle="Add Normal Range"
      subChildContent={conjureFormContentOfSecondChildModal}
      mainSize="sm"

    />
  );
};
export default Profile;
