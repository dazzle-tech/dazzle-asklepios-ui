import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetContinuousVitalsByOperationQuery,
  useSaveContinuousVitalsMutation
} from '@/services/RecoveryService';
import { newApOperationRecoveryVitalsMonitoring } from '@/types/model-types-constructor';
import { formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import AddIcon from '@mui/icons-material/Add';
import React, { useEffect, useState } from 'react';
import { ImCancelCircle } from 'react-icons/im';
import { MdModeEdit } from 'react-icons/md';
import { Text } from 'rsuite';
import AddEditPopup from './oepnAddEditPopup';
const ContinuousVitalsMonitoring = ({ operation }) => {
  const dispatch = useAppDispatch();

  const [vitals, setVitals] = useState({ ...newApOperationRecoveryVitalsMonitoring });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openAddNewPopup, setOpenAddNewPopup] = useState<boolean>(false);
  const [popupCancelOpen, setPopupCancelOpen] = useState<boolean>(false);
  const { data: vitalsData, refetch } = useGetContinuousVitalsByOperationQuery(operation?.key, {
    skip: !operation?.key
  });

  // Mutation hook to save continuous vitals
  const [save] = useSaveContinuousVitalsMutation();
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && vitals && rowData.key === vitals.key) {
      return 'selected-row';
    } else return '';
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCancle = async () => {
    try {
      await save({ ...vitals, isValid: false }).unwrap();
      setPopupCancelOpen(false);
      refetch();
      dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));
    } catch (error) {
      console.error('Failed to save observation:', error);
      dispatch(notify({ msg: 'Failed to save', sev: 'error' }));
    }
  };
  // Icons column for
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={20}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => setOpenAddNewPopup(true)}
      />
      <ImCancelCircle
        title="Cancel"
        size={18}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => setPopupCancelOpen(true)}
      />
    </div>
  );

  // Table Columns
  const tableColumns = [
    {
      key: 'time',
      title: <Translate>Time</Translate>,
      render: (rowData: any) => {
        return rowData?.createdAt ? formatDateWithoutSeconds(rowData?.createdAt) : '--';
      }
    },
    {
      key: 'latestbpSystolic',
      title: <Translate>BP</Translate>,
      render: (rowData: any) =>
        rowData.bloodPressureSystolic && rowData.bloodPressureDiastolic
          ? `${rowData?.bloodPressureSystolic}/${rowData?.bloodPressureDiastolic} mmHg`
          : ''
    },

    {
      key: 'latestrespiratoryrate',
      title: <Translate>Pulse</Translate>,
      render: (rowData: any) => (rowData?.heartRate ? `${rowData?.heartRate} bpm` : ' ')
    },
    {
      key: 'latestoxygensaturation',
      title: <Translate>SpO2</Translate>,
      render: (rowData: any) => (rowData?.oxygenSaturation ? `${rowData?.oxygenSaturation} %` : ' ')
    },
    {
      key: 'latesttemperature',
      title: <Translate>Temp</Translate>,
      render: (rowData: any) => (rowData?.temperature ? `${rowData?.temperature} °C` : ' ')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionContainer
        title={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <div className="title-div">
              <Text>Continuous Vitals Monitoring</Text>
            </div>
            <div className="container-of-add-new-button-2">
              <MyButton
                prefixIcon={() => <AddIcon />}
                color="var(--deep-blue)"
                width="90px"
                onClick={() => {
                  setOpenAddNewPopup(true);
                  setVitals({ ...newApOperationRecoveryVitalsMonitoring });
                }}
              >
                Add
              </MyButton>
            </div>
          </div>
        }
        content={
          <MyTable
            data={vitalsData?.object || []}
            columns={tableColumns}
            onRowClick={rowData => {
              setVitals({ ...rowData });
            }}
            rowClassName={rowData => isSelected(rowData)}
          />
        }
      />

      <AddEditPopup
        open={openAddNewPopup}
        setOpen={setOpenAddNewPopup}
        observation={vitals}
        setObservation={setVitals}
        operation={operation}
        refetch={refetch}
        width={width}
      />
      <DeletionConfirmationModal
        actionType="delete"
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        itemToDelete="observation"
        actionButtonFunction={handleCancle}
      />
      <br />
    </div>
  );
};
export default ContinuousVitalsMonitoring;
