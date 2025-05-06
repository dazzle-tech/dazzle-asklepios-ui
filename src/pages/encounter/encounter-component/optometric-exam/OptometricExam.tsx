import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useSaveOptometricExamMutation, useGetOptometricExamsQuery } from '@/services/encounterService';
import Translate from '@/components/Translate';
import { newApOptometricExam } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import PlusIcon from '@rsuite/icons/Plus';
import CancellationModal from '@/components/CancellationModal';
import AddOptometricTest from './AddOptometricTest';
import { MdModeEdit } from 'react-icons/md';
const OptometricExam = ({ patient, encounter }) => {
  const authSlice = useAppSelector(state => state.auth);
  const [open, setOpen] = useState(false);
  const [saveOptometricExam] = useSaveOptometricExamMutation();
  const [optometricExam, setOptometricExam] = useState<any>({
    ...newApOptometricExam,
    medicalHistoryLkey: null,
    followUpRequired: false,
    fundoscopySlitlampDone: false,
    performedWithLkey: null,
    distanceAcuity: null,
    rightEyeOd: null,
    leftEyeOd: null,
    rightEyeOs: null,
    leftEyeOs: null,
    nearAcuity: null,
    pinholeTestResultLkey: null,
    numberOfPlatesTested: null,
    correctAnswersCount: null,
    deficiencyTypeLkey: null,
    rightEyeSphere: null,
    leftEyeSphere: null,
    rightCylinder: null,
    leftCylinder: null,
    rightAxis: null,
    leftAxis: null,
    rightEye: null,
    leftEye: null,
    timeOfMeasurement: null,
    cornealThickness: null,
    glaucomaRiskAssessmentLkey: null
  });
  const [secondSelectedicd10, setSecondSelectedicd10] = useState({ text: ' ' });
  const [selectedicd10, setSelectedIcd10] = useState({ text: ' ' });
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [optometricExamStatus, setOptometricExamStatus] = useState('');
  const [allData, setAllData] = useState(false);
  const [time, setTime] = useState({ time: '' });
  const dispatch = useAppDispatch();
  // Initialize the request state for fetching optometric exams with default filters
  const [optometricExamListRequest, setOptometricExamListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined // Filter out records that have been marked as deleted
      },
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key // Filter by the current patient
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter?.key // Filter by the current encounter
      }
    ]
  });

  // Fetch optometric exam data based on the current request filters
  const { data: optometricExamResponse, refetch: refetchOptometricExam, isLoading } = useGetOptometricExamsQuery(optometricExamListRequest);


  // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
  const isSelected = rowData => {
    if (rowData && optometricExam && optometricExam.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };
  // Change page event handler
  const handlePageChange = (_: unknown, newPage: number) => {
    setOptometricExamListRequest({ ...optometricExamListRequest, pageNumber: newPage + 1 });
  };
  // Change number of rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptometricExamListRequest({
      ...optometricExamListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // Reset to first page
    });
  };
  // Handle Cancel Optometric Exam Record
  const handleCancle = () => {
    //TODO convert key to code
    saveOptometricExam({
      ...optometricExam,
      statusLkey: '3196709905099521',
      deletedAt: new Date().getTime(),
      deletedBy: authSlice.user.key
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Optometric Exam Canceled Successfully'));
        refetchOptometricExam();
        setPopupCancelOpen(false);
      });
  };
  // Handle Clear Field
  const handleClearField = () => {
    setOptometricExam({
      ...newApOptometricExam,
      medicalHistoryLkey: null,
      followUpRequired: false,
      fundoscopySlitlampDone: false,
      performedWithLkey: null,
      pinholeTestResultLkey: null,
      deficiencyTypeLkey: null,
      glaucomaRiskAssessmentLkey: null
    });
  };
  // Handle Add New Optometric Exam Record
  const handleAddNewOptometricExam = () => {
    handleClearField();
    setOpen(true);
  }

  // Format Time From Seconds To Formal Time
  const formatTime = totalSeconds => {
    if (!totalSeconds) return '-';

    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  // Effects
  useEffect(() => {
    setOptometricExamListRequest(prev => ({
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
    setOptometricExamListRequest(prev => ({
      ...prev,
      filters: [
        ...(optometricExamStatus !== ''
          ? [
            {
              fieldName: 'status_lkey',
              operator: 'match',
              value: optometricExamStatus
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
  }, [optometricExamStatus, allData]);
  useEffect(() => {
    setOptometricExamListRequest(prev => {
      const filters =
        optometricExamStatus != '' && allData
          ? [
            {
              fieldName: 'patient_key',
              operator: 'match',
              value: patient?.key
            }
          ]
          : optometricExamStatus === '' && allData
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
  }, [allData, optometricExamStatus]);

  // Pagination values
  const pageIndex = optometricExamListRequest.pageNumber - 1;
  const rowsPerPage = optometricExamListRequest.pageSize;
  const totalCount = optometricExamResponse?.extraNumeric ?? 0;

  // Table Columns
  const columns = [
    {
      key: 'testReason',
      title: 'Reason',
      dataKey: 'testReason',
    },
    {
      key: 'medicalHistory',
      title: 'Medical History',
      render: (row: any) =>
        row?.medicalHistoryLvalue
          ? row.medicalHistoryLvalue.lovDisplayVale
          : row.medicalHistoryLkey
    },
    {
      key: 'performedWith',
      title: 'Test Performed With',
      render: (row: any) =>
        row?.performedWithLvalue
          ? row.performedWithLvalue.lovDisplayVale
          : row.performedWithLkey
    },
    {
      key: 'distanceAcuity',
      title: 'Distance Acuity',
      render: (row: any) => row?.distanceAcuity ? `${row?.distanceAcuity ?? ''} m` : ' '
    },
    {
      key: 'rightEyeOd',
      title: 'Right Eye',
      render: (row: any) => row?.rightEyeOd ? `20/ ${row?.rightEyeOd} ` : ' '
    },
    {
      key: 'leftEyeOd',
      title: 'Left Eye',
      render: (row: any) => row?.leftEyeOd ? `20/ ${row?.leftEyeOd}` : ' '
    },
    {
      key: 'nearAcuity',
      title: 'Near Acuity',
      render: (row: any) => row?.nearAcuity ? `${row?.nearAcuity ?? ''} m` : ' '
    },
    {
      key: 'rightEyeOs',
      title: 'Right Eye ',
      render: (row: any) => row?.rightEyeOs ? `J ${row?.rightEyeOs}` : ' '
    },
    {
      key: 'leftEyeOs',
      title: 'Left Eye ',
      render: (row: any) => row?.leftEyeOs ? `J ${row?.leftEyeOs}` : ' '
    },
    {
      key: 'pinholeTestResult',
      title: 'Pinhole Test Result',
      render: (row: any) =>
        row?.pinholeTestResultLvalue
          ? row.pinholeTestResultLvalue.lovDisplayVale
          : row.pinholeTestResultLkey
    },
    {
      key: "details",
      title: <Translate>Add details</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData => {
        return (
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setOptometricExam(rowData);
              setOpen(true);
            }}

          />
        );
      }
    },
    {
      key: 'numberOfPlatesTested',
      title: 'Number of Plates Tested',
      dataKey: 'numberOfPlatesTested',
      expandable: true,
    },
    {
      key: 'correctAnswersCount',
      title: 'Correct Answers Count',
      dataKey: 'correctAnswersCount',
      expandable: true,
    },
    {
      key: 'deficiencyType',
      title: 'Deficiency Type',
      expandable: true,
      render: (row: any) =>
        row?.deficiencyTypeLvalue
          ? row.deficiencyTypeLvalue.lovDisplayVale
          : row.deficiencyTypeLkey
    },
    {
      key: 'rightEye',
      title: 'Right Eye',
      dataKey: 'rightEye',
      expandable: true,
    },
    {
      key: 'leftEye',
      title: 'Left Eye',
      dataKey: 'leftEye',
      expandable: true,
    },
    {
      key: 'measurementMethod',
      title: 'Measurement Method',
      dataKey: 'measurementMethod',
      expandable: true,
    },
    {
      key: 'timeOfMeasurement',
      title: 'Time of Measurement',
      expandable: true,
      render: (row: any) => {
        if (!row?.timeOfMeasurement) return '-';
        const totalSeconds = row.timeOfMeasurement;
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    },
    {
      key: 'createdAt',
      title: 'Created At / Created By',
      expandable: true,
      render: (row: any) => `${new Date(row.createdAt).toLocaleString('en-GB')} / ${row?.createByUser?.fullName}`
    },
    {
      key: 'updatedAt',
      title: 'Updated At / Updated By',
      expandable: true,
      render: (row: any) => row?.updatedAt ? `${new Date(row.updatedAt).toLocaleString('en-GB')} / ${row?.updateByUser?.fullName}` : ' '
    },
    {
      key: 'deletedAt',
      title: 'Cancelled At / Cancelled By',
      expandable: true,
      render: (row: any) => row?.deletedAt ? `${new Date(row.deletedAt).toLocaleString('en-GB')} / ${row?.deleteByUser?.fullName}` : ' '
    },
    {
      key: 'cancellationReason',
      title: 'Cancellation Reason',
      dataKey: 'cancellationReason',
      expandable: true,
    }
  ];
  return (
    <div>
      <div className='bt-div'>
        <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!optometricExam?.key}>
          <Translate>Cancel</Translate>
        </MyButton>
        <Checkbox onChange={(value, checked) => {
          if (checked) {
            //TODO convert key to code
            setOptometricExamStatus('3196709905099521');
          } else {
            setOptometricExamStatus('');
          }
        }} >
          Show Cancelled
        </Checkbox>
        <Checkbox
          onChange={(value, checked) => {
            if (checked) {
              setAllData(true);
            } else {
              setAllData(false);
            }
          }} >
          Show All
        </Checkbox>
        <div className='bt-right'>
          <MyButton prefixIcon={() => <PlusIcon />} onClick={handleAddNewOptometricExam}>Add </MyButton>
        </div>
      </div>
      <AddOptometricTest
        open={open}
        setOpen={setOpen}
        patient={patient}
        encounter={encounter}
        optometricObject={optometricExam}
        refetch={refetchOptometricExam}
        secondSelectedicd10={secondSelectedicd10}
        setSecondSelectedicd10={setSecondSelectedicd10}
        selectedicd10={selectedicd10}
        setSelectedIcd10={setSelectedIcd10}
        timeM={time} />
      <MyTable
        data={optometricExamResponse?.object ?? []}
        columns={columns}
        height={420}
        loading={isLoading}
        onRowClick={rowData => {
          setOptometricExam({ ...rowData, });
          rowData?.icdCode?.icdCode && rowData?.icdCode?.description ? setSelectedIcd10({ text: `${rowData.icdCode.icdCode} - ${rowData.icdCode.description}` }) : null;
          rowData?.icdCode2?.icdCode && rowData?.icdCode2?.description ? setSecondSelectedicd10({ text: `${rowData.icdCode2.icdCode} - ${rowData.icdCode2.description}` }) : null;
          setTime({ time: formatTime(rowData?.timeOfMeasurement) });
        }}
        rowClassName={isSelected}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <CancellationModal title="Cancel Optometric Exam" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={optometricExam} setObject={setOptometricExam} handleCancle={handleCancle} fieldName="cancellationReason" />
    </div>
  );
};
export default OptometricExam;
