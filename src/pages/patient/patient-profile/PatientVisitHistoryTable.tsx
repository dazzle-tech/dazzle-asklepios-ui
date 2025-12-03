import Translate from '@/components/Translate';
import React, { useEffect, useState, useMemo } from 'react';
import { Tooltip, Form, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import {
  useGetEncountersQuery,
  useCancelEncounterMutation,
  useCompleteEncounterMutation
} from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import MyTable from '@/components/MyTable';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import EncounterDischarge from '@/pages/encounter/encounter-component/encounter-discharge';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAllResourcesQuery } from '@/services/setup/resource/ResourceService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';

const PatientVisitHistoryTable = ({
  quickAppointmentModel,
  setQuickAppointmentModel,
  localPatient
}) => {
   const dispatch = useDispatch();
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [open, setOpen] = useState(false);
  const [openDischargeModal, setOpenDischargeModal] = useState(false);
  // Request object for encounter list API
  const [visitHistoryListRequest, setVisitHistoryListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'plannedStartDate',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient.key || undefined
      }
    ],
    pageSize: 15
  });

  // Mutations for encounter actions
  const [cancelEncounter] = useCancelEncounterMutation();
  const [completeEncounter] = useCompleteEncounterMutation();
  // Fetch visit history list response
  const {
    data: visiterHistoryResponse,
    refetch: refetchEncounter,
    isFetching
  } = useGetEncountersQuery(visitHistoryListRequest, {
    refetchOnMountOrArgChange: true, // Refetch when component mounts or arguments change
    refetchOnFocus: true // Refetch when window regains focus
  });

  // Fetch all departments for lookup
  const { data: allDepartments } = useGetAllDepartmentsWithoutPaginationQuery({});

  // Fetch all practitioners for lookup
  const { data: practitionersResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 1000, // Fetch a large number to get all practitioners
    sort: 'id,asc'
  });

  // Fetch all resources for lookup
  const { data: resourcesResponse } = useGetAllResourcesQuery({
    page: 0,
    size: 1000, // Fetch a large number to get all resources
    sort: 'id,asc'
  });

  // Fetch all diagnostic tests for lookup
  const { data: diagnosticTestsResponse } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 1000, // Fetch a large number to get all diagnostic tests
    sort: 'id,asc'
  });

  // Create a department lookup map by key
  const departmentMap = useMemo(() => {
    if (!allDepartments) return {};
    const map = {};
    allDepartments.forEach(dept => {
      if (dept.key) map[dept.key] = dept;
      if (dept.id) map[dept.id] = dept;
    });
    return map;
  }, [allDepartments]);

  // Create a practitioner lookup map by key
  const practitionerMap = useMemo(() => {
    if (!practitionersResponse?.data) return {};
    const map = {};
    practitionersResponse.data.forEach(practitioner => {
      if (practitioner.key) map[practitioner.key] = practitioner;
      if (practitioner.id) map[practitioner.id] = practitioner;
    });
    return map;
  }, [practitionersResponse]);

  // Create a resource lookup map by key
  const resourceMap = useMemo(() => {
    if (!resourcesResponse?.data) return {};
    const map = {};
    resourcesResponse.data.forEach(resource => {
      if (resource.key) map[resource.key] = resource;
      if (resource.id) map[resource.id] = resource;
    });
    return map;
  }, [resourcesResponse]);

  // Create a diagnostic test lookup map by key
  const diagnosticTestMap = useMemo(() => {
    if (!diagnosticTestsResponse?.data) return {};
    const map = {};
    diagnosticTestsResponse.data.forEach(test => {
      if (test.key) map[test.key] = test;
      if (test.id) map[test.id] = test;
    });
    return map;
  }, [diagnosticTestsResponse]);

 
  // Cancel encounter handler
  const handleCancelEncounter = async () => {
    try {
      if (selectedVisit) {
        await cancelEncounter(selectedVisit).unwrap();
        refetchEncounter();
        dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
        setOpen(false);
      }
    } catch (error) {
      dispatch(notify({ msg: 'An error occurred while canceling the encounter', sev: 'error' }));
    }
  };

  // Complete encounter handler
  const handleCompleteEncounter = async () => {
    try {
      if (selectedVisit) {
        await completeEncounter(selectedVisit).unwrap();
        refetchEncounter();
        dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
      }
    } catch (error) {
      dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
    }
  };
  // Table columns definition
  const tableColumns = [
    {
      key: 'visitId',
      title: <Translate>key</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <a
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSelectedVisit(rowData);
            setQuickAppointmentModel(true);
          }}
        >
          {rowData.visitId}
        </a>
      )
    },
    {
      key: 'plannedStartDate',
      title: <Translate>Date</Translate>,
      flexGrow: 4,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'departmentName',
      title: <Translate>Department</Translate>,
      flexGrow: 4,
      dataKey: 'departmentName',
      render: (rowData: any) => {
        // Try to get department from the map using department_key or resource_key
        const departmentKey = rowData?.departmentKey ;
        const department = departmentKey ? departmentMap[departmentKey] : null;
        
        if (department) {
          return department.name;
        }
        
        // Fallback to original logic if department not found in map
        return rowData?.resourceTypeLkey === '2039534205961578' || 'PRACTITIONER'
          ? rowData?.departmentName
          : rowData.resourceObject?.name;
      }
    },
    {
      key: 'encountertype',
      title: <Translate>Encounter Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        // Try to get department from the map using department_key or resource_key
        const departmentKey = rowData?.departmentKey;
        const department = departmentKey ? departmentMap[departmentKey] : null;
        
        if (department?.encounterType) {
          return formatEnumString(department.encounterType);
        }
        
        // Fallback to original logic if department not found in map
        return rowData.resourceObject?.departmentTypeLkey
          ? rowData.resourceObject?.departmentTypeLvalue?.lovDisplayVale
          : rowData.resourceObject?.departmentTypeLkey;
      }
    },
    {
      key: 'physician',
      title: <Translate>Physician</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        // Get resource from resource map
        const resourceKey = rowData?.resourceKey || rowData?.resource_key;
        const resource = resourceKey ? resourceMap[resourceKey] : null;
        
        if (!resource) {
          // Fallback to original logic if resource not found
          return rowData?.resourceObject?.practitionerFullName || 
                 rowData?.resourceObject?.name || '';
        }
        
        // Get resource type
        const resourceType = resource.resourceType || resource.resourceTypeLkey || resource.resourceTypeLvalue?.valueCode;
        
        // Based on resource type, look up the appropriate name
        if (resourceType === 'PRACTITIONER' || resourceType === '2039534205961578') {
          // Look up practitioner
          const practitionerKey = resource.practitionerKey || resource.practitioner_key;
          const practitioner = practitionerKey ? practitionerMap[practitionerKey] : null;
          
          if (practitioner) {
            return practitioner.practitionerFullName || 
                   `${practitioner.firstName || ''} ${practitioner.lastName || ''}`.trim();
          }
          return resource.name || '';
        } 
        else if (['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(resourceType)) {
          // Look up department
          const departmentKey = resource.departmentKey || resource.department_key;
          const department = departmentKey ? departmentMap[departmentKey] : null;
          
          if (department) {
            return department.name || department.departmentName;
          }
          return resource.resourceKey || '';
        }
        else if (['MEDICAL_TEST'].includes(resourceType)) {
          // Look up diagnostic test
          const diagnosticTestKey = resource.diagnosticTestKey || resource.diagnostic_test_key;
          const diagnosticTest = diagnosticTestKey ? diagnosticTestMap[diagnosticTestKey] : null;
          
          if (diagnosticTest) {
            return diagnosticTest.name || diagnosticTest.testName;
          }
          return resource.resourceKey || '';
        }
        
        // Default: return resource name
        return resource.resourceKey || '';
      }
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.encounterPriorityLvalue
          ? rowData.encounterPriorityLvalue.lovDisplayVale
          : rowData.encounterPriorityLkey
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.encounterStatusLvalue
          ? rowData.encounterStatusLvalue.lovDisplayVale
          : rowData.encounterStatusLkey
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: rowData => {
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        const tooltipComplete = <Tooltip>Complete Visit</Tooltip>;
        const tooltipDischarge = <Tooltip>Discharge Visit</Tooltip>;
        const dischargeResources = ['BRT_INPATIENT', 'BRT_DAYCASE', 'BRT_PROC', 'BRT_EMERGENCY'];
        const isDischargeResource = dischargeResources.includes(
          rowData?.resourceTypeLvalue?.valueCode
        );

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {rowData?.encounterStatusLvalue?.valueCode === 'NEW' && (
              <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                <div>
                  <MyButton
                    size="small"
                    appearance="subtle"
                    onClick={() => {
                      setSelectedVisit(rowData);
                      setOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faRectangleXmark} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            {rowData?.encounterStatusLvalue?.valueCode === 'ONGOING' && (
              <Whisper
                trigger="hover"
                placement="top"
                speaker={isDischargeResource ? tooltipDischarge : tooltipComplete}
              >
                <div>
                  <MyButton
                    size="small"
                    appearance="subtle"
                    onClick={() => {
                      if (isDischargeResource) {
                        setSelectedVisit(rowData);
                        setOpenDischargeModal(true);
                      } else {
                        setSelectedVisit(rowData);
                        handleCompleteEncounter();
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faPowerOff} />
                  </MyButton>
                </div>
              </Whisper>
            )}
          </Form>
        );
      }
    },

    {
      key: 'visitTypeLvalue',
      title: <Translate>Visit Type</Translate>,
      expandable: true,
      render: (rowData: any) => <span>{rowData?.visitTypeLvalue?.lovDisplayVale}</span>
    },
    {
      key: 'CreatedByAt',
      title: <Translate>Created By\At</Translate>,
      expandable: true,
      render: (rowData: any) =>
        rowData?.createdAt ? (
          <>
            {rowData?.createdBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.createdAt)}
            </span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'cancelledByAt',
      title: <Translate>Cancelled By\At</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.deletedAt)}</span>
          </>
        );
      }
    },
    {
      key: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true
    },
    {
      key: 'dischargedByAt',
      title: <Translate>Discharged By\At</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.discharge}</span>
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.dischargeAt)}
            </span>
          </>
        );
      }
    }
  ];

  // Effects
  useEffect(() => {
    setVisitHistoryListRequest({
      ...initialListRequest,
      sortBy: 'plannedStartDate',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient.key || undefined
        }
      ]
    });
  }, [localPatient]);

  return (
    <>
      <MyTable
        data={visiterHistoryResponse?.object ?? []}
        columns={tableColumns}
        height={580}
        loading={isFetching}
      />
      <DeletionConfirmationModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={handleCancelEncounter}
        actionType="Deactivate"
        confirmationQuestion="Do you want to cancel this Encounter ?"
        actionButtonLabel="Cancel"
        cancelButtonLabel="Close"
      />
      <EncounterDischarge
        open={openDischargeModal}
        setOpen={setOpenDischargeModal}
        encounter={selectedVisit}
      />
      {quickAppointmentModel ? (
        <PatientQuickAppointment
          quickAppointmentModel={quickAppointmentModel}
          localPatient={localPatient}
          setQuickAppointmentModel={setQuickAppointmentModel}
          localVisit={selectedVisit}
          isDisabeld={true}
          onEncounterSaved={refetchEncounter}
        />
      ) : (
        <></>
      )}
      
    </>
  );
};

export default PatientVisitHistoryTable;

