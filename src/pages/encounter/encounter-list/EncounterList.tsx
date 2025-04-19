import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNurse, faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Table, Pagination, Tooltip, Whisper } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
// import PeoplesTimeIcon from '@rsuite/icons/PeoplesTime';
import { addFilterToListRequest, formatDate } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import './styles.less';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';

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
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [startEncounter] = useStartEncounterMutation();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  const {
    data: encounterListResponse,
    isFetching,
    refetch: refetchEncounter,
    isLoading
  } = useGetEncountersQuery(listRequest);
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
      navigate(targetPath, {
        state: {
          info: 'toEncounter',
          fromPage: 'EncounterList',
          patient: patientData,
          encounter: encounterData
        }
      });
    } else {
      navigate(targetPath, {
        state: {
          info: 'toEncounter',
          fromPage: 'EncounterList',
          patient: patientData,
          encounter: encounterData
        }
      });
    }
    const currentDateTime = new Date().toLocaleString();
    setDateClickToVisit(currentDateTime);
  };
  const handleGoToPreVisitObservations = async (encounterData, patientData) => {
    const privatePatientPath = '/user-access-patient-private';
    const preObservationsPath = '/encounter-pre-observations';
    const targetPath = localPatient.privatePatient ? privatePatientPath : preObservationsPath;
    if (localPatient.privatePatient) {
      navigate(targetPath, {
        state: { info: 'toNurse', patient: patientData, encounter: encounterData }
      });
    } else {
      navigate(targetPath, { state: { patient: patientData, encounter: encounterData } });
    }
  };

  //useEffect
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
    // init list
    handleManualSearch();
  }, []);

  useEffect(() => {
    console.log(isLoading);
    if (isLoading) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }
  }, [isLoading]);

  const tableColumns = [
    {
      key: 'queueNumber',
      title: <Translate>#</Translate>,
      flexGrow: 1,
      dataKey: 'queueNumber'
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME</Translate>,
      flexGrow: 6,
      fullText: true,
      render: rowData => {
        const tooltipSpeaker = (
          <Tooltip>
            <div>MRN : {rowData?.patientObject?.patientMrn}</div>
            <div>Age : {rowData?.patientAge}</div>
            <div>
              Gender :{' '}
              {rowData?.patientObject?.genderLvalue
                ? rowData?.patientObject?.genderLvalue?.lovDisplayVale
                : rowData?.patientObject?.genderLkey}
            </div>
            <div>Visit ID : {rowData?.visitId}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div style={{ display: 'inline-block' }}>
              {rowData?.patientObject?.privatePatient ? (
                <Badge color="cyan" content="Private">
                  <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                    {rowData?.patientObject?.fullName}
                  </p>
                </Badge>
              ) : (
                <p style={{ cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'visitType',
      title: <Translate>VISIT TYPE</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.visitTypeLvalue
          ? rowData.visitTypeLvalue.lovDisplayVale
          : rowData.visitTypeLkey
    },
    {
      key: 'chiefComplaint',
      title: <Translate>CHIEF COMPLAIN</Translate>,
      flexGrow: 4,
      render: rowData => rowData.chiefComplaint
    },
    {
      key: 'diagnosis',
      title: <Translate>DIAGNOSIS</Translate>,
      flexGrow: 4,
      render: rowData => rowData.diagnosis
    },
    {
      key: 'hasPrescription',
      title: <Translate>PRESCRIPTION</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.hasPrescription ? (
          <Badge content="YES" className="status-yes" />
        ) : (
          <Badge content="NO" className="status-no" />
        )
    },
    {
      key: 'hasOrder',
      title: <Translate>HAS ORDER</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.hasOrder ? (
          <Badge content="YES" className="status-yes" />
        ) : (
          <Badge content="NO" className="status-no" />
        )
    },
    {
      key: 'encounterPriority',
      title: <Translate>PRIORITY</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.encounterPriorityLvalue
          ? rowData.encounterPriorityLvalue.lovDisplayVale
          : rowData.encounterPriorityLkey
    },
    {
      key: 'plannedStartDate',
      title: <Translate>DATE</Translate>,
      flexGrow: 3,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.encounterStatusLvalue
          ? rowData.encounterStatusLvalue.lovDisplayVale
          : rowData.encounterStatusLkey
    },
    {
      key: 'hasObservation',
      title: <Translate>IS OBSERVED</Translate>,
      render: rowData =>
        rowData.hasObservation ? (
          <Badge content="YES" className="status-yes" />
        ) : (
          <Badge content="NO" className="status-no" />
        )
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: rowData => {
        const tooltipNurse = <Tooltip>Nurse Station</Tooltip>;
        const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltipDoctor}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patientData = rowData.patientObject;
                    setLocalEncounter(rowData);
                    setLocalPatient(patientData);
                    handleGoToVisit(rowData, patientData);
                  }}
                >
                  <FontAwesomeIcon icon={faUserDoctor} />
                </MyButton>
              </div>
            </Whisper>
            <Whisper trigger="hover" placement="top" speaker={tooltipNurse}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="black"
                  onClick={() => {
                    const patientData = rowData.patientObject;
                    setLocalEncounter(rowData);
                    setLocalPatient(patientData);
                    handleGoToPreVisitObservations(rowData, patientData);
                  }}
                >
                  <FontAwesomeIcon icon={faUserNurse} />
                </MyButton>
              </div>
            </Whisper>
          </Form>
        );
      }
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
        height={450}
        data={encounterListResponse?.object ?? []}
        columns={tableColumns}
        rowClassName={isSelected}
        loading={isLoading || (manualSearchTriggered && isFetching)}
        onRowClick={rowData => {
          setLocalEncounter(rowData);
          setLocalPatient(rowData.patientObject);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          setListRequest({ ...listRequest, sortBy, sortType });
        }}
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
