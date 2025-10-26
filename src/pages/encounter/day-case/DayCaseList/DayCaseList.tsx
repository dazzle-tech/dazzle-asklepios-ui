import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { faBoxOpen, faFile, faListCheck, faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetDayCaseEncountersQuery,
  useStartEncounterMutation,
  useCancelEncounterMutation
} from '@/services/encounterService';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import BedAssignmentModal from './BedAssignmentModal';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import BedManagementModal from '@/pages/Inpatient/inpatientList/bedBedManagementModal';
import ChangeBedModal from '@/pages/Inpatient/inpatientList/changeBedModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyModal from '@/components/MyModal/MyModal';
import RefillModalComponent from '@/pages/Inpatient/departmentStock/refill-component';
import PhysicianOrderSummaryModal from '@/pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component/PhysicianOrderSummaryComponent';
import EncounterLogsTable from '@/pages/Inpatient/inpatientList/EncounterLogsTable';
import './style.less';

const DayCaseList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>
        <Translate>
         DayCase List
         </Translate>
         </h5>
    </div>
  );

  dispatch(setPageCode('P_DayCaseEncounters'));
  const [cancelEncounter] = useCancelEncounterMutation();
  dispatch(setDivContent(divContent));
  const [openBedManagementModal, setOpenBedManagementModal] = useState(false);
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
  const [openBedAssigmentModal, setOpenBedAssigment] = useState(false);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [startEncounter] = useStartEncounterMutation();
  const [departmentFilter, setDepartmentFilter] = useState({ key: '' });
  const [openChangeBedModal, setOpenChangeBedModal] = useState(false);
  const [record, setRecord] = useState({});
  const [encounterStatus, setEncounterStatus] = useState({ key: '' });
  const [openRefillModal, setOpenRefillModal] = useState(false);
  const [openPhysicianOrderSummaryModal, setOpenPhysicianOrderSummaryModal] = useState(false);
  const [openEncounterLogsModal, setOpenEncounterLogsModal] = useState(false);
  const [switchDepartment, setSwitchDepartment] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'resource_type_lkey',
        operator: 'in',
        value: ['5433343011954425', '2039548173192779'].map(key => `(${key})`).join(' ')
      },
      {
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: ['91063195286200', '91084250213000', '5256965920133084']
          .map(key => `(${key})`)
          .join(' ')
      },
      {
        fieldName: 'discharge',
        operator: 'match',
        value: 'false'
      }
    ]
  });

  // Fetch department list response
  const departmentListResponse = useGetResourceTypeQuery('5433343011954425');
  // Fetch lovs
  const { data: encounterStatusLov } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const { data: EncPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: bookVisitLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');

  // Fetch the encounter list using the current listRequest
  const {
    data: encounterListResponse,
    isFetching,
    refetch: refetchEncounter,
    isLoading
  } = useGetDayCaseEncountersQuery({
    listRequest,
    department_key: switchDepartment
      ? departmentFilter?.key != null
        ? departmentFilter?.key
        : ''
      : ''
  });
  // Function to check if a row in the list is the currently selected encounter
  const isSelected = rowData => {
    if (rowData && encounter && rowData.key === encounter.key) {
      return 'selected-row';
    } else return '';
  };

  // handle cancel encounter function
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
  // Function to handle navigation to a visit screen
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
          fromPage: 'DayCaseList',
          patient: patientData,
          encounter: encounterData
        }
      });
    } else {
      navigate(targetPath, {
        state: {
          info: 'toEncounter',
          fromPage: 'DayCaseList',
          patient: patientData,
          encounter: encounterData
        }
      });
    }
    sessionStorage.setItem('encounterPageSource', 'EncounterList');
  };

  // table columns
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
      key: 'location',
      title: <Translate>LOCATION</Translate>,
      render: (row: any) => (
        <span className="location-table-style ">
          {row?.apRoom?.name}
          <br />
          {row?.apBed?.name}
        </span>
      )
    },
    {
      key: 'chiefComplaint',
      title: <Translate>CHIEF COMPLAIN</Translate>,
      render: rowData => rowData.chiefComplaint
    },
    {
      key: 'diagnosis',
      title: <Translate>DIAGNOSIS</Translate>,
      render: rowData => rowData.diagnosis
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
        rowData.encounterPriorityLvalue
          ? rowData.encounterPriorityLvalue.lovDisplayVale
          : rowData.encounterPriorityLkey
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
              ? rowData.encounterStatusLvalue.lovDisplayVale
              : rowData.encounterStatusLkey
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
        const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        const tooltipBedAssessment = <Tooltip>Assign to Bed</Tooltip>;
        const tooltipChangeBed = <Tooltip>Change Bed</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {rowData?.apRoom && (
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
            )}

            {rowData?.encounterStatusLkey === '5256965920133084' && (
              <Whisper trigger="hover" placement="top" speaker={tooltipBedAssessment}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      const patientData = rowData?.patientObject;
                      setLocalEncounter(rowData);
                      setOpenBedAssigment(true);
                    }}
                    backgroundColor="Black"
                  >
                    <FontAwesomeIcon icon={faBed} />
                  </MyButton>
                </div>
              </Whisper>
            )}
            {(rowData?.encounterStatusLvalue?.valueCode === 'NEW' ||
              rowData?.encounterStatusLvalue?.valueCode === 'WAITING_LIST') && (
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
            <Whisper trigger="hover" placement="top" speaker={tooltipChangeBed}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="gray"
                  onClick={() => {
                    setOpenChangeBedModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faBed} />
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
  // filters
  const filters = () => (
    <>
      <Form layout="inline" fluid>
        <div className="switch-dep-dev ">
          {' '}
          <MyInput
            require
            column
            fieldLabel="Select Department"
            fieldType="select"
            fieldName="key"
            selectData={departmentListResponse?.data?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={departmentFilter}
            setRecord={value => {
              setDepartmentFilter(value);
              setSwitchDepartment(false);
            }}
            searchable={false}
            width={200}
          />
          <MyButton
            size="small"
            backgroundColor="gray"
            onClick={() => {
              setSwitchDepartment(true);
            }}
            prefixIcon={() => <FontAwesomeIcon icon={faRepeat} />}
          >
            Switch Department
          </MyButton>
          <MyInput
            column
            width="10vw"
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
            column
            fieldLabel="Search by"
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
        </div>
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
                width={150}
              />
              {/* Chief Complain Text */}
              <MyInput
                width={150}
                fieldName="chiefComplain"
                fieldType="text"
                record={record}
                setRecord={setRecord}
                fieldLabel="Chief Complain"
              />
              {/* Checkboxes*/}
              <MyInput
                width={110}
                fieldName="withPrescription"
                fieldType="checkbox"
                record={record}
                setRecord={setRecord}
                label="With Prescription"
              />
              <MyInput
                width={80}
                fieldName="hasOrders"
                fieldType="checkbox"
                record={record}
                setRecord={setRecord}
                label="Has Orders"
              />
              <MyInput
                width={80}
                fieldName="isObserved"
                fieldType="checkbox"
                record={record}
                setRecord={setRecord}
                label="Is Observed"
              />
              {/* Priority LOV */}
              <MyInput
                width={150}
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

  // Effects
  // useEffect(() => {
  //     if (isFetching) {
  //         refetchEncounter();
  //     }
  // }, [departmentFilter, isFetching]);
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
    if (isLoading || (manualSearchTriggered && isFetching)) {
      dispatch(showSystemLoader());
    } else if (isFetching && isLoading) {
      dispatch(hideSystemLoader());
    }
    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, isFetching, dispatch]);
  useEffect(() => {
    const divContent = (
      <div style={{ display: 'flex' }}>
        <h5>
          <Translate>
           DayCase List
           </Translate>
           </h5>
      </div>
    );
    dispatch(setPageCode('P_DayCaseEncounters'));
    dispatch(setDivContent(divContent));
  }, [dispatch]);

  return (
    <Panel>
      <div className="inpatient-list-btns">
        <MyButton
          onClick={() => setOpenBedManagementModal(true)}
          disabled={!departmentFilter?.key}
          prefixIcon={() => <FontAwesomeIcon icon={faBedPulse} />}
        >
          Bed Management
        </MyButton>
      </div>
      <BedAssignmentModal
        refetchEncounter={refetchEncounter}
        open={openBedAssigmentModal}
        setOpen={setOpenBedAssigment}
        encounter={encounter}
        departmentKey={
          encounter?.resourceTypeLkey === '5433343011954425'
            ? encounter?.resourceObject?.key
            : encounter?.departmentKey
        }
      />
      <MyTable
        filters={filters()}
        height={600}
        data={encounterListResponse?.object ?? []}
        columns={tableColumns}
        rowClassName={isSelected}
        loading={isLoading || (manualSearchTriggered && isFetching) || isFetching}
        onRowClick={rowData => {
          setLocalEncounter(rowData);
        }}
        tableButtons={
          <div className="day-case-list-table-buttons-position">
            <MyButton onClick={() => setOpenRefillModal(true)}>
              <FontAwesomeIcon icon={faBoxOpen} />
              Refill Stock
            </MyButton>

            <MyButton onClick={() => setOpenPhysicianOrderSummaryModal(true)}>
              <FontAwesomeIcon icon={faListCheck} />
              Task Management
            </MyButton>

            <MyButton onClick={() => setOpenEncounterLogsModal(true)}>
              <FontAwesomeIcon icon={faFile} />
              Encounter Logs
            </MyButton>
          </div>
        }
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
      <DeletionConfirmationModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={handleCancelEncounter}
        actionType="Deactivate"
        confirmationQuestion="Do you want to cancel this Encounter ?"
        actionButtonLabel="Cancel"
        cancelButtonLabel="Close"
      />
      <BedManagementModal
        open={openBedManagementModal}
        setOpen={setOpenBedManagementModal}
        departmentKey={departmentFilter?.key}
      />
      <ChangeBedModal
        open={openChangeBedModal}
        setOpen={setOpenChangeBedModal}
        localEncounter={encounter}
        refetchInpatientList={refetchEncounter}
      />
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
  );
};

export default DayCaseList;
