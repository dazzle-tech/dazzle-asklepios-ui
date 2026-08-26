import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditPointOfSaleConfiguration from './AddEditPointOfSaleConfiguration';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import HistoryIcon from '@mui/icons-material/History';
import {
  PointOfSaleConfigurationDTO,
  useCreatePointOfSaleConfigurationMutation,
  useGetPointOfSaleConfigurationsQuery,
  useUpdatePointOfSaleConfigurationMutation,
  useTogglePointOfSaleConfigurationActiveMutation
} from '@/services/point-of-sale/PointOfSaleConfigurationService';
import PointOfSaleConfigurationHistory from './PointOfSaleConfigurationHistory';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { isUndefined } from 'lodash';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const newConfiguration: Partial<PointOfSaleConfigurationDTO> = {
  name: '',
  clientId: '',
  terminalId: '',
  terminalSerialNo: '',
  terminalType: '',
  counterNumber: '',
  cashRegisterNo: '',
  isActive: true,
};

const PointOfSaleConfiguration = () => {
  const dispatch = useAppDispatch();

  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const [popupOpen, setPopupOpen] = useState(false);
  const [
    openHistoryModal,
    setOpenHistoryModal,
  ] = useState(false);

  const [
    selectedConfiguration,
    setSelectedConfiguration,
  ] = useState<PointOfSaleConfigurationDTO | null>(
    null
  );
  const [configuration, setConfiguration] =
    useState<Partial<PointOfSaleConfigurationDTO>>(
      newConfiguration
    );
  const [openConfirmModal, setOpenConfirmModal] =
    useState(false);

  const [actionType, setActionType] = useState<
    'deactivate' | 'reactivate'
  >('deactivate');
  const {
    data = [],
    isFetching,
    refetch,
  } = useGetPointOfSaleConfigurationsQuery();

  const [createConfiguration] =
    useCreatePointOfSaleConfigurationMutation();

  const [updateConfiguration] =
    useUpdatePointOfSaleConfigurationMutation();
  const [toggleActive] =
    useTogglePointOfSaleConfigurationActiveMutation();
  const handleNew = () => {
    setConfiguration(newConfiguration);
    setPopupOpen(true);
  };

  const handleSave = async () => {
    try {
      if (configuration.id) {
        await updateConfiguration(
          configuration as PointOfSaleConfigurationDTO
        ).unwrap();

        dispatch(
          notify({
            msg: 'POS configuration updated successfully',
            sev: 'success',
          })
        );
      } else {
        console.log("in create")
        await createConfiguration(
          configuration as any
        ).unwrap();

        dispatch(
          notify({
            msg: 'POS configuration created successfully',
            sev: 'success',
          })
        );
      }

      setPopupOpen(false);
      refetch();
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to save POS configuration',
          sev: 'error',
        })
      );
    }
  };
  const handleToggleActive = async (id: number) => {
    try {
      await toggleActive(id).unwrap();

      dispatch(
        notify({
          msg: 'Status toggled successfully',
          sev: 'success',
        })
      );

      setOpenConfirmModal(false);
      refetch();
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to update status',
          sev: 'error',
        })
      );

      setOpenConfirmModal(false);
    }
  };
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 3,
    },
    {
      key: 'clientId',
      title: <Translate>Client Id</Translate>,
      flexGrow: 3,
    },
    {
      key: 'terminalId',
      title: <Translate>Terminal Id</Translate>,
      flexGrow: 3,
    },
    {
      key: 'terminalSerialNo',
      title: <Translate>Serial No</Translate>,
      flexGrow: 3,
    },
    {
      key: 'counterNumber',
      title: <Translate>Counter</Translate>,
      flexGrow: 2,
    },
    {
      key: 'active',
      title: <Translate>Active</Translate>,
      flexGrow: 1,
      render: (rowData: any) =>
          <MyBadgeStatus
                contant={
                  rowData?.isActive
                    ? 'Yes'
                    : 'No'
                }
                color={
                  rowData?.isActive
                    ? '#0DAA41'
                    : '#D64545'
                }
              />
    },
    {
      key:'occupied',
      title: <Translate>occupied</Translate>,
      flexGrow: 1,
       render: (rowData: any) =>
         <MyBadgeStatus
                contant={
                  rowData?.occupied
                    ? 'Yes'
                    : 'No'
                }
                color={
                  rowData?.occupied
                    ? '#0DAA41'
                    : '#D64545'
                }
              />

    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: (rowData: PointOfSaleConfigurationDTO) => (
        <div className="container-of-icons">

          <MdModeEdit
            className="icons-style"
            size={22}
            title="Edit"
            onClick={() => {
              setConfiguration(rowData);
              setPopupOpen(true);
            }}
          />

          {rowData.isActive ? (
            <MdDelete
              title="Deactivate"
              size={22}
              fill="var(--primary-pink)"
              className="icons-style"
              onClick={() => {
                setConfiguration(rowData);
                setActionType('deactivate');
                setOpenConfirmModal(true);
              }}
            />
          ) : (
            <FaUndo
              title="Activate"
              size={20}
              fill="var(--primary-gray)"
              className="icons-style"
              onClick={() => {
                setConfiguration(rowData);
                setActionType('reactivate');
                setOpenConfirmModal(true);
              }}
            />
          )}

          <HistoryIcon
            className="icons-style"
            fontSize="small"
            titleAccess="History"
            onClick={() => {
              setSelectedConfiguration(rowData);
              setOpenHistoryModal(true);
            }}
          />

        </div>
      ),
    },
  ];

  useEffect(() => {
    dispatch(setPageCode('PointOfSaleConfiguration'));
    dispatch(setDivContent('Point Of Sale Configuration'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, []);

  useEffect(() => {
    const handleResize = () =>
      setWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () =>
      window.removeEventListener(
        'resize',
        handleResize
      );
  }, []);

  const direction =
    localStorage.getItem('direction') || 'LTR';

  const isRTL = direction === 'RTL';

  return (
    <Panel dir={isRTL ? 'rtl' : 'ltr'}>
      <MyTable
        height={500}
        data={data}
        loading={isFetching}
        columns={tableColumns}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="120px"
            >
              Add Device
            </MyButton>
          </div>
        }
      />

      <AddEditPointOfSaleConfiguration
        open={popupOpen}
        setOpen={setPopupOpen}
        configuration={configuration}
        setConfiguration={setConfiguration}
        handleSave={handleSave}
      />
      <PointOfSaleConfigurationHistory
        open={openHistoryModal}
        setOpen={setOpenHistoryModal}
        configuration={selectedConfiguration}

      />
      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete="POS Configuration"
        actionButtonFunction={() =>
          handleToggleActive(configuration.id!)
        }
        actionType={actionType}
      />
    </Panel>
  );
};

export default PointOfSaleConfiguration;