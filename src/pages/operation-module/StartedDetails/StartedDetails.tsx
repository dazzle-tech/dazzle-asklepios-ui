import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyModal from '@/components/MyModal/MyModal';
import PatientSide from '@/pages/encounter/encounter-main-info-section/PatienSide';
import {
  useGetOperationListQuery,
  useSaveOperationRequestsMutation
} from '@/services/operationService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import React, { useState } from 'react';
import { Col, Divider, Form, Row, Tabs } from 'rsuite';
import PatientArrival from './PatientArrival';
import { useAppSelector } from '@/hooks';
import OperativeTimeOut from './OperativeTimeOut';
import AnesthesiaInduction from './AnesthesiaInduction';
import SurgicalHistory from '@/pages/encounter/encounter-component/patient-history/SurgicalHistory';
import SurgicalPreparation from './SurgicalPreparation';
import IntraoperativeEventsTracking from './IntraoperativeEventsTracking';
import PostOperativeNote from './PostOperativeNote';

// Import external styles
import './styles.less';
import MyTab from '@/components/MyTab';

const StartedDetails = ({
  open,
  setOpen,
  patient,
  encounter,
  operation,
  setOperation,
  refetch,
  editable
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const [save, saveMutation] = useSaveOperationRequestsMutation();
  const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  const { data: anesthTypesLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: operationList } = useGetOperationListQuery({ ...initialListRequest });
  const [activeTab, setActiveTab] = useState<string>('1');

  const tabData = [
    {
      title: 'Patient Arrival & Registration',
      content: (
        <PatientArrival
          operation={operation}
          patient={patient}
          encounter={encounter}
          user={authSlice.user}
          editable={editable}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )
    },
    {
      title: 'Pre-Operative Time-out',
      content: (
        <OperativeTimeOut
          operation={operation}
          refetch={refetch}
          editable={editable}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabledTabs={[
            !['PROC_INPROGRESS', 'PROC_COMPLETED'].includes(
              operation?.operationStatusLvalue?.valueCode
            )
              ? ['3', '4', '5', '6']
              : []
          ].flat()}
        />
      )
    },
    {
      title: 'Anesthesia Induction & Monitoring',
      content: (
        <AnesthesiaInduction
          operation={operation}
          patient={patient}
          encounter={encounter}
          editable={editable}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ),
      disabled: !['PROC_INPROGRESS', 'PROC_COMPLETED'].includes(
        operation?.operationStatusLvalue?.valueCode
      )
    },
    {
      title: 'Surgical Preparation & Incision',
      content: (
        <SurgicalPreparation
          operation={operation}
          editable={editable}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ),
      disabled: !['PROC_INPROGRESS', 'PROC_COMPLETED'].includes(
        operation?.operationStatusLvalue?.valueCode
      )
    },
    {
      title: 'Intraoperative & Events Tracking',
      content: (
        <IntraoperativeEventsTracking
          operation={operation}
          patient={patient}
          encounter={encounter}
          editable={editable}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ),
      disabled: !['PROC_INPROGRESS', 'PROC_COMPLETED'].includes(
        operation?.operationStatusLvalue?.valueCode
      )
    },
    {
      title: 'Post-Operative Notes & Handover',
      content: <PostOperativeNote operation={operation} editable={editable} refetch={refetch} />,
      disabled: !['PROC_INPROGRESS', 'PROC_COMPLETED'].includes(
        operation?.operationStatusLvalue?.valueCode
      )
    }
  ];
  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Operation Progress"
        size="full"
        hideActionBtn
        content={
          <div className="started-details-container">
            <div className="started-details-left-box">
              <Form fluid>
                <Row gutter={13}>
                  <Col md={4}>
                    <MyInput
                      fieldType="select"
                      selectData={operationList?.object ?? []}
                      selectDataLabel="name"
                      selectDataValue="key"
                      width="100%"
                      fieldName="operationKey"
                      record={operation}
                      setRecord={setOperation}
                    />
                  </Col>
                  <Col md={4}>
                    <MyInput
                      disabled={true}
                      width="100%"
                      fieldType="select"
                      fieldLabel="Body Part "
                      selectData={bodypartLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'bodyPartLkey'}
                      record={operation}
                      setRecord={setOperation}
                    />
                  </Col>
                  <Col md={4}>
                    <MyInput
                      disabled={true}
                      width="100%"
                      fieldType="select"
                      fieldLabel="Side"
                      selectData={sideLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'sideLkey'}
                      record={operation}
                      setRecord={setOperation}
                    />
                  </Col>
                  <Col md={4}>
                    <MyInput
                      disabled={true}
                      fieldType="select"
                      selectData={anesthTypesLov?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      width="100%"
                      fieldName="plannedAnesthesiaTypeLkey"
                      record={operation}
                      setRecord={setOperation}
                    />
                  </Col>
                  <Col md={3}>
                    <br />
                    <MyButton
                      onClick={() => {
                        try {
                          save({ ...operation });
                        } catch (error) {
                          console.log('Error in save');
                        }
                      }}
                    >
                      Save
                    </MyButton>
                  </Col>
                </Row>
              </Form>
              <Divider />
              <MyTab 
               data={tabData}
               activeTab={activeTab}
               setActiveTab={setActiveTab}
               className="started-details-tabs"
              />
            </div>

            <div className="started-details-right-box">
              <PatientSide patient={patient} encounter={encounter} />
            </div>
          </div>
        }
      />
    </>
  );
};

export default StartedDetails;
