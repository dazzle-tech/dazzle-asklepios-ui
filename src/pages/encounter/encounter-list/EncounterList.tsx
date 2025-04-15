import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Panel, Form, Badge, Whisper, Tooltip, Pagination } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserDoctor, faUserNurse } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { addFilterToListRequest, formatDate } from '@/utils';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { ApPatient } from '@/types/model-types';
import * as icons from '@rsuite/icons';

import './styles.less';

const EncounterList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [startEncounter] = useStartEncounterMutation();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });

  const { data: encounterListResponse, isFetching, isLoading } = useGetEncountersQuery(listRequest);

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  useEffect(() => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(' '));
  }, [location.pathname, dispatch, isLoading]);

  useEffect(() => {
    if (!isFetching && manualSearchTriggered) {
      setManualSearchTriggered(false);
    }
  }, [isFetching, manualSearchTriggered]);

  useEffect(() => {
    const divContent = (
      <div style={{ display: 'flex' }}>
        <h5>Patients Visit List</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('P_Encounters'));
    dispatch(setDivContent(divContentHTML));
    handleManualSearch();
  }, []);

  const isSelected = rowData => (rowData?.key === encounter?.key ? 'selected-row' : '');

  const handleManualSearch = () => {
    setManualSearchTriggered(true);
    const { fromDate, toDate } = dateFilter;
    const formattedFromDate = formatDate(fromDate);
    const formattedToDate = formatDate(toDate);

    if (fromDate && toDate) {
      setListRequest(
        addFilterToListRequest('planned_start_date', 'between', `${formattedFromDate}_${formattedToDate}`, listRequest)
      );
    } else if (fromDate) {
      setListRequest(addFilterToListRequest('planned_start_date', 'gte', formattedFromDate, listRequest));
    } else if (toDate) {
      setListRequest(addFilterToListRequest('planned_start_date', 'lte', formattedToDate, listRequest));
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  const handleGoToVisit = async (encounterData, patientData) => {
    await startEncounter(encounterData).unwrap();
    if (encounterData?.key) {
      dispatch(setEncounter(encounterData));
      dispatch(setPatient(encounterData.patientObject));
    }
    const targetPath = patientData.privatePatient ? '/user-access-patient-private' : '/encounter';
    navigate(targetPath, {
      state: {
        info: 'toEncounter',
        fromPage: 'EncounterList',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  const handleGoToPreVisitObservations = async (encounterData, patientData) => {
    const targetPath = localPatient.privatePatient ? '/user-access-patient-private' : '/encounter-pre-observations';
    navigate(targetPath, {
      state: { info: 'toNurse', patient: patientData, encounter: encounterData }
    });
  };

  const columns = [
    {
      key: 'queueNumber',
      title: <Translate>#</Translate>,
      dataKey: 'queueNumber',
      flexGrow: 1
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME</Translate>,
      flexGrow: 5,
      render: rowData => (
        <Whisper
          trigger="hover"
          placement="top"
          speaker={
            <Tooltip>
              <div>MRN : {rowData?.patientObject?.patientMrn}</div>
              <div>Age : {rowData?.patientAge}</div>
              <div>Gender : {rowData?.patientObject?.genderLvalue?.lovDisplayVale || rowData?.patientObject?.genderLkey}</div>
              <div>Visit ID : {rowData?.visitId}</div>
            </Tooltip>
          }
        >
          <div>
            {rowData?.patientObject?.privatePatient ? (
              <Badge color="cyan" content="Private">
                <p style={{ marginTop: 5, cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
              </Badge>
            ) : (
              <p style={{ cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
            )}
          </div>
        </Whisper>
      )
    },
    {
      key: 'visitType',
      title: <Translate>VISIT TYPE</Translate>,
      flexGrow: 3,
      render: rowData => rowData.visitTypeLvalue?.lovDisplayVale || rowData.visitTypeLkey
    },
    {
      key: 'chiefComplaint',
      title: <Translate>CHIEF COMPLAIN</Translate>,
      flexGrow: 3,
      render: rowData => rowData.chiefComplaint
    },
    {
      key: 'diagnosis',
      title: <Translate>DIAGNOSIS</Translate>,
      flexGrow: 3,
      render: rowData => rowData.diagnosis
    },
    {
      key: 'prescription',
      title: <Translate>PRESCRIPTION</Translate>,
      flexGrow: 2.5,
      render: rowData => rowData.hasPrescription ? <Badge content="YES" className="status-yes" /> : <Badge content="NO" className="status-no" />
    },
    {
      key: 'hasOrder',
      title: <Translate>HAS ORDER</Translate>,
      flexGrow: 2,
      render: rowData => rowData.hasOrder ? <Badge content="YES" className="status-yes" /> : <Badge content="NO" className="status-no" />
    },
    {
      key: 'priority',
      title: <Translate>PRIORITY</Translate>,
      flexGrow: 2,
      render: rowData => rowData.encounterPriorityLvalue?.lovDisplayVale || rowData.encounterPriorityLkey
    },
    {
      key: 'plannedStartDate',
      title: <Translate>DATE</Translate>,
      dataKey: 'plannedStartDate',
      flexGrow: 3
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 2,
      render: rowData => rowData.encounterStatusLvalue?.lovDisplayVale || rowData.encounterStatusLkey
    },
    {
      key: 'hasObservation',
      title: <Translate>IS OBSERVED</Translate>,
      render: rowData => rowData.hasObservation ? <Badge content="YES" className="status-yes" /> : <Badge content="NO" className="status-no" />
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      render: rowData => (
        <Form layout="inline" fluid className="nurse-doctor-form">
          <Whisper trigger="hover" placement="top" speaker={<Tooltip><div>Go to Visit</div></Tooltip>}>
            <div>
              <MyButton
                size="small"
                onClick={() => handleGoToVisit(rowData, rowData.patientObject)}
              >
                <FontAwesomeIcon icon={faUserDoctor} />
              </MyButton>
            </div>
          </Whisper>
          <Whisper trigger="hover" placement="top" speaker={<Tooltip><div>Nurse Station</div></Tooltip>}>
            <div>
              <MyButton
                size="small"
                backgroundColor="black"
                onClick={() => handleGoToPreVisitObservations(rowData, rowData.patientObject)}
              >
                <FontAwesomeIcon icon={faUserNurse} />
              </MyButton>
            </div>
          </Whisper>
        </Form>
      )
    }
  ];

  return (
    <Panel>
      <Form layout="inline" fluid className="date-filter-form">
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
        <div className="search-btn">
          <MyButton onClick={handleManualSearch}>
            <icons.Search />
          </MyButton>
        </div>
      </Form>
      <MyTable
        data={encounterListResponse?.object ?? []}
        columns={columns}
        loading={isLoading || (manualSearchTriggered && isFetching)}
        onRowClick={rowData => {
          setLocalEncounter(rowData);
          setLocalPatient(rowData.patientObject);
        }}
        rowClassName={isSelected}
        height={450}
      />
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
  );
};

export default EncounterList;
