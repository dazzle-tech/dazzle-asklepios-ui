import React, { useEffect, useState,useRef } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, Form } from 'rsuite';
import {
  useSaveTreadmillStresseMutation,
  useGetTreadmillStressesQuery
} from '@/services/encounterService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import { newApTreadmillStress } from '@/types/model-types-constructor';
import { ApTreadmillStress } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import AddTreadmillStress from './AddTreadmillStress';
import { MdModeEdit } from 'react-icons/md';
import { formatDateWithoutSeconds } from '@/utils';
import { tr } from 'date-fns/locale';

const TreadmillStress = ({ patient, encounter, edit }) => {
  const authSlice = useAppSelector(state => state.auth);
  const [open, setOpen] = useState(false);
  const [treadmillStress, setTreadmillStress] = useState<ApTreadmillStress>({
    ...newApTreadmillStress,
    preTestSystolicBp: null,
    preTestDiastolicBp: null,
    exerciseDuration: null,
    maximumHeartRateAchieved: null,
    targetHeartRate: null,
    postTestSystolicBp: null,
    postTestDiastolicBp: null,
    recoveryTime: null
  });
  const [selectedRowData, setSelectedRowData] = useState<ApTreadmillStress | null>(null);
  const [saveTreadmillStress] = useSaveTreadmillStresseMutation();
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [treadmillStressStatus, setTreadmillStressStatus] = useState('');
  const [allData, setAllData] = useState(false);
  const dispatch = useAppDispatch();

  // Fetch LOV data for display purposes
  const { data: baselineEcgLovQueryResponse } = useGetLovValuesByCodeQuery('BASELINE_ECG_FINDINGS');
  const { data: bruceProtocolLovQueryResponse } =
    useGetLovValuesByCodeQuery('BRUCE_PROTOCOL_STAGES');
  const { data: segmentChangeLovQueryResponse } = useGetLovValuesByCodeQuery('SEGMENT_CHANGES');
  const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('TREADMILL_TYPES');
  const { data: testOutcomeLovQueryResponse } = useGetLovValuesByCodeQuery('TEST_OUTCOMES');

  // Initialize list request with default filters
  const [treadmillStressListRequest, setTreadmillStressListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter?.key
      }
    ]
  });

  // Fetch the list of  Treadmill Stress based on the provided request, and provide a refetch function
  const {
    data: treadmillStressResponse,
    refetch: refetchTreadmillStress,
    isLoading
  } = useGetTreadmillStressesQuery(treadmillStressListRequest);

  // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
  const isSelected = rowData => {
    if (rowData && selectedRowData && selectedRowData.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // Handle Clear Fields Function
  const handleClearField = () => {
    setTreadmillStress({
      ...newApTreadmillStress,
      baselineEcgFindingsLkey: null,
      bruceProtocolStageLkey: null,
      segmentChangeLkey: null,
      typeLkey: null,
      statusLkey: null,
      testOutcomeLkey: null,
      arrhythmiaNoted: false
    });
    setSelectedRowData(null);
  };

  // Handle Add New Treadmill Stress Record
  const handleAddNewTreadmillStress = () => {
    handleClearField();
    setOpen(true);
  };

  // Change page event handler
  const handlePageChange = (_: unknown, newPage: number) => {
    setTreadmillStressListRequest({ ...treadmillStressListRequest, pageNumber: newPage + 1 });
  };

  // Change number of rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTreadmillStressListRequest({
      ...treadmillStressListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // Reset to first page
    });
  };

  // Handle Cancle Function
  const handleCancle = () => {
    //TODO convert key to code
    saveTreadmillStress({
      ...treadmillStress,
      statusLkey: '3196709905099521',
      deletedAt: new Date().getTime(),
      deletedBy: authSlice.user.key
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Treadmill Stress Canceled Successfully', sev: 'success' }));
        refetchTreadmillStress();
      });
    setPopupCancelOpen(false);
  };

  // Effects
  useEffect(() => {
    setTreadmillStressListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        ...(patient?.key && encounter?.key
          ? [
              {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
              },
              {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
              }
            ]
          : [])
      ]
    }));
  }, [patient?.key, encounter?.key]);

  useEffect(() => {
    setTreadmillStressListRequest(prev => ({
      ...prev,
      filters: [
        ...(treadmillStressStatus !== ''
          ? [
              {
                fieldName: 'status_lkey',
                operator: 'match',
                value: treadmillStressStatus
              },
              {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
              },
              ...(allData === false
                ? [
                    {
                      fieldName: 'encounter_key',
                      operator: 'match',
                      value: encounter?.key
                    }
                  ]
                : [])
            ]
          : [
              {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
              },
              {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
              },
              ...(allData === false
                ? [
                    {
                      fieldName: 'encounter_key',
                      operator: 'match',
                      value: encounter?.key
                    }
                  ]
                : [])
            ])
      ]
    }));
  }, [treadmillStressStatus, allData]);

  useEffect(() => {
    setTreadmillStressListRequest(prev => {
      const filters =
        treadmillStressStatus != '' && allData
          ? [
              {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
              }
            ]
          : treadmillStressStatus === '' && allData
          ? [
              {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
              },
              {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
              }
            ]
          : prev.filters;

      return {
        ...initialListRequest,
        filters
      };
    });
  }, [allData, treadmillStressStatus]);

  // Pagination values
  const pageIndex = treadmillStressListRequest.pageNumber - 1;
  const rowsPerPage = treadmillStressListRequest.pageSize;
  const totalCount = treadmillStressResponse?.extraNumeric ?? 0;

  // Table Columns
  const columns = [
    {
      key: 'indication',
      title: 'TEST INDICATION',
      dataKey: 'indication'
    },
    {
      key: 'baselineEcgFindings',
      title: 'BASELINE ECG FINDINGS',
      render: (row: any) =>
        row?.baselineEcgFindingsLvalue
          ? row.baselineEcgFindingsLvalue.lovDisplayVale
          : row.baselineEcgFindingsLkey
    },
    {
      key: 'bruceProtocolStage',
      title: 'BRUCE PROTOCOL STAGE',
      render: (row: any) =>
        row?.bruceProtocolStageLvalue
          ? row.bruceProtocolStageLvalue.lovDisplayVale
          : row.bruceProtocolStageLkey
    },
    {
      key: 'exerciseDuration',
      title: 'EXERCISE DURATION',
      render: (row: any) => (row?.exerciseDuration ? `${row?.exerciseDuration ?? ''} Minutes` : ' ')
    },
    {
      key: 'details',
      title: <Translate>EDIT</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData => {
        return (
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setTreadmillStress(rowData);
              setOpen(true);
            }}
          />
        );
      }
    },
    {
      key: 'createdAt',
      title: 'CREATED AT/BY',
      expandable: true,
      render: (row: any) =>
        row?.createdAt ? (
          <>
            {row?.createByUser?.fullName}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'updatedAt',
      title: 'UPDATED AT/BY',
      expandable: true,
      render: (row: any) =>
        row?.updatedAt ? (
          <>
            {row?.updateByUser?.fullName}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.updatedAt)}</span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'deletedAt',
      title: 'CANCELLED AT/BY',
      expandable: true,
      render: (row: any) =>
        row?.deletedAt ? (
          <>
            {row?.deleteByUser?.fullName} <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'cancellationReason',
      title: 'CANCELLATION REASON',
      dataKey: 'cancellationReason',
      expandable: true
    }
  ];

  const tableRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        previewRef.current &&
        !previewRef.current.contains(event.target as Node)
      ) {
        setSelectedRowData(null);
        setTreadmillStress({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <div>

      <MyTable
        data={treadmillStressResponse?.object ?? []}
        columns={columns}
        loading={isLoading}
        height={400}
        onRowClick={row => {
          setTreadmillStress({ ...row });
          setSelectedRowData({ ...row });
        }}
        rowClassName={isSelected}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="bt-div-2">
            <div className="bt-left-2">
              <MyButton
                onClick={() => {
                  setPopupCancelOpen(true);
                }}
                prefixIcon={() => <CloseOutlineIcon />}
                disabled={!edit ? !treadmillStress?.key : true}
              >
                <Translate>Cancel</Translate>
              </MyButton>
              <Checkbox
                onChange={(value, checked) => {
                  if (checked) {
                    //TODO convert key to code
                    setTreadmillStressStatus('3196709905099521');
                  } else {
                    setTreadmillStressStatus('');
                  }
                }}
              >
                Show Cancelled
              </Checkbox>
              <Checkbox
                onChange={(value, checked) => {
                  if (checked) {
                    setAllData(true);
                  } else {
                    setAllData(false);
                  }
                }}
              >
                Show All
              </Checkbox>
            </div>
            <div className="bt-right-2">
              <MyButton
                disabled={edit}
                prefixIcon={() => <PlusIcon />}
                onClick={handleAddNewTreadmillStress}
              >
                Add
              </MyButton>
            </div>
          </div>
        }
      />

      {selectedRowData && (
        <div ref={previewRef} className="margin-det-10">
      {/* Details Form Section */}
      {selectedRowData && (
        <div className="margin-det-10">
          <div className="margin-buttom-8">
            <SectionContainer
              title="Test Information"
              content={
                <Form className="flex-row-3" disabled={true}>
                  <MyInput
                    fieldLabel="Test Indication"
                    fieldName="indication"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Baseline ECG Findings"
                    fieldType="select"
                    fieldName="baselineEcgFindingsLkey"
                    selectData={baselineEcgLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <div className="bp-input-group-2">
                    <div>
                      <MyInput
                        width={200}
                        fieldLabel="Pre-Test Blood Pressure"
                        fieldName="preTestSystolicBp"
                        fieldType="number"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        disabled={true}
                      />
                    </div>
                    <div className="slash">/</div>
                    <div>
                      <MyInput
                        width={200}
                        fieldName="preTestDiastolicBp"
                        fieldType="number"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        showLabel={false}
                        disabled={true}
                      />
                    </div>
                  </div>
                </Form>
              }
            />
          </div>
          <div className="margin-buttom-8">
            <SectionContainer
              title="Exercise Parameters"
              content={
                <Form className="flex-row-3" disabled={true}>
                  <MyInput
                    width={200}
                    fieldLabel="Bruce Protocol Stage"
                    fieldType="select"
                    fieldName="bruceProtocolStageLkey"
                    selectData={bruceProtocolLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="ST Segment Change"
                    fieldType="select"
                    fieldName="segmentChangeLkey"
                    selectData={segmentChangeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Arrhythmia Noted"
                    fieldType="checkbox"
                    fieldName="arrhythmiaNoted"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Type"
                    fieldType="select"
                    fieldName="typeLkey"
                    selectData={typeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Test Outcome"
                    fieldType="select"
                    fieldName="testOutcomeLkey"
                    selectData={testOutcomeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldType="number"
                    fieldLabel="Exercise Duration (Minutes)"
                    fieldName="exerciseDuration"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldType="number"
                    fieldLabel="Maximum Heart Rate Achieved (BPM)"
                    fieldName="maximumHeartRateAchieved"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldType="number"
                    fieldLabel="Target Heart Rate (BPM)"
                    fieldName="targetHeartRate"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                </Form>
              }
            />
          </div>
          <div className="margin-buttom-8">
            <SectionContainer
              title="Out Comes "
              content={
                <Form className="flex-row-3" disabled={true}>
                  <div className="bp-input-group-2">
                    <div>
                      <MyInput
                        width={200}
                        fieldLabel="Post-Test BP"
                        fieldName="postTestSystolicBp"
                        fieldType="number"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        disabled={true}
                      />
                    </div>
                    <div className="slash">/</div>
                    <div>
                      <MyInput
                        width={200}
                        fieldName="postTestDiastolicBp"
                        fieldType="number"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        showLabel={false}
                        disabled={true}
                      />
                    </div>
                  </div>
                  <MyInput
                    width={200}
                    fieldType="number"
                    fieldLabel="Recovery Time (Minutes)"
                    fieldName="recoveryTime"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    fieldLabel="Cardiologist Notes"
                    fieldType="textarea"
                    fieldName="cardiologistNotes"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                </Form>
              }
            />
          </div>
        </div>
      )}
      </div>
    )}

      <AddTreadmillStress
        open={open}
        setOpen={setOpen}
        patient={patient}
        encounter={encounter}
        treadmillStressObject={treadmillStress}
        refetch={refetchTreadmillStress}
        edit={edit}
      />
      <CancellationModal
        title="Cancel Treadmill Stress Test"
        fieldLabel="Cancellation Reason"
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        object={treadmillStress}
        setObject={setTreadmillStress}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
      />
    </div>
  );
};
export default TreadmillStress;
