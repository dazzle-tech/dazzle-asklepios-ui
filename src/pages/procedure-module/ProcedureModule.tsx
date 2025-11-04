import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetPatientAttachmentsListQuery } from '@/services/attachmentService';
import { useGetEncounterByIdQuery } from '@/services/encounterService';
import { useGetPatientByIdQuery, useLazyGetPatientByIdQuery } from '@/services/patientService';
import { useGetProceduresQuery } from '@/services/procedureService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApProcedure } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds, fromCamelCaseToDBName } from '@/utils';
import { faBarcode, faFileWaveform, faPrint } from '@fortawesome/free-solid-svg-icons'; // FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaBedPulse, FaFileArrowDown } from 'react-icons/fa6'; // React Icons
import { MdAttachFile } from 'react-icons/md';
import { Checkbox, Form, HStack, Tooltip, Whisper } from 'rsuite';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import PatientEMRModal from '../patient/patient-emr/PatientEMRModal';
import Perform from '../encounter/encounter-component/procedure/Perform';
import MyButton from '@/components/MyButton/MyButton';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import { useLocation } from 'react-router-dom';
import Icd10Search from '../medical-component/Icd10Search';
import './styles.less';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';

// --- Utils ---
const handleDownload = (attachment: any) => {
  if (!attachment?.fileContent) return;
  const byteCharacters = atob(attachment.fileContent);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], {
    type: attachment.contentType || 'application/octet-stream'
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = attachment.fileName || 'download';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};

const ProcedureModule: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const [showCanceled, setShowCanceled] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [procedure, setProcedure] = useState<any>({ ...newApProcedure });
  const [dateFilter, setDateFilter] = useState<{ fromDate: Date | null; toDate: Date | null }>({
    fromDate: new Date(),
    toDate: null
  });

  const [record, setRecord] = useState<{ filter: string; value: string }>({
    filter: '',
    value: ''
  });

  const { data: patient } = useGetPatientByIdQuery(procedure?.patientKey, {
    skip: !procedure?.patientKey
  });

  const { data: encounter } = useGetEncounterByIdQuery(procedure?.encounterKey, {
    skip: !procedure?.encounterKey
  });
  const [openPerformModal, setOpenPerformModal] = useState(false);
  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');

  const isSelected = (rowData: any) =>
    rowData && procedure && rowData.key === procedure.key ? 'selected-row' : '';

  const [openEMRModal, setOpenEMRModal] = useState(false);

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'current_department', operator: 'match', value: 'false' },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      }
    ]
  });

  const {
    data: procedures,
    refetch: proRefetch,
    isLoading: procedureLoding
  } = useGetProceduresQuery(listRequest);

  const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      { fieldName: 'attachment_type', operator: 'match', value: 'PROCEDURE' }
    ]
  });

  const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
    useGetPatientAttachmentsListQuery(attachmentsListRequest);

  const [trigger] = useLazyGetPatientByIdQuery();

  const { data: procedureStatusLovQueryResponse } = useGetLovValuesByCodeQuery('PROC_STATUS');
  const { data: procedureCatStatusLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const { data: procedurePrioStatusLovQueryResponse } =
    useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: procedureLevelStatusLovQueryResponse } =
    useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: procedureIndStatusLovQueryResponse } = useGetLovValuesByCodeQuery('ICD-10');

  const filterFields = [
    { label: 'PROCEDURE ID', value: 'procedureId' },
    { label: 'Procedure Name', value: 'procedureName' },
    { label: 'INDICATIONS', value: 'indications' }
  ];

  // Keep latest patients map in ref to avoid over-broad deps
  const [patients, setPatients] = useState<Record<string, any>>({});
  const patientsRef = useRef(patients);
  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);

  // Refresh attachments list filters when modal closes
  useEffect(() => {
    if (!attachmentsModalOpen) {
      const updatedFilters = [
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
        { fieldName: 'attachment_type', operator: 'match', value: 'PROCEDURE' }
      ];
      setAttachmentsListRequest(prevRequest => ({ ...prevRequest, filters: updatedFilters }));
    }
    attachmentRefetch();
  }, [attachmentsModalOpen, attachmentRefetch]);

  // Fetch patients for each procedure (FIX: never iterate over undefined)
  useEffect(() => {
    const fetchPatients = async () => {
      const list = Array.isArray(procedures?.object) ? procedures!.object : [];
      if (list.length === 0) return;

      const toFetch = list
        .map((p: any) => p?.patientKey)
        .filter((key: any) => key && !patientsRef.current[key]);

      for (const key of toFetch) {
        try {
          const result = await trigger(key).unwrap();
          setPatients(prev => ({ ...prev, [key]: result }));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch patient', key, e);
        }
      }
    };

    fetchPatients();
  }, [procedures?.object, trigger]);

  // Helpers
  const addOrUpdateFilter = (filters: any[], newFilter: any) => {
    const next = [...filters];
    const index = next.findIndex(f => f.fieldName === newFilter.fieldName);
    if (index > -1) next[index] = newFilter;
    else next.push(newFilter);
    return next;
  };

  // Update filters when showCanceled toggles
  useEffect(() => {
    setListRequest(prev => {
      let updatedFilters = [...prev.filters];
      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'current_department',
        operator: 'match',
        value: 'false'
      });
      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      });
      return { ...prev, filters: updatedFilters };
    });
  }, [showCanceled]);

  // Update filters when record changes
  useEffect(() => {
    if (record.filter) {
      handleFilterChange(record.filter, record.value);
    } else {
      setListRequest(prev => ({
        ...prev,
        filters: addOrUpdateFilter(prev.filters, {
          fieldName: 'current_department',
          operator: 'match',
          value: 'false'
        })
      }));
      setListRequest(prev => ({
        ...prev,
        filters: addOrUpdateFilter(prev.filters, {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3621690096636149'
        })
      }));
    }
  }, [record]);

  // Date filter logic (clone dates to avoid mutating state refs)
  useEffect(() => {
    let updatedFilters = [...listRequest.filters];

    const from = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
    const to = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

    if (from && to) {
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'scheduled_date_time',
        operator: 'between',
        value: `${from.getTime()}-${to.getTime()}`
      });
    } else if (from) {
      from.setHours(0, 0, 0, 0);
      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'scheduled_date_time',
        operator: 'gte',
        value: from.getTime()
      });
    } else if (to) {
      to.setHours(23, 59, 59, 999);
      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'scheduled_date_time',
        operator: 'lte',
        value: to.getTime()
      });
    }

    setListRequest(prev => ({ ...prev, filters: updatedFilters }));
  }, [dateFilter]);

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

  const handleFilterChange = (fieldName: string, value: string) => {
    if (!fieldName) return;
    if (value) {
      const newFilter = {
        fieldName: fromCamelCaseToDBName(fieldName),
        operator: 'containsIgnoreCase',
        value
      };
      setListRequest(prev => ({ ...prev, filters: addOrUpdateFilter(prev.filters, newFilter) }));
    }
  };

  const OpenPerformModel = () => setOpenPerformModal(true);

  // Columns memo to avoid re-renders
  const tableColumns = useMemo(
    () => [
      {
        key: 'patientKey',
        title: <Translate>Patient</Translate>,
        render: (rowData: any) => (
          <Whisper
            placement="top"
            speaker={<Tooltip>{patients[rowData.patientKey]?.patientMrn}</Tooltip>}
          >
            {patients[rowData.patientKey]?.fullName}
          </Whisper>
        )
      },
      {
        key: 'procedureId',
        dataKey: 'procedureId',
        title: <Translate>PROCEDURE ID</Translate>,
        flexGrow: 1,
        render: (rowData: any) => rowData.procedureId
      },
      {
        key: 'procedureName',
        dataKey: 'procedureName',
        title: <Translate>Procedure Name</Translate>,
        flexGrow: 1
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
        key: 'categoryKey',
        dataKey: 'categoryKey',
        title: <Translate>CATEGORY</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const category = CategoryLovQueryResponse?.object?.find(
            (item: any) => item.key === rowData.categoryKey
          );
          return category?.lovDisplayVale || ' ';
        }
      },
      {
        key: 'priorityLkey',
        dataKey: 'priorityLkey',
        title: <Translate>PRIORITY</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
      },
      {
        key: 'procedureLevelLkey',
        dataKey: 'procedureLevelLkey',
        title: <Translate>LEVEL</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData.procedureLevelLkey
            ? rowData.procedureLevelLvalue?.lovDisplayVale
            : rowData.procedureLevelLkey
      },
      {
        key: 'indications',
        dataKey: 'indications',
        title: <Translate>INDICATIONS</Translate>,
        flexGrow: 1
      },
      {
        key: 'statusLkey',
        dataKey: 'statusLkey',
        title: <Translate>STATUS</Translate>,
        flexGrow: 1,
        render: (rowData: any) => rowData.statusLvalue?.lovDisplayVale ?? null
      },
      {
        key: 'attachment',
        dataKey: 'attachment',
        title: <Translate>ATTACHED FILE</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const list = fetchPatintAttachmentsResponce?.object || [];
          const matchingAttachments = list.filter(
            (item: any) => item.referenceObjectKey === rowData.key
          );
          const lastAttachment = matchingAttachments?.[matchingAttachments.length - 1];
          return (
            <HStack spacing={2}>
              {lastAttachment && (
                <FaFileArrowDown
                  size={20}
                  onClick={() => handleDownload(lastAttachment)}
                  style={{ cursor: 'pointer' }}
                />
              )}
              <MdAttachFile
                size={20}
                onClick={() => setAttachmentsModalOpen(true)}
                style={{ cursor: 'pointer' }}
              />
            </HStack>
          );
        }
      },
      {
        key: 'perform',
        title: <Translate>PERFORM</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const isDisabled = rowData.currentDepartment;
          return (
            <HStack spacing={10}>
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Perform Details</Tooltip>}>
                <div>
                  <FaBedPulse
                    size={22}
                    fill={isDisabled ? '#ccc' : 'var(--primary-gray)'}
                    style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                    onClick={!isDisabled ? OpenPerformModel : undefined}
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
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={() => setOpenEMRModal(true)}
                >
                  <FontAwesomeIcon icon={faFileWaveform} />
                </MyButton>
              </div>
            </Whisper>
          </HStack>
        )
      },
      {
        key: 'facilityKey',
        dataKey: 'facilityKey',
        title: <Translate>FACILITY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) => (rowData.facilityKey ? rowData.facility?.facilityName : '')
      },
      {
        key: 'departmentTypeLkey',
        dataKey: 'departmentTypeLkey',
        title: <Translate>DEPARTMENT</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) =>
          rowData.departmentKey ? rowData.department?.departmentTypeLvalue?.lovDisplayVale : ''
      },
      {
        key: 'bodyPartLkey',
        dataKey: 'bodyPartLkey',
        title: <Translate>BODY PART</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) =>
          rowData.bodyPartLkey ? rowData.bodyPartLvalue?.lovDisplayVale : rowData.bodyPartLkey
      },
      {
        key: 'sideLkey',
        dataKey: 'sideLkey',
        title: <Translate>SIDE</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) =>
          rowData.sideLkey ? rowData.sideLvalue?.lovDisplayVale : rowData.sideLkey
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
        render: (rowData: any) => (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : ''}
            </span>
          </>
        )
      },
      {
        key: 'updatedMeta',
        title: <Translate>UPDATED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData.updatedBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.updatedAt ? formatDateWithoutSeconds(rowData.updatedAt) : ''}
            </span>
          </>
        )
      },
      {
        key: 'cancelledMeta',
        title: <Translate>CANCELLED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.deletedAt ? formatDateWithoutSeconds(rowData.deletedAt) : ''}
            </span>
          </>
        )
      },
      {
        key: 'cancellationReason',
        dataKey: 'cancellationReason',
        title: <Translate>CANCELLITON REASON</Translate>,
        flexGrow: 1,
        expandable: true
      }
    ],
    [CategoryLovQueryResponse, patients]
  );

  const pageIndex = (listRequest.pageNumber || 1) - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = procedures?.extraNumeric ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest(prev => ({ ...prev, pageNumber: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest(prev => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    }));
  };

  const contents = (
    <div className="advanced-filters">
      <Form fluid className="dissss">
        <MyInput
          fieldType="select"
          fieldName="Category"
          selectData={procedureCatStatusLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
          showLabel={false}
        />

        <MyInput
          fieldType="select"
          fieldName="Priority"
          selectData={procedurePrioStatusLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
          showLabel={false}
        />

        <MyInput
          fieldType="select"
          fieldName="Level"
          selectData={procedureLevelStatusLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
          showLabel={false}
        />
        <div className="indication-procedure-handle-position">
          <Icd10Search
            object={record}
            setOpject={setRecord}
            fieldName="indication"
            fieldLabel="Indication"
          />
        </div>
      </Form>
    </div>
  );

  const filters = () => (
    <>
      <Form fluid layout='inline' className='procedure-module-table-filters-handle-position'>
        <MyInput
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
          showLabel={false}
          column
        />
        <MyInput
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
          showLabel={false}
          column
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
          className="margin-21"
        />
        <MyInput
          fieldName="value"
          fieldType="text"
          record={record}
          setRecord={setRecord}
          showLabel={false}
          placeholder="Search"
          className="margin-21"
        />


        <SearchPatientCriteria record={record} setRecord={setRecord} searchMarginTop={0}/>

        <Checkbox style={{marginTop:'1.2vw'}} checked={!showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
          Show Cancelled
        </Checkbox>
      </Form>
      <AdvancedSearchFilters searchFilter={true} content={contents} />
    </>
  );

  return (
    <>
      <MyTable
        filters={filters()}
        columns={tableColumns}
        data={procedures?.object ?? []}
        onRowClick={(rowData: any) => {
          setProcedure(rowData);
        }}
        loading={procedureLoding}
        rowClassName={isSelected}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy: any, sortType: any) => {
          setListRequest(prev => ({ ...prev, sortBy, sortType }));
        }}
        page={pageIndex}
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
        content={
          <Perform
            proRefetch={proRefetch}
            encounter={encounter}
            patient={patient}
            procedure={procedure}
            setProcedure={setProcedure}
            edit={false}
          />
        }
      />

      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title="Electronic Medical Record"
        size="90vw"
        content={
          patient && encounter ? (
            <PatientEMRModal inModal patient={patient} encounter={encounter} />
          ) : (
            <div style={{ padding: 16 }}>No patient selected.</div>
          )
        }
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
        cancelButtonLabel="Cancel"
      />
    </>
  );
};

export default ProcedureModule;
