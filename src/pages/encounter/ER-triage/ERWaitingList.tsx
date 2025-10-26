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
// import PeoplesTimeIcon from '@rsuite/icons/PeoplesTime';
import { addFilterToListRequest, formatDate } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEREncountersQuery, useCancelEncounterMutation } from '@/services/encounterService';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
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

const ERWaitingList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [cancelEncounter] = useCancelEncounterMutation();
  const [openBedAssigmentModal, setOpenBedAssigment] = useState(false);
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [record, setRecord] = useState({});

  // header setup
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5><Translate>ER Wating List</Translate></h5>
    </div>
  );
  const { data: EncPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: bookVisitLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
  dispatch(setPageCode('ER_Waiting_List'));
  dispatch(setDivContent(divContent));

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
        value: '6743167799449277'
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
      setListRequest({
        ...listRequest,
        filters: [
          {
            fieldName: 'encounter_status_lkey',
            operator: 'match',
            value: '6742317684600328'
          },
          {
            fieldName: 'resource_type_lkey',
            operator: 'match',
            value: '6743167799449277'
          }
        ]
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
  const handleGoToQuickVisit = async (encounterData, patientData) => {
    const targetPath = '/quick-visit';
    navigate(targetPath, {
      state: {
        info: 'toQuickVisit',
        fromPage: 'ERWaitingList',
        patient: patientData,
        encounter: encounterData
      }
    });
  };
  const handleGoToViewTriage = async (encounterData, patientData) => {
    const targetPath = '/view-triage';
    navigate(targetPath, {
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

  useEffect(() => {
    handleManualSearch();
  }, [dateFilter.fromDate, dateFilter.toDate]);

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
        rowData?.patientObject?.genderLvalue
          ? rowData?.patientObject?.genderLvalue?.lovDisplayVale
          : rowData?.patientObject?.genderLkey
    },
    {
      key: 'emergencyLevelLkey',
      title: <Translate>ER Level</Translate>,
      render: rowData =>
        rowData?.emergencyLevelLkey ? (
          <MyBadgeStatus
            color={rowData?.emergencyLevelLvalue?.valueColor}
            contant={
              rowData?.emergencyLevelLvalue
                ? rowData?.emergencyLevelLvalue?.lovDisplayVale
                : rowData?.emergencyLevelLkey
            }
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
      render: (row: any) =>
        row?.emergencyTriage ? (
          <>
            {' '}
            {row?.emergencyTriage?.createdByUser?.fullName}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row?.emergencyTriage?.createdAt)}
            </span>{' '}
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
          contant={
            rowData.encounterStatusLvalue
              ? rowData?.encounterStatusLvalue?.lovDisplayVale
              : rowData?.encounterStatusLkey
          }
        />
      )
    },
    //Need Edit (visitTypeLvalue)
    {
      key: 'priority',
      title: <Translate>PRIORITY</Translate>,
      render: rowData => (
        <MyBadgeStatus
          color={rowData?.visitTypeLvalue?.valueColor}
          contant={
            rowData?.visitTypeLvalue
              ? rowData?.visitTypeLvalue?.lovDisplayVale
              : rowData?.visitTypeLkey
          }
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
            <Whisper trigger="hover" placement="top" speaker={tooltipTriage}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patientData = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    handleGoToViewTriage(rowData, patientData);
                  }}
                >
                  <FontAwesomeIcon icon={faCommentMedical} />
                </MyButton>
              </div>
            </Whisper>
            <Whisper trigger="hover" placement="top" speaker={tooltipAssignBed}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="black"
                  onClick={() => {
                    const patientData = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    setOpenBedAssigment(true);
                  }}
                >
                  <FontAwesomeIcon icon={faBedPulse} />
                </MyButton>
              </div>
            </Whisper>
            <Whisper trigger="hover" placement="top" speaker={tooltipQuickVisit}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patientData = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    handleGoToQuickVisit(rowData, patientData);
                  }}
                >
                  <FontAwesomeIcon icon={faUserDoctor} />
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
        />{' '}
      </>
    );
  };
  return (
    <Panel>
      <BedAssignmentModal
        refetchEncounter={refetchEncounter}
        open={openBedAssigmentModal}
        setOpen={setOpenBedAssigment}
        encounter={encounter}
        departmentKey={
          encounter?.resourceTypeLkey === '6743167799449277'
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
      <DeletionConfirmationModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={handleCancelEncounter}
        actionType="Deactivate"
        confirmationQuestion="Do you want to cancel this Encounter ?"
        actionButtonLabel="Cancel"
        cancelButtonLabel="Close"
      />
    </Panel>
  );
};

export default ERWaitingList;
