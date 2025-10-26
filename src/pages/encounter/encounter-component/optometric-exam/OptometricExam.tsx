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
import PlusIcon from '@rsuite/icons/Plus';
import CancellationModal from '@/components/CancellationModal';
import AddOptometricTest from './AddOptometricTest';
import OptometricExamTabs from './OptometricExamTabs';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useLocation } from 'react-router-dom';
const OptometricExam = () => {
   const location = useLocation();
     const { patient, encounter, edit } = location.state || {};
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
  const divContent = (
      <div style={{ display: 'flex' }}>
        <h5>
          <Translate>
          Optometric Exam
          </Translate>
          </h5>
      </div>
    );
    dispatch(setPageCode('Clinical_Visit'));
    dispatch(setDivContent(divContent));

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
    setSelectedIcd10({ text: ' ' });
    setSecondSelectedicd10({ text: ' ' });
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
          <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={handleAddNewOptometricExam}>Add </MyButton>
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
        timeM={time}
        edit={edit} />

      <OptometricExamTabs
        isLoading={isLoading}
        optometricExamResponse={optometricExamResponse}
        setOpen={setOpen}
        optometricExam={optometricExam}
        setOptometricExam={setOptometricExam}
        optometricExamListRequest={optometricExamListRequest}
        setOptometricExamListRequest={setOptometricExamListRequest}
        setSelectedIcd10={setSelectedIcd10}
        setSecondSelectedicd10={setSecondSelectedicd10}
        setTime={setTime} />
      <CancellationModal title="Cancel Optometric Exam" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={optometricExam} setObject={setOptometricExam} handleCancle={handleCancle} fieldName="cancellationReason" />
    </div>
  );
};
export default OptometricExam;
