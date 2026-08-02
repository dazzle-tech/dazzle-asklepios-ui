import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyTab from '@/components/MyTab';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetAllNotificationHeadersQuery,
  useLazySearchNotificationHeadersQuery,
  useToggleNotificationHeaderActiveMutation,
} from '@/services/notification-management/notificationHeaderService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import {
  NotificationHeaderResponseVM,
  NotificationHeaderSearchDTO,
  NotificationTemplateChannel,
} from '@/types/model-types-new';
import { newNotificationHeaderResponseVM } from '@/types/model-types-constructor-new';
import { conjureValueBasedOnIDFromList, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { Box } from '@mui/material';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useMemo, useState } from 'react';
import { FaUndo } from 'react-icons/fa';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { Form, Panel, Whisper, Tooltip } from 'rsuite';
import AddEditNotificationHeader from './components/AddEditNotificationHeader';
import NotificationTemplatesTab from './tabs/NotificationTemplatesTab';
import './styles.less';

const NOTIFICATION_CHANNELS: {
  key: NotificationTemplateChannel;
  label: string;
}[] = [
  { key: 'EMAIL', label: 'Email' },
  { key: 'IN_APP', label: 'In-App' },
  { key: 'SMS', label: 'SMS' },
  { key: 'WHATSAPP', label: 'WhatsApp' },
];

const NotificationRule = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmActivationModal, setOpenConfirmActivationModal] = useState<boolean>(false);
  const [stateOfActivationModal, setStateOfActivationModal] = useState<string>('deactivate');
  const [selectedHeader, setSelectedHeader] = useState<NotificationHeaderResponseVM>({
    ...newNotificationHeaderResponseVM,
  });
  const [isFiltered, setIsFiltered] = useState(false);

  const [filtersState, setFiltersState] = useState({
    code: '',
    name: '',
    module: '',
    category: '',
    priority: '',
  });

  const [searchParams, setSearchParams] = useState<NotificationHeaderSearchDTO | null>(null);
  const [isCodeOnlySearch, setIsCodeOnlySearch] = useState(false);

  const { data, isFetching, refetch } = useGetAllNotificationHeadersQuery();
  const [searchNotificationHeaders, { data: filteredData, isFetching: isSearchFetching }] =
    useLazySearchNotificationHeadersQuery();
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const [toggleActive] = useToggleNotificationHeaderActiveMutation();

  const moduleOptions = useEnumOptions('NotificationModule');
  const categoryOptions = useEnumOptions('NotificationCategory');
  const priorityOptions = useEnumOptions('NotificationPriority');
  const codeOptions = useEnumOptions('NotificationCode');

  const buildSearchParams = (
    filters: typeof filtersState
  ): NotificationHeaderSearchDTO | null => {
    const params: NotificationHeaderSearchDTO = {};

    const code =
      typeof filters.code === 'string' ? filters.code.trim() : String(filters.code ?? '').trim();
    if (code) params.code = code;

    const name = filters.name?.trim();
    if (name) params.name = name;

    if (filters.module) params.module = filters.module as NotificationHeaderSearchDTO['module'];
    if (filters.category) {
      params.category = filters.category as NotificationHeaderSearchDTO['category'];
    }
    if (filters.priority) {
      params.priority = filters.priority as NotificationHeaderSearchDTO['priority'];
    }

    return Object.keys(params).length ? params : null;
  };

  const tableData = useMemo(() => {
    if (!isFiltered) return data ?? [];

    if (isCodeOnlySearch && searchParams?.code) {
      return (data ?? []).filter(row => String(row.code) === String(searchParams.code));
    }

    return filteredData ?? [];
  }, [isFiltered, isCodeOnlySearch, searchParams?.code, filteredData, data]);

  useEffect(() => {
    dispatch(setPageCode('Notification_Rule'));
    dispatch(setDivContent('Notification Rule'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const isSelected = (rowData: NotificationHeaderResponseVM) => {
    if (rowData && selectedHeader && rowData.id === selectedHeader.id) {
      return 'selected-row';
    }
    return '';
  };

  const handleSearch = () => {
    const params = buildSearchParams(filtersState);
    if (!params) {
      dispatch(
        notify({
          msg: 'Select at least one filter criteria',
          sev: 'warning',
        })
      );
      return;
    }

    const codeOnly = Boolean(params.code && Object.keys(params).length === 1);
    setIsCodeOnlySearch(codeOnly);
    setSearchParams(params);
    setIsFiltered(true);

    if (!codeOnly) {
      searchNotificationHeaders(params);
    }
  };

  const handleReset = () => {
    setFiltersState({
      code: '',
      name: '',
      module: '',
      category: '',
      priority: '',
    });
    setSearchParams(null);
    setIsCodeOnlySearch(false);
    setIsFiltered(false);
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleActive(id).unwrap();
      refetch();
      dispatch(
        notify({
          msg:
            stateOfActivationModal === 'deactivate'
              ? 'The Notification Header was successfully Deactivated'
              : 'The Notification Header was successfully Reactivated',
          sev: 'success',
        })
      );
      setOpenConfirmActivationModal(false);
    } catch {
      dispatch(
        notify({
          msg:
            stateOfActivationModal === 'deactivate'
              ? 'Failed to deactivate this Notification Header'
              : 'Failed to reactivate this Notification Header',
          sev: 'warning',
        })
      );
    }
  };

  const handleNew = () => {
    setSelectedHeader({ ...newNotificationHeaderResponseVM });
    setPopupOpen(true);
  };

  const iconsForActions = (rowData: NotificationHeaderResponseVM) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setSelectedHeader(rowData);
          setPopupOpen(true);
        }}
      />
      {rowData?.isActive ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setSelectedHeader(rowData);
            setStateOfActivationModal('deactivate');
            setOpenConfirmActivationModal(true);
          }}
        />
      ) : (
        <FaUndo
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          className="icons-style"
          onClick={() => {
            setSelectedHeader(rowData);
            setStateOfActivationModal('reactivate');
            setOpenConfirmActivationModal(true);
          }}
        />
      )}
    </div>
  );

  const columns = [
    {
      key: 'code',
      title: 'Code',
      render: (rowData: NotificationHeaderResponseVM) => (
        <span>{rowData.code ? formatEnumString(rowData.code) : '-'}</span>
      ),
    },
    { key: 'name', title: 'Name' },
    {
      key: 'module',
      title: 'Module',
      render: (rowData: NotificationHeaderResponseVM) => (
        <span>{rowData.module ? formatEnumString(rowData.module) : '-'}</span>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      render: (rowData: NotificationHeaderResponseVM) => (
        <span>{rowData.category ? formatEnumString(rowData.category) : '-'}</span>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (rowData: NotificationHeaderResponseVM) => (
        <span>{rowData.priority ? formatEnumString(rowData.priority) : '-'}</span>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (row: NotificationHeaderResponseVM) => (
        <Whisper placement="top" speaker={<Tooltip>{row?.description}</Tooltip>}>
          <span>
            {row.description && row.description.length > 20
              ? `${row.description.substring(0, 20)}...`
              : row.description || '-'}
          </span>
        </Whisper>
      ),
    },
    {
      key: 'facilityId',
      title: 'Facility',
      width: 200,
      render: (row: NotificationHeaderResponseVM) => (
        <span>
          {row.facilityId
            ? conjureValueBasedOnIDFromList(facilityListResponse as any[], row.facilityId, 'name') ??
              row.facilityId
            : 'All Facilities'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: NotificationHeaderResponseVM) => (row.isActive ? 'Active' : 'Inactive'),
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: (rowData: NotificationHeaderResponseVM) => iconsForActions(rowData),
    },
  ];

  const filters = () => (
    <Form layout="inline" fluid className="container-of-filters-notification-rule">
      <MyInput
        fieldName="code"
        fieldType="select"
        placeholder="Code"
        selectData={codeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="name"
        fieldType="text"
        placeholder="Name"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="module"
        fieldType="select"
        selectData={moduleOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="category"
        fieldType="select"
        selectData={categoryOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="priority"
        fieldType="select"
        selectData={priorityOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyButton onClick={handleSearch}>Search</MyButton>
      <MyButton onClick={handleReset} color="red">
        Reset
      </MyButton>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <>
      <Panel dir={dir}>
        <MyTable
          height={500}
          rowClassName={isSelected}
          data={tableData}
          loading={isFetching || isSearchFetching}
          columns={columns}
          filters={filters()}
          onRowClick={row => setSelectedHeader(row)}
          tableButtons={
            <MyButton prefixIcon={() => <AddOutlineIcon />} onClick={handleNew}>
              Add New
            </MyButton>
          }
        />

        <AddEditNotificationHeader
          open={popupOpen}
          setOpen={setPopupOpen}
          header={selectedHeader}
          refetch={refetch}
        />

        <DeletionConfirmationModal
          open={openConfirmActivationModal}
          setOpen={setOpenConfirmActivationModal}
          itemToDelete="Notification Header"
          actionButtonFunction={() => handleToggle(selectedHeader?.id)}
          actionType={stateOfActivationModal}
        />
      </Panel>

      {selectedHeader?.id && (
        <Box mt={3}>
          <MyTab
            lazy
            data={NOTIFICATION_CHANNELS.map(channel => ({
              title: channel.label,
              content: <NotificationTemplatesTab header={selectedHeader} channel={channel.key} />,
              disabled: !selectedHeader?.id,
            }))}
          />
        </Box>
      )}
    </>
  );
};

export default NotificationRule;
