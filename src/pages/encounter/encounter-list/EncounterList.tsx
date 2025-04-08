import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserDoctor } from "@fortawesome/free-solid-svg-icons";
import { faUserNurse } from "@fortawesome/free-solid-svg-icons";
import { Badge } from 'rsuite';
import './styles.less'
import {
  Form,
  Panel,
  Table,
  Pagination,
  Tooltip,
  Whisper
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
// import PeoplesTimeIcon from '@rsuite/icons/PeoplesTime';
import { addFilterToListRequest, formatDate } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { useLocation } from "react-router-dom";
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import './styles.less'
const EncounterList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Patients Visit List</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('P_Encounters'));
  dispatch(setDivContent(divContentHTML));
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient })
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [startEncounter] = useStartEncounterMutation()
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  const { data: encounterListResponse, isFetching, isLoading } = useGetEncountersQuery(listRequest);
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  //Functions
  const isSelected = rowData => {
    if (rowData && encounter && rowData.key === encounter.key) {
      return 'selected-row';
    } else return '';
  };
  const handleManualSearch = () => {
    setManualSearchTriggered(true);
    if (dateFilter.fromDate && dateFilter.toDate) {
      const formattedFromDate = formatDate(dateFilter.fromDate);
      const formattedToDate = formatDate(dateFilter.toDate);
      setListRequest(
        addFilterToListRequest(
          'planned_start_date',
          'between',
          formattedFromDate + '_' + formattedToDate,
          listRequest
        )
      );
    } else if (dateFilter.fromDate) {
      const formattedFromDate = formatDate(dateFilter.fromDate);
      setListRequest(
        addFilterToListRequest('planned_start_date', 'gte', formattedFromDate, listRequest)
      );
    } else if (dateFilter.toDate) {
      const formattedToDate = formatDate(dateFilter.toDate);
      setListRequest(
        addFilterToListRequest('planned_start_date', 'lte', formattedToDate, listRequest)
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  const handleGoToVisit = async (encounterData, patientData) => {
    await startEncounter(encounterData).unwrap();
    if (encounterData && encounterData.key) {
      dispatch(setEncounter(encounterData));
      dispatch(setPatient(encounterData['patientObject']));
    }
    const privatePatientPath = '/user-access-patient-private';
    const encounterPath = '/encounter';
    const targetPath = patientData.privatePatient ? privatePatientPath : encounterPath;
    if (patientData.privatePatient) {
      navigate(targetPath, { state: { info: "toEncounter", fromPage: "EncounterList", patient: patientData, encounter: encounterData } });
    } else {
      navigate(targetPath, { state: { info: "toEncounter", fromPage: "EncounterList", patient: patientData, encounter: encounterData } });
    }
    const currentDateTime = new Date().toLocaleString();
    setDateClickToVisit(currentDateTime);
  };
  const handleGoToPreVisitObservations = async (encounterData, patientData) => {
    const privatePatientPath = '/user-access-patient-private';
    const preObservationsPath = '/encounter-pre-observations';
    const targetPath = localPatient.privatePatient ? privatePatientPath : preObservationsPath;
    if (localPatient.privatePatient) {
      navigate(targetPath, { state: { info: "toNurse", patient: patientData, encounter: encounterData } });
    } else {
      navigate(targetPath, { state: { patient: patientData, encounter: encounterData } });

    }
  };

  //useEffect
  useEffect(() => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(" "));
  }, [location.pathname, dispatch, isLoading]);
  useEffect(() => {
    if (!isFetching && manualSearchTriggered) {
      setManualSearchTriggered(false);
    }
  }, [isFetching, manualSearchTriggered]);
  useEffect(() => {
    // init list
    handleManualSearch();
  }, []);

  return (
    <>
      <Panel>
        <Form layout='inline' fluid className='date-filter-form' >
          <MyInput
            width={291}
            height={40}
            column
            fieldType="date"
            fieldLabel="From Date"
            fieldName="fromDate"
            record={dateFilter}
            setRecord={setDateFilter}
          />
          <MyInput
            height={40}
            width={291}
            column
            fieldType="date"
            fieldLabel="To Date"
            fieldName="toDate"
            record={dateFilter}
            setRecord={setDateFilter}
          />
          <div style={{height:'100%' ,paddingTop:'30px' ,marginLeft:'auto'}}>
          <MyButton
          
            onClick={handleManualSearch}
          >
           <icons.Search />
          </MyButton>
          </div>
        </Form>
        <Table
          height={450}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortColumn={(sortBy, sortType) => {
            if (sortBy)
              setListRequest({
                ...listRequest,
                sortBy,
                sortType
              });
          }}
          data={encounterListResponse?.object ?? []}
          onRowClick={rowData => {
            setLocalEncounter(rowData);
            setLocalPatient(rowData.patientObject)
          }}
          rowClassName={isSelected}
          loading={isLoading || (manualSearchTriggered && isFetching)}
        >
          <Column flexGrow={1} fullText>
            <HeaderCell  >
              <Translate>#</Translate>
            </HeaderCell>
            <Cell dataKey="queueNumber" />
          </Column>
          <Column flexGrow={3}>
            <HeaderCell  >
              <Translate>VISIT ID</Translate>
            </HeaderCell>
            <Cell dataKey="visitId" />
          </Column>
          <Column flexGrow={6} fullText>
            <HeaderCell fullText  >
              <Translate>PATIENT NAME</Translate>
            </HeaderCell>
            <Cell dataKey="patientFullName" fullText>
              {rowData => {
                const tooltipSpeaker = (
                  <Tooltip>
                    <div>MRN : {rowData?.patientObject?.patientMrn}</div>
                    <div>Age : {rowData?.patientAge}</div>
                    <div>Gender : {rowData?.patientObject?.genderLvalue
                      ? rowData?.patientObject?.genderLvalue?.lovDisplayVale
                      : rowData?.patientObject?.genderLkey}</div>
                  </Tooltip>
                );
                return (
                  <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
                    <div style={{ display: 'inline-block' }}>
                      {rowData?.patientObject?.privatePatient ? (
                        <Badge color="cyan" content="Private">
                          <p style={{ marginTop: '5px', cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
                        </Badge>
                      ) : (
                        <p style={{ cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
                      )}
                    </div>
                  </Whisper>
                );
              }}
            </Cell>
          </Column>
          <Column flexGrow={3} fullText >
            <HeaderCell  >
              <Translate>VISIT TYPE</Translate>
            </HeaderCell>
            <Cell >
              {rowData => rowData.visitTypeLvalue ? rowData.visitTypeLvalue.lovDisplayVale : rowData.visitTypeLkey}
            </Cell>
          </Column>
          <Column flexGrow={4} fullText>
            <HeaderCell  >
              <Translate> CHIEF COMPLAIN </Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.chiefComplaint
              }</Cell>
          </Column>
          <Column flexGrow={5} fullText>
            <HeaderCell>
              <Translate>DIAGNOSIS</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.diagnosis}
            </Cell>
          </Column>
          <Column flexGrow={3} fullText>
            <HeaderCell>
              <Translate>PRESCRIPTION</Translate>
            </HeaderCell>
            <Cell>{rowData =>
              rowData.hasPrescription ? <Badge content="YES"
                className='status-yes'
              /> : <Badge
                className='status-no'
                content="NO"
              />
            }</Cell>
          </Column>
          <Column flexGrow={3}>
            <HeaderCell  >
              <Translate>HAS ORDER</Translate>
            </HeaderCell>
            <Cell>{rowData =>
              rowData.hasOrder ? <Badge content="YES"
                className=' status-yes'
              /> : <Badge
                className='status-no'
                content="NO"
              />
            }</Cell>
          </Column>
          <Column flexGrow={3}>
            <HeaderCell  >
              <Translate>PRIORITY</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.encounterPriorityLvalue
                  ? rowData.encounterPriorityLvalue.lovDisplayVale
                  : rowData.encounterPriorityLkey
              }
            </Cell>
          </Column>
          <Column flexGrow={3}>
            <HeaderCell  >
              <Translate>DATE</Translate>
            </HeaderCell>
            <Cell dataKey="plannedStartDate" />
          </Column>
          <Column flexGrow={3}>
            <HeaderCell  >
              <Translate>STATUS</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.encounterStatusLvalue
                  ? rowData.encounterStatusLvalue.lovDisplayVale
                  : rowData.encounterStatusLkey
              }
            </Cell>
          </Column>
          <Column >
            <HeaderCell  >
              <Translate>IS OBSERVED</Translate>
            </HeaderCell>
            <Cell>
              {rowData => (rowData.hasObservation ? <Badge
                content="YES"
                className='status-yes'
              /> : <Badge
                className='status-no'
                content="NO"
              />)}
            </Cell>
          </Column>
          <Column >
            <HeaderCell  >
              <Translate> </Translate>
            </HeaderCell>
            <Cell style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {rowData =>
                <Form layout='inline' fluid>
                  <MyButton
                   size='small'
                    
                    onClick={() => {
                      const encounterData = rowData;
                      const patientData = rowData.patientObject;
                      setLocalEncounter(encounterData);
                      setLocalPatient(patientData);
                      handleGoToVisit(encounterData, patientData);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserDoctor}/>
                  </MyButton>
                  <MyButton
                   
                    size='small'
                    backgroundColor='black'
                    onClick={() => {
                      const encounterData = rowData;
                      const patientData = rowData.patientObject;
                      setLocalEncounter(encounterData);
                      setLocalPatient(patientData);
                      handleGoToPreVisitObservations(encounterData, patientData);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserNurse} />
                  </MyButton>
                </Form>
              }
            </Cell>
          </Column>
        </Table>
        <div style={{ padding: 20 }}>
          <Pagination
            prev
            next
            first
            last
            ellipsis
            boundaryLinks
            maxButtons={5}
            size="xs"
            layout={['total', '-', 'limit', '|', 'pager', 'skip']}
            limitOptions={[5, 15, 30]}
            limit={listRequest.pageSize}
            activePage={listRequest.pageNumber}
            onChangePage={pageNumber => {
              setListRequest({ ...listRequest, pageNumber });
            }}
            onChangeLimit={pageSize => {
              setListRequest({ ...listRequest, pageSize });
            }}
            total={encounterListResponse?.extraNumeric ?? 0}
          />
        </div>
      </Panel>
    </>
  );
};

export default EncounterList;
