import { useAppDispatch } from '@/hooks';
import { useSaveDiagnosticOrderTestRadReportMutation } from '@/services/radService';
import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Row } from 'rsuite';
import './styles.less';
import { formatDateWithoutSeconds } from '@/utils';
import MyStepper from '@/components/MyStepper';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useSaveDiagnosticOrderTestMutation } from '@/services/encounterService';
import DetailsCard from '@/components/DetailsCard';
import {
  faCircleCheck,
  faClock,
  faRectangleList,
  faTriangleExclamation} from '@fortawesome/free-solid-svg-icons';

import { RootState } from '@/store';
import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsRadReport,
  newApEncounter,
  newApPatient
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import ReactDOMServer from 'react-dom/server';
import { Col, Panel } from 'rsuite';
import PatientSide from '../lab-module/PatienSide';
import FilterDate from './FilterDate';
import Orders from './Orders';
import Report from './Report';
import Tests from './Tests';
import MyButton from '@/components/MyButton/MyButton';
import FilmAndReagentsTableModal from './FilmAndReagentsTableModal';
const Rad = () => {
  const dispatch = useAppDispatch();
  const [currentStep, setCurrentStep] = useState('6055029972709625');
  const [encounter, setEncounter] = useState({ ...newApEncounter, discharge: false });
  const [patient, setPatient] = useState({ ...newApPatient });
  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders });
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [report, setReport] = useState({ ...newApDiagnosticOrderTestsRadReport });
  const [openFilmAndReagentsModal, setOpenFilmAndReagentsModal] = useState(false);
  const [listOrdersResponse, setListOrdersResponse] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'isUrgent',
    sortType: 'desc'
  });
  const ReportRef = useRef(null);
  const refetchReport = () => {
    ReportRef.current?.reportFetch();
  };

  const [listReportResponse, setListReportResponse] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'order_test_key',
        operator: 'match',
        value: test?.key || undefined
      }
    ]
  });

  const [saveTest] = useSaveDiagnosticOrderTestMutation();
  const [saveReport, saveReportMutation] = useSaveDiagnosticOrderTestRadReportMutation();

  const divContent = (
    <div className="flexs">
      <h5>Clinical Radiology</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Rad'));
  dispatch(setDivContent(divContentHTML));

  useEffect(() => {
    setPatient(order.patient);
    setEncounter(order.encounter);
  }, [order]);

  useEffect(() => {
    console.log('test from rad', test);
    setCurrentStep(test.processingStatusLkey);
    const updatedFilters = [
      {
        fieldName: 'order_test_key',
        operator: 'match',
        value: test?.key || undefined
      }
    ];
    setListReportResponse(prevRequest => ({
      ...prevRequest,
      filters: [...updatedFilters]
    }));
  }, [test]);

  useEffect(() => {
    refetchReport();
  }, [saveReportMutation.isSuccess]);

  const stepsData = [
    {
      key: '6816324725527414',
      value: 'Patient Arrived',
      description: formatDateWithoutSeconds(test.patientArrivedAt)
    },
    {
      key: '6055074111734636',
      value: 'Accepted',
      description: formatDateWithoutSeconds(test.acceptedAt)
    },
    {
      key: '6055192099058457',
      value: 'Rejected',
      description: formatDateWithoutSeconds(test.rejectedAt),
      isError: true
    },
    {
      key: '265123250697000',
      value: 'Result Ready',
      description: formatDateWithoutSeconds(test.readyAt)
    },
    {
      key: '265089168359400',
      value: 'Result Approved',
      description: formatDateWithoutSeconds(test.approvedAt)
    }
  ];

  const filteredStepsData = stepsData.filter(step =>
    currentStep == '6055192099058457' ? step.value !== 'Accepted' : step.value !== 'Rejected'
  );
  const activeStep = filteredStepsData.findIndex(step => step.key === currentStep);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <div>

          <div className="count-div-on-top-of-page">
      <DetailsCard
        title="Result Ready"
        number={2}
        icon={faCircleCheck}
        color="--green-600"
        backgroundClassName="result-ready-section"
        width={'20vw'}
      />
      <DetailsCard
        title="Patient Arrived"
        number={2}
        icon={faClock}
        color="--primary-yellow"
        backgroundClassName="sample-collected-section"
        width={'20vw'}
      />
      <DetailsCard
        title="New"
        number={2}
        icon={faRectangleList}
        color="--primary-blue"
        backgroundClassName="new-section"
        width={'20vw'}
      />
      <DetailsCard
        title="Total Test"
        number={2}
        icon={faTriangleExclamation}
        color="--gray-dark"
        backgroundClassName="total-test-section"
        width={'20vw'}
      />
    </div>


      <div className="container">
        <div className="left-boxs">
          <Row>
            <Col xs={14}>
              <Orders
                order={order}
                setOrder={setOrder}
                listOrdersResponse={listOrdersResponse}
                setListOrdersResponse={setListOrdersResponse}
              />
            </Col>
            <Col xs={10}>
              <Row>
                <FilterDate
                  listOrdersResponse={listOrdersResponse}
                  setListOrdersResponse={setListOrdersResponse}
                />
              </Row>
              {test.key && (
                <Row>
                  <MyStepper activeStep={activeStep} stepsList={filteredStepsData} />
                </Row>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={24}>
              <Panel header="Order's Tests" defaultExpanded>
                <Tests
                  saveReportMutation={saveReportMutation}
                  test={test}
                  setTest={setTest}
                  order={order}
                  patient={patient}
                  encounter={encounter}
                  saveTest={saveTest}
                  saveReport={saveReport}
                  reportFetch={refetchReport}
                />
              </Panel>
            </Col>
          </Row>
          <Row>
            <Col md={24}>
              <Panel header="Test's Results Processing" defaultExpanded>
                <div className="flexs-end">
                  <MyButton
                    onClick={() => {
                      setOpenFilmAndReagentsModal(true);
                    }}
                  >
                    Use Film & Reagents
                  </MyButton>
                </div>
                <Report
                  report={report}
                  setReport={setReport}
                  test={test}
                  setTest={setTest}
                  saveReport={saveReport}
                  saveTest={saveTest}
                  saveReportMutation={saveReportMutation}
                  listReportResponse={listReportResponse}
                  setListReportResponse={setListReportResponse}
                  patient={patient}
                  order={order}
                />
                <FilmAndReagentsTableModal
                  open={openFilmAndReagentsModal}
                  setOpen={setOpenFilmAndReagentsModal}
                />
              </Panel>
            </Col>
          </Row>
        </div>

        <div className="right-boxs">
          <PatientSide patient={patient} encounter={encounter} />
        </div>
      </div>
    </div>
  );
};
export default Rad;
