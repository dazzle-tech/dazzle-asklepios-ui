import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import { Drawer, Tooltip, Form, Whisper } from 'rsuite';
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
import { ApPatient } from '@/types/model-types';
import { newApPatient } from '@/types/model-types-constructor';

const PatientVisitHistoryTable = ({
  visitHistoryModel,
  setVisitHistoryModel,
  quickAppointmentModel,
  setQuickAppointmentModel,
  localPatient
}) => {
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [open, setOpen] = useState(false);
  const [openDischargeModal, setOpenDischargeModal] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    console.log("patient: " + localPatient.key + " " + localPatient.fullName);
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
  // Query for encounter list
  const {
    data: visiterHistoryResponse,
    refetch: refetchEncounter,
    isFetching
  } = useGetEncountersQuery(visitHistoryListRequest);

  useEffect(() => {
    refetchEncounter();
  }, [visitHistoryListRequest]);
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
      console.error('Encounter completion error:', error);
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
      console.error('Encounter completion error:', error);
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
      render: (rowData: any) =>
        rowData?.resourceTypeLkey === '2039534205961578'
          ? rowData?.departmentName
          : rowData.resourceObject?.name
    },
    {
      key: 'encountertype',
      title: <Translate>Encounter Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.resourceObject?.departmentTypeLkey
          ? rowData.resourceObject?.departmentTypeLvalue?.lovDisplayVale
          : rowData.resourceObject?.departmentTypeLkey
    },
    {
      key: 'physician',
      title: <Translate>Physician</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData?.resourceTypeLkey === '2039534205961578'
          ? rowData?.resourceObject?.practitionerFullName
          : ''
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
    }
  ];
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
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default PatientVisitHistoryTable;
