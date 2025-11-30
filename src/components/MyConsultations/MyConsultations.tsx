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
import { useDispatch } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

const MyConsultations = () => {
  const dispatch = useDispatch();
  const [record, setRecord] = useState({});
  const [openActionModal, setOpenActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

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



  const departmentOptions = departmentListResponse?.data?.map(dep => ({
    label: dep.name,
    value: dep.id
  })) ?? [];




  const physicians = practitionerListResponse?.data?.filter(
    p => p.jobRole === "PHYSICIAN"
  ) ?? [];

  const physicianList =
    physicians?.map(p => ({
      key: p.id,
      value: p.id,
      label: `${p.firstName} ${p.lastName}`
    })) ?? [];



  const staticData = [
    {
      id: 1,
      priority: "High",
      patientName: "John Smith",
      gender: "Male",
      age: 54,
      diagnosis: "Acute Appendicitis",
      findings: "Severe abdominal pain at RLQ, elevated WBC",
      questionToConsultant: "Is surgical intervention recommended?Is surgical intervention recommended?Is surgical intervention recommended?",
      departmentName: "General Surgery",
      createdBy: "Dr. Adam",
      createdAt: "2025-01-22 10:34",
      status: "Pending"
    },
    {
      id: 2,
      priority: "Medium",
      patientName: "Sarah Johnson",
      gender: "Female",
      age: 29,
      diagnosis: "Migraine Headache",
      findings: "MRI normal, persistent dizziness",
      questionToConsultant: "Recommend alternative medication?",
      departmentName: "Neurology",
      createdBy: "Dr. Lina",
      createdAt: "2025-01-22 09:15",
      status: "Pending"
    },
    {
      id: 3,
      priority: "Low",
      patientName: "Ahmed Ali",
      gender: "Male",
      age: 41,
      diagnosis: "Mild COVID-19",
      findings: "O2 98%, mild cough, stable vitals",
      questionToConsultant: "Isolation period recommendation?",
      departmentName: "Internal Medicine",
      createdBy: "Dr. Khaled",
      createdAt: "2025-01-20 14:50",
      status: "Pending"
    }
  ];

  const [data, setData] = useState(staticData);

  const handleConfirmAction = () => {
    if (!selectedRow) return;

    const updatedData = data.map(item =>
      item.id === selectedRow.id
        ? { ...item, status: selectedAction === "accept" ? "Accepted" : "Rejected" }
        : item
    );

    setData(updatedData);
    setOpenActionModal(false);
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
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Accept</Tooltip>}>
            <div>
              <MyButton
                size="small"
                radius="6px"
                backgroundColor="#36a55bff"
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
                backgroundColor="#D64545"
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

  console.log("department list response", departmentListResponse);
  console.log("departmentoptions", departmentOptions);

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
  return (
    <Panel>
      <MyTable
        data={data}
        columns={tableColumns}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={staticData.length}
        filters={filters}
        loading={loading}
        tableButtons={tablebuttons}
        onPageChange={(page) => setPage(page)}
        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value))}
      />


      <DeletionConfirmationModal
        open={openActionModal}
        setOpen={setOpenActionModal}
        itemToDelete={selectedRow?.patientName}
        actionType={selectedAction}
        actionButtonFunction={handleConfirmAction}
        confirmationQuestion={
          selectedAction === "accept"
            ? "Are you sure you want to accept this consultation?"
            : "Are you sure you want to reject this consultation?"
        }
      />

    </Panel>
  );
};

export default MyConsultations;
