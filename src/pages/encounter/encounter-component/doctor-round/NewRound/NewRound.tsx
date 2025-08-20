import React, { useState, useEffect } from 'react';
import { initialListRequest } from '@/types/types';
import { Row, Col, Form, Text } from 'rsuite';
import {
  useDeleteDoctorRoundStaffMutation,
  useGetDoctorRoundsListQuery,
  useGetDoctorRoundStaffListQuery,
  useSaveDoctorRoundMutation,
  useSaveDoctorRoundStaffMutation
} from '@/services/encounterService';
import { newApDoctorRound, newApDoctorRoundStaff } from '@/types/model-types-constructor';
import StaffAssignment from '../../procedure/StaffMember';
import { ApDoctorRound } from '@/types/model-types';
import MyButton from '@/components/MyButton/MyButton';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import RoundInfo from './RoundInfo';
import SectionContainer from '@/components/SectionsoContainer';
import ProgressNotes from './ProgressNotes';
import PatientSummary from './PatientSummary';
import Assessment from './Assessment';
import NursingReportsSummary from './NursingReportsSummary';
import PhysicalExamination from './PhysicalExamination';

const NewRound = ({ patient, encounter, edit, setIsConfirmedRound }) => {
  const dispatch = useAppDispatch();
  const [doctorRound, setDoctorRound] = useState<ApDoctorRound>({ ...newApDoctorRound });
  const authSlice = useAppSelector(state => state.auth);
  const [recordOfIndicationsDescription, setRecordOfIndicationsDescription] = useState({
    indicationsDescription: ''
  });
  // State to hold the request parameters for fetching doctor rounds related to the current patient and encounter
  const [roundListRequest, setRoundListRequest] = useState({
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
  // Define the mutation hook to save a doctor round and get the mutation state
  const [saveRound, saveRoundMutation] = useSaveDoctorRoundMutation();
  // Fetch the list of doctor rounds based on the current filters.
  // Skip the query if patient or encounter keys are not available.
  const { data: doctorRoundList, isLoading } = useGetDoctorRoundsListQuery(roundListRequest, {
    skip: !patient?.key || !encounter?.key
  });

  // save and complete buttons
  const saveAndComplete = () => {
    return (
      <div
       className="bt-right"
       >
        <Col>
          {' '}
          <MyButton
            onClick={handleStartNewRound}
            prefixIcon={() => <FontAwesomeIcon icon={faFileAlt} />}
            disabled={!doctorRound?.key}
          >
            Save Draft
          </MyButton>
        </Col>
        <Col xs={32}>
          <MyButton
            appearance="ghost"
            onClick={handleCompleteRound}
            prefixIcon={() => <FontAwesomeIcon icon={faCircleCheck} />}
            disabled={!doctorRound?.key}
          >
            Complete Round
          </MyButton>
        </Col>
      </div>
    );
  };

  // handle Start New Round Function
  const handleStartNewRound = async () => {
    dispatch(showSystemLoader());
    try {
      if (!doctorRound?.key) {
        await saveRound({
          ...doctorRound,
          patientKey: patient.key,
          encounterKey: encounter.key,
          statusLkey: '91063195286200',
          roundStartTime: doctorRound?.roundStartTime
            ? new Date(doctorRound?.roundStartTime).getTime()
            : 0,
          secondaryDiagnoses: recordOfIndicationsDescription?.indicationsDescription,
          createdBy: authSlice.user.key
        }).unwrap();

        dispatch(notify({ msg: 'New Round Started Successfully', sev: 'success' }));
      } else {
        await saveRound({
          ...doctorRound,
          secondaryDiagnoses: recordOfIndicationsDescription?.indicationsDescription,
          updatedBy: authSlice.user.key
        }).unwrap();

        dispatch(notify({ msg: ' Round Updated Successfully', sev: 'success' }));
      }
    } catch (error) {
      dispatch(notify({ msg: 'Failed to Start New Round', sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  // handle Complete Round Function
  const handleCompleteRound = async () => {
    dispatch(showSystemLoader());
    try {
      await handleStartNewRound();

      await saveRound({
        ...doctorRound,
        statusLkey: '91109811181900',
        secondaryDiagnoses: recordOfIndicationsDescription?.indicationsDescription,
        updatedBy: authSlice.user.key
      }).unwrap();
      dispatch(notify({ msg: 'Round Completed Successfully', sev: 'success' }));
      setDoctorRound({
        ...newApDoctorRound,
        major: false,
        suspected: false,
        shiftLkey: null,
        patientStatusLkey: null,
        statusLkey: '91063195286200'
      });
      setIsConfirmedRound(true);
      setRecordOfIndicationsDescription({ indicationsDescription: '' });
    } catch (error) {
      dispatch(notify({ msg: 'Failed to Complete Round', sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  // Effects
  useEffect(() => {
    if (saveRoundMutation && saveRoundMutation.status === 'fulfilled') {
      setDoctorRound(saveRoundMutation.data);
    }
  }, [saveRoundMutation]);

  useEffect(() => {
    if (isLoading || saveRoundMutation.isLoading) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }
    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, saveRoundMutation.isLoading, dispatch]);

  useEffect(() => {
    if (!patient?.key || !encounter?.key) return;
    const filters = [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter.key
      }
    ];
    setRoundListRequest(prev => ({
      ...prev,
      filters
    }));
  }, [patient?.key, encounter?.key]);

  useEffect(() => {
    const list = doctorRoundList?.object ?? [];
    if (list.length === 0) {
      setDoctorRound({ ...newApDoctorRound });
      return;
    }
    const openRound = list.find(item => item.statusLkey !== '91109811181900');
    if (openRound) {
      setDoctorRound({ ...openRound });
      setRecordOfIndicationsDescription({
        indicationsDescription: openRound.secondaryDiagnoses
      });
      setRoundListRequest(prev => {
        const newFilters = prev.filters.filter(
          f => f.fieldName !== 'key' && f.fieldName !== 'status_lkey'
        );
        return {
          ...prev,
          filters: [
            ...newFilters,
            {
              fieldName: 'key',
              operator: 'match',
              value: openRound.key
            },
            {
              fieldName: 'status_lkey',
              operator: 'notMatch',
              value: '91109811181900'
            }
          ]
        };
      });
    } else {
      const firstItem = list[0];
      setDoctorRound({
        ...newApDoctorRound,
        initialNote: firstItem?.initialNote || ''
      });
      setRoundListRequest(prev => {
        const newFilters = prev.filters.filter(
          f => f.fieldName !== 'key' && f.fieldName !== 'status_lkey'
        );
        return {
          ...prev,
          filters: newFilters
        };
      });
    }
  }, [doctorRoundList]);

  return (
    <Row gutter={15} className="d">
      <Form fluid>
        <Row>
          <SectionContainer
            title={<Text>Round Information</Text>}
            content={
              <RoundInfo
                doctorRound={doctorRound}
                setDoctorRound={setDoctorRound}
                saveAndComplete={saveAndComplete}
                handleStartNewRound={handleStartNewRound}
              />
            }
          />
        </Row>
        <Row>
          <Col md={12}>
            <StaffAssignment
              parentKey={doctorRound?.key}
              label="Round Staff"
              getQuery={useGetDoctorRoundStaffListQuery}
              saveMutation={useSaveDoctorRoundStaffMutation}
              deleteMutation={useDeleteDoctorRoundStaffMutation}
              newStaffObj={newApDoctorRoundStaff}
              filterFieldName="doctorRoundKey"
              width={200}
            />
          </Col>
          <Col md={12}>
            <SectionContainer
              title={<Text>Progress Notes</Text>}
              content={
                <ProgressNotes
                  doctorRound={doctorRound}
                  setDoctorRound={setDoctorRound}
                  doctorRoundList={doctorRoundList}
                />
              }
            />
          </Col>
        </Row>
        <Row>
          <SectionContainer
            title={<Text>Assessment</Text>}
            content={
              <Assessment
                doctorRound={doctorRound}
                setDoctorRound={setDoctorRound}
                recordOfIndicationsDescription={recordOfIndicationsDescription}
                setRecordOfIndicationsDescription={setRecordOfIndicationsDescription}
              />
            }
          />
        </Row>
        <Row>
          <SectionContainer
            title={<Text>Patient Summary</Text>}
            content={<PatientSummary patient={patient} />}
          />
        </Row>
        <Row>
          <SectionContainer
            title={<Text>Nursing Reports Summary</Text>}
            content={<NursingReportsSummary patient={patient} encounter={encounter} />}
          />
        </Row>
        <Row>
          <SectionContainer
            title={<Text>Physical Examination</Text>}
            content={<PhysicalExamination patient={patient} encounter={encounter} edit={edit} />}
          />
        </Row>
        <br />
        <Row className="bt-div">{saveAndComplete()}</Row>
      </Form>
    </Row>
  );
};
export default NewRound;

