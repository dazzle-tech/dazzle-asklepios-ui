import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, Icon, PlusRound } from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
import { Badge } from 'rsuite';
import './styles.less'
import {
  InputGroup,
  ButtonToolbar,
  FlexboxGrid,
  Form,
  IconButton,
  Input,
  Panel,
  Stack,
  Divider,
  Drawer,
  Table,
  Pagination,
  Button,
  DatePicker,
  SelectPicker
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import PageIcon from '@rsuite/icons/Page';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import CharacterAuthorizeIcon from '@rsuite/icons/CharacterAuthorize';
// import PeoplesTimeIcon from '@rsuite/icons/PeoplesTime';
import { addFilterToListRequest, calculateAge, formatDate, fromCamelCaseToDBName } from '@/utils';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import ListIcon from '@rsuite/icons/List';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import SendIcon from '@rsuite/icons/Send';
import { useGetIcdListQuery } from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import CharacterLockIcon from '@rsuite/icons/CharacterLock';
import { useLocation } from "react-router-dom";
import PageEndIcon from '@rsuite/icons/PageEnd';
import { timeStamp } from 'console';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch, useSelector } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
const EncounterList = () => {
  const patientSlice = useAppSelector(state => state.patient);
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
  const [encounter, setLocalEncounter] = useState({ ...newApEncounter });
  const { data: icdListResponseData } = useGetIcdListQuery({
    ...initialListRequest,
    pageSize: 100
  });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });


  const { data: encounterListResponse } = useGetEncountersQuery(listRequest);

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),//new Date(),
    toDate: new Date()
  });

  const isSelected = rowData => {
    if (rowData && encounter && rowData.key === encounter.key) {
      return 'selected-row';
    } else return '';
  };
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  const handleManualSearch = () => {
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

  useEffect(() => {
    // init list
    handleManualSearch();
  }, []);

  const goToVisit = () => {
    if (encounter && encounter.key) {
      dispatch(setEncounter(encounter));
      dispatch(setPatient(encounter['patientObject']));
    }

    const privatePatientPath = '/user-access-patient-private';
    const encounterPath = '/encounter';
    const targetPath = localPatient.privatePatient ? privatePatientPath : encounterPath;

    if (localPatient.privatePatient) {
      navigate(targetPath, { state: { info: "toEncounter", fromPage: "EncounterList", patient: localPatient, encounter: encounter } });
    } else {
      navigate(targetPath, { state: { info: "toEncounter", fromPage: "EncounterList", patient: localPatient, encounter: encounter } });
    }

    const currentDateTime = new Date().toLocaleString();
    setDateClickToVisit(currentDateTime);
  };

  const goToPreVisitObservations = () => {

    const privatePatientPath = '/user-access-patient-private';
    const preObservationsPath = '/encounter-pre-observations';
    const targetPath = localPatient.privatePatient ? privatePatientPath : preObservationsPath;
    if (localPatient.privatePatient) {
      navigate(targetPath, { state: { info: "toNurse", patient: localPatient, encounter: encounter } });
    } else {
      navigate(targetPath, { state: { patient: localPatient, encounter: encounter } });

    }
  };
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(null));
    };
  }, [location.key]);
  return (
    <>
      <Panel

      >
        <Panel style={{ zoom: .85 }}>
          <ButtonToolbar>

            <Button appearance="primary" onClick={goToVisit} style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "3px" }} >

              <icons.ArrowRight style={{ marginRight: '5px', color: 'white' }} />
              <Translate>Go to Visit</Translate>
            </Button>
            <Divider vertical />
            <DatePicker
              oneTap
              placeholder="From Date"
              value={dateFilter.fromDate}
              onChange={e => setDateFilter({ ...dateFilter, fromDate: e })}

              style={{ width: '234px' }}
            />
            <DatePicker
              oneTap
              placeholder="To Date"
              value={dateFilter.toDate}
              onChange={e => setDateFilter({ ...dateFilter, toDate: e })}
              style={{ width: '234px' }}
            />

            <Button appearance="primary" onClick={handleManualSearch} style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "3px" }} >

              <icons.Search style={{ marginRight: '5px', color: 'white' }} />
              <Translate>Search</Translate>
            </Button>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Button onClick={goToPreVisitObservations} appearance="ghost" style={{ borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)', display: 'flex', marginLeft: "3px" }}>

                <PageEndIcon style={{ marginRight: '5px', color: 'var(--primary-blue)' }} />
                <Translate>Nurse Station</Translate>
              </Button>
              <SelectPicker
                style={{ width: 185 }}
                data={[
                  {
                    label: (
                      <Button
                        color='cyan'
                        appearance="ghost"
                        style={{ color: 'var(--primary-blue', zoom: 0.8, textAlign: 'left', width: 170 }}
                        disabled={localPatient.key === undefined}
                        block
                      >
                        <span>Visit History</span>
                      </Button>
                    ),
                    value: 'visitHistory',
                  },
                ]}
                placeholder={
                  <span style={{ color: 'var(--primary-blue' }}>
                    <ListIcon style={{ marginRight: 8 }} />
                    {"  "} More
                  </span>
                }
                menuStyle={{ marginTop: 0, width: 180, padding: 5 }}
              />

            </div>
          </ButtonToolbar>
        </Panel>
        <Table
          height={600}
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
          rowHeight={40}
          bordered
          cellBordered
          data={encounterListResponse?.object ?? []}
          onRowClick={rowData => {
            setLocalEncounter(rowData);
            setLocalPatient(rowData.patientObject)
          }}
          rowClassName={(rowData, rowIndex) => {
            if (rowIndex === -1) return "first-row";
            return isSelected(rowData);
          }}
        >
          <Column sortable flexGrow={2} fullText>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
              <Translate>#</Translate>
            </HeaderCell>
            <Cell dataKey="queueNumber" />
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
              <Translate>VISIT ID</Translate>
            </HeaderCell>
            <Cell dataKey="visitId" />
          </Column>
          <Column sortable flexGrow={6} fullText>
            <HeaderCell fullText style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
              <Translate>PATIENT NAME</Translate>
            </HeaderCell>
            <Cell dataKey="patientFullName" fullText>
              {rowData => rowData?.patientObject?.privatePatient ? (
                <div>
                  <Badge color="cyan" content={'Private'}>
                    <p style={{ marginTop: '5px' }}>{rowData?.patientObject?.fullName}</p>
                  </Badge>
                </div>
              ) : (
                <p>{rowData?.patientObject?.fullName}</p>
              )
              }
            </Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
              <Translate>MRN</Translate>
            </HeaderCell>
            <Cell>
              {(rowData) => {
                return rowData?.patientObject?.patientMrn;
              }}
            </Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
              <Translate>AGE</Translate>
            </HeaderCell>
            <Cell dataKey="patientAge" />
          </Column>

          <Column sortable flexGrow={3} fullText fixed>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
              <Translate>VISIT TYPE</Translate>
            </HeaderCell>
            <Cell >
              {rowData=>rowData.encounterTypeLvalue?rowData.encounterTypeLvalue.lovDisplayVale:rowData.encounterTypeLkey}
            </Cell>
          </Column>
          <Column sortable flexGrow={4} fullText>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>

              <Translate> CHIEF COMPLAIN </Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.chiefComplaint
              }</Cell>
          </Column>
          <Column sortable flexGrow={5} fullText>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>

              <Translate>DIAGNOSIS</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.diagnosis}

            </Cell>

          </Column>
          <Column sortable flexGrow={3} fullText>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>

              <Translate>PRESCRIPTION</Translate>
            </HeaderCell>
            <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} >{rowData =>
              rowData.hasPrescription ? <Badge content="YES" style={{
                backgroundColor: '#bcf4f7',
                color: '#008aa6',
                padding: '5px 19px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: "bold"
              }} /> : <Badge
                style={{
                  backgroundColor: 'rgba(238, 130, 238, 0.2)',
                  color: '#4B0082',
                  padding: '5px 19px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: "bold"
                }}
                content="NO"
              />
            }</Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>

              <Translate>HAS ORDER</Translate>
            </HeaderCell>
            <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} >{rowData =>
              rowData.hasOrder ? <Badge content="YES" style={{
                backgroundColor: '#bcf4f7',
                color: '#008aa6',
                padding: '5px 19px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: "bold"
              }} /> : <Badge
                style={{
                  backgroundColor: 'rgba(238, 130, 238, 0.2)',
                  color: '#4B0082',
                  padding: '5px 19px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: "bold"
                }}
                content="NO"
              />
            }</Cell>
          </Column>

          <Column sortable flexGrow={3}>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>

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
          <Column sortable flexGrow={3}>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
              <Translate>DATE</Translate>
            </HeaderCell>
            <Cell dataKey="plannedStartDate" />
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>

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
            <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
              <Translate>IS OBSERVED</Translate>
            </HeaderCell>
            <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {rowData => (rowData.hasObservation ? <Badge content="YES" style={{
                backgroundColor: '#bcf4f7',
                color: '#008aa6',
                padding: '5px 19px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: "bold"
              }} /> : <Badge
                style={{
                  backgroundColor: 'rgba(238, 130, 238, 0.2)',
                  color: '#4B0082',
                  padding: '5px 19px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: "bold"
                }}
                content="NO"
              />)}
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
