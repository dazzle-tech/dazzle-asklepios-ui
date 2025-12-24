import React, { useState } from 'react';
import { Whisper, Tooltip, Popover, Dropdown } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import {
  FaFileImport,
  FaFileWaveform,
  FaPaperclip,
  FaPlay
} from 'react-icons/fa6';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import OpenClaimModal from './OpenClaimModal';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import { AttachmentUploadModal } from '@/components/AttachmentModals';

const OutpatientTablePage = () => {

    const MOCK_CLAIMS = [
    {
        id: 1,
        claimId: 'CLM-1001',
        codingStatus: 'Completed',
        encounterStatus: 'Closed',
        startDateTime: '2025-08-01 09:45',
        encounterNumber: 'ENC-7788',
        patientId: 'P-445',
        patientFullName: 'Ahmad Ali',
        department: 'Radiology',
        assigned: 'Dr. Sami',
        patientsFinances: 'Self Pay',
        accountingBalance: 250.75,
        encounterDateTime: '2025-08-01 10:30',
        dischargeDateTime: '2025-11-20 14:00',
        timeSinceDischarge: '2 days'
    }
    ];



    const [data] = useState(MOCK_CLAIMS);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [openActionsMenu, setOpenActionsMenu] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);
    const [testsOpen, setTestsOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [openClaimModal, setOpenClaimModal] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);
    const [showPatientRecordsModal, setShowPatientRecordsModal] = useState(false);
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [attachmentContext, setAttachmentContext] = useState<{
    referenceId?: number | string;
    attachmentType?: string;
    }>({});



    const getTimeSince = (dateTime?: string) => {
    if (!dateTime) return '-';

    const start = new Date(dateTime).getTime();
    const now = Date.now();

    const diffMs = now - start;
    if (diffMs < 0) return '-';

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;

    return `${days}D:${remainingHours}H:${remainingMinutes}m`;
    };


    const iconsForActions = (row: any) => (
        <div className="container-of-icons">
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Open Claim</Tooltip>}>
            <div>
                <MyButton
                size="small"
                backgroundColor="light-blue"
                onClick={() => {
                    setSelectedClaim(row);
                    setOpenClaimModal(true);
                }}
                >
                <FaFileImport size={18} />
                </MyButton>

            </div>
        </Whisper>

        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Start Claim</Tooltip>}>
            <div>
            <MyButton
                size="small"
                onClick={() => {
                    setSelectedClaim(row);
                    setOpenClaimModal(true);
                }}>
                <FaPlay size={18} />
            </MyButton>
            </div>
        </Whisper>

        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Attachment</Tooltip>}>
            <div>
                <MyButton
                size="small"
                backgroundColor="black"
                onClick={() => {
                    setAttachmentContext({
                    referenceId: row.encounterNumber,
                    attachmentType: 'CLAIM'
                    });
                    setAttachmentsModalOpen(true);
                }}
                >
                <FaPaperclip size={17} />
                </MyButton>

            </div>
        </Whisper>

        <Whisper trigger="hover" placement="top" speaker={<Tooltip>EMR</Tooltip>}>
            <div>
            <MyButton
                size="small"
                backgroundColor="violet"
                onClick={() => setShowPatientRecordsModal(true)}
            >
                <FaFileWaveform size={17} />
            </MyButton>
            </div>
        </Whisper>

        </div>
    );

    const columns = [
    { key: 'claimId', title: 'Claim ID' },
    { key: 'patientsFinances', title: "Patient's Finances" },
    { key: 'accountingBalance', title: 'Accounting Balance' },
    {
        key: 'encounterNumber',
        title: 'Encounter ID'
    },
    {
        key: 'patientFullName',
        title: 'Patient Full Name',
        render: (row: any) => (
        <Whisper
            trigger="hover"
            placement="top"
            speaker={
            <Tooltip>
                <div><b>Patient ID:</b> {row.patientId}</div>
                <div><b>Department:</b> {row.department}</div>
                <div><b>Assigned:</b> {row.assigned}</div>
            </Tooltip>
            }
        >
            <span style={{ cursor: 'pointer'}}>
            {row.patientFullName}
            </span>
        </Whisper>
        )
    },
    {
        key: 'encounterDateTime',
        title: 'Encounter Date / Time'
    },
    {
        key: 'codingStatus',
        title: 'Claim Status'
    },
    {
        key: 'dischargeDateTime',
        title: 'Discharge Date / Time'
    },
    {
    key: 'timeSinceDischarge',
    title: 'Time Since Discharge',
    render: (row: any) => getTimeSince(row.dischargeDateTime)
    },
    {
        key: 'startDateTime',
        title: 'Start Date / Time'
    },
    {
        key: 'encounterStatus',
        title: 'Encounter Status'
    },
    {
    key: 'actions',
    title: 'Actions',
    render: (row: any) => iconsForActions(row)
    }
    ];



    const rowClassName = (row: any) =>
        row?.id === selectedRow?.id ? 'selected-row' : '';

    return (<>
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

            <MyModal
            open={openClaimModal}
            setOpen={setOpenClaimModal}
            title="Open Claim"
            size="90vw"
            bodyheight="100vh"
            hideBack
            hideActionBtn
            content={
                <OpenClaimModal claim={selectedClaim} />
            }
            />


      <MyModal
        open={showPatientRecordsModal}
        setOpen={setShowPatientRecordsModal}
        title="Patient Records"
        size="70vw"
        bodyheight="83vh"
        content={<PatientEMRModal />}
        hideBack={true}
        actionButtonLabel="Save"
      />


            <AttachmentUploadModal
            isOpen={attachmentsModalOpen}
            setIsOpen={setAttachmentsModalOpen}
            actionType="add"
            attachmentSource={attachmentContext.referenceId}
            attatchmentType={attachmentContext.attachmentType}
            refecthData={() => {
                console.log('Attachments refreshed');
            }}
            />


    </>);
    };

export default OutpatientTablePage;
