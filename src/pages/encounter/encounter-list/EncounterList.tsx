import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNurse, faUserDoctor, faPrint } from '@fortawesome/free-solid-svg-icons';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import RefillModalComponent from '@/pages/Inpatient/departmentStock/refill-component';
import { faFileWaveform } from '@fortawesome/free-solid-svg-icons';
import 'react-tabs/style/react-tabs.css';
import { addFilterToListRequest, formatDate } from '@/utils';
import DetailsCard from '@/components/DetailsCard';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useCancelEncounterMutation,
  useGetEncountersQuery,
  useStartEncounterMutation
} from '@/services/encounterService';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyModal from '@/components/MyModal/MyModal';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import './styles.less';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import PhysicianOrderSummaryModal from '@/pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component/PhysicianOrderSummaryComponent';
import EncounterLogsTable from '@/pages/Inpatient/inpatientList/EncounterLogsTable';

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
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
  const [open, setOpen] = useState(false);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [record, setRecord] = useState({});
  const [openRefillModal, setOpenRefillModal] = useState(false);
  const [openPhysicianOrderSummaryModal, setOpenPhysicianOrderSummaryModal] = useState(false);
  const [openEncounterLogsModal, setOpenEncounterLogsModal] = useState(false);
  const [encounterStatus, setEncounterStatus] = useState({ key: '' });
  const [startEncounter] = useStartEncounterMutation();
  const [cancelEncounter] = useCancelEncounterMutation();
  //
  const { data: bookVisitLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
  const { data: EncPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: encounterStatusLov } = useGetLovValuesByCodeQuery('ENC_STATUS');

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true,
    filters: [
      {
        fieldName: 'resource_type_lkey',
        operator: 'in',
        value: ['2039534205961578', '2039620472612029', '2039516279378421']
          .map(key => `(${key})`)
          .join(' ')
      },
      {
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: ['91063195286200', '91084250213000'].map(key => `(${key})`).join(' ')
      }
    ]
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
  useEffect(() => {
    handleManualSearch();
  }, [listRequest, dateFilter.fromDate, dateFilter.toDate]);

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
      setListRequest({
        ...listRequest,
        filters: [
          {
            fieldName: 'resource_type_lkey',
            operator: 'in',
            value: ['2039534205961578', '2039620472612029', '2039516279378421']
              .map(key => `(${key})`)
              .join(' ')
          },
          {
            fieldName: 'encounter_status_lkey',
            operator: 'in',
            value: ['91063195286200', '91084250213000'].map(key => `(${key})`).join(' ')
          }
        ]
      });
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
    sessionStorage.setItem('encounterPageSource', 'EncounterList');
  };
  const handleGoToPreVisitObservations = async (encounterData, patientData) => {
    const privatePatientPath = '/user-access-patient-private';
    const preObservationsPath = '/nurse-station';
    const targetPath = patientData.privatePatient ? privatePatientPath : preObservationsPath;
    if (patientData.privatePatient) {
      navigate(targetPath, {
        state: { info: 'toNurse', patient: patientData, encounter: encounterData }
      });
    } else {
      navigate(targetPath, {
        state: {
          patient: patientData,
          encounter: encounterData,
          edit: encounterData.encounterStatusLvalue.valueCode == 'CLOSED'
        }
      });
    }
  };
  const handleCancelEncounter = async () => {
    try {
      if (encounter) {
        await cancelEncounter(encounter).unwrap();
        refetchEncounter();
        dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
        setOpen(false);
      }
    } catch (error) {
      console.error('Encounter completion error:', error);
      dispatch(notify({ msg: 'An error occurred while canceling the encounter', sev: 'error' }));
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
    if (isLoading || (manualSearchTriggered && isFetching)) {
      dispatch(showSystemLoader());
    } else if (isFetching && isLoading) {
      dispatch(hideSystemLoader());
    }

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, isFetching, dispatch]);

  const tableColumns = [
    {
      key: 'queueNumber',
      title: <Translate>#</Translate>,
      dataKey: 'queueNumber',
      render: rowData => rowData?.patientObject?.patientMrn
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME</Translate>,
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
                <Badge color="blue" content="Private">
                  <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                    {rowData?.patientObject?.fullName}
                  </p>
                </Badge>
              ) : (
                <>
                  <p style={{ cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
                </>
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'visitType',
      title: <Translate>VISIT TYPE</Translate>,
      render: rowData =>
        rowData.visitTypeLvalue ? rowData?.visitTypeLvalue?.lovDisplayVale : rowData?.visitTypeLkey
    },
    {
      key: 'chiefComplaint',
      title: <Translate>CHIEF COMPLAIN</Translate>,
      render: rowData => rowData?.chiefComplaint
    },
    {
      key: 'diagnosis',
      title: <Translate>DIAGNOSIS</Translate>,
      render: rowData => rowData?.diagnosis
    },
    {
      key: 'hasPrescription',
      title: <Translate>PRESCRIPTION</Translate>,
      render: rowData =>
        rowData.hasPrescription ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'hasOrder',
      title: <Translate>HAS ORDER</Translate>,
      render: rowData =>
        rowData.hasOrder ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'encounterPriority',
      title: <Translate>PRIORITY</Translate>,
      render: rowData =>
        rowData?.encounterPriorityLvalue
          ? rowData?.encounterPriorityLvalue?.lovDisplayVale
          : rowData?.encounterPriorityLkey
    },
    {
      key: 'plannedStartDate',
      title: <Translate>DATE</Translate>,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      render: rowData => (
        <MyBadgeStatus
          color={rowData?.encounterStatusLvalue?.valueColor}
          contant={
            rowData.encounterStatusLvalue
              ? rowData?.encounterStatusLvalue?.lovDisplayVale
              : rowData?.encounterStatusLkey
          }
        />
      )
    },
    {
      key: 'hasObservation',
      title: <Translate>IS OBSERVED</Translate>,
      render: rowData =>
        rowData.hasObservation ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: rowData => {
        const tooltipNurse = <Tooltip>Nurse Station</Tooltip>;
        const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipPrint = <Tooltip>Print Visit Report</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltipDoctor}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patientData = rowData?.patientObject;
                    setLocalEncounter(rowData);
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
                    handleGoToPreVisitObservations(rowData, patientData);
                  }}
                >
                  <FontAwesomeIcon icon={faUserNurse} />
                </MyButton>
              </div>
            </Whisper>
            <Whisper trigger="hover" placement="top" speaker={tooltipEMR}>
              <div>
                <MyButton size="small" backgroundColor="violet">
                  <FontAwesomeIcon icon={faFileWaveform} />
                </MyButton>
              </div>
            </Whisper>
            {rowData?.encounterStatusLvalue?.valueCode === 'NEW' && (
              <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      setLocalEncounter(rowData);
                      setOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faRectangleXmark} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            <Whisper trigger="hover" placement="top" speaker={tooltipPrint}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="light-blue"
                  onClick={() => {
                    const patientData = rowData.patientObject;
                    setLocalEncounter(rowData);
                    handleGoToPreVisitObservations(rowData, patientData);
                  }}
                >
                  <FontAwesomeIcon icon={faPrint} />
                </MyButton>
              </div>
            </Whisper>
          </Form>
        );
      },
      expandable: false
    }
  ];

  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = encounterListResponse?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API
    setManualSearchTriggered(true);
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };

  const filters = () => {
    return (
      <>
        <Form layout="inline" fluid className="date-filter-form">
          <MyInput
            column
            width={180}
            fieldType="date"
            fieldLabel="From Date"
            fieldName="fromDate"
            record={dateFilter}
            setRecord={setDateFilter}
          />
          <MyInput
            width={180}
            column
            fieldType="date"
            fieldLabel="To Date"
            fieldName="toDate"
            record={dateFilter}
            setRecord={setDateFilter}
          />
          <MyInput
            width="10vw"
            column
            fieldLabel="Select Filter"
            fieldName="selectfilter"
            fieldType="select"
            selectData={[
              { key: 'MRN', value: 'MRN' },
              { key: 'Document Number', value: 'Document Number' },
              { key: 'Full Name', value: 'Full Name' },
              { key: 'Archiving Number', value: 'Archiving Number' },
              { key: 'Primary Phone Number', value: 'Primary Phone Number' },
              { key: 'Date of Birth', value: 'Date of Birth' }
            ]}
            selectDataLabel="value"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            fieldLabel="Search by"
            column
            fieldName="searchCriteria"
            fieldType="text"
            placeholder="Search"
            width="15vw"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            column
            width={200}
            fieldType="select"
            fieldLabel="Encounter Status"
            fieldName="key"
            selectData={encounterStatusLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={encounterStatus}
            setRecord={setEncounterStatus}
          />
        </Form>
        <AdvancedSearchFilters
          searchFilter={true}
          content={
            <div className="advanced-filters">
              <Form fluid className="dissss">
                {/* Visit Type LOV */}
                <MyInput
                  fieldName="accessTypeLkey"
                  fieldType="select"
                  selectData={bookVisitLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  fieldLabel="Visit Type"
                  selectDataValue="key"
                  record={record}
                  setRecord={setRecord}
                  searchable={false}
                />
                {/* Chief Complain Text */}
                <MyInput
                  fieldName="chiefComplain"
                  fieldType="text"
                  record={record}
                  setRecord={setRecord}
                  fieldLabel="Chief Complain"
                />
                {/* Checkboxes*/}
                <MyInput
                  fieldName="withPrescription"
                  fieldType="checkbox"
                  record={record}
                  setRecord={setRecord}
                  label="With Prescription"
                />
                <MyInput
                  fieldName="hasOrders"
                  fieldType="checkbox"
                  record={record}
                  setRecord={setRecord}
                  label="Has Orders"
                />
                <MyInput
                  fieldName="isObserved"
                  fieldType="checkbox"
                  record={record}
                  setRecord={setRecord}
                  label="Is Observed"
                />
                {/* Priority LOV */}
                <MyInput
                  fieldName="priority"
                  fieldType="select"
                  record={record}
                  setRecord={setRecord}
                  selectData={EncPriorityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  placeholder="Select Priority"
                  fieldLabel="Priority"
                  searchable={false}
                />
              </Form>
            </div>
          }
        />
      </>
    );
  };
  return (
    <>
      <div className="count-div-on-top-of-page-visit-list">
        <DetailsCard
          title="Total Patients"
          number={4}
          color="--primary-blue"
          backgroundClassName="result-ready-section"
          position="center"
          width={'15vw'}
        />
        <DetailsCard
          title="Active Cases"
          number={3}
          color="--green-600"
          backgroundClassName="sample-collected-section"
          position="center"
          width={'15vw'}
        />
        <DetailsCard
          title="Completed"
          number={1}
          color="--primary-purple "
          backgroundClassName="new-section"
          position="center"
          width={'15vw'}
        />
        <DetailsCard
          title="Avg Progress"
          number={'80%'}
          color="--primary-yellow"
          backgroundClassName="total-test-section"
          position="center"
          width={'15vw'}
        />
      </div>

      <Panel>
        <MyTable
          filters={filters()}
          tableButtons={
            <div className="out-patient-list-table-buttons-position-handle">
              <MyButton onClick={() => setOpenRefillModal(true)}>Refill Stock</MyButton>
              <MyButton onClick={() => setOpenPhysicianOrderSummaryModal(true)}>
                Task Management
              </MyButton>

              <MyButton onClick={() => setOpenEncounterLogsModal(true)}>Encounter Logs</MyButton>
            </div>
          }
          height={600}
          data={encounterListResponse?.object ?? []}
          columns={tableColumns}
          rowClassName={isSelected}
          loading={isLoading || (manualSearchTriggered && isFetching)}
          onRowClick={rowData => {
            setLocalEncounter(rowData);
          }}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortChange={(sortBy, sortType) => {
            setListRequest({ ...listRequest, sortBy, sortType });
          }}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />

        {/* Refill Modal */}
        <MyModal
          open={openRefillModal}
          setOpen={setOpenRefillModal}
          title="Refill"
          size="90vw"
          content={
            <>
              <RefillModalComponent></RefillModalComponent>
            </>
          }
          actionButtonLabel="Save"
          actionButtonFunction={() => {
            console.log('Save refill clicked');
          }}
          cancelButtonLabel="Close"
        />

        {/* Existing deletion modal */}
        <DeletionConfirmationModal
          open={open}
          setOpen={setOpen}
          actionButtonFunction={handleCancelEncounter}
          actionType="Deactivate"
          confirmationQuestion="Do you want to cancel this Encounter ?"
          actionButtonLabel="Cancel"
          cancelButtonLabel="Close"
        />

        <MyModal
          open={openPhysicianOrderSummaryModal}
          setOpen={setOpenPhysicianOrderSummaryModal}
          title="Task Management"
          size="90vw"
          content={
            <>
              <PhysicianOrderSummaryModal></PhysicianOrderSummaryModal>
            </>
          }
          actionButtonLabel="Save"
          actionButtonFunction={() => {
            console.log('Save refill clicked');
          }}
          cancelButtonLabel="Close"
        />

        <MyModal
          open={openEncounterLogsModal}
          setOpen={setOpenEncounterLogsModal}
          title="Encounter Logs"
          size="70vw"
          content={<EncounterLogsTable />}
          actionButtonLabel="Close"
          actionButtonFunction={() => setOpenEncounterLogsModal(false)}
          cancelButtonLabel="Cancel"
        />
      </Panel>
    </>
  );
};

export default EncounterList;
