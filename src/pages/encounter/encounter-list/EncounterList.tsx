import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setLocalEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, Icon, PlusRound } from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
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
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { addFilterToListRequest, calculateAge, formatDate, fromCamelCaseToDBName } from '@/utils';
import {
  useGetFacilitiesQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery,
  useGetPractitionersQuery
} from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';

const EncounterList = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [encounter, setLocalEncounter] = useState({ ...newApEncounter });

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  
  const { data: encounterListResponse } = useGetEncountersQuery(listRequest);

  const [dateFilter, setDateFilter] = useState({
    fromDate: undefined,//new Date(),
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
            />
            <DatePicker
              oneTap
              placeholder="To Date"
              value={dateFilter.toDate}
              onChange={e => setDateFilter({ ...dateFilter, toDate: e })}
            />
            <IconButton appearance="primary" icon={<icons.Search />} onClick={handleManualSearch}>
              <Translate>Search</Translate>
            </IconButton>
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
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('patientKey', e)} />
              <Translate>Patient Key</Translate>
            </HeaderCell>
            <Cell dataKey="patientKey" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('patientFullName', e)} />
              <Translate>Patient Name</Translate>
            </HeaderCell>
            <Cell dataKey="patientFullName" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('patientAge', e)} />
              <Translate>Patient Age</Translate>
            </HeaderCell>
            <Cell dataKey="patientAge" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('departmentKey', e)} />
              <Translate>Department</Translate>
            </HeaderCell>
            <Cell dataKey="departmentKey" />
          </Column>
          <Column sortable flexGrow={4}>
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
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Translate>Date</Translate>
            </HeaderCell>
            <Cell dataKey="plannedStartDate" />
          </Column>
          <Column sortable flexGrow={4}>
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
