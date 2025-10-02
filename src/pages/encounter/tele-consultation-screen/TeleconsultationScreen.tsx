// Import required modules
import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import MyInput from '@/components/MyInput';
import DragDropTable from './DragDropTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { Tooltip, Whisper } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { Form } from 'rsuite';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import CancellationModal from '@/components/CancellationModal';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCirclePlay,
  faCircleXmark,
  faFileImport,
  faFileWaveform,
  faLandMineOn
} from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import { useDispatch, useSelector } from 'react-redux';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import './start-tele-consultation/styles.less';
import { useGetEncounterByIdQuery, useGetTeleConsultationCallLogListQuery, useGetTeleConsultationListQuery, useGetTeleConsultationProgressNotesListQuery, useSaveTeleConsultationCallLogMutation, useSaveTeleConsultationMutation } from '@/services/encounterService';
import { initialListRequestId } from '@/types/types';
import { ApTeleConsultation } from '@/types/model-types';
import { calculateAge, calculateAgeFormat, formatDateWithoutSeconds } from '@/utils';
import { render } from 'react-dom';
import { newApEncounter, newApPatient, newApTeleConsultation } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import CallLog from './CallLog';
import Translate from '@/components/Translate';
import AdvancedModal from '@/components/AdvancedModal';
import MyTable from '@/components/MyTable';



// Define request type



// State variables
const TeleconsultationRequests = () => {
  const sliceauth = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>({ ...newApPatient });
  const [encounter, setEncounter] = useState<any>({ ...newApEncounter });
  const [openLogModal, setOpenLogModal] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'reject' | null>(null);
  const [requests, setRequests] = useState<ApTeleConsultation>({ ...newApTeleConsultation });
  const { data: encounterData } = useGetEncounterByIdQuery(requests?.encounterId ?? '', { skip: !requests?.encounterId });
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>({});
  const [record, setRecord] = useState({});

  const {
    data: fetchedProgressNotes,
    isLoading,
    isFetching,
    error,

  } = useGetTeleConsultationProgressNotesListQuery(
    {
      ...initialListRequestId
      ,
      filters: [
        {
          fieldName: "tele_consultation_id",
          operator: "match",
          value: requests?.id,
        },
      ],

    }, {
    skip: !requests?.id
  });

  // const [pendingAction, setPendingAction] = useState<'confirm' | 'reject' | null>(null);
  const [customConfirmMessage, setCustomConfirmMessage] = useState('');
  const [sortColumn, setSortColumn] = useState('patientName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);



  const { data: orders, refetch  ,isLoading:ordersLod} = useGetTeleConsultationListQuery({ ...initialListRequestId, })
  const { data: callLogs } = useGetTeleConsultationCallLogListQuery(
    {
      ...initialListRequestId,
      filters: [
        {
          fieldName: "tele_consultation_id",
          operator: "match",
          value: requests?.id,
        },
      ],
    }, {
    skip: !requests?.id
  });
  console.log("callLogs", callLogs);

  const [save, saveMutation] = useSaveTeleConsultationMutation();
  const [saveCallLog, saveCallLogMutation] = useSaveTeleConsultationCallLogMutation();


  useEffect(() => {
    if (encounterData) {
      setEncounter(encounterData);

    }
  }, [encounterData]);
  useEffect(() => {
    setPatient(requests?.patient ?? {});
  }, [requests]);

  const handleConfirmAction = async () => {
    if (!requests) return;

    try {
     
      await save({
        ...requests,
        statusLkey: '13828721011417130',
        startedAt: Date.now(),
        startedBy: sliceauth.user?.login,
      }).unwrap();

    
      await saveCallLog({
        teleConsultationId: requests.id,
        startedDate: Date.now(),
        startedBy: sliceauth.user?.login 
      }).unwrap();

     
      dispatch(
        notify({
          sev: 'success',
          msg: 'Teleconsultation started successfully',
        })
      );

     
      refetch();

      
      navigate('/start-tele-consultation', {
        state: {
          patient,
          encounter,
          fromPage: 'teleconsultation-requests',
          consultaition: requests,
          notelist: fetchedProgressNotes ?? [],
        },
      });
    } catch (err) {
      console.error('Error while starting teleconsultation:', err);
      dispatch(
        notify({
          sev: 'error',
          msg: 'Failed to start teleconsultation',
        })
      );
    } finally {
     
      setOpenConfirmModal(false);
    }
  };


  // Handle cancellation (rejection) with reason
  const handleCancleReject = () => {
    // ORD_STAT_REJCONS
    save({ ...requests, statusLkey: '32943037809141'
      ,rejectedAt:Date.now(),rejectedBy:sliceauth.user?.login

     })
      .unwrap()
      .then((res) => {
        dispatch(
          notify({ sev: 'success', msg: 'Request rejected successfully' })
        );
        refetch();
      })
      .catch((err) => {
        console.error('Save failed:', err);
        dispatch(notify({ sev: 'error', msg: 'Failed to reject request' }));
      })
      .finally(() => {
        // Close modal and reset
        setOpenCancelModal(false);

        setCancelObject({});
      });
  };

  const contents = (
    <div className="advanced-filters">
      <Form fluid className="dissss">
        <MyInput
          width="100%"
          fieldLabel="Select Search Criteria"
          fieldType="select"
          fieldName="searchByField"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'MRN', value: 'patientMrn' },
            { label: 'Document Number', value: 'documentNo' },
            { label: 'Full Name', value: 'fullName' },
            { label: 'Archiving Number', value: 'archivingNumber' },
            { label: 'Primary Phone Number', value: 'phoneNumber' },
            { label: 'Date of Birth', value: 'dob' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />

        <MyInput
          width="100%"
          fieldLabel="Search Patients"
          fieldType="text"
          fieldName="patientName"
          record={record}
          setRecord={setRecord}
        />




        <MyInput
          width="100%"
          fieldLabel="Priority"
          fieldType="select"
          fieldName="priority"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'low', value: 'Low' },
            { label: 'medium', value: 'Medium' },
            { label: 'urgent', value: 'Urgent' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />

        <MyInput
          width="100%"
          fieldLabel="Status"
          fieldType="select"
          fieldName="status"
          record={record}
          setRecord={setRecord}
          selectData={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Cancelled', value: 'Cancelled' },
            { label: 'Ongoing', value: 'Ongoing' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />
      </Form>
    </div>
  );


  const filterstable = (
    <>
      <Form fluid>
        <div className="from-to-input-position">
          <MyInput
            width={'100%'}
            fieldLabel="Request From"
            fieldType="date"
            fieldName="key0"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width={'100%'}
            fieldLabel="To"
            fieldType="date"
            fieldName="key1"
            record={record}
            setRecord={setRecord}
          />
        </div>
      </Form>
      <AdvancedSearchFilters searchFilter={true} content={contents} />
    </>
  );

  const columns = [
    {
      key: 'priorityIcon',
      title: '',
      width: 50,

      render: (row: ApTeleConsultation) =>
        row.expectedResponse === "immediate" ? (
          <FontAwesomeIcon
            icon={faLandMineOn}
            style={{ color: 'red', fontSize: '18px' }}
            title="Urgent Priority"
          />
        ) : null
    },
    {
      key: 'patient',
      title: 'Patient Name',
      dataKey: 'patientName',
      width: 200,
      render: (row: any) => (
        <div>{row.patient?.fullName}</div>
      )
    },
    {
      key: 'gender', title: 'Gender', dataKey: 'gender', width: 80,
      render: (row: any) => (
        <div>{row.patient?.genderLvalue?.lovDisplayVale ?? ''}</div>
      )
    },
    {
      key: 'age', title: 'Age', dataKey: 'age', width: 60,
      render: (row: any) => (
        <div>{calculateAgeFormat
          (row.patient?.dob)}</div>
      )
    },
    {
      key: 'questionToConsultant', title: 'Question To Consultant', width: 180

    },
    {
      key:'expectedResponseTime',
      title:<Translate>Expected Repones Date</Translate>,
      width: 180,
      render:(row:any)=>{
        return formatDateWithoutSeconds(row.expectedResponseTime)
      }

    }
   ,
    {
      key: 'urgencyLkey', title: 'Urgency', width: 80,
      render: row => {
        return row.urgencyLvalue?.lovDisplayVale;
      }
    },
    {
      key: 'statusLkey',
      title: 'Status',
      width: 100,

      render: row => {

        return <MyBadgeStatus color={row.statusLvalue?.valueColor} contant={row.statusLvalue?.lovDisplayVale} />;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 120,

      render: (rowData: ApTeleConsultation) => (
        <div className="actions-icons-tele-consultation-screen">
          {/* Start Teleconsultation */}
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Start Teleconsultation</Tooltip>}>
            <div>
              <MyButton
                size="small"
                disabled={rowData.statusLkey === '32943037809141'}
                onClick={async () => {
                  if (rowData.statusLkey !== '32943037809141' && rowData.statusLkey !== '5959341154465084') {
                    await saveCallLog({
                      teleConsultationId: rowData.id,
                      startedDate: Date.now(),
                      startedBy: sliceauth.user?.login || 'Admin',
                    }).unwrap();
                    navigate('/start-tele-consultation', {
                      state: {
                        patient: patient,
                        encounter: encounter,
                        fromPage: 'teleconsultation-requests',
                        consultaition: requests,
                        notelist: fetchedProgressNotes ?? []



                      },
                    });
                  }

                  // setPendingAction('confirm');
                  else {
                    setCustomConfirmMessage(`Start The Call With ${rowData.patient?.fullName}?`);
                    setActionType('confirm');
                    setOpenConfirmModal(true);
                  }
                }}
              >
                <FontAwesomeIcon icon={faCirclePlay} />
              </MyButton>
            </div>
          </Whisper>

          {/* Reject Request */}
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Reject Request</Tooltip>}>
            <div>
              <MyButton
                size="small"
                onClick={() => {

                  setActionType('reject');
                  setOpenCancelModal(true);
                }}
                disabled={rowData.statusLkey !== '5959341154465084'}
              >
                <FontAwesomeIcon icon={faCircleXmark} />
              </MyButton>
            </div>
          </Whisper>

          {/* View EMR File */}
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>View EMR File</Tooltip>}>
            <div>
              <MyButton size="small">
                <FontAwesomeIcon icon={faFileWaveform} />
              </MyButton>
            </div>
          </Whisper>
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Call Logs</Tooltip>}>
            <div>
              <MyButton size="small"
                onClick={() => {
                  setOpenLogModal(true);
                }}
              >
               <FontAwesomeIcon icon={faFileImport} />
              </MyButton>
            </div>
          </Whisper>
        </div>
      )
    },
 


  ];

  const sortedData = [...orders].sort((a, b) => {
    const aValue = a[sortColumn as keyof ApTeleConsultation];
    const bValue = b[sortColumn as keyof ApTeleConsultation];

    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  const paginatedData = sortedData?.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  console.log(paginatedData);
  const divContent = (
    <div className="page-title">
      <h5>Tele Consultation Screen</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('tele_consultation_screen'));
  dispatch(setDivContent(divContentHTML));

  return (
    <Panel>

      <DragDropTable
        data={orders?.object ?? []}
        columns={columns}
        loading={ordersLod}
        filters={filterstable}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={orders?.object?.length}
        sortColumn={sortColumn}
        sortType={sortType}
        rowClassName={row => (row?.id === requests?.id ? 'selected-row' : '')}
        onRowClick={data => {
          setRequests(data);
        }}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <CancellationModal
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        handleCancle={handleCancleReject}
        object={cancelObject}
        setObject={setCancelObject}
        fieldLabel="Please specify the reason for rejection"
        title="Reject Request"
        fieldName="reason"
      />

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete={actionType === 'confirm' ? "Confirm" : "Reject"}
        actionType={actionType}
        actionButtonFunction={handleConfirmAction}
        confirmationQuestion={customConfirmMessage}
      />
      <AdvancedModal
        open={openLogModal}
        setOpen={setOpenLogModal}
        leftTitle="Action Logs"
        rightTitle='Access Log'
        size="md"
        rightContent={<CallLog list={callLogs ?? []} />}
        leftContent={
       <>
     
  <div style={{ padding: '1rem' }}>
  <div style={{ marginBottom: '8px' }}>
    <strong>Requested @</strong>{' '}
    {`${formatDateWithoutSeconds(requests?.requestedAt)} By ${requests?.requestedBy || ""}`}
  </div>

  <div style={{ marginBottom: '8px' }}>
    <strong>Call Started @</strong>{' '}
    {`${formatDateWithoutSeconds(requests?.callStartedAt)} By ${requests?.callStartedBy || ""}`}
  </div>

  <div style={{ marginBottom: '8px' }}>
    <strong>Call Close @</strong>{' '}
    {`${formatDateWithoutSeconds(requests?.callColsedAt)} By ${requests?.callColsedBy || ""}`}
  </div>
  {requests?.rejectedAt && (
  <div style={{ marginBottom: '8px' }}>
    <strong>Reject @</strong>{' '}
    {`${formatDateWithoutSeconds(requests.rejectedAt)} By ${requests.rejectedBy || "Unknown"}`}
    {requests.rejectedReason && requests.rejectedReason !== "0" && (
      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
        Reason: {requests.rejectedReason}
      </div>
    )}
  </div>
)}


</div>


</>
        }
      />

    </Panel>
  );
};

export default TeleconsultationRequests;
