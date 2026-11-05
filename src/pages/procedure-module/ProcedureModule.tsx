import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetEncounterByIdQuery } from '@/services/encounters/patientEncounterService';
import { useGetPatientByIdQuery, useLazyGetPatientByIdQuery } from '@/services/patient/patientService';
import { useSearchProceduresQuery } from '@/services/patients/patientProcedureService';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetProceduresByIdsQuery } from '@/services/setup/procedure/procedureService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import { formatDateWithoutSeconds } from '@/utils';
import { faBarcode, faFileWaveform, faPrint } from '@fortawesome/free-solid-svg-icons'; // FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaBedPulse } from 'react-icons/fa6'; // React Icons
import { MdAttachFile } from 'react-icons/md';
import { Checkbox, Form, HStack, Tooltip, Whisper } from 'rsuite';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import PatientEMRModal from '../patient/patient-emr/PatientEMRModal';
import EncounterAttachment from '../patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import Perform from '../encounter/encounter-component/procedure-new/Perform';
import MyButton from '@/components/MyButton/MyButton';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import { useLocation } from 'react-router-dom';
import Icd10Search from '../medical-component/Icd10Search';
import './styles.less';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';

const ProcedureModule: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const [showCanceled, setShowCanceled] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [procedure, setProcedure] = useState<any>({});
  const [dateFilter, setDateFilter] = useState<{ fromDate: Date | null; toDate: Date | null }>({
    fromDate: new Date(),
    toDate: null
  });

  const [record, setRecord] = useState<{ filter: string; value: string }>({
    filter: '',
    value: ''
  });
  const [appliedPatientSearch, setAppliedPatientSearch] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });

  const { data: patient } = useGetPatientByIdQuery(
    { id: procedure?.patientId },
    { skip: !procedure?.patientId }
  );

  const { data: encounter } = useGetEncounterByIdQuery(
    { id: procedure?.encounterId },
    { skip: !procedure?.encounterId }
  );
  const [openPerformModal, setOpenPerformModal] = useState(false);
  const categoryOptions = useEnumOptions('ProcedureCategory');

  const isSelected = (rowData: any) =>
    rowData && procedure && rowData.id === procedure.id ? 'selected-row' : '';

  const [openEMRModal, setOpenEMRModal] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const dayBoundary = (date: Date | null, endOfDay: boolean) => {
    if (!date) return undefined;
    const boundary = new Date(date);
    if (endOfDay) boundary.setHours(23, 59, 59, 999);
    else boundary.setHours(0, 0, 0, 0);
    return boundary.toISOString();
  };

  const {
    data: procedures,
    refetch: proRefetch,
    isLoading: procedureLoding
  } = useSearchProceduresQuery({
    page,
    size: rowsPerPage,
    fromDate: dayBoundary(dateFilter.fromDate, false),
    toDate: dayBoundary(dateFilter.toDate, true),
    includeCancelled: !showCanceled
  });
  const procedureRows = useMemo(() => procedures?.data ?? [], [procedures]);

  const procedureSetupIds = useMemo(
    () => [...new Set(procedureRows.map((row: any) => row.procedureId))] as number[],
    [procedureRows]
  );
  const { data: procedureSetups = [] } = useGetProceduresByIdsQuery(procedureSetupIds, {
    skip: procedureSetupIds.length === 0
  });
  const { data: departments } = useGetAllDepartmentsWithoutPaginationQuery(undefined);
  const { data: facilities } = useGetAllFacilitiesQuery(undefined);
  const setupOf = (row: any) => procedureSetups.find(item => item.id === row?.procedureId);

  const [trigger] = useLazyGetPatientByIdQuery();

  const { data: procedurePrioStatusLovQueryResponse } =
    useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: procedureLevelStatusLovQueryResponse } =
    useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');

  const filterFields = [
    { label: 'PROCEDURE ID', value: 'procedureId' },
    { label: 'Procedure Name', value: 'procedureName' }
  ];

  // Keep latest patients map in ref to avoid over-broad deps
  const [patients, setPatients] = useState<Record<string, any>>({});
  const patientsRef = useRef(patients);
  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);

  // Fetch the patient of each listed procedure once
  useEffect(() => {
    const fetchPatients = async () => {
      const toFetch = [...new Set(procedureRows.map((row: any) => row.patientId))].filter(
        (id: any) => id && !patientsRef.current[id]
      );

      for (const id of toFetch as number[]) {
        try {
          const result = await trigger({ id }).unwrap();
          setPatients(prev => ({ ...prev, [id]: result }));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch patient', id, e);
        }
      }
    };

    fetchPatients();
  }, [procedureRows, trigger]);

  useEffect(() => {
    const divContent = (
     "Procedure Requests List"
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);

    dispatch(setPageCode('Procedure_Requests_List'));
    dispatch(setDivContent(divContentHTML));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  const OpenPerformModel = () => setOpenPerformModal(true);

  const metaCell = (by?: string | null, date?: string | null) => (
    <>
      <span>{by}</span>
      <br />
      <span className="date-table-style">{date ? formatDateWithoutSeconds(date) : ''}</span>
    </>
  );

  const tableColumns = [
    {
      key: 'patientId',
      title: <Translate>Patient</Translate>,
      render: (rowData: any) => (
        <Whisper
          placement="top"
          speaker={<Tooltip>{patients[rowData.patientId]?.patientMrn}</Tooltip>}
        >
          {patients[rowData.patientId]?.fullName}
        </Whisper>
      )
    },
    {
      key: 'procedureId',
      dataKey: 'procedureId',
      title: <Translate>PROCEDURE ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.id
    },
    {
      key: 'procedureName',
      title: <Translate>Procedure Name</Translate>,
      flexGrow: 1,
      render: (rowData: any) => setupOf(rowData)?.name ?? ''
    },
    {
      key: 'scheduledDateTime',
      dataKey: 'scheduledDateTime',
      title: <Translate>SCHEDULED DATE TIME</Translate>,
      flexGrow: 1,
      render: (rowData: any) =>
        rowData.scheduledDateTime ? formatDateWithoutSeconds(rowData.scheduledDateTime) : ' '
    },
    {
      key: 'categoryType',
      title: <Translate>CATEGORY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => formatEnumString(setupOf(rowData)?.categoryType) || ' '
    },
    {
      key: 'priority',
      dataKey: 'priority',
      title: <Translate>PRIORITY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => formatEnumString(rowData.priority)
    },
    {
      key: 'procedureLevel',
      dataKey: 'procedureLevel',
      title: <Translate>LEVEL</Translate>,
      flexGrow: 1,
      render: (rowData: any) => formatEnumString(rowData.procedureLevel)
    },
    {
      key: 'status',
      dataKey: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => formatEnumString(rowData.status)
    },
    {
      key: 'attachment',
      title: <Translate>ATTACHED FILE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <MdAttachFile
          size={20}
          onClick={() => {
            setProcedure(rowData);
            setAttachmentsModalOpen(true);
          }}
          style={{ cursor: 'pointer' }}
        />
      )
    },
    {
      key: 'perform',
      title: <Translate>PERFORM</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const isDisabled = rowData.status === 'CANCELLED';
        return (
          <HStack spacing={10}>
            <Whisper trigger="hover" placement="top" speaker={<Tooltip>Perform Details</Tooltip>}>
              <div>
                <FaBedPulse
                  size={22}
                  fill={isDisabled ? '#ccc' : 'var(--primary-gray)'}
                  style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                  onClick={
                    isDisabled
                      ? undefined
                      : () => {
                          setProcedure(rowData);
                          OpenPerformModel();
                        }
                  }
                />
              </div>
            </Whisper>
          </HStack>
        );
      }
    },
    {
      key: 'print',
      title: <Translate>Print</Translate>,
      render: (_rowData: any) => (
        <HStack spacing={10}>
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Print</Tooltip>}>
            <div>
              <MyButton
                size="small"
                backgroundColor="light-blue"
                onClick={() => {
                  /* TODO: implement print */
                }}
              >
                <FontAwesomeIcon icon={faPrint} />
              </MyButton>
            </div>
          </Whisper>
        </HStack>
      )
    },
    {
      key: 'action',
      title: <Translate>Action</Translate>,
      render: (_rowData: any) => (
        <HStack spacing={10}>
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Wristband</Tooltip>}>
            <div>
              <MyButton size="small" backgroundColor="black">
                <FontAwesomeIcon icon={faBarcode} />
              </MyButton>
            </div>
          </Whisper>

          <Whisper placement="top" trigger="hover" speaker={<Tooltip>EMR</Tooltip>}>
            <div>
              <MyButton size="small" backgroundColor="violet" onClick={() => setOpenEMRModal(true)}>
                <FontAwesomeIcon icon={faFileWaveform} />
              </MyButton>
            </div>
          </Whisper>
        </HStack>
      )
    },
    {
      key: 'toFacilityId',
      title: <Translate>FACILITY</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) =>
        (facilities ?? []).find((item: any) => item.id === rowData.toFacilityId)?.name ?? ''
    },
    {
      key: 'toDepartmentId',
      title: <Translate>DEPARTMENT</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) =>
        (departments ?? []).find((item: any) => item.id === rowData.toDepartmentId)?.name ?? ''
    },
    {
      key: 'bodyPart',
      dataKey: 'bodyPart',
      title: <Translate>BODY PART</Translate>,
      flexGrow: 1,
      expandable: true
    },
    {
      key: 'side',
      dataKey: 'side',
      title: <Translate>SIDE</Translate>,
      flexGrow: 1,
      expandable: true
    },
    {
      key: 'notes',
      dataKey: 'notes',
      title: <Translate>NOTE</Translate>,
      flexGrow: 1,
      expandable: true
    },
    {
      key: 'createdMeta',
      title: <Translate>CREATED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => metaCell(rowData.createdBy, rowData.createdDate)
    },
    {
      key: 'updatedMeta',
      title: <Translate>UPDATED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => metaCell(rowData.lastModifiedBy, rowData.lastModifiedDate)
    },
    {
      key: 'cancelledMeta',
      title: <Translate>CANCELLED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => metaCell(rowData.cancelledBy, rowData.cancelledDate)
    },
    {
      key: 'cancellationReason',
      dataKey: 'cancellationReason',
      title: <Translate>CANCELLITON REASON</Translate>,
      flexGrow: 1,
      expandable: true
    }
  ];

  const totalCount = procedures?.totalCount ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const matchesRecordFilter = (row: any) => {
    const raw = String(record?.value ?? '').trim().toLowerCase();
    if (!record?.filter || !raw) return true;
    const value = record.filter === 'procedureName' ? setupOf(row)?.name : row.id;
    return String(value ?? '').toLowerCase().includes(raw);
  };

  const contents = (
    <div className="advanced-filters">
      <Form fluid className="dissss">
        <MyInput
          fieldType="select"
          fieldName="Category"
          selectData={categoryOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={record}
          setRecord={setRecord}
          showLabel={false}
          searchable={false}
        />

        <MyInput
          fieldType="select"
          fieldName="Priority"
          selectData={procedurePrioStatusLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

          selectDataValue="key"
          record={record}
          setRecord={setRecord}
          showLabel={false}
          searchable={false}
        />

        <MyInput
          fieldType="select"
          fieldName="Level"
          selectData={procedureLevelStatusLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

          selectDataValue="key"
          record={record}
          setRecord={setRecord}
          showLabel={false}
          searchable={false}
        />
        <div className="indication-procedure-handle-position">
          <Icd10Search
            object={record}
            setOpject={setRecord}
            fieldName="indication"
            fieldLabel={<Translate>Indication</Translate>}
          />
        </div>
      </Form>
    </div>
  );

  const filters = () => (
    <>
      <Form fluid className='procedure-module-table-filters-handle-position'>
        <MyInput
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
          showLabel={false}
        />
        <MyInput
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
          showLabel={false}
        />
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={record}
          setRecord={updatedRecord => {
            setRecord({ ...record, filter: (updatedRecord as any).filter, value: '' });
          }}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
        />
        <MyInput
          fieldName="value"
          fieldType="text"
          record={record}
          setRecord={setRecord}
          showLabel={false}
          placeholder="Search"
        />


        <SearchPatientCriteria
          record={record}
          setRecord={setRecord}
          searchMarginTop={0}
          liveSearchMinLength={0}
          onSearchClick={() => {
            setAppliedPatientSearch({
              searchByField: (record as any)?.searchByField ?? 'fullName',
              patientName: (record as any)?.patientName ?? ''
            });
            setPage(0);
          }}
        />

        <Checkbox className="show-cancelled" style={{marginTop:'1.2vw'}} checked={!showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
          <Translate>Show Cancelled</Translate>
        </Checkbox>
      </Form>
      <AdvancedSearchFilters searchFilter={true} content={contents} />
    </>
  );


  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <MyTable
        filters={filters()}
        columns={tableColumns}
        data={procedureRows.filter(matchesRecordFilter).filter((row: any) => {
          const field = String(appliedPatientSearch?.searchByField ?? 'fullName');
          const raw = String(appliedPatientSearch?.patientName ?? '').trim().toLowerCase();
          if (!raw) return true;
          const patient = patients[row?.patientId] ?? {};
          if (field === 'patientMrn') {
            return String(patient?.patientMrn ?? '').toLowerCase().includes(raw);
          }
          if (field === 'phoneNumber') {
            return String(patient?.phoneNumber ?? patient?.primaryMobileNumber ?? '')
              .toLowerCase()
              .includes(raw);
          }
          if (field === 'documentNumber') {
            return String(patient?.documentNo ?? patient?.documentNumber ?? '')
              .toLowerCase()
              .includes(raw);
          }
          if (field === 'dob') {
            return String(patient?.dob ?? patient?.dateOfBirth ?? '').slice(0, 10) ===
              String(appliedPatientSearch?.patientName ?? '').trim();
          }
          return String(patient?.fullName ?? '').toLowerCase().includes(raw);
        })}
        onRowClick={(rowData: any) => {
          setProcedure(rowData);
        }}
        loading={procedureLoding}
        rowClassName={isSelected}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <MyModal
        open={openPerformModal}
        setOpen={setOpenPerformModal}
        title="Perform Details"
        hideActionBtn
        size="full"
        content={<div dir={dir}>
          <Perform
            proRefetch={proRefetch}
            encounter={encounter}
            patient={patient}
            procedure={procedure}
            setProcedure={setProcedure}
            edit={false}
          />
          </div>
        }
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title="Attachments"
        size="lg"
        hideActionBtn
        content={
          <div dir={dir}>
            <EncounterAttachment
              localEncounter={encounter}
              source="PROCEDURE_REQUEST_ATTACHMENT"
              sourceId={procedure?.id ? Number(procedure.id) : undefined}
              patientId={procedure?.patientId}
              refetchAttachmentList={false}
              setRefetchAttachmentList={() => {}}
            />
          </div>
        }
      />

      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title="Electronic Medical Record"
        size="90vw"
        content={
          patient && encounter ? (
            <div dir={dir}><PatientEMRModal inModal patient={patient} encounter={encounter} /></div>
          ) : (
            <div style={{ padding: 16 }}>No patient selected.</div>
          )
        }
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
        cancelButtonLabel="Cancel"
      />

    </div>
  );
};

export default ProcedureModule;
