import React, { useEffect, useState } from 'react';
import {Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FaChartLine } from 'react-icons/fa';
import { initialListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { MdModeEdit } from 'react-icons/md';
import AddNormalRange from './AddNormalRange';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useGetDiagnosticTestNormalRangesByTestIdQuery,
  useCreateDiagnosticTestNormalRangeMutation,
  useUpdateDiagnosticTestNormalRangeMutation,
  useDeleteDiagnosticTestNormalRangeMutation} from '@/services/setup/diagnosticTest/diagnosticTestNormalRangeService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { DiagnosticTestNormalRange } from '@/types/model-types-new';
import { newDiagnosticTestNormalRange, newLaboratory } from '@/types/model-types-constructor-new';
import { formatEnumString } from '@/utils';
import { useGetLaboratoryByTestIdQuery } from '@/services/setup/diagnosticTest/laboratoryService';


const NormalRangeSetupModal = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  const [showChild, setShowChild] = useState<boolean>(false);
  const [openConfirmDeleteNormalRange, setOpenConfirmDeleteNormalRange] = useState<boolean>(false);
  const [selectedLOVs, setSelectedLOVs] = useState([]);
  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<DiagnosticTestNormalRange>({
      ...newDiagnosticTestNormalRange
    });


const { data: allLovValues } = useGetLovValuesByCodeQuery("LAB_NORMRANGE_VALUE_TYPE");


 const {data:getLaboratoryDetails}=useGetLaboratoryByTestIdQuery(diagnosticsTest?.id)
   const [laboratory,setLaboratory]=useState({...newLaboratory});


  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5
    ,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // Fetch normal Range List response
const {
  data: normalRangeListResponse,
  refetch: refetchNormalRange,
  isFetching
} = useGetDiagnosticTestNormalRangesByTestIdQuery(
  {
    testId: diagnosticsTest?.id as number,
    page: paginationParams.page,
    size: paginationParams.size,
  },
  { skip: !open || !diagnosticsTest?.id }
);




  // Pagination values
  const totalCount = normalRangeListResponse?.totalCount ?? 0;
  const links = normalRangeListResponse?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && diagnosticTestNormalRange && rowData.id === diagnosticTestNormalRange.id) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit, Remove)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setShowChild(true);
        }}
      />
      <MdDelete
        className="icons-style"
        title="Remove"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteNormalRange(true);
        }}
      />
    </div>
  );

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

  //Table columns
  const tableColumns = [
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
    // {
    //   key: 'isValid',
    //   title: <Translate>Status</Translate>,
    //   render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    // },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

const [createDiagnosticTestNormalRange] = useCreateDiagnosticTestNormalRangeMutation();
const [updateDiagnosticTestNormalRange] = useUpdateDiagnosticTestNormalRangeMutation();
const [deleteDiagnosticTestNormalRange] = useDeleteDiagnosticTestNormalRangeMutation();

useEffect(() => {
  if (open && diagnosticsTest?.id) {
    setDiagnosticTestNormalRange(prev => ({
      ...prev,
      testId: diagnosticsTest.id
    }));
  }
}, [open, diagnosticsTest?.id]);

 useEffect(()=>{
  if(getLaboratoryDetails){
    setLaboratory(getLaboratoryDetails);}
    else{
      setLaboratory({...newLaboratory})
    }

 },[getLaboratoryDetails])
  // handle save diagnostics Test Normal Range
    const handleSave = async () => {
      try {
        if (!diagnosticTestNormalRange.resultType) {
          return dispatch(notify({ msg: "Please select Result Type", sev: "error" }));
        }

        const payload = {
          ...(diagnosticTestNormalRange.id && { id: diagnosticTestNormalRange.id }),
          testId: diagnosticsTest.id,

          gender: diagnosticTestNormalRange.gender ?? null,
          condition: diagnosticTestNormalRange.condition ?? null,

          ageFrom: diagnosticTestNormalRange.ageFrom,
          ageFromUnit: diagnosticTestNormalRange.ageFromUnit ?? null,
          ageTo: diagnosticTestNormalRange.ageTo,
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
        refetchNormalRange();
        setDiagnosticTestNormalRange({
          ...newDiagnosticTestNormalRange,
          testId: diagnosticsTest.id
        });
        setShowChild(false);

      } catch (err) {
        console.log("HANDLE SAVE ERROR", err);
        dispatch(notify({ msg: "Failed to Save Normal Range", sev: "error" }));
      }
    };


   // handle remove normal range
    const handleRemove = () => {
      setOpenConfirmDeleteNormalRange(false);
      deleteDiagnosticTestNormalRange(diagnosticTestNormalRange.id)
        .unwrap()
        .then(() => refetchNormalRange());
      dispatch(notify({ msg:'Normal Range Deleted Successfully', sev: "success" }))
    };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setDiagnosticTestNormalRange({
                    ...newDiagnosticTestNormalRange,
                    testId: diagnosticsTest?.id
                  });
                  setShowChild(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={normalRangeListResponse?.data ?? []}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelected}
              onPageChange={handlePageChange}
              page={pageIndex}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onRowsPerPageChange={(e) => {
                setPaginationParams({
                  ...paginationParams,
                  size: Number(e.target.value),
                  page: 0,
                  timestamp: Date.now(),
                });
              }}
              onRowClick={rowData => {
                setDiagnosticTestNormalRange(rowData);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteNormalRange}
              setOpen={setOpenConfirmDeleteNormalRange}
              itemToDelete="Normal Range"
              actionButtonFunction={handleRemove}
              actionType="delete"
            />
          </Form>
        );
    }
  };
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <AddNormalRange
        diagnosticTestNormalRange={diagnosticTestNormalRange}
        setDiagnosticTestNormalRange={setDiagnosticTestNormalRange}
        laboratory={laboratory}
        // listRequestQuery={listRequestQuery}
      />
    );
  };
  // Effects

  useEffect(() => {
    if (diagnosticTestNormalRange) {
      setSelectedLOVs(diagnosticTestNormalRange?.lovKeys);
    } else {
      setDiagnosticTestNormalRange(newDiagnosticTestNormalRange);
    }
  }, [diagnosticTestNormalRange]);

useEffect(() => {
  if (open && diagnosticsTest?.id) {
    refetchNormalRange();
  }
}, [open, diagnosticsTest?.id]);


  return (
    <ChildModal
      actionButtonLabel={diagnosticsTest?.key ? 'Save' : 'Create'}
      hideActionBtn
      actionChildButtonFunction={handleSave}
      open={open}
      setOpen={setOpen}
      showChild={showChild}
      setShowChild={setShowChild}
      title="Normal Ranges"
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Normal Ranges', icon: <FaChartLine /> }]}
      childStep={[{ title: 'Normal Range Info', icon: <FaChartLine /> }]}
      childTitle={diagnosticTestNormalRange?.id ? 'Edit Normal Range' : 'New Normal Range'}
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};
export default NormalRangeSetupModal;
