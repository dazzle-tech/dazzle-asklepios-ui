import React, { useState } from 'react';
import {
  Panel,
  Form,
  Whisper,
  Tooltip,
  Popover,
  Dropdown
} from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import { FaEdit, FaListAlt } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useGetDepartmentsQuery } from '@/services/setupService';
import { Tabs } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { FaFileExport, FaFileImport, FaFileWaveform, FaPaperclip, FaPaperPlane, FaPerson, FaPlay } from 'react-icons/fa6';

const Claimscreen = () => {

  const dispatch = useAppDispatch();


  const divContent = (
    "Claims"
  );
  dispatch(setPageCode('ProductList'));
  dispatch(setDivContent(divContent));



  const MOCK_CLAIMS = [
    {
      id: 1,
      claimId: 'CLM-1001',
      isEdited: 'Yes',
      editedVersion: 'v2',
      isSecondaryClaimVersion: 'No',
      encounterNumber: 'ENC-7788',
      patientId: 'P-445',
      patientFullName: 'Ahmad Ali',
      sourceClaim: 'Internal',
      patientsFinances: 'Self Pay',
      accountingBalance: 250.75,
      encounterDateTime: '2025-08-01 10:30',
      department: 'Radiology',
      assigned: 'Dr. Sami',
      auditedBy: 'Audit Team A',
      codingStatus: 'Completed',
      dischargeDateTime: '2025-08-03 14:00',
      timeSinceDischarge: '2 days',
      paymentType: 'Cash',
      insurance: 'None',
      codingStartDateTime: '2025-08-01 12:00',
      treatmentStatus: 'Finished',
      encounterStatus: 'Closed'
    }
  ];

  const [data] = useState(MOCK_CLAIMS);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [filter, setFilter] = useState<any>({});
  const [popupOpen, setPopupOpen] = useState(false);
  const [testsOpen, setTestsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [openActionsMenu, setOpenActionsMenu] = useState(false);

  const { data: departmentListResponse } = useGetDepartmentsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const departmentOptions =
    departmentListResponse?.data?.map(dep => ({
      label: dep.name,
      value: dep.id
    })) ?? [];

  const TopActionsMenu = () => {
    return (
      <Whisper
        trigger="click"
        placement="bottom"
        open={openActionsMenu}
        onClose={() => setOpenActionsMenu(false)}
        speaker={
          <Popover full>
            <Dropdown.Menu>

              <Dropdown.Item
                onClick={() => {
                  if (!selectedRow) return;
                  setPopupOpen(true);
                  setOpenActionsMenu(false);
                }}
              >
                <div className="container-of-icon-and-key1">
                  <FaPerson />
                  <span>Encounter Info</span>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                onClick={() => {
                  if (!selectedRow) return;
                  setTestsOpen(true);
                  setOpenActionsMenu(false);
                }}
              >
                <div className="container-of-icon-and-key1">
                  <FaPaperPlane />
                  <span>Discharge Report</span>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                onClick={() => {
                  if (!selectedRow) return;
                  setDeleteOpen(true);
                  setOpenActionsMenu(false);
                }}
              >
                <div className="container-of-icon-and-key1">
                  <FaFileWaveform />
                  <span>Medical Record</span>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                onClick={() => {
                  if (!selectedRow) return;
                  setDeleteOpen(true);
                  setOpenActionsMenu(false);
                }}
              >
                <div className="container-of-icon-and-key1">
                  <FaFileExport />
                  <span>Assign</span>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                onClick={() => {
                  if (!selectedRow) return;
                  setDeleteOpen(true);
                  setOpenActionsMenu(false);
                }}
              >
                <div className="container-of-icon-and-key1">
                  <FaPaperclip />
                  <span>Attach Document</span>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                onClick={() => {
                  if (!selectedRow) return;
                  setDeleteOpen(true);
                  setOpenActionsMenu(false);
                }}
              >
                <div className="container-of-icon-and-key1">
                  <FaPlay />
                  <span>Start</span>
                </div>
              </Dropdown.Item>

            </Dropdown.Menu>
          </Popover>
        }
      >
        <span>
          <MyButton
            size="small"
            onClick={() => setOpenActionsMenu(!openActionsMenu)}
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </MyButton>
        </span>
      </Whisper>
    );
  };


  const iconsForActions = () => (
    <div className="container-of-icons">
      <TopActionsMenu />

      <Whisper trigger="hover" placement="top" speaker={<Tooltip>Open Claim</Tooltip>}>
        <div>
          <MyButton
            size="small"
            backgroundColor="light-blue"
            onClick={() => setPopupOpen(true)}
          >
            <FaFileImport size={18} />
          </MyButton>
        </div>
      </Whisper>

      <Whisper trigger="hover" placement="top" speaker={<Tooltip>Create Second Claim</Tooltip>}>
        <div>
          <MyButton
            size="small"
            onClick={() => setDeleteOpen(true)}
          >
            <AddOutlineIcon size={18} />
          </MyButton>
        </div>
      </Whisper>

      <Whisper trigger="hover" placement="top" speaker={<Tooltip>Edit Claim</Tooltip>}>
        <div>
          <MyButton
            size="small"
            backgroundColor="black"
            onClick={() => setTestsOpen(true)}
          >
            <FaEdit size={17} />
          </MyButton>
        </div>
      </Whisper>


    </div>
  );

  const columns = [
    { key: 'claimId', title: 'Claim ID' },
    { key: 'isEdited', title: 'Is Edited' },
    { key: 'editedVersion', title: 'Edited Version' },
    { key: 'isSecondaryClaimVersion', title: 'Is Secondary Claim Version' },
    { key: 'encounterNumber', title: 'Encounter Number' },
    { key: 'patientId', title: 'Patient ID' },
    { key: 'patientFullName', title: 'Patient Full Name' },
    { key: 'sourceClaim', title: 'Source Claim' },
    { key: 'patientsFinances', title: "Patient's Finances" },
    { key: 'accountingBalance', title: 'Accounting Balance' },
    { key: 'encounterDateTime', title: 'Encounter Date / Time' },
    { key: 'department', title: 'Department' },
    { key: 'assigned', title: 'Assigned' },
    { key: 'auditedBy', title: 'Audited By' },
    { key: 'codingStatus', title: 'Coding Status' },
    { key: 'dischargeDateTime', title: 'Discharge Date / Time' },
    { key: 'timeSinceDischarge', title: 'Time Since Discharge' },
    { key: 'paymentType', title: 'Payment Type' },
    { key: 'insurance', title: 'Insurance' },
    { key: 'codingStartDateTime', title: 'Coding Start Date / Time' },
    { key: 'treatmentStatus', title: 'Treatment Status' },
    { key: 'encounterStatus', title: 'Encounter Status' },
    {
      key: 'actions',
      title: 'Actions',
      render: () => iconsForActions()
    }
  ];

  const content = (<>
    <div className="advanced-filters">
      <Form fluid className="dissss">
        <div className='advanced-filters-claims-screen'>
        <MyInput
          width="10vw"
          fieldLabel="Coding Status"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width="10vw"
          fieldLabel="Claim Billing Mode"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width="10vw"
          fieldLabel="Assigned"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        />
        <MyInput
          fieldName="scheduledTransfusion"
          fieldType="check"
          fieldLabel="Assigned To Me"
          showLabel={false}
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          fieldName="scheduledTransfusion"
          fieldType="check"
          fieldLabel="Un Assigned"
          showLabel={false}
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width="10vw"
          fieldLabel="Encounter Billing Mode"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        /></div>
      </Form>
    </div></>);

  const filters = () => (
    <div className='my-table-filters'>
    <Form layout='inline' fluid>
      <div className='container-of-filter-fields-department-date-filters'>
        <MyInput
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={filter}
          setRecord={setFilter}
          showLabel={false}
          column
        />
        <MyInput
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={filter}
          setRecord={setFilter}
          showLabel={false}
          column
        />
      </div>

      <SearchPatientCriteria record={filter} setRecord={setFilter} />

      <MyInput
        width="10vw"
        fieldLabel="Department"
        fieldName="department"
        fieldType="checkPicker"
        selectData={departmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filter}
        setRecord={setFilter}
        column
      />
      <MyInput
        width="10vw"
        fieldLabel="Encounter Status"
        fieldName="department"
        fieldType="checkPicker"
        selectData={departmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filter}
        setRecord={setFilter}
        column
      />

      <MyInput
        width="10vw"
        fieldLabel="insurance"
        fieldName="department"
        fieldType="checkPicker"
        selectData={departmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filter}
        setRecord={setFilter}
        column
      />

    </Form>

          <AdvancedSearchFilters
        searchFilter={true}
        content={content}
      />
    </div>
  );

const isSelectedRow = (rowData: any) => {
  if (!selectedRow) return '';
  return rowData?.id === selectedRow?.id ? 'selected-row' : '';
};

  return (
    <Panel>
        {filters()}

 <Tabs defaultActiveKey="1" appearance="subtle">

    <Tabs.Tab eventKey="1" title="Inpatient">
      <MyTable
        height={450}
        data={data}
        columns={columns}
        rowClassName={isSelectedRow}
        onRowClick={row => setSelectedRow(row)}
        tableButtons={
          <div className="table-top-actions">

            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => setPopupOpen(true)}
            >
              Add New
            </MyButton>
          </div>
        }
      />

    </Tabs.Tab>
  </Tabs>

</Panel>
  );
};

export default Claimscreen;