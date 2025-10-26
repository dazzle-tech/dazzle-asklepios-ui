import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import {
  useGetOperationRequestsListQuery,
  useSaveOperationRequestsMutation
} from '@/services/operationService';
import {
  newApEncounter,
  newApOperationRequests,
  newApPatient
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import React, { useEffect, useState } from 'react';
import { Badge, Checkbox, Form, HStack, Tooltip, Whisper } from 'rsuite';
import PatientSide from '../encounter/encounter-main-info-section/PatienSide';
import { FaPrint, FaSun } from 'react-icons/fa6';

import RecoveryRoomFunctionalities from './RecoveryRoomFunctionalities';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import StartedDetails from '../operation-module/StartedDetails/StartedDetails';
import { useGetEncounterByIdQuery } from '@/services/encounterService';
import { useGetPatientByIdQuery } from '@/services/patientService';
const Recovery = () => {
  const [openRecoveryRoomFunctionalities, setOpenRecoveryRoomFunctionalities] =
    useState<boolean>(false);
    const [open,setOpen]=useState(false)
  const [request, setRequest] = useState<any>({ ...newApOperationRequests });
  const { data: patientData } = useGetPatientByIdQuery(request?.patientKey, { skip: !request?.patientKey });
  console.log("Patient Data",patientData)
  const [patient, setPatient] = useState({ ...newApPatient });
  console.log("patient",patient)
  const { data: encounterData, isLoading: isEncounterLoading } = useGetEncounterByIdQuery(request.encounterKey, { skip: !request.encounterKey });
  console.log("Encounter Data",encounterData)
  const [encounter, setEncounter] = useState({ ...newApEncounter });
  console.log("Encounter",encounter)
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: null
  });
 
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


  useEffect(()=>{
    if(encounterData){
      setEncounter(encounterData)
    }
  },[encounterData]);
  useEffect(()=>{
    if(patientData){
      setPatient(patientData)
    }
  },[patientData])
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
        return rowData?.diagnosis?.icdCode + " - " + rowData?.diagnosis?.description;
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
              <FaSun
                onClick={() => setOpenRecoveryRoomFunctionalities(true)}
                style={{
                  fontSize: '1em',
                  marginRight: 10
                }}
              />
            </Whisper>
            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Print Report</Tooltip>}>
              <FaPrint
                style={{
                  fontSize: '1em',
                  marginRight: 10
                }}
              />
            </Whisper>
            <Whisper
              placement="top"
              trigger="hover"
              speaker={<Tooltip>{"View"}</Tooltip>}
            >
              <FontAwesomeIcon icon={faEye}
                onClick={() => setOpen(true)}
              // style={isDisabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}

              />
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

  const filters = () => (<>
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
      <Checkbox>Show Moved to bedd</Checkbox>
    </Form>

          <AdvancedSearchFilters searchFilter={true}/>

  </>);
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
        content={<RecoveryRoomFunctionalities encounter={encounter} patient={patient} operation={request} />}
      ></MyModal>
      <StartedDetails open={open} setOpen={setOpen} 
      operation={request} setOperation={setRequest} 
      patient={patient}encounter={encounter} refetch={refetch} editable={false}/>
    </div>
  );
};
export default Recovery;
