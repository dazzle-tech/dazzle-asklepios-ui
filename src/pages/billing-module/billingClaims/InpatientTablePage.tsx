import React, { useState } from 'react';
import { Whisper, Tooltip, Popover, Dropdown } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaEdit } from 'react-icons/fa';
import {
  FaFileImport,
  FaFileExport,
  FaFileWaveform,
  FaPaperclip,
  FaPaperPlane,
  FaPerson,
  FaPlay
} from 'react-icons/fa6';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';

const InpatientTablePage = () => {
    
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
  const [openActionsMenu, setOpenActionsMenu] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [testsOpen, setTestsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
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

  const rowClassName = (row: any) =>
    row?.id === selectedRow?.id ? 'selected-row' : '';

  return (
    <MyTable
      height={450}
      data={data}
      columns={columns}
      rowClassName={rowClassName}
      onRowClick={row => setSelectedRow(row)}
      tableButtons={
        <MyButton prefixIcon={() => <AddOutlineIcon />}>
          Add New
        </MyButton>
      }
    />
  );
};

export default InpatientTablePage;
