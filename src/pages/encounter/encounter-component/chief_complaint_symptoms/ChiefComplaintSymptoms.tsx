import React, { useEffect, useState,useRef } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, Form } from 'rsuite';
import {
  useSaveComplaintSymptomsMutation,
  useGetComplaintSymptomsQuery
} from '@/services/encounterService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApComplaintSymptoms } from '@/types/model-types-constructor';
import { ApComplaintSymptoms } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import AddChiefComplaintSymptoms from './AddChiefComplaintSymptoms';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { formatDateWithoutSeconds } from '@/utils';

const ChiefComplaintSymptoms = ({ patient, encounter, edit }) => {
  const authSlice = useAppSelector(state => state.auth);
  const [complaintSymptoms, setComplaintSymptoms] = useState<ApComplaintSymptoms>({
    ...newApComplaintSymptoms,
    duration: null
  });
  const [selectedRowData, setSelectedRowData] = useState<ApComplaintSymptoms | null>(null);
  const [open, setOpen] = useState(false);
  const [saveComplaintSymptoms] = useSaveComplaintSymptomsMutation();
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [complaintSymptomsStatus, setComplaintSymptomsStatus] = useState('');
  const [allData, setAllData] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const dispatch = useAppDispatch();

  // Fetch LOV data for display purposes
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');

  const handleSelectRow = (rowKey: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, rowKey]);
    } else {
      setSelectedRows(prev => prev.filter(key => key !== rowKey));
    }
  };

  const isRowSelected = (rowKey: string) => selectedRows.includes(rowKey);

  // Initialize list request with default filters
  const [complaintSymptomsListRequest, setComplaintSymptomsListRequest] = useState<ListRequest>({
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

  // Fetch the list
  const {
    data: complaintSymptomsResponse,
    refetch: refetchComplaintSymptoms,
    isLoading
  } = useGetComplaintSymptomsQuery(complaintSymptomsListRequest);

  // Check if the current row is selected visually
  const isSelected = rowData => {
    if (rowData && selectedRowData && selectedRowData.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // Handle Clear Fields
  const handleClearField = () => {
    setComplaintSymptoms({
      ...newApComplaintSymptoms,
      unitLkey: null,
      painLocationLkey: null
    });
    setSelectedRowData(null);
  };

  // Handle Add New
  const handleAddNewComplaintSymptoms = () => {
    handleClearField();
    setOpen(true);
  };

  // Pagination handlers
  const handlePageChange = (_: unknown, newPage: number) => {
    setComplaintSymptomsListRequest({ ...complaintSymptomsListRequest, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComplaintSymptomsListRequest({
      ...complaintSymptomsListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  // Handle Cancel
  const handleCancle = () => {
    saveComplaintSymptoms({
      ...complaintSymptoms,
      statusLkey: '3196709905099521',
      deletedAt: new Date().getTime(),
      deletedBy: authSlice.user.key
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Complaint Symptoms Canceled Successfully', sev: 'success' }));
        refetchComplaintSymptoms();
      });
    setPopupCancelOpen(false);
  };

  // Effects
  useEffect(() => {
    setComplaintSymptomsListRequest(prev => ({
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
    setComplaintSymptomsListRequest(prev => ({
      ...prev,
      filters: [
        ...(complaintSymptomsStatus !== ''
          ? [
              {
                fieldName: 'status_lkey',
                operator: 'match',
                value: complaintSymptomsStatus
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
  }, [complaintSymptomsStatus, allData]);

  useEffect(() => {
    setComplaintSymptomsListRequest(prev => {
      const filters =
        complaintSymptomsStatus != '' && allData
          ? [
              {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
              }
            ]
          : complaintSymptomsStatus === '' && allData
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
  }, [allData, complaintSymptomsStatus]);

  // Pagination
  const pageIndex = complaintSymptomsListRequest.pageNumber - 1;
  const rowsPerPage = complaintSymptomsListRequest.pageSize;
  const totalCount = complaintSymptomsResponse?.extraNumeric ?? 0;

  // Columns
  const columns = [
    {
      key: 'chiefComplaint',
      title: 'CHIEF COMPLAINT'
    },
    {
      key: 'onsetDate',
      title: 'ONSET DATE',
      render: (rowData: any) =>
        rowData?.onsetDate ? new Date(rowData.onsetDate).toLocaleDateString('en-GB') : ''
    },
    {
      key: 'duration',
      title: 'DURATION',
      render: (rowData: any) => (
        <>
          {rowData?.duration}{' '}
          {rowData?.unitLvalue ? rowData?.unitLvalue.lovDisplayVale : rowData?.unitLkey}
        </>
      )
    },
    {
      key: 'painCharacteristics',
      title: 'PAIN CHARACTERISTICS'
    },
    {
      key: 'painLocation',
      title: 'PAIN LOCATION',
      render: (rowData: any) =>
        rowData?.painLocationLvalue
          ? rowData.painLocationLvalue.lovDisplayVale
          : rowData.painLocationLkey
    },
    {
      key: 'radiation',
      title: 'RADIATION'
    },
    {
      key: 'aggravatingFactors',
      title: 'AGGRAVATING FACTORS'
    },
    {
      key: 'relievingFactors',
      title: 'RELIEVING FACTORS'
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
              setComplaintSymptoms(rowData);
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
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
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
            <span className="date-table-style">{formatDateWithoutSeconds(row.updatedAt)}</span>
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
            {row?.deleteByUser?.fullName}
            <br />
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <div>
      <AddChiefComplaintSymptoms
        open={open}
        setOpen={setOpen}
        patient={patient}
        encounter={encounter}
        complaintSymptom={complaintSymptoms}
        refetch={refetchComplaintSymptoms}
        edit={edit}
      />
      <MyTable
        data={complaintSymptomsResponse?.object ?? []}
        columns={columns}
        height={400}
        loading={isLoading}
        onRowClick={rowData => {
          setComplaintSymptoms({ ...rowData });
          setSelectedRowData({ ...rowData });
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
                disabled={!edit ? !complaintSymptoms?.key : true}
              >
                <Translate>Cancel</Translate>
              </MyButton>
              <Checkbox
                onChange={(value, checked) => {
                  if (checked) {
                    setComplaintSymptomsStatus('3196709905099521');
                  } else {
                    setComplaintSymptomsStatus('');
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
                onClick={handleAddNewComplaintSymptoms}
              >
                Add
              </MyButton>
            </div>
          </div>
        }
      />

      {selectedRowData && (
        <div ref={previewRef} className="margin-ver-10">
      {/* Details Form Section */}
      {selectedRowData && (
        <div className="margin-ver-10">
          <Form fluid layout="vertical" disabled={true}>
            {/* Chief Complaint */}
            <SectionContainer
              title="Chief Complaint"
              content={
                <Form className="flex-row-3">
                  <MyInput
                    fieldLabel="Chief Complaint"
                    fieldType="textarea"
                    fieldName="chiefComplaint"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldType="date"
                    fieldLabel="Onset Date"
                    fieldName="onsetDate"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Pain Characteristics"
                    fieldName="painCharacteristics"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldType="number"
                    fieldLabel="Duration"
                    fieldName="duration"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Unit"
                    fieldType="select"
                    fieldName="unitLkey"
                    selectData={unitLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                    searchable={false}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Pain Location"
                    fieldType="select"
                    fieldName="painLocationLkey"
                    selectData={bodyPartsLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Radiation"
                    fieldName="radiation"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Aggravating Factors"
                    fieldName="aggravatingFactors"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    width={200}
                    fieldLabel="Relieving Factors"
                    fieldName="relievingFactors"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                  <MyInput
                    fieldLabel="Associated Symptoms"
                    fieldType="textarea"
                    fieldName="associatedSymptoms"
                    record={selectedRowData}
                    setRecord={setSelectedRowData}
                    disabled={true}
                  />
                </Form>
              }
            />
          </Form>
        </div>
      )}
        </div>
      )}
      <CancellationModal
        title="Cancel Chief Complaint"
        fieldLabel="Cancellation Reason"
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        object={complaintSymptoms}
        setObject={setComplaintSymptoms}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
      />
    </div>
  );
};

export default ChiefComplaintSymptoms;
