import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
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
import { useGetConsultationOrdersByDepartmentQuery, useSaveConsultationOrdersMutation } from '@/services/encounterService';
import { useAppSelector } from '@/hooks';
import { useDispatch } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { initialListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';

const MyConsultations = () => {
  const dispatch = useDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const loggedInUser = authSlice.user;
  
  const [record, setRecord] = useState({});
  const [openActionModal, setOpenActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'accept' | 'reject' | null>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  
  const [saveConsultationOrder] = useSaveConsultationOrdersMutation();
  
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageNumber: 1,
    pageSize: 10,
    ignore: false
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
    size: 15,
    sort: 'id,asc'
  });

  const { data: departmentListResponse, isFetching } = useGetDepartmentsQuery(paginationParams);
  
  // Fetch consultation orders by department
  const { data: consultationResponse, isLoading: consultationsLoading, refetch: refetchConsultations } = useGetConsultationOrdersByDepartmentQuery(
    {
      listRequest: listRequest,
      department_key: selectedDepartment?.departmentId?.toString() || '',
      preferred_consultant_key: loggedInUser?.practitionerKey || loggedInUser?.id?.toString()
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

  const handleConfirmAction = async () => {
    if (!selectedRow) return;

    try {
      const statusKey = selectedAction === "accept" 
        ? '1804566422622516'  // Accepted status
        : '1804533730103990'; // Rejected status

      await saveConsultationOrder({
        ...selectedRow,
        statusLkey: statusKey,
        updatedBy: loggedInUser?.login || 'Admin'
      }).unwrap();

      dispatch(notify({ 
        msg: `Consultation ${selectedAction === 'accept' ? 'confirmed' : 'rejected'} successfully`, 
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

  const toggleRowSelection = (id) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const tableColumns = [
    {
      key: 'select',
      title: "",
      width: 50,
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row.id)}
          onChange={() => toggleRowSelection(row.id)}
          style={{ cursor: "pointer" }}
        />
      )
    },
    {
      key: 'patientInfo',
      title: <Translate>Patient Name</Translate>,
      flexGrow: 4,
      render: (row) => (
        <Whisper
          trigger="hover"
          placement="top"
          speaker={
            <Tooltip>
              <div style={{ padding: "4px 8px" }}>
                <div><b>Gender:</b> {row.gender}</div>
                <div><b>Age:</b> {row.age} yrs</div>
              </div>
            </Tooltip>
          }
        >
          <span style={{ cursor: "pointer" }}>
            {row.patientName}
          </span>
        </Whisper>
      )
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      flexGrow: 1,
      render: (row) => {
        let color = "#6c757d";

        if (row.priority === "High") color = "#D64545";
        if (row.priority === "Medium") color = "#E6A100";
        if (row.priority === "Low") color = "#57ff39ff";

        return (
          <MyBadgeStatus
            contant={row.priority}
            color={color}
          />
        );
      }
    },
    {
      key: 'diagnosis',
      title: <Translate>Diagnosis</Translate>,
      flexGrow: 3,
      render: (row) => row.diagnosis
    },
    {
      key: 'findings',
      title: <Translate>Findings</Translate>,
      flexGrow: 3,
      render: (row) => row.findings
    },
    {
      key: 'questionToConsultant',
      title: <Translate>Question To Consultant</Translate>,
      flexGrow: 4,
      render: (row) => {

        const text = row.questionToConsultant || "";
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
      render: (row) => row.departmentName
    },
    {
      key: 'created',
      title: <Translate>Created By / At</Translate>,
      flexGrow: 2,
      render: (row) => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{row.createdAt}</span>
        </>
      )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (row) => {
        let color = "#6c757d";

        if (row.status === "Pending") color = "#E6A100";
        if (row.status === "Accepted") color = "#0DAA41";
        if (row.status === "Rejected") color = "#D64545";

        return (
          <MyBadgeStatus
            contant={row.status}
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
                onClick={() => console.log("Open EMR", row)}
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
                  setSelectedAction("accept");
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
                onClick={() => console.log("Add Response", row)}
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
        />



      </div>
    </Form>
    <AdvancedSearchFilters searchFilter={true} />
  </>);

  const tablebuttons = (
    <div className="day-case-list-table-buttons-position">
      <MyButton
        color="var(--deep-blue)"
        prefixIcon={() => <FaCheck />}
        width="109px">
        Submit
      </MyButton>
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
        sortType={listRequest.sortType}
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
          selectedAction === "accept"
            ? "Are you sure you want to confirm this consultation?"
            : "Are you sure you want to reject this consultation?"
        }
      />

    </Panel>
  );
};

export default MyConsultations;
