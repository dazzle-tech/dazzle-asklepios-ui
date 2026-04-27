import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
import { faFileWaveform } from '@fortawesome/free-solid-svg-icons';
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import 'react-tabs/style/react-tabs.css';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { addFilterToListRequest, formatDate } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEREncountersQuery, useCancelEncounterMutation } from '@/services/encounterService';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { formatDateWithoutSeconds } from '@/utils';
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import BedAssignmentModal from '../day-case/DayCaseList/BedAssignmentModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import './styles.less';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import MyModal from '@/components/MyModal/MyModal';

const ERWaitingList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [cancelEncounter] = useCancelEncounterMutation();
  const [openBedAssigmentModal, setOpenBedAssigment] = useState(false);

  const [encounter, setLocalEncounter] = useState<any>({
    ...newApEncounter,
    discharge: false
  });

  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [record, setRecord] = useState({});

  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [localPatient, setLocalPatient] = useState<any>(null);

  // header setup
  const divContent = 'ER Wating List';

useEffect(() => {
  dispatch(setPageCode('ER_Waiting_List'));
  dispatch(setDivContent(divContent));

  return () => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(''));
  };
}, [dispatch]);

  const { data: EncPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: bookVisitLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true,
    filters: [
      {
        fieldName: 'encounter_status_lkey',
        operator: 'match',
        value: '6742317684600328'
      },
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      }
    ]
  });

  const {
    data: encounterListResponse,
    isFetching,
    refetch: refetchEncounter,
    isLoading
  } = useGetEREncountersQuery(listRequest);

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  const isSelected = rowData => {
    if (rowData && encounter && rowData.key === encounter.key) return 'selected-row';
    return '';
  };

  const handleManualSearch = () => {
    setManualSearchTriggered(true);
    if (dateFilter.fromDate && dateFilter.toDate) {
      const from = formatDate(dateFilter.fromDate);
      const to = formatDate(dateFilter.toDate);
      setListRequest(
        addFilterToListRequest('planned_start_date', 'between', from + '_' + to, listRequest)
      );
    } else if (dateFilter.fromDate) {
      const formatted = formatDate(dateFilter.fromDate);
      setListRequest(addFilterToListRequest('planned_start_date', 'gte', formatted, listRequest));
    } else if (dateFilter.toDate) {
      const formatted = formatDate(dateFilter.toDate);
      setListRequest(addFilterToListRequest('planned_start_date', 'lte', formatted, listRequest));
    }
  };

  const handleCancelEncounter = async () => {
    try {
      await cancelEncounter(encounter).unwrap();
      refetchEncounter();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpen(false);
    } catch {
      dispatch(notify({ msg: 'Error cancelling encounter', sev: 'error' }));
    }
  };

  const handleGoToQuickVisit = (encounterData, patientData) => {
    navigate('/quick-visit', {
      state: {
        info: 'toQuickVisit',
        fromPage: 'ERWaitingList',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  const handleGoToViewTriage = (encounterData, patientData) => {
    navigate('/view-triage', {
      state: {
        from: 'ER_Waiting_List',
        info: 'toViewTriage',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  //useEffect
  useEffect(() => {
    if (!isFetching && manualSearchTriggered) setManualSearchTriggered(false);
  }, [isFetching, manualSearchTriggered]);

  useEffect(() => handleManualSearch(), []);

  useEffect(() => {
    if (isLoading || (manualSearchTriggered && isFetching)) dispatch(showSystemLoader());
    else if (isFetching && isLoading) dispatch(hideSystemLoader());
    return () => dispatch(hideSystemLoader());
  }, [isLoading, isFetching, dispatch]);

  useEffect(() => handleManualSearch(), [dateFilter.fromDate, dateFilter.toDate]);

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
      render: rowData => rowData?.patientObject?.fullName
    },
    {
      key: 'patientMRN',
      title: <Translate>MRN</Translate>,
      render: rowData => rowData?.patientObject?.patientMrn
    },
    {
      key: 'Age',
      title: <Translate>Age</Translate>,
      render: rowData => rowData?.patientAge
    },
    {
      key: 'genderLkey',
      title: <Translate>Gender</Translate>,
      render: rowData =>
        rowData?.patientObject?.genderLvalue?.lovDisplayVale ?? rowData?.patientObject?.genderLkey
    },
    {
      key: 'emergencyLevelLkey',
      title: <Translate>ER Level</Translate>,
      render: rowData =>
        rowData?.emergencyLevelLkey ? (
          <MyBadgeStatus
            color={rowData?.emergencyLevelLvalue?.valueColor}
            contant={rowData?.emergencyLevelLvalue?.lovDisplayVale}
          />
        ) : (
          ''
        )
    },
    {
      key: 'chiefComplaint',
      title: <Translate>CHIEF COMPLAIN</Translate>,
      render: rowData => rowData?.chiefComplaint
    },
    {
      key: 'plannedStartDate',
      title: <Translate>DATE</Translate>,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'triageAt',
      title: 'TRIAGE AT/BY',
      render: row =>
        row?.emergencyTriage ? (
          <>
            {row?.emergencyTriage?.createdByUser?.fullName}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row?.emergencyTriage?.createdAt)}
            </span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      render: rowData => (
        <MyBadgeStatus
          color={rowData?.encounterStatusLvalue?.valueColor}
          contant={rowData?.encounterStatusLvalue?.lovDisplayVale}
        />
      )
    },
    {
      key: 'priority',
      title: <Translate>PRIORITY</Translate>,
      render: rowData => (
        <MyBadgeStatus
          color={rowData?.visitTypeLvalue?.valueColor}
          contant={rowData?.visitTypeLvalue?.lovDisplayVale}
        />
      )
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: rowData => {
        const tooltipTriage = <Tooltip>View Triage</Tooltip>;
        const tooltipAssignBed = <Tooltip>Assign Bed</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipQuickVisit = <Tooltip>Quick Visit</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {/* TRIAGE */}
            <Whisper trigger="hover" placement="top" speaker={tooltipTriage}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patient = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    handleGoToViewTriage(rowData, patient);
                  }}
                >
                  <FontAwesomeIcon icon={faCommentMedical} />
                </MyButton>
              </div>
            </Whisper>

            {/* Assign Bed */}
            <Whisper trigger="hover" placement="top" speaker={tooltipAssignBed}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="black"
                  onClick={() => {
                    setLocalEncounter(rowData);
                    setOpenBedAssigment(true);
                  }}
                >
                  <FontAwesomeIcon icon={faBedPulse} />
                </MyButton>
              </div>
            </Whisper>

            {/* Quick Visit */}
            <Whisper trigger="hover" placement="top" speaker={tooltipQuickVisit}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patient = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    handleGoToQuickVisit(rowData, patient);
                  }}
                >
                  <FontAwesomeIcon icon={faUserDoctor} />
                </MyButton>
              </div>
            </Whisper>

            {/* EMR modal فتح */}
            <Whisper trigger="hover" placement="top" speaker={tooltipEMR}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={() => {
                    const patient = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    setLocalPatient(patient);
                    setOpenEMRModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faFileWaveform} />
                </MyButton>
              </div>
            </Whisper>

            {/* Cancel */}
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
          </Form>
        );
      }
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

  const filtersUI = (
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

  return (
    <Panel>
      {/* Assign Bed Modal */}
      <BedAssignmentModal
        refetchEncounter={refetchEncounter}
        open={openBedAssigmentModal}
        setOpen={setOpenBedAssigment}
        encounter={encounter}
        departmentKey={encounter?.departmentId}
      />

      <MyTable
        filters={filtersUI}
        height={600}
        data={encounterListResponse?.object ?? []}
        columns={tableColumns}
        rowClassName={isSelected}
        loading={isLoading || (manualSearchTriggered && isFetching)}
        onRowClick={rowData => setLocalEncounter(rowData)}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => setListRequest({ ...listRequest, sortBy, sortType })}
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

      {/* *** EMR MODAL *** */}
      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title="Patient EMR"
        size="95vw"
        content={<PatientEMRModal inModal={true} patient={localPatient} encounter={encounter} />}
        cancelButtonLabel="Close"
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
      />
    </Panel>
  );
};

export default ERWaitingList;
