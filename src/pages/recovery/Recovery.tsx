import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetOperationRequestsListQuery } from '@/services/operationService';
import {
  newApEncounter,
  newApOperationRequests,
  newApPatient
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import React, { useEffect, useState } from 'react';
import { FaPrint, FaSun } from 'react-icons/fa6';
import { Badge, Checkbox, Col, Form, HStack, Row, Tooltip, Whisper } from 'rsuite';
import PatientSide from '../encounter/encounter-main-info-section/PatienSide';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useGetEncounterByIdQuery } from '@/services/encounterService';
import { useGetPatientByIdQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { formatDate } from '@/utils';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import StartedDetails from '../operation-module/StartedDetails/StartedDetails';
import RecoveryRoomFunctionalities from './RecoveryRoomFunctionalities';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import './styles.less';
import { useAppDispatch } from '@/hooks';

const Recovery = () => {
  const [openRecoveryRoomFunctionalities, setOpenRecoveryRoomFunctionalities] =
    useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<any>({ ...newApOperationRequests });
  const [encounterStatus, setEncounterStatus] = useState<{ key: string }>({ key: '' });
  const [record, setRecord] = useState<any>({});
  const [manualSearchTriggered, setManualSearchTriggered] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const divContent = 'Recovery';
    dispatch(setPageCode('Recovery'));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);
  const [diagnosisObject, setDiagnosisObject] = useState<any>(null);

  const { data: patientData } = useGetPatientByIdQuery(request?.patientKey, {
    skip: !request?.patientKey
  });
  console.log('Patient Data', patientData);
  const [patient, setPatient] = useState({ ...newApPatient });
  console.log('patient', patient);
  const { data: encounterData, isLoading: isEncounterLoading } = useGetEncounterByIdQuery(
    request.encounterKey,
    { skip: !request.encounterKey }
  );
  console.log('Encounter Data', encounterData);
  const [encounter, setEncounter] = useState({ ...newApEncounter });
  console.log('Encounter', encounter);
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: null
  });
  // lovs
  const { data: bookVisitLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
  const { data: EncPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: procStatusLov } = useGetLovValuesByCodeQuery('PROC_STATUS');
  const { data: opTypeLov } = useGetLovValuesByCodeQuery('OPERATION_ORDER_TYPE');
  const { data: opLevelLov } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: orderPriorityLov } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: definedOperationsLov } = useGetLovValuesByCodeQuery('DEFINED_OPERATIONS');

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,

    filters: [
      {
        fieldName: 'operation_status_lkey',
        operator: 'match',
        value: '3621707345048408'
      }
    ]
  });

  const isSelected = rowData => {
    if (rowData && request && rowData.key === request.key) {
      return 'selected-row';
    } else return '';
  };

  //operation Api's
  const {
    data: operationrequestList,
    refetch,
    isLoading
  } = useGetOperationRequestsListQuery(listRequest);

  useEffect(() => {
    if (encounterData) {
      setEncounter(encounterData);
    }
  }, [encounterData]);

  useEffect(() => {
    if (patientData) {
      setPatient(patientData);
    }
  }, [patientData]);

  useEffect(() => {
    let updatedFilters = [...listRequest.filters];

    if (dateFilter.fromDate && dateFilter.toDate) {
      dateFilter.fromDate.setHours(0, 0, 0, 0);
      dateFilter.toDate.setHours(23, 59, 59, 999);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'created_at',
        operator: 'between',
        value: dateFilter.fromDate.getTime() + '-' + dateFilter.toDate.getTime()
      });
    } else if (dateFilter.fromDate) {
      dateFilter.fromDate.setHours(0, 0, 0, 0);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'created_at',
        operator: 'gte',
        value: dateFilter.fromDate.getTime()
      });
    } else if (dateFilter.toDate) {
      dateFilter.toDate.setHours(23, 59, 59, 999);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'created_at',
        operator: 'lte',
        value: dateFilter.toDate.getTime()
      });
    }

    setListRequest(prev => ({
      ...prev,
      filters: updatedFilters
    }));
  }, [dateFilter]);

  //table
  const columns = [
    {
      key: 'patientname',
      title: <Translate>Patient Name</Translate>,
      render: (rowData: any) => {
        const tooltipSpeaker = (
          <Tooltip>
            <div>MRN : {rowData?.patient?.patientMrn}</div>

            <div>
              Gender :{' '}
              {rowData?.patient?.genderLvalue
                ? rowData?.patient?.genderLvalue?.lovDisplayVale
                : rowData?.patient?.genderLkey}
            </div>
            <div>Visit ID : {rowData?.encounter?.visitId}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div style={{ display: 'inline-block' }}>
              {rowData?.patient?.privatePatient ? (
                <Badge color="blue" content="Private">
                  <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                    {rowData?.patient?.fullName}
                  </p>
                </Badge>
              ) : (
                <>
                  <p style={{ cursor: 'pointer' }}>{rowData?.patient?.fullName}</p>
                </>
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'diagnosisKey',
      title: <Translate>Pre-op Diagnosis</Translate>,
      render: (rowData: any) => {
        return rowData?.diagnosis?.icdCode + ' - ' + rowData?.diagnosis?.description;
      }
    },
    {
      key: 'oparetionKey',
      title: <Translate>oparation name</Translate>,
      render: (rowData: any) => {
        return rowData?.operation?.name;
      }
    },
    {
      key: 'operationTypeLkey',
      title: <Translate>operation type</Translate>,
      render: (rowData: any) => {
        return rowData.operationTypeLvalue
          ? rowData.operationTypeLvalue.lovDisplayVale
          : rowData.operationTypeLkey;
      }
    },
    {
      key: 'operationLevelLkey',
      title: <Translate>Operation Level</Translate>,
      render: (rowData: any) => {
        return rowData.operationLevelLvalue
          ? rowData.operationLevelLvalue.lovDisplayVale
          : rowData.operationLevelLkey;
      }
    },
    {
      key: 'operationDateTime',
      title: <Translate>Operation Date/Time</Translate>,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData?.operationDateTime);
      }
    },
    {
      key: 'priorityLkey',
      title: <Translate>Priority</Translate>,
      render: (rowData: any) => {
        return rowData.priorityLvalue
          ? rowData.priorityLvalue?.lovDisplayVale
          : rowData.priorityLkey;
      }
    },
    {
      key: 'recoveryStatusLkey',
      title: <Translate>Status</Translate>,
      render: (rowData: any) => {
        return rowData?.recoveryLvalue
          ? rowData?.recoveryLvalue.lovDisplayVale
          : rowData?.recoveryLkey || '';
      }
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (rowData: any) => {
        return (
          <HStack spacing={10}>
            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Recovery</Tooltip>}>
              <MyButton
                prefixIcon={() => (
                  <FaSun
                    onClick={() => setOpenRecoveryRoomFunctionalities(true)}
                    style={{
                      fontSize: '1em'
                    }}
                  />
                )}
              ></MyButton>
            </Whisper>

            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Print Report</Tooltip>}>
              <MyButton
                backgroundColor="var(--light-blue)"
                prefixIcon={() => (
                  <FaPrint
                    style={{
                      fontSize: '1em'
                    }}
                  />
                )}
              ></MyButton>
            </Whisper>

            <Whisper placement="top" trigger="hover" speaker={<Tooltip>{'View'}</Tooltip>}>
              <MyButton
                backgroundColor="var(--black)"
                prefixIcon={() => (
                  <FontAwesomeIcon
                    icon={faEye}
                    onClick={() => setOpen(true)}
                    style={{
                      fontSize: '1em'
                    }}
                  />
                )}
              ></MyButton>
            </Whisper>
          </HStack>
        );
      }
    },

    {
      key: '',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.createdAt)}</span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Submited At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.submitedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.submitedAt)}</span>
          </>
        );
      }
    },

    {
      key: '',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy} </span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.deletedAt)}</span>
          </>
        );
      }
    }
  ];

  const addOrUpdateFilter = (filters, newFilter) => {
    const index = filters.findIndex(f => f.fieldName === newFilter.fieldName);
    if (index > -1) {
      // Replace the existing filter
      return filters.map((f, i) => (i === index ? newFilter : f));
    } else {
      // Add new filter
      return [...filters, newFilter];
    }
  };

  const handleClearFilters = () => {
    const today = new Date();
    setRecord({});
    setEncounterStatus({ key: '' });
    setDiagnosisObject(null); // Clear diagnosis

    setDateFilter({
      fromDate: today,
      toDate: today
    });

    const formattedToday = formatDate(today);

    setListRequest({
      ...initialListRequest,
      pageNumber: 1,
      pageSize: listRequest.pageSize,
      ignore: true,
      filters: [
        {
          fieldName: 'planned_start_date',
          operator: 'between',
          value: `${formattedToday}_${formattedToday}`
        }
      ]
    });

    setManualSearchTriggered(true);
  };
  const filters = () => (
    <>
      <Form layout="inline" fluid className="container-of-filter-fields-department">
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
        <Checkbox>Show Moved to bed</Checkbox>

        <Form fluid className="container-of-filter-fields-department">
          <MyInput
            width={220}
            fieldName="operationKey"
            fieldType="select"
            record={record}
            setRecord={setRecord}
            selectData={definedOperationsLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            placeholder="Operation Name"
            fieldLabel="Operation Name"
            searchable
          />

          <MyInput
            width={180}
            fieldName="recoveryStatusLkey"
            fieldType="select"
            record={record}
            setRecord={setRecord}
            selectData={procStatusLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            placeholder="Status"
            fieldLabel="Status"
            searchable={false}
            className="margin-bottom-24"
          />
        </Form>
      </Form>

      <AdvancedSearchFilters
        searchFilter={true}
        clearOnClick={handleClearFilters}
        content={
          <div className="advanced-filters">
            <Form key={JSON.stringify(record)} fluid className="dissss">
              {/* Pre-op Diagnosis: ICD-10 component */}
              <Row>
                <Col md={24}>
                  <div
                    className="container-ofiicd10-search-discharge-planning"
                    style={{ marginTop: '5px', width: '300px' }}
                  >
                    <Icd10Search
                      object={diagnosisObject}
                      setOpject={setDiagnosisObject}
                      fieldName="Pre-op Diagnosis"
                    />
                  </div>
                </Col>
              </Row>

              {/* Operation Type: OPERATION_ORDER_TYPE */}
              <MyInput
                width={190}
                fieldName="operationTypeLkey"
                fieldType="select"
                record={record}
                setRecord={setRecord}
                selectData={opTypeLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                placeholder="Operation Type"
                fieldLabel="Operation Type"
                searchable={false}
              />

              {/* Operation Level: PROCEDURE_LEVEL */}
              <MyInput
                width={190}
                fieldName="operationLevelLkey"
                fieldType="select"
                record={record}
                setRecord={setRecord}
                selectData={opLevelLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                placeholder="Operation Level"
                fieldLabel="Operation Level"
                searchable={false}
              />

              {/* Operation Date: Date picker */}
              <MyInput
                width={190}
                fieldName="operationDate"
                fieldType="date"
                record={record}
                setRecord={setRecord}
                fieldLabel="Operation Date"
              />

              {/* Priority (orders): ORDER_PRIORITY */}
              <MyInput
                width={190}
                fieldName="orderPriorityLkey"
                fieldType="select"
                record={record}
                setRecord={setRecord}
                selectData={orderPriorityLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                placeholder="Order Priority"
                fieldLabel="Order Priority"
                searchable={false}
              />
            </Form>
          </div>
        }
      />
    </>
  );

  return (
    <div className="container">
      <div className="left-box">
        <MyTable
          filters={filters()}
          columns={columns}
          data={operationrequestList?.object || []}
          rowClassName={isSelected}
          loading={isLoading}
          onRowClick={rowData => {
            setRequest(rowData);
          }}
        />
      </div>
      <div className="right-box">
        <PatientSide patient={patient} encounter={encounter} />
      </div>
      <MyModal
        open={openRecoveryRoomFunctionalities}
        setOpen={setOpenRecoveryRoomFunctionalities}
        title="Recovery Room Functionalities"
        hideActionBtn
        size="full"
        content={
          <RecoveryRoomFunctionalities
            encounter={encounter}
            patient={patient}
            operation={request}
          />
        }
      ></MyModal>
      <StartedDetails
        open={open}
        setOpen={setOpen}
        operation={request}
        setOperation={setRequest}
        patient={patient}
        encounter={encounter}
        refetch={refetch}
        editable={false}
      />
    </div>
  );
};
export default Recovery;
