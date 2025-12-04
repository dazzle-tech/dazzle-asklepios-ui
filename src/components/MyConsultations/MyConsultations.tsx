import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import { Form, Panel, Tooltip, Whisper, Modal } from 'rsuite';
import MyTable from '@/components/MyTable';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faFileLines, faFilePen, faUpload } from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '../MyBadgeStatus/MyBadgeStatus';
import MyButton from '../MyButton/MyButton';
import MyInput from '../MyInput';
import AdvancedSearchFilters from '../AdvancedSearchFilters';
import { FaCheck } from 'react-icons/fa6';
import DeletionConfirmationModal from '../DeletionConfirmationModal';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import { useGetConsultationOrdersByDepartmentQuery, useSaveConsultationOrdersMutation, useGetEncountersQuery, useGetPatientDiagnosisQuery } from '@/services/encounterService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetPatientsQuery } from '@/services/patientService';
import { useAppSelector } from '@/hooks';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setPatient, setEncounter } from '@/reducers/patientSlice';
import { initialListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { conjureValueBasedOnKeyFromList, conjureValueBasedOnIDFromList, formatDateWithoutSeconds, calculateAgeFormat, formatDate, addFilterToListRequest } from '@/utils';

const MyConsultations = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const loggedInUser = authSlice.user;
  
  const [record, setRecord] = useState<any>({});
  const [openActionModal, setOpenActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'confirm' | 'reject' | null>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [statusFilter, setStatusFilter] = useState<any>({ statuses: [] });
  
  // Response modal states
  const [openResponseModal, setOpenResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  
  const [saveConsultationOrder] = useSaveConsultationOrdersMutation();
  
  // Build status filter - default shows New and Confirmed
  const getStatusFilter = () => {
    if (statusFilter.statuses && statusFilter.statuses.length > 0) {
      return statusFilter.statuses.map(key => `(${key})`).join(' ');
    }
    // Default: show New and Confirmed
    return ['1804566422622516', '164797574082125'].map(key => `(${key})`).join(' ');
  };

  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortType: 'desc',
    ignore: false,
    filters: [
      {
        fieldName: 'status_lkey',
        operator: 'in',
        value: getStatusFilter()
      }
    ]
  });

  // Header setup
  useEffect(() => {
    const divContent = (
      "My Consultation"
    );
    dispatch(setPageCode('My Consultation'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const { data: practitionerListResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 9999,
    sort: "id,asc"
  });

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: departmentListResponse, isFetching } = useGetDepartmentsQuery(paginationParams);
  const { data: orderPriorityLovResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: diagOrderStatusLovResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_STATUS');

  // Find the practitioner that matches the logged-in user
  const loggedInPractitioner = practitionerListResponse?.data?.find(
    p => p.userId === loggedInUser?.id
  );
  const practitionerId = loggedInPractitioner?.id?.toString() || '';
  
  // Fetch consultation orders by department
  const { data: consultationResponse, isLoading: consultationsLoading, refetch: refetchConsultations } = useGetConsultationOrdersByDepartmentQuery(
    {
      listRequest: listRequest,
      department_key: selectedDepartment?.departmentId?.toString() || '',
      preferred_consultant_key: practitionerId
    },
    {
      skip: !selectedDepartment?.departmentId
    }
  );



  const departmentOptions = departmentListResponse?.data?.map(dep => ({
    label: dep.name,
    value: dep.id
  })) ?? [];

  const pageIndex = (listRequest.pageNumber ?? 1) - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = consultationResponse?.extraNumeric || 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setManualSearchTriggered(true);
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  const handleSearch = () => {
    setManualSearchTriggered(true);
    
    let updatedRequest: any = {
      ...listRequest,
      pageNumber: 1,
      timestamp: Date.now(), // Force refetch by updating timestamp
      filters: [
        {
          fieldName: 'status_lkey',
          operator: 'in',
          value: getStatusFilter()
        }
      ]
    };

    // Add date filters if provided (convert to timestamps)
    if (record.requestDateFrom && record.requestDateTo) {
      const fromTimestamp = new Date(record.requestDateFrom).setHours(0, 0, 0, 0);
      const toTimestamp = new Date(record.requestDateTo).setHours(23, 59, 59, 999);
      updatedRequest = addFilterToListRequest(
        'created_at',
        'between',
        `${fromTimestamp}_${toTimestamp}`,
        updatedRequest
      );
    } else if (record.requestDateFrom) {
      const fromTimestamp = new Date(record.requestDateFrom).setHours(0, 0, 0, 0);
      updatedRequest = addFilterToListRequest(
        'created_at',
        'gte',
        fromTimestamp.toString(),
        updatedRequest
      );
    } else if (record.requestDateTo) {
      const toTimestamp = new Date(record.requestDateTo).setHours(23, 59, 59, 999);
      updatedRequest = addFilterToListRequest(
        'created_at',
        'lte',
        toTimestamp.toString(),
        updatedRequest
      );
    }

    setListRequest(updatedRequest);
  };

  const handleClearFilters = () => {
    setRecord({});
    setStatusFilter({ statuses: [] });
    setListRequest({
      ...listRequest,
      pageNumber: 1,
      timestamp: Date.now(), // Force refetch
      filters: [
        {
          fieldName: 'status_lkey',
          operator: 'in' as const,
          value: getStatusFilter()
        }
      ]
    });
  };




  const physicians = practitionerListResponse?.data?.filter(
    p => p.jobRole === "PHYSICIAN"
  ) ?? [];

  const physicianList =
    physicians?.map(p => ({
      key: p.id,
      value: p.id,
      label: `${p.firstName} ${p.lastName}`
    })) ?? [];

  // Extract consultation data from API response
  // API now returns a flat list of all visible consultations
  const allConsultations = consultationResponse?.object || [];

  // Get unique patient keys from consultations
  const uniquePatientKeys = new Set(
    allConsultations.map((c: any) => c.patientKey).filter(Boolean)
  );
  const patientKeysArray = Array.from(uniquePatientKeys);
  
  // Fetch all patients in one query
  const { data: patientsResponse } = useGetPatientsQuery(
    {
      ...initialListRequest,
      pageSize: 1000,
      filters: patientKeysArray.length > 0 ? [
        {
          fieldName: 'key',
          operator: 'in',
          value: patientKeysArray.map(key => `(${key})`).join(' ')
        }
      ] : []
    },
    {
      skip: patientKeysArray.length === 0
    }
  );

  // Create a lookup map for quick patient data access
  const patientMap = new Map(
    (patientsResponse?.object || []).map((patient: any) => [patient.key, patient])
  );

  // Get unique encounter keys from consultations
  const uniqueEncounterKeys = new Set(
    allConsultations.map((c: any) => c.visitKey).filter(Boolean)
  );
  const encounterKeysArray = Array.from(uniqueEncounterKeys);
  
  // Fetch all encounters
  const { data: encountersResponse } = useGetEncountersQuery(
    {
      ...initialListRequest,
      pageSize: 1000,
      ignore: false,
      filters: encounterKeysArray.length > 0 ? [
        {
          fieldName: 'key',
          operator: 'in',
          value: encounterKeysArray.map(key => `(${key})`).join(' ')
        }
      ] : []
    },
    {
      skip: encounterKeysArray.length === 0
    }
  );

  // Create a lookup map for encounters
  const encounterMap = new Map(
    (encountersResponse?.object || []).map((encounter: any) => [encounter.key, encounter])
  );

  // Fetch patient diagnoses for all consultations
  const { data: diagnosisResponse } = useGetPatientDiagnosisQuery(
    {
      ...initialListRequest,
      pageSize: 1000,
      ignore: false,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: encounterKeysArray.length > 0 ? [
        {
          fieldName: 'visit_key',
          operator: 'in',
          value: encounterKeysArray.map(key => `(${key})`).join(' ')
        }
      ] : []
    },
    {
      skip: encounterKeysArray.length === 0
    }
  );

  // Group diagnoses by visit_key and get the first diagnosis for each
  const diagnosisMap = new Map();
  (diagnosisResponse?.object || []).forEach((diagnosis: any) => {
    if (!diagnosisMap.has(diagnosis.visitKey)) {
      diagnosisMap.set(diagnosis.visitKey, diagnosis);
    }
  });

  const handleConfirmAction = async () => {
    if (!selectedRow) return;

    try {
      const statusKey = selectedAction === "confirm" 
        ? '1804566422622516'  // Confirmed status
        : '1804533730103990'; // Rejected status

      await saveConsultationOrder({
        ...selectedRow,
        statusLkey: statusKey,
        updatedBy: loggedInUser?.login || 'Admin'
      }).unwrap();

      dispatch(notify({ 
        msg: `Consultation ${selectedAction === 'confirm' ? 'confirmed' : 'rejected'} successfully`, 
        sev: 'success' 
      }));
      
      refetchConsultations();
      setOpenActionModal(false);
      setSelectedRow(null);
      setSelectedAction(null);
    } catch (error) {
      dispatch(notify({ 
        msg: 'Failed to update consultation status', 
        sev: 'error' 
      }));
    }
  };

  const toggleRowSelection = (rowData) => {
    setSelectedRows(prev =>
      prev.some(r => r.key === rowData.key)
        ? prev.filter(r => r.key !== rowData.key)
        : [...prev, rowData]
    );
  };

  const handleSubmit = async () => {
    if (selectedRows.length === 0) return;

    // Filter only confirmed consultations
    const confirmedConsultations = selectedRows.filter(
      (consultation: any) => consultation.statusLkey === '1804566422622516'
    );

    if (confirmedConsultations.length === 0) {
      dispatch(notify({ 
        msg: 'Only confirmed consultations can be submitted', 
        sev: 'warning' 
      }));
      return;
    }

    try {
      await Promise.all(
        confirmedConsultations.map((consultation: any) =>
          saveConsultationOrder({
            ...consultation,
            statusLkey: '1804482322306061',
            submissionDate: Date.now(),
            updatedBy: loggedInUser?.login || 'Admin'
          }).unwrap()
        )
      );

      dispatch(notify({ 
        msg: `${confirmedConsultations.length} consultation(s) submitted successfully`, 
        sev: 'success' 
      }));
      
      refetchConsultations();
      setSelectedRows([]);
    } catch (error) {
      dispatch(notify({ 
        msg: 'Failed to submit consultations', 
        sev: 'error' 
      }));
    }
  };

  const handleOpenResponseModal = (consultation: any) => {
    setSelectedConsultation(consultation);
    setResponseText(consultation.viewResponse || '');
    setOpenResponseModal(true);
  };

  const handleSaveResponse = async () => {
    if (!selectedConsultation) return;

    try {
      await saveConsultationOrder({
        ...selectedConsultation,
        viewResponse: responseText,
        updatedBy: loggedInUser?.login || 'Admin'
      }).unwrap();

      dispatch(notify({ 
        msg: 'Response saved successfully', 
        sev: 'success' 
      }));
      
      refetchConsultations();
      setOpenResponseModal(false);
      setResponseText('');
      setSelectedConsultation(null);
    } catch (error) {
      dispatch(notify({ 
        msg: 'Failed to save response', 
        sev: 'error' 
      }));
    }
  };

  const tableColumns = [
    {
      key: 'select',
      title: "",
      width: 50,
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.some(r => r.key === row.key)}
          onChange={() => toggleRowSelection(row)}
          disabled={row.statusLkey !== '1804566422622516'}
          style={{ cursor: row.statusLkey === '1804566422622516' ? "pointer" : "not-allowed" }}
        />
      )
    },
    {
      key: 'patientInfo',
      title: <Translate>Patient Name</Translate>,
      flexGrow: 4,
      render: (row) => {
        // Get patient data from the map using patientKey
        const patient: any = patientMap.get(row.patientKey);
        const patientName = patient?.fullName || 'N/A';
        const patientGender = patient?.genderLvalue?.lovDisplayVale || patient?.genderLkey || '';
        const patientAge = patient?.dob ? calculateAgeFormat(patient.dob) : '';

        return (
          <Whisper
            trigger="hover"
            placement="top"
            speaker={
              <Tooltip>
                <div style={{ padding: "4px 8px" }}>
                  {patientGender && <div><b>Gender:</b> {patientGender}</div>}
                  {patientAge && <div><b>Age:</b> {patientAge}</div>}
                </div>
              </Tooltip>
            }
          >
            <span style={{ cursor: "pointer" }}>
              {patientName}
            </span>
          </Whisper>
        );
      }
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      flexGrow: 1,
      render: (row) => {
        const priorityDisplay = conjureValueBasedOnKeyFromList(
          orderPriorityLovResponse?.object ?? [],
          row.priorityLkey,
          'lovDisplayVale'
        );
        
        let color = "#6c757d";
        if (row.priorityLkey === "1506860138673074") color = "#D64545";
        if (row.priorityLkey === "1506826559380682") color = "#57ff39ff";

        return (
          <MyBadgeStatus
            contant={priorityDisplay}
            color={color}
          />
        );
      }
    },
    {
      key: 'diagnosis',
      title: <Translate>Diagnosis</Translate>,
      flexGrow: 3,
      render: (row) => {
        const diagnosis: any = diagnosisMap.get(row.visitKey);
        const diagnosisObject = diagnosis?.diagnosisObject;
        if (diagnosisObject && diagnosisObject.icdCode && diagnosisObject.description) {
          return `${diagnosisObject.icdCode}, ${diagnosisObject.description}`;
        }
        return '';
      }
    },
    {
      key: 'findings',
      title: <Translate>Findings</Translate>,
      flexGrow: 3,
      render: (row) => {
        const encounter: any = encounterMap.get(row.visitKey);
        return encounter?.physicalExamNote || encounter?.findings || '';
      }
    },
    {
      key: 'questionToConsultant',
      title: <Translate>Question To Consultant</Translate>,
      flexGrow: 4,
      render: (row) => {

        const text = row.consultationContent || "";
        const MAX = 35;
        const isLong = text.length > MAX;
        const shortText = isLong ? text.substring(0, MAX) + "..." : text;

        return (
          <Whisper
            trigger={isLong ? "hover" : "none"}
            placement="top"
            speaker={
              <Tooltip style={{ maxWidth: "300px", whiteSpace: "normal" }}>
                {text}
              </Tooltip>
            }
          >
            <span style={{ cursor: isLong ? "pointer" : "default" }}>
              {shortText}
            </span>
          </Whisper>
        );
      }
    },
    {
      key: 'department',
      title: <Translate>Department</Translate>,
      flexGrow: 2,
      render: (row) => conjureValueBasedOnIDFromList(
        departmentListResponse?.data ?? [],
        row.departmentKey ? Number(row.departmentKey) : row.departmentKey,
        'name'
      )
    },
    {
      key: 'created',
      title: <Translate>Created By / At</Translate>,
      flexGrow: 2,
      render: (row) => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">
            {row.createdAt ? formatDateWithoutSeconds(row.createdAt) : ''}
          </span>
        </>
      )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (row) => {
        const statusDisplay = conjureValueBasedOnKeyFromList(
          diagOrderStatusLovResponse?.object ?? [],
          row.statusLkey,
          'lovDisplayVale'
        );
        
        let color = "#6c757d";
        if (row.statusLkey === "164797574082125") color = "#E6A100";
        if (row.statusLkey === "1804566422622516") color = "#0DAA41";
        if (row.statusLkey === "1804533730103990") color = "#D64545";

        return (
          <MyBadgeStatus
            contant={statusDisplay}
            color={color}
          />
        );
      }
    },
    {
      key: 'actions',
      title: <Translate>ACTIONS</Translate>,
      flexGrow: 4,
      render: (row) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Open EMR</Tooltip>}>
            <div>
              <MyButton
                size="small"
                radius="6px"
                backgroundColor="violet"
                onClick={() => {
                  const patient = patientMap.get(row.patientKey);
                  const encounter = encounterMap.get(row.visitKey);

                  if (patient) {
                    dispatch(setPatient(patient));
                    if (encounter) {
                      dispatch(setEncounter(encounter));
                    }

                    navigate('/patient-EMR', {
                      state: {
                        patient,
                        encounter,
                        fromPage: 'MyConsultations',
                        inModal: true
                      }
                    });
                  }
                }}
              >
                <FontAwesomeIcon icon={faFileLines} color="white" />
              </MyButton>
            </div>
          </Whisper>
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Confirm</Tooltip>}>
            <div>
              <MyButton
                size="small"
                radius="6px"
                backgroundColor="darkblue"
                onClick={() => {
                  setSelectedRow(row);
                  setSelectedAction("confirm");
                  setOpenActionModal(true);
                }}
              >
                <FontAwesomeIcon icon={faCircleCheck} color="white" />
              </MyButton>
            </div>
          </Whisper>
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Reject</Tooltip>}>
            <div>
              <MyButton
                size="small"
                radius="6px"
                backgroundColor="gray"
                onClick={() => {
                  setSelectedRow(row);
                  setSelectedAction("reject");
                  setOpenActionModal(true);
                }}
              >
                <FontAwesomeIcon icon={faCircleXmark} color="white" />
              </MyButton>
            </div>
          </Whisper>
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Add Response</Tooltip>}>
            <div>
              <MyButton
                size="small"
                radius="6px"
                backgroundColor="light-blue"
                disabled={row.statusLkey !== '1804566422622516'}
                onClick={() => handleOpenResponseModal(row)}
              >
                <FontAwesomeIcon icon={faFilePen} color="white" />
              </MyButton>
            </div>
          </Whisper>
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Add Report</Tooltip>}>
            <div>
              <MyButton
                size="small"
                radius="6px"
                backgroundColor="black"
                onClick={() => console.log("Add Report", row)}
              >
                <FontAwesomeIcon icon={faUpload} color="white" />
              </MyButton>
            </div>
          </Whisper>

        </div>
      )
    }
  ];

  const filters = (<>
    <Form fluid>
      <div className="filters-container">
        <MyInput
          fieldLabel="Request Date From"
          fieldName="requestDateFrom"
          fieldType="date"
          width="10vw"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          fieldLabel="Request Date To"
          fieldName="requestDateTo"
          fieldType="date"
          width="10vw"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="12vw"
          fieldType="checkPicker"
          fieldLabel="Status"
          fieldName="statuses"
          selectData={diagOrderStatusLovResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={statusFilter}
          setRecord={setStatusFilter}
        />

        {/* <MyInput
          width="10vw"
          fieldLabel="Department"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={record}
          setRecord={setRecord}
        />

        <MyInput
          width="10vw"
          fieldLabel="Physician"
          fieldName="physician"
          fieldType="checkPicker"
          selectData={physicianList}
          selectDataLabel="label"
          selectDataValue="value"
          record={record}
          setRecord={setRecord}
        /> */}
      </div>
    </Form>
    <AdvancedSearchFilters 
      searchFilter={true}
      searchOnClick={handleSearch}
      clearOnClick={handleClearFilters}
    />
  </>);

  const tablebuttons = (
    <div className="bt-div-2">
      <div className="bt-left-2"></div>
      
      <div className="bt-right-2">
        <MyButton
          color="var(--deep-blue)"
          prefixIcon={() => <FaCheck />}
          width="109px"
          onClick={handleSubmit}
          disabled={selectedRows.length === 0}>
          Submit
        </MyButton>
      </div>
    </div>);

  // Show message if no department selected
  if (!selectedDepartment?.departmentId) {
    return (
      <Panel>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Please select a department to view consultations.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <MyTable
        data={allConsultations}
        columns={tableColumns}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        filters={filters}
        loading={consultationsLoading || (manualSearchTriggered && consultationsLoading)}
        tableButtons={tablebuttons}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType as 'asc' | 'desc'}
        onSortChange={(sortBy, sortType) => {
          setListRequest({ ...listRequest, sortBy, sortType });
        }}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />


      <DeletionConfirmationModal
        open={openActionModal}
        setOpen={setOpenActionModal}
        itemToDelete={selectedRow?.patientName}
        actionType={selectedAction}
        actionButtonFunction={handleConfirmAction}
        confirmationQuestion={
          selectedAction === "confirm"
            ? "Are you sure you want to confirm this consultation?"
            : "Are you sure you want to reject this consultation?"
        }
      />

      <Modal 
        open={openResponseModal} 
        onClose={() => {
          setOpenResponseModal(false);
          setResponseText('');
          setSelectedConsultation(null);
        }}
        size="md"
      >
        <Modal.Header>
          <Modal.Title>
            {selectedConsultation?.statusLkey === '1804482322306061' 
              ? 'View Response' 
              : 'Add Response'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form fluid>
            <MyInput
              fieldLabel="Response"
              fieldName="response"
              fieldType="textarea"
              rows={6}
              record={{ response: responseText }}
              setRecord={(value) => setResponseText(value.response)}
              disabled={selectedConsultation?.statusLkey === '1804482322306061'}
              placeholder="Enter your response here..."
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <MyButton
            onClick={() => {
              setOpenResponseModal(false);
              setResponseText('');
              setSelectedConsultation(null);
            }}
            appearance="subtle"
          >
            Cancel
          </MyButton>
          {selectedConsultation?.statusLkey !== '1804482322306061' && (
            <MyButton
              onClick={handleSaveResponse}
              backgroundColor="var(--deep-blue)"
              disabled={!responseText.trim()}
            >
              Save Response
            </MyButton>
          )}
        </Modal.Footer>
      </Modal>

    </Panel>
  );
};

export default MyConsultations;
