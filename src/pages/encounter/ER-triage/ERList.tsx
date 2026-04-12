import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import RefillModalComponent from '@/pages/Inpatient/departmentStock/refill-component';
import EncounterLogsTable from '@/pages/Inpatient/inpatientList/EncounterLogsTable';
import BedManagementModal from '@/pages/Inpatient/inpatientList/bedBedManagementModal';
import ChangeBedModal from '@/pages/Inpatient/inpatientList/changeBedModal';
import TransferPatientModal from '@/pages/Inpatient/inpatientList/transferPatient';
import PhysicianOrderSummaryModal from '@/pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component/PhysicianOrderSummaryComponent';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import {
  useCancelEncounterMutation,
  useGetEmergencyEncountersQuery,
  useStartEncounterMutation
} from '@/services/encounterService';
import { useGetDepartmentsByResourceTypeQuery } from '@/services/security/departmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import {
  faBed,
  faBedPulse,
  faFileWaveform,
  faRectangleXmark,
  faRepeat,
  faUserDoctor
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import './styles.less';
import { useNavigate } from 'react-router-dom';
import { useLazyGetPatientByIdQuery } from '@/services/patient/patientService';

const ERList = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const divContent = 'ER Department';

  useEffect(() => {
    dispatch(setPageCode('ER_Patient_Encounters'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const [cancelEncounter] = useCancelEncounterMutation();
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter });
  const [openBedManagementModal, setOpenBedManagementModal] = useState(false);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [openChangeBedModal, setOpenChangeBedModal] = useState(false);
  const [startEncounter] = useStartEncounterMutation();
  const [departmentFilter, setDepartmentFilter] = useState({ key: '' });
  const [switchDepartment, setSwitchDepartment] = useState(false);
  const [record, setRecord] = useState({});
  const [encounterStatus, setEncounterStatus] = useState({ key: '' });
  const [openTransferPatientModal, setOpenTransferPatientModal] = useState(false);
  const [openRefillModal, setOpenRefillModal] = useState(false);
  const [openPhysicianOrderSummaryModal, setOpenPhysicianOrderSummaryModal] = useState(false);
  const [openEncounterLogsModal, setOpenEncounterLogsModal] = useState(false);


  const [getPatientById] = useLazyGetPatientByIdQuery();

  // *** تمت إضافته لفتح مودال EMR ***
  const [openEMRModal, setOpenEMRModal] = useState(false);

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      },
      {
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: ['91084250213000', '91063195286200'].map(key => `(${key})`).join(' ')
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
  } = useGetEmergencyEncountersQuery({
    listRequest,
    department_key: switchDepartment
      ? departmentFilter?.key != null
        ? departmentFilter?.key
        : ''
      : ''
  });

  const { data: departmentListResponse } = useGetDepartmentsByResourceTypeQuery({
    resourceType: 'EMERGENCY'
  });
  const { data: encounterStatusLov } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const { data: EncPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: bookVisitLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');

  const isSelected = rowData => {
    if (rowData && encounter && rowData.key === encounter.key) return 'selected-row';
    return '';
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
          fromPage: 'ER_Department',
          patient: patientData,
          encounter: encounterData
        }
      });
    } else {
      navigate(targetPath, {
        state: {
          info: 'toEncounter',
          fromPage: 'ER_Department',
          patient: patientData,
          encounter: encounterData
        }
      });
    }
    sessionStorage.setItem('encounterPageSource', 'EncounterList');
  };

  const handleCancelEncounter = async () => {
    try {
      if (encounter) {
        await cancelEncounter(encounter).unwrap();
        refetchEncounter();
        dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
        setOpen(false);
      }
    } catch {
      dispatch(notify({ msg: 'An error occurred while canceling the encounter', sev: 'error' }));
    }
  };

  const filters = () => (
    <>
      <Form fluid>
        <div className="er-department-table-filters-position">
          <MyInput
            required
            fieldLabel="Select Department"
            fieldType="select"
            fieldName="key"
            selectData={departmentListResponse ?? []}
            selectDataLabel="name"
            selectDataValue="id"
            record={departmentFilter}
            setRecord={value => {
              setDepartmentFilter(value);
              setSwitchDepartment(false);
            }}
            searchable={false}
            width={200}
          />

          <div className="switch-department-er-department-position">
            <MyButton
              size="small"
              backgroundColor="gray"
              onClick={() => setSwitchDepartment(true)}
              prefixIcon={() => <FontAwesomeIcon icon={faRepeat} />}
            >
              Switch Department
            </MyButton>
          </div>

          <MyInput
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
            fieldLabel="Search by"
            fieldName="searchCriteria"
            fieldType="text"
            placeholder="Search"
            width="15vw"
            record={record}
            setRecord={setRecord}
          />

          <MyInput
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
            <Form fluid>
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
              <MyInput
                width={150}
                fieldName="chiefComplain"
                fieldType="text"
                record={record}
                setRecord={setRecord}
                fieldLabel="Chief Complain"
              />
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


  useEffect(() => {
    refetchEncounter();
  }, []);

  useEffect(() => {
    if (!isFetching && manualSearchTriggered) setManualSearchTriggered(false);
  }, [isFetching, manualSearchTriggered]);

  useEffect(() => {
    if (isLoading || (manualSearchTriggered && isFetching)) dispatch(showSystemLoader());
    else if (isFetching && isLoading) dispatch(hideSystemLoader());

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, isFetching, dispatch]);

  useEffect(() => {
    if (isFetching) refetchEncounter();
  }, [departmentFilter, isFetching]);

  const tableColumns = [
    {
      key: 'visitId',
      title: <Translate>#</Translate>,
      dataKey: 'visitId'
    },

    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME</Translate>,
      fullText: true,
      render: rowData => {

        const patient = rowData?.patientObject;

        const fullName =
          `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim() || '-';

        const tooltipSpeaker = (
          <Tooltip>
            <div>MRN : {patient?.medicalRecordNumber ?? '-'}</div>
            <div>Age : {rowData?.patientAge ?? '-'}</div>
            <div>Gender : {patient?.sexAtBirth ?? '-'}</div>
            <div>Visit ID : {rowData?.visitId}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div style={{ display: 'inline-block' }}>
              {patient?.privatePatient ? (
                <Badge color="blue" content="Private">
                  <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                    {fullName}
                  </p>
                </Badge>
              ) : (
                <p style={{ cursor: 'pointer' }}>
                  {fullName}
                </p>
              )}
            </div>
          </Whisper>
        );
      }
    },

    {
      key: 'location',
      title: <Translate>LOCATION</Translate>,
      render: row => (
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
        rowData.encounterPriorityLvalue?.lovDisplayVale || rowData.encounterPriorityLkey
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
            contant={rowData.encounterStatusLvalue?.lovDisplayVale}
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
        const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipChangeBed = <Tooltip>Change Bed</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {/* Go to Visit */}
            <Whisper trigger="hover" placement="top" speaker={tooltipDoctor}>
              <div>
                <MyButton
                  size="small"
                    onClick={async () => {
                      const patientData = rowData?.patientObject;

                      if (!patientData?.id) return;

                      const fullPatient = await getPatientById({ id: patientData.id }).unwrap();

                      setLocalEncounter(rowData);
                      setLocalPatient(fullPatient);

                      dispatch(setEncounter(rowData));
                      dispatch(setPatient(fullPatient));

                      setOpenEMRModal(true);
                    }}
                >
                  <FontAwesomeIcon icon={faUserDoctor} />
                </MyButton>
              </div>
            </Whisper>

            {/* Change Bed */}
            <Whisper trigger="hover" placement="top" speaker={tooltipChangeBed}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="gray"
                  onClick={() => setOpenChangeBedModal(true)}
                >
                  <FontAwesomeIcon icon={faBed} />
                </MyButton>
              </div>
            </Whisper>

            {/* Go to EMR — الآن يفتح مودال فقط */}
            <Whisper trigger="hover" placement="top" speaker={tooltipEMR}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={() => {
                    const patientData = rowData?.patientObject;

                    if (!patientData) return;

                    setLocalEncounter(rowData);
                    setLocalPatient(patientData);

                    dispatch(setEncounter(rowData));
                    dispatch(setPatient(patientData));

                    setOpenEMRModal(true);
                  }}

                >
                  <FontAwesomeIcon icon={faFileWaveform} />
                </MyButton>
              </div>
            </Whisper>

            {/* Cancel Encounter */}
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
          </Form>
        );
      },
      expandable: false
    }
  ];

  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = encounterListResponse?.extraNumeric ?? 0;

  const handlePageChange = (_, newPage) => {
    setManualSearchTriggered(true);
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = event => {
    setManualSearchTriggered(true);
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
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

      <ChangeBedModal
        open={openChangeBedModal}
        setOpen={setOpenChangeBedModal}
        localEncounter={encounter}
        refetchInpatientList={refetchEncounter}
      />

      <BedManagementModal
        open={openBedManagementModal}
        setOpen={setOpenBedManagementModal}
        departmentKey={departmentFilter?.key}
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

      <MyModal
        open={openRefillModal}
        setOpen={setOpenRefillModal}
        title="Refill"
        size="90vw"
        content={<RefillModalComponent />}
        actionButtonLabel="Save"
        actionButtonFunction={() => {}}
        cancelButtonLabel="Close"
      />

      <MyModal
        open={openPhysicianOrderSummaryModal}
        setOpen={setOpenPhysicianOrderSummaryModal}
        title="Task Management"
        size="90vw"
        content={<PhysicianOrderSummaryModal />}
        actionButtonLabel="Save"
        actionButtonFunction={() => {}}
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

      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title="Patient EMR"
        size="95vw"
        content={
          <PatientEMRModal
            inModal={true}
            patient={localPatient}
            encounter={encounter}
          />
        }
        cancelButtonLabel="Close"
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
      />
    </Panel>
  );
};

export default ERList;
