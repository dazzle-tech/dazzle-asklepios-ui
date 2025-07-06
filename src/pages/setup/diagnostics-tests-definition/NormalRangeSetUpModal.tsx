import React, { useEffect, useState } from 'react';
import {
  useGetDiagnosticsTestNormalRangeListQuery,
  useRemoveDiagnosticsTestNormalRangeMutation,
  useSaveDiagnosticsTestNormalRangeMutation
} from '@/services/setupService';
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
import { ApDiagnosticTestNormalRange } from '@/types/model-types';
import { newApDiagnosticTestNormalRange } from '@/types/model-types-constructor';
import { MdModeEdit } from 'react-icons/md';
import AddNormalRange from './AddNormalRange';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

const NormalRangeSetupModal = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  const [showChild, setShowChild] = useState<boolean>(false);
  const [openConfirmDeleteNormalRange, setOpenConfirmDeleteNormalRange] = useState<boolean>(false);
  const [selectedLOVs, setSelectedLOVs] = useState([]);
  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<ApDiagnosticTestNormalRange>({
      ...newApDiagnosticTestNormalRange
    });
  const [listRequest, setListRequest] = useState({
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
  const [listRequestQuery, setListRequestQuery] = useState({
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
  // Fetch normal Range List response
  const {
    data: normalRangeListResponse,
    refetch: refetchNormalRange,
    isFetching
  } = useGetDiagnosticsTestNormalRangeListQuery(listRequest);
  // save Normal Range
  const [saveDiagnosticsTestNormalRange, saveDiagnosticsTestNormalRangeMutation] = useSaveDiagnosticsTestNormalRangeMutation();
  // remove Normal Range
  const [removeDiagnosticsTestNormalRange] = useRemoveDiagnosticsTestNormalRangeMutation();
  
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && diagnosticTestNormalRange && rowData.key === diagnosticTestNormalRange.key) {
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

  //Table columns
  const tableColumns = [
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
      key: 'LovValues',
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
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  // handle save diagnostics Test Normal Range
  const handleSave = async () => {
    try {
      await saveDiagnosticsTestNormalRange({
        diagnosticTestNormalRange: { ...diagnosticTestNormalRange, testKey: diagnosticsTest.key },
        lov: selectedLOVs
      }).unwrap();
      refetchNormalRange();
      setDiagnosticTestNormalRange({
        ...newApDiagnosticTestNormalRange,
        ageToUnitLkey: null,
        ageFromUnitLkey: null,
        normalRangeTypeLkey: null,
        resultLovKey: null,
        genderLkey:null,
        resultTypeLkey:null,
        conditionLkey:null,
        criticalValue: false
      });
      dispatch(notify('Normal Range Saved Successfully'));
    } catch (error) {
      console.error('Error saving Normal Range:', error);
    }
  };
   // handle remove normal range
  const handleRemove = () => {
    setOpenConfirmDeleteNormalRange(false);
    removeDiagnosticsTestNormalRange({
      ...diagnosticTestNormalRange,
      deletedBy: 'Administrator'
    })
      .unwrap()
      .then(() => refetchNormalRange());
    dispatch(notify('Normal Range was Deleted Successfully '));
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
                    ...newApDiagnosticTestNormalRange,
                    ageToUnitLkey: null,
                    ageFromUnitLkey: null,
                    normalRangeTypeLkey: null,
                    resultLovKey: null
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
              data={normalRangeListResponse?.object ?? []}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setDiagnosticTestNormalRange(rowData);
              }}
              sortColumn={listRequest.sortBy}
              sortType={listRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
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
        listRequestQuery={listRequestQuery}
      />
    );
  };
  // Effects
  useEffect(() => {
    setListRequest({
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
  }, [diagnosticsTest]);

  useEffect(() => {
    if (diagnosticTestNormalRange) {
      setSelectedLOVs(diagnosticTestNormalRange?.lovList);
    } else {
      setDiagnosticTestNormalRange(newApDiagnosticTestNormalRange);
    }
  }, [diagnosticTestNormalRange]);

  useEffect(() => {
    setDiagnosticTestNormalRange({
      ...newApDiagnosticTestNormalRange,
      ageToUnitLkey: null,
      ageFromUnitLkey: null,
      normalRangeTypeLkey: null,
      resultLovKey: null
    });
    if (saveDiagnosticsTestNormalRangeMutation.data) {
      setListRequestQuery({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDiagnosticsTestNormalRangeMutation.data]);

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
      childTitle={diagnosticTestNormalRange?.key ? 'Edit Normal Range' : 'New Normal Range'}
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};
export default NormalRangeSetupModal;
