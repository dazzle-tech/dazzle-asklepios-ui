import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, Icon, PlusRound } from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
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
  DatePicker
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import PageIcon from '@rsuite/icons/Page';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import CharacterAuthorizeIcon from '@rsuite/icons/CharacterAuthorize';
// import PeoplesTimeIcon from '@rsuite/icons/PeoplesTime';
import { addFilterToListRequest, calculateAge, formatDate, fromCamelCaseToDBName } from '@/utils';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import SendIcon from '@rsuite/icons/Send';
import { useGetIcdListQuery } from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import CharacterLockIcon from '@rsuite/icons/CharacterLock';
import PageEndIcon from '@rsuite/icons/PageEnd';
import { timeStamp } from 'console';
const EncounterList = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [encounter, setLocalEncounter] = useState({ ...newApEncounter });
  const { data: icdListResponseData } = useGetIcdListQuery({
    ...initialListRequest,
    pageSize: 100
  });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });

  const [patientListRequest, setPatientListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });

  const [dateClickToVisit, setDateClickToVisit] = useState('');
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
      navigate('/encounter');
    }
    const currentDateTime = new Date().toLocaleString();
    setDateClickToVisit(currentDateTime);
  };
  const goToPreVisitObservations = () => {
    if (encounter && encounter.key) {
      dispatch(setEncounter(encounter));
      dispatch(setPatient(encounter['patientObject']));
      navigate('/encounter-pre-observations');
    }
  };
  return (
    <>
      <Panel
        header={
          <h3 className="title">
            <Translate>Patients Visit List</Translate>
          </h3>
        }
      >
        <Panel>
          <ButtonToolbar>
            <IconButton
              appearance="primary"
              color="cyan"
              disabled={!encounter.key}
              onClick={goToVisit}
              icon={<icons.ArrowRight />}
            >
              <Translate>Go to Visit</Translate>
            </IconButton>

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
            <IconButton appearance="primary" icon={<icons.Search />} onClick={handleManualSearch}>
              <Translate>Search</Translate>
            </IconButton>



          </ButtonToolbar>
          <br />
          <ButtonToolbar>
            <IconButton
              appearance="primary"
              color="violet"
              icon={<PageIcon />}
            >
              <Translate>My Appointments</Translate>
            </IconButton>
            <IconButton appearance="ghost" color="violet" icon={<SendIcon />} >
              <Translate>Create Appointment</Translate>
            </IconButton>
            <IconButton appearance="primary" color="cyan" icon={<CharacterLockIcon />} >
              <Translate>EMR</Translate>
            </IconButton>
            <IconButton appearance="ghost" color="cyan" icon={<CharacterAuthorizeIcon />} >
              <Translate>Order Results</Translate>
            </IconButton>
            <IconButton appearance="primary" color="blue" icon={<CharacterAuthorizeIcon />} >
              <Translate>Waiting list</Translate>
            </IconButton>

            <div style={{ marginLeft: 'auto' }}>
              <IconButton
                appearance="primary"
                color="violet"
                disabled={!encounter.key}
                onClick={goToPreVisitObservations}
                icon={<PageEndIcon />}
              >
                <Translate>Nurse Station</Translate>
              </IconButton>
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
          headerHeight={80}
          rowHeight={60}
          bordered
          cellBordered
          data={encounterListResponse?.object ?? []}
          onRowClick={rowData => {
            setLocalEncounter(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable flexGrow={2}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('queueNumber', e)} />
              <Translate>Queue Number</Translate>
            </HeaderCell>
            <Cell dataKey="queueNumber" />
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('visitId', e)} />
              <Translate>Visit ID</Translate>
            </HeaderCell>
            <Cell dataKey="visitId" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('patientFullName', e)} />
              <Translate>Patient Name</Translate>
            </HeaderCell>
            <Cell dataKey="patientFullName" />
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Input
                onChange={(e) => handleFilterChange('patientKey', e)}
              />
              <Translate>MRN</Translate>
            </HeaderCell>
            <Cell>
              {(rowData) => {
                return rowData?.patientObject?.patientMrn;
              }}
            </Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('patientAge', e)} />
              <Translate>Age</Translate>
            </HeaderCell>
            <Cell dataKey="patientAge" />
          </Column>

          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('type', e)} />
              <Translate>Visit Type</Translate>
            </HeaderCell>
            <Cell dataKey="type" />
          </Column>
          <Column sortable flexGrow={4} fullText>
            <HeaderCell>

              <Translate> Chief Complain </Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.chiefComplaint
              }</Cell>
          </Column>
          <Column sortable flexGrow={5} fullText>
            <HeaderCell>

              <Translate>Diagnosis</Translate>
            </HeaderCell>
            <Cell>
              {rowData => {
                console.log(rowData.diagnosis)
                const diag = icdListResponseData?.object?.find(
                  item =>item.key === rowData.diagnosis
                );
                console.log(icdListResponseData?.object)
                  
                if (diag) {
                  console.log("Found diag:", diag);
                  return diag.icdCode+","+diag.description;
              } else {
                  console.warn("No matching diag found for key:", rowData.diagnosis);
                  return "N/A";
              }
                return diag?.icdCode ?? "N/A"; 
              }}
            </Cell>

          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>

              <Translate>Prescription </Translate>
            </HeaderCell>
            <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} >{rowData =>
              rowData.hasPrescription ? <CheckRoundIcon className='iconStyle' /> : <WarningRoundIcon className='iconNoStyle' />
            }</Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>

              <Translate> Has order</Translate>
            </HeaderCell>
            <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} >{rowData =>
              rowData.hasOrder ? <CheckRoundIcon className='iconStyle' /> : <WarningRoundIcon className='iconNoStyle' />
            }</Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('encounterPriorityLkey', e)} />
              <Translate>Priority</Translate>
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
            <HeaderCell>
              <Translate>Date</Translate>
            </HeaderCell>
            <Cell dataKey="plannedStartDate" />
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('encounterStatusLkey', e)} />
              <Translate>Status</Translate>
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
            <HeaderCell>
              <Translate>Is Observed</Translate>
            </HeaderCell>
            <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {rowData => (rowData.observations ? <CheckRoundIcon className='iconStyle' /> : null)}
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
            layout={['limit', '|', 'pager']}
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
