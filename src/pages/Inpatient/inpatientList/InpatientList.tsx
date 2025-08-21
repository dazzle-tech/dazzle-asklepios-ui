import Translate from '@/components/Translate';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { faUserNurse, faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetInpatientEncountersQuery,
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
import { faFileWaveform } from '@fortawesome/free-solid-svg-icons';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import BedManagementModal from './bedBedManagementModal/BedManagementModal';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import ChangeBedModal from './changeBedModal/ChangeBedModal';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import './styles.less';
import MyInput from '@/components/MyInput';
import { faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons';
import TransferPatientModal from './transferPatient/TransferPatientModal';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import { faPersonWalkingArrowRight } from '@fortawesome/free-solid-svg-icons';
import TemporaryDischarge from './temporaryDischarge/TemporaryDischarge';
import { faPersonWalkingArrowLoopLeft } from '@fortawesome/free-solid-svg-icons';
import ReturnFromTemporary from './temporaryDischarge/ReturnFromTemporary';
import { faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from "@/services/setupService";

const InpatientList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Inpatient Visit List</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('In_Patient_Encounters'));
  dispatch(setDivContent(divContentHTML));
  const [open, setOpen] = useState(false);
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter });
  const [openTemporaryDischargeModal, setOpenTemporaryDischargeModal] = useState(false);
  const [openBedManagementModal, setOpenBedManagementModal] = useState(false);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [openChangeBedModal, setOpenChangeBedModal] = useState(false);
  const [startEncounter] = useStartEncounterMutation();
  const [departmentFilter, setDepartmentFilter] = useState({ key: '' });
  const [switchDepartment, setSwitchDepartment] = useState(false);
  const [openTransferPatientModal, setOpenTransferPatientModal] = useState(false);
  const [record, setRecord] = useState({});
  const [encounterStatus, setEncounterStatus] = useState({ key: '' }); 
  const [cancelEncounter] = useCancelEncounterMutation();
  const [openReturnFromTemporaryModal, setOpenReturnFromTemporaryModal] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: '4217389643435490'
      },
      {
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: ['91063195286200', '91084250213000','6130571996160318'].map(key => `(${key})`).join(' ')
      },
      {
        fieldName: 'discharge',
        operator: 'match',
        value: 'false'
      }
    ]
  });
  const {
    data: encounterListResponse,
    isFetching,
    refetch: refetchEncounter,
    isLoading
  } = useGetInpatientEncountersQuery({
    listRequest,
    department_key: switchDepartment
      ? departmentFilter?.key != null
        ? departmentFilter?.key
        : ''
      : ''
  });

  // Fetch department list response
  const departmentListResponse = useGetResourceTypeQuery('4217389643435490');
  const { data: encounterStatusLov } = useGetLovValuesByCodeQuery('ENC_STATUS');

  //Functions
  const isSelected = rowData => {
    if (rowData && encounter && rowData.key === encounter.key) {
      return 'selected-row';
    } else return '';
  };

  // handle go to visit (medical sheets) function
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
  // handle go to preVisitObservations (nurse station) function
  const handleGoToPreVisitObservations = async (encounterData, patientData) => {
    const privatePatientPath = '/user-access-patient-private';
    const preObservationsPath = '/inpatient-nurse-station';
    const targetPath = localPatient.privatePatient ? privatePatientPath : preObservationsPath;
    if (localPatient.privatePatient) {
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
  const filters = () => (
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
            { key: 'Date of Birth', value: 'Date of Birth'}
        ]}
          selectDataLabel="value"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          column
          fieldLabel='Search by'
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

<MyButton appearance='ghost'>
  <FontAwesomeIcon icon={faMagnifyingGlassPlus}/>
  Advance
</MyButton>
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
      </div>
    </Form>
  );

  //useEffect
  useEffect(() => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(' '));
  }, [location.pathname, dispatch, isLoading]);
  useEffect(() => {
    refetchEncounter();
  }, []);
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
    if (isFetching) {
      refetchEncounter();
    }
  }, [departmentFilter, isFetching]);

  // table columns
  const tableColumns = [
    {
      key: 'queueNumber',
      title: <Translate>#</Translate>,
      dataKey: 'queueNumber',
      render: rowData => rowData?.patientObject.patientMrn
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
      title: <Translate>ADMISSION DATE</Translate>,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      render: rowData =>
        !rowData.discharge && rowData.encounterStatusLkey !== '91109811181900' ? (
          <MyBadgeStatus
            color={rowData?.encounterStatusLvalue?.valueColor}
            contant={
              rowData.encounterStatusLvalue
                ? rowData.encounterStatusLvalue.lovDisplayVale
                : rowData.encounterStatusLkey
            }
          />
        ) : null
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
        const tooltipNurse = <Tooltip>Nurse Anamnesis</Tooltip>;
        const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipChangeBed = <Tooltip>Change Bed</Tooltip>;
        const toolTransferPatient = <Tooltip>Transfer Patient</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        const tooltipDischarge = <Tooltip>Temporary Discharge</Tooltip>;
        const tooltipReturnFromDischarge = <Tooltip>Return from Temporary DC</Tooltip>;

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
            <Whisper trigger="hover" placement="top" speaker={toolTransferPatient}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="var(--deep-blue)"
                  onClick={() => {
                    setOpenTransferPatientModal(true);
                    setLocalEncounter(rowData);
                  }}
                >
                  <FontAwesomeIcon icon={faArrowRightArrowLeft} />
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
            {rowData?.encounterStatusLvalue?.valueCode === 'ONGOING' && (
              <Whisper trigger="hover" placement="top" speaker={tooltipDischarge}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      const patientData = rowData.patientObject;
                      setLocalEncounter(rowData);
                      setLocalPatient(patientData);
                      setOpenTemporaryDischargeModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faPersonWalkingArrowRight} />
                  </MyButton>
                </div>
              </Whisper>
            )}
            {rowData?.encounterStatusLvalue?.valueCode === 'TEMP_DC' && (
              <Whisper trigger="hover" placement="top" speaker={tooltipReturnFromDischarge}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      const patientData = rowData.patientObject;
                      setLocalEncounter(rowData);
                      setLocalPatient(patientData);
                      setOpenReturnFromTemporaryModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faPersonWalkingArrowLoopLeft} />
                  </MyButton>
                </div>
              </Whisper>
            )}
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
      <MyTable
        height={600}
        filters={filters()}
        data={encounterListResponse?.object ?? []}
        columns={tableColumns}
        rowClassName={isSelected}
        loading={isLoading || (manualSearchTriggered && isFetching) || isFetching}
        onRowClick={rowData => {
          setLocalEncounter(rowData);
          setLocalPatient(rowData.patientObject);
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
      <TransferPatientModal
        open={openTransferPatientModal}
        setOpen={setOpenTransferPatientModal}
        localEncounter={encounter}
        refetchInpatientList={refetchEncounter}
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
      <TemporaryDischarge
        open={openTemporaryDischargeModal}
        setOpen={setOpenTemporaryDischargeModal}
        localEncounter={encounter}
        refetchInpatientList={refetchEncounter}
        localPatient={localPatient}
      />
      <ReturnFromTemporary
        open={openReturnFromTemporaryModal}
        setOpen={setOpenReturnFromTemporaryModal}
        localEncounter={encounter}
        refetchInpatientList={refetchEncounter}
        localPatient={localPatient}
        departmentKey={encounter?.resourceObject?.key}
      />
    </Panel>
  );
};

export default InpatientList;
