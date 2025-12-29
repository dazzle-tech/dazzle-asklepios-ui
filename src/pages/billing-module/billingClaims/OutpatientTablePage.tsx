import React, { useEffect, useMemo, useState } from 'react';
import { Whisper, Tooltip } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaFileImport, FaFileWaveform, FaPaperclip, FaPlay } from 'react-icons/fa6';
import MyModal from '@/components/MyModal/MyModal';
import OpenClaimModal from './OpenClaimModal';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import { AttachmentUploadModal } from '@/components/AttachmentModals';

import { useGetEncountersQuery } from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector } from '@/hooks';

const COMPLETED_STATUS_KEY = '91109811181900'; 

const OutpatientTablePage = () => {
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;

  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [openClaimModal, setOpenClaimModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);

  const [showPatientRecordsModal, setShowPatientRecordsModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);

  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [attachmentContext, setAttachmentContext] = useState<{
    referenceId?: number | string;
    attachmentType?: string;
  }>({});

  // --------- helpers: generate extra fields ----------
  const hashToInt = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  };

  const seededNumber = (seedStr: string, min: number, max: number, decimals = 2) => {
    const seed = hashToInt(seedStr);
    const rnd = (seed % 100000) / 100000;
    const val = min + rnd * (max - min);
    return Number(val.toFixed(decimals));
  };

  const generateClaimId = (encKey: string | number) => {
    const n = (hashToInt(String(encKey)) % 999999) + 1;
    return `CLM-${String(n).padStart(6, '0')}`;
  };

  const getTimeSince = (dateTime?: string) => {
    if (!dateTime) return '-';
    const start = new Date(dateTime).getTime();
    const now = Date.now();
    const diffMs = now - start;
    if (diffMs < 0) return '-';
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    return `${days}D:${hours % 24}H:${minutes % 60}m`;
  };

  const getBaseFilters = () => {
    const baseFilters: any[] = [
      {
        fieldName: 'resource_type_lkey',
        operator: 'in',
        value: [
          '2039534205961578',
          '2039620472612029',
          '2039516279378421',
          'PRACTITIONER',
          'MEDICAL_TEST',
          'CLINIC'
        ]
          .map(key => `(${key})`)
          .join(' ')
      },
        {
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: ['91109811181900'].map(key => `(${key})`).join(' ')
      }
    ];


    return baseFilters;
  };

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: false, 
    filters: []
  });

  useEffect(() => {
    setListRequest(prev => ({
      ...prev,
      ignore: false,
      pageNumber: 1,
      pageSize: 200, 
      filters: getBaseFilters()
    }));
   
  }, []);

  const { data: encounterListResponse, isLoading, isFetching, error } = useGetEncountersQuery(
    listRequest,
    { skip: false }
  );

  // --------- transform encounters -> your table rows ----------
//   const data = useMemo(() => {
//     const encounters = encounterListResponse?.object ?? [];

//     // ✅ فلترة completed على الفرونت
//     const completedEncounters = encounters.filter((enc: any) => {
//       return enc?.encounterStatusLvalue?.key === COMPLETED_STATUS_KEY;
//       // إذا عندكم valueCode:
//       // return enc?.encounterStatusLvalue?.valueCode === 'COMPLETED';
//     });

//     return completedEncounters.map((enc: any, index: number) => {
//       const key = enc?.key ?? enc?.visitId ?? index;
//       const patientObj = enc?.patientObject ?? {};

//       return {
//         id: key,

//         // extra fields
//         claimId: generateClaimId(key),
//         patientsFinances: seededNumber(`fin-${key}`, 1, 999, 0),
//         accountingBalance: seededNumber(`bal-${key}`, 0, 2000, 2),

//         codingStatus: 'COMPLETED',
//         encounterStatus: enc?.encounterStatusLvalue?.lovDisplayVale ?? '-',

//         encounterNumber: enc?.visitId ?? enc?.encounterNumber ?? String(key),
//         patientId: patientObj?.patientMrn ?? patientObj?.key ?? '-',
//         patientFullName: patientObj?.fullName ?? '-',
//         department: enc?.departmentObject?.name ?? enc?.departmentName ?? '-',
//         assigned: enc?.practitionerObject?.fullName ?? enc?.doctorName ?? '-',
//         encounterDateTime: enc?.plannedStartDate ?? '-',
//         dischargeDateTime: enc?.dischargeDateTime ?? '',

//         originalEncounter: enc
//       };
//     });
//   }, [encounterListResponse]);

const data = useMemo(() => {
  const encounters = encounterListResponse?.object ?? [];

  return encounters.map((enc: any, index: number) => {
    const key = enc?.key ?? enc?.visitId ?? index;
    const patientObj = enc?.patientObject ?? {};

    const claimIsCompleted = (hashToInt(`claim-${key}`) % 100) < 30; 
    const codingStatus = claimIsCompleted ? 'COMPLETED' : 'NEW';

    return {
      id: key,

      claimId: generateClaimId(key),
      patientsFinances: seededNumber(`fin-${key}`, 1, 999, 0),
      accountingBalance: seededNumber(`bal-${key}`, 0, 2000, 2),

      //NEW or COMPLETED
      codingStatus,

      encounterStatus: enc?.encounterStatusLvalue?.lovDisplayVale ?? '-',
      encounterNumber: enc?.visitId ?? enc?.encounterNumber ?? String(key),
      patientId: patientObj?.patientMrn ?? patientObj?.key ?? '-',
      patientFullName: patientObj?.fullName ?? '-',
      department: enc?.departmentObject?.name ?? enc?.departmentName ?? '-',
      assigned: enc?.practitionerObject?.fullName ?? enc?.doctorName ?? '-',
      encounterDateTime: enc?.plannedStartDate ?? '-',
      dischargeDateTime: enc?.dischargeDateTime ?? '',

      originalEncounter: enc
    };
  });
}, [encounterListResponse]);

  const iconsForActions = (row: any) => {
    const startDisabled = row.codingStatus === 'COMPLETED';

    return (
      <div className="container-of-icons">
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Open Claim</Tooltip>}>
          <div>
            <MyButton
              size="small"
              backgroundColor="light-blue"
              disabled={!startDisabled}
              onClick={() => {
                setSelectedClaim(row);
                setOpenClaimModal(true);
              }}
            >
              <FaFileImport size={18} />
            </MyButton>
          </div>
        </Whisper>

        <Whisper
          trigger="hover"
          placement="top"
          speaker={<Tooltip>{startDisabled ? 'Claim Completed' : 'Start Claim'}</Tooltip>}
        >
          <div>
            <MyButton
              size="small"
              disabled={startDisabled}
              onClick={() => {
                if (startDisabled) return;
                setSelectedClaim(row);
                setOpenClaimModal(true);
              }}
            >
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
              onClick={() => {
                const enc = row.originalEncounter;
                const pat = enc?.patientObject ?? null;
                setEmrEncounter(enc);
                setEmrPatient(pat);
                setShowPatientRecordsModal(true);
              }}
            >
              <FaFileWaveform size={17} />
            </MyButton>
          </div>
        </Whisper>
      </div>
    );
  };

  const columns = [
    { key: 'claimId', title: 'Claim ID' },
    { key: 'patientsFinances', title: "Patient's Finances" },
    { key: 'accountingBalance', title: 'Accounting Balance' },
    { key: 'encounterNumber', title: 'Encounter ID' },
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
          <span style={{ cursor: 'pointer' }}>{row.patientFullName}</span>
        </Whisper>
      )
    },
    { key: 'encounterDateTime', title: 'Encounter Date / Time' },
    { key: 'codingStatus', title: 'Claim Status' },
    { key: 'dischargeDateTime', title: 'Complete Date / Time' },
    {
      key: 'timeSinceDischarge',
      title: 'Time Since Discharge',
      render: (row: any) => getTimeSince(row.dischargeDateTime)
    },
    { key: 'encounterStatus', title: 'Encounter Status' },
    { key: 'actions', title: 'Actions', render: (row: any) => iconsForActions(row) }
  ];

  const rowClassName = (row: any) => (row?.id === selectedRow?.id ? 'selected-row' : '');

  return (
    <>
      {!isLoading && !isFetching && data.length === 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: 4
          }}
        >
        </div>
      )}

      <MyTable
        height={450}
        data={data}
        columns={columns}
        rowClassName={rowClassName}
        onRowClick={row => setSelectedRow(row)}
        loading={isLoading || isFetching}
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
        content={<OpenClaimModal claim={selectedClaim} />}
      />

      <MyModal
        open={showPatientRecordsModal}
        setOpen={setShowPatientRecordsModal}
        title="Patient Records"
        size="70vw"
        bodyheight="83vh"
        hideBack={true}
        actionButtonLabel="Save"
        content={
          emrPatient && emrEncounter ? (
            <PatientEMRModal patient={emrPatient} encounter={emrEncounter} />
          ) : (
            <div style={{ padding: 16 }}>No patient selected.</div>
          )
        }
      />

      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        actionType="add"
        attachmentSource={attachmentContext.referenceId}
        attatchmentType={attachmentContext.attachmentType}
        refecthData={() => console.log('Attachments refreshed')}
      />
    </>
  );
};

export default OutpatientTablePage;
