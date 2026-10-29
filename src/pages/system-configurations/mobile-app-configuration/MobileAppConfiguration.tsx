import React, { useEffect, useMemo, useState } from 'react';
import { Form, Loader, Modal, Panel, Whisper, Tooltip } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete, MdModeEdit, MdNotificationsActive } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useDeleteMobileAppConfigMutation,
  useGetAllMobileAppConfigsQuery,
  useNotifyPortalPatientsToUpdateAppMutation,
} from '@/services/system-configurations/mobileAppConfigService';
import {
  MobileAppConfigResponseVM,
  PortalAppUpdateNotificationVM,
} from '@/types/model-types-new';
import { newMobileAppConfigResponseVM } from '@/types/model-types-constructor-new';
import AddEditMobileAppConfig from './AddEditMobileAppConfig';
import './styles.less';

const MobileAppConfiguration = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmNotifyOpen, setConfirmNotifyOpen] = useState(false);
  const [notifyResultOpen, setNotifyResultOpen] = useState(false);
  const [notifyResult, setNotifyResult] = useState<PortalAppUpdateNotificationVM | null>(null);
  const [selected, setSelected] = useState<MobileAppConfigResponseVM>({
    ...newMobileAppConfigResponseVM,
  });
  const [filtersState, setFiltersState] = useState({ configKey: '' });

  const { data, isFetching, refetch } = useGetAllMobileAppConfigsQuery();
  const [deleteConfig] = useDeleteMobileAppConfigMutation();
  const [notifyPortalPatientsToUpdateApp, { isLoading: isNotifying }] =
    useNotifyPortalPatientsToUpdateAppMutation();
  const enumOptions = useEnumOptions('MobileAppConfigKey');

  useEffect(() => {
    dispatch(setPageCode('MOBILE_APP_CONFIG'));
    dispatch(setDivContent('Mobile App Configuration'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const rows = useMemo(() => {
    const list = data ?? [];
    if (!filtersState.configKey) return list;
    return list.filter(row => row.configKey === filtersState.configKey);
  }, [data, filtersState.configKey]);

  const isSelected = (rowData: MobileAppConfigResponseVM) =>
    rowData && selected && rowData.id === selected.id ? 'selected-row' : '';

  const handleNew = () => {
    setSelected({ ...newMobileAppConfigResponseVM });
    setPopupOpen(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteConfig(selected.id).unwrap();
      dispatch(notify({ msg: 'The configuration was successfully deleted', sev: 'success' }));
      setConfirmDeleteOpen(false);
      setSelected({ ...newMobileAppConfigResponseVM });
      refetch();
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to delete this configuration',
          sev: 'warning',
        })
      );
    }
  };

  const handleNotifyAppUpdate = async () => {
    setConfirmNotifyOpen(false);
    setNotifyResult(null);
    setNotifyResultOpen(true);
    try {
      const result = await notifyPortalPatientsToUpdateApp().unwrap();
      setNotifyResult(result);
      dispatch(notify({ msg: 'Portal patients were notified successfully', sev: 'success' }));
    } catch (error) {
      setNotifyResultOpen(false);
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to notify portal patients',
          sev: 'warning',
        })
      );
    }
  };

  const columns = [
    { key: 'configKey', title: 'Key', flexGrow: 2 },
    { key: 'configType', title: 'Type', flexGrow: 1 },
    {
      key: 'configValue',
      title: 'Value',
      flexGrow: 3,
      render: (row: MobileAppConfigResponseVM) =>
        row.configType === 'IMAGE' ? (
          <img className="mobile-app-config-image" src={row.configValue} alt={row.configKey} />
        ) : (
          <Whisper placement="top" speaker={<Tooltip>{row.configValue}</Tooltip>}>
            <span>
              {row.configValue && row.configValue.length > 80
                ? `${row.configValue.substring(0, 80)}...`
                : row.configValue}
            </span>
          </Whisper>
        ),
    },
    {
      key: 'description',
      title: 'Description',
      flexGrow: 2,
      render: (row: MobileAppConfigResponseVM) => (
        <Whisper placement="top" speaker={<Tooltip>{row.description}</Tooltip>}>
          <span>
            {row.description && row.description.length > 60
              ? `${row.description.substring(0, 60)}...`
              : row.description || '-'}
          </span>
        </Whisper>
      ),
    },
    {
      key: 'icons',
      title: '',
      width: 90,
      render: (row: MobileAppConfigResponseVM) => (
        <div className="container-of-icons">
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => {
              setSelected(row);
              setPopupOpen(true);
            }}
          />
          <MdDelete
            title="Delete"
            size={24}
            fill="var(--primary-pink)"
            className="icons-style"
            onClick={() => {
              setSelected(row);
              setConfirmDeleteOpen(true);
            }}
          />
        </div>
      ),
    },
  ];

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={500}
        rowClassName={isSelected}
        data={rows}
        loading={isFetching}
        columns={columns}
        onRowClick={row => setSelected(row)}
        filters={
          <Form layout="inline" fluid className="container-of-filters-mobile-app-config">
            <MyInput
              fieldName="configKey"
              fieldLabel="Key"
              fieldType="select"
              selectData={enumOptions}
              selectDataLabel="value"
              selectDataValue="value"
              placeholder="Key"
              record={filtersState}
              setRecord={setFiltersState}
              column
            />
            <MyButton color="red" onClick={() => setFiltersState({ configKey: '' })}>
              Reset
            </MyButton>
          </Form>
        }
        tableButtons={
          <div className="container-of-mobile-app-config-buttons">
            <MyButton
              prefixIcon={() => <MdNotificationsActive />}
              onClick={() => setConfirmNotifyOpen(true)}
              disabled={isNotifying}
              loading={isNotifying}
            >
              Notify App Update
            </MyButton>
            <MyButton prefixIcon={() => <AddOutlineIcon />} onClick={handleNew} disabled={isNotifying}>
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditMobileAppConfig
        open={popupOpen}
        setOpen={setPopupOpen}
        config={selected}
        refetch={refetch}
      />

      <DeletionConfirmationModal
        open={confirmDeleteOpen}
        setOpen={setConfirmDeleteOpen}
        itemToDelete="configuration"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />

      <DeletionConfirmationModal
        open={confirmNotifyOpen}
        setOpen={setConfirmNotifyOpen}
        actionType="confirm"
        actionButtonLabel="Notify"
        confirmationQuestion="Do you want to notify portal patients to update the mobile app?"
        actionButtonFunction={handleNotifyAppUpdate}
      />

      <Modal
        open={notifyResultOpen}
        onClose={() => !isNotifying && setNotifyResultOpen(false)}
        size="xs"
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title>
            {isNotifying ? 'Notifying Portal Patients' : 'App Update Notification Result'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isNotifying || !notifyResult ? (
            <div className="mobile-app-config-notify-loading">
              <Loader size="md" content="Sending notifications..." />
            </div>
          ) : (
            <div className="mobile-app-config-notify-result">
              <div>
                <span>Portal patients:</span>
                <strong>{notifyResult.portalPatientCount}</strong>
              </div>
              <div>
                <span>Notified:</span>
                <strong>{notifyResult.notifiedCount}</strong>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <MyButton
            appearance="subtle"
            disabled={isNotifying}
            onClick={() => setNotifyResultOpen(false)}
          >
            Close
          </MyButton>
        </Modal.Footer>
      </Modal>
    </Panel>
  );
};

export default MobileAppConfiguration;
