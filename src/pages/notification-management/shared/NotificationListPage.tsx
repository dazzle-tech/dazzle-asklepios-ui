import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetNotificationsByChannelQuery,
  useSearchNotificationsByChannelQuery,
} from '@/services/notification-management/notificationService';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { NotificationChannel, NotificationResponseVM } from '@/types/model-types-new';
import { newNotificationResponseVM } from '@/types/model-types-constructor-new';
import { conjureValueBasedOnIDFromList, formatDateWithoutSeconds, formatEnumString } from '@/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { MdVisibility } from 'react-icons/md';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
import { getNotificationChannelPageConfig } from './notificationChannelPageConfig';
import {
  buildSearchParamsFromFilters,
  formatEmailList,
  formatPhoneValue,
  getBodyPreview,
  getInitialFiltersState,
  NotificationFiltersState,
} from './notificationListUtils';
import ViewNotificationModal from './ViewNotificationModal';
import './styles.less';

interface NotificationListPageProps {
  channel: NotificationChannel;
}

const NotificationListPage: React.FC<NotificationListPageProps> = ({ channel }) => {
  const config = getNotificationChannelPageConfig(channel);
  const dispatch = useAppDispatch();
  const [isFiltered, setIsFiltered] = useState(true);
  const [filtersState, setFiltersState] = useState<NotificationFiltersState>(() =>
    getInitialFiltersState()
  );
  const [searchParams, setSearchParams] = useState(() =>
    buildSearchParamsFromFilters(getInitialFiltersState())
  );
  const [selectedNotification, setSelectedNotification] = useState<NotificationResponseVM>({
    ...newNotificationResponseVM,
    channel,
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const { data, isFetching } = useGetNotificationsByChannelQuery(channel);
  const { data: filteredData, isFetching: isSearchFetching } =
    useSearchNotificationsByChannelQuery(
      { channel, body: searchParams ?? {} },
      { skip: !searchParams }
    );
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const { data: languages } = useGetAllLanguagesQuery({});

  const statusOptions = useEnumOptions('NotificationStatus');
  const priorityOptions = useEnumOptions('NotificationPriority');

  const languageNameByKey = useMemo(() => {
    const map = new Map<string, string>();
    (languages ?? []).forEach(language => {
      if (language.langKey) {
        map.set(language.langKey, language.langName);
      }
    });
    return map;
  }, [languages]);

  const getLanguageName = (langKey?: string | null) => {
    if (!langKey) return '-';
    return languageNameByKey.get(langKey) ?? langKey;
  };

  const tableData = isFiltered ? filteredData ?? [] : data ?? [];

  useEffect(() => {
    dispatch(setPageCode(config.pageCode));
    dispatch(setDivContent(config.pageTitle));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, config.pageCode, config.pageTitle]);

  const isSelected = (rowData: NotificationResponseVM) => {
    if (rowData?.id && selectedNotification?.id === rowData.id) {
      return 'selected-row';
    }
    return '';
  };

  const handleSearch = () => {
    setSearchParams(buildSearchParamsFromFilters(filtersState));
    setIsFiltered(true);
  };

  const handleReset = () => {
    const initial = getInitialFiltersState();
    setFiltersState(initial);
    setSearchParams(buildSearchParamsFromFilters(initial));
    setIsFiltered(true);
  };

  const openViewModal = (rowData: NotificationResponseVM) => {
    setSelectedNotification(rowData);
    setViewModalOpen(true);
  };

  const iconsForActions = (rowData: NotificationResponseVM) => (
    <div className="container-of-icons">
      <MdVisibility
        title="View"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={event => {
          event.stopPropagation();
          openViewModal(rowData);
        }}
      />
    </div>
  );

  const truncatePreview = (value: string, max = 30) =>
    value && value.length > max ? `${value.substring(0, max)}...` : value || '-';

  const columns = [
    { key: 'code', title: 'Code' },
    {
      key: 'status',
      title: 'Status',
      render: (row: NotificationResponseVM) =>
        row.status ? formatEnumString(row.status) : '-',
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (row: NotificationResponseVM) =>
        row.priority ? formatEnumString(row.priority) : '-',
    },
    {
      key: 'facilityId',
      title: 'Facility',
      width: 180,
      render: (row: NotificationResponseVM) => (
        <span>
          {row.facilityId
            ? conjureValueBasedOnIDFromList(facilityListResponse as any[], row.facilityId, 'name') ??
              row.facilityId
            : 'All Facilities'}
        </span>
      ),
    },
    {
      key: 'language',
      title: 'Language',
      render: (row: NotificationResponseVM) => getLanguageName(row.language),
    },
    {
      key: 'recipientName',
      title: 'Recipient Name',
      render: (row: NotificationResponseVM) => row.recipientName || '-',
    },
    ...(config.showEmailColumns
      ? [
          {
            key: 'recipientEmail',
            title: 'Recipient Email',
            render: (row: NotificationResponseVM) =>
              formatEmailList(row.toEmails, row.recipientEmail),
          },
        ]
      : []),
    ...(config.showPhoneColumns
      ? [
          {
            key: 'recipientPhone',
            title: 'Recipient Phone',
            render: (row: NotificationResponseVM) => formatPhoneValue(row),
          },
        ]
      : []),
    ...(config.showSubjectColumn
      ? [
          {
            key: 'subject',
            title: 'Subject',
            render: (row: NotificationResponseVM) => (
              <Whisper placement="top" speaker={<Tooltip>{row.subject || '-'}</Tooltip>}>
                <span>{truncatePreview(row.subject ?? '')}</span>
              </Whisper>
            ),
          },
        ]
      : []),
    ...(config.showTitleColumn
      ? [
          {
            key: 'title',
            title: 'Title',
            render: (row: NotificationResponseVM) => (
              <Whisper placement="top" speaker={<Tooltip>{row.title || '-'}</Tooltip>}>
                <span>{truncatePreview(row.title ?? '')}</span>
              </Whisper>
            ),
          },
        ]
      : []),
    {
      key: 'body',
      title: 'Body Preview',
      render: (row: NotificationResponseVM) => {
        const preview = getBodyPreview(row.body, config.bodyPreviewAsHtml);
        return (
          <Whisper placement="top" speaker={<Tooltip>{preview || '-'}</Tooltip>}>
            <span>{truncatePreview(preview)}</span>
          </Whisper>
        );
      },
    },
    {
      key: 'sentDate',
      title: 'Sent Date',
      render: (row: NotificationResponseVM) => formatDateWithoutSeconds(row.sentDate) || '-',
    },
    {
      key: 'failedDate',
      title: 'Failed Date',
      render: (row: NotificationResponseVM) => formatDateWithoutSeconds(row.failedDate) || '-',
    },
    {
      key: 'providerStatus',
      title: 'Provider Status',
      render: (row: NotificationResponseVM) => row.providerStatus || '-',
    },
    {
      key: 'errorMessage',
      title: 'Error',
      render: (row: NotificationResponseVM) => (
        <Whisper placement="top" speaker={<Tooltip>{row.errorMessage || '-'}</Tooltip>}>
          <span>{truncatePreview(row.errorMessage ?? '', 20)}</span>
        </Whisper>
      ),
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 2,
      render: (rowData: NotificationResponseVM) => iconsForActions(rowData),
    },
  ];

  const filters = () => (
    <Form layout="inline" fluid className="container-of-filters-channel-notification">
      <MyInput
        fieldName="code"
        fieldType="text"
        placeholder="Code"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      <MyInput
        fieldName="status"
        fieldType="select"
        placeholder="Status"
        selectData={statusOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      <MyInput
        fieldName="priority"
        fieldType="select"
        placeholder="Priority"
        selectData={priorityOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      <MyInput
        fieldName="language"
        fieldType="select"
        placeholder="Language"
        selectData={languages ?? []}
        selectDataLabel="langName"
        selectDataValue="langKey"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      <MyInput
        fieldName="recipientName"
        fieldType="text"
        placeholder="Recipient Name"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      {config.showRecipientEmailFilter && (
        <MyInput
          fieldName="recipientEmail"
          fieldType="text"
          placeholder="Recipient Email"
          record={filtersState}
          setRecord={setFiltersState}
          column
        />
      )}
      {config.showRecipientPhoneFilter && (
        <MyInput
          fieldName="recipientPhone"
          fieldType="text"
          placeholder="Recipient Phone"
          record={filtersState}
          setRecord={setFiltersState}
          column
        />
      )}
      <MyInput
        fieldName="providerStatus"
        fieldType="text"
        placeholder="Provider Status"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      <MyInput
        fieldName="providerMessageId"
        fieldType="text"
        placeholder="Provider Message ID"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      <MyInput
        fieldName="dateFrom"
        fieldType="date"
        placeholder="Date From"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      <MyInput
        fieldName="dateTo"
        fieldType="date"
        placeholder="Date To"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />
      <MyButton onClick={handleSearch}>
        <Translate>Search</Translate>
      </MyButton>
      <MyButton onClick={handleReset} color="red">
        <Translate>Reset</Translate>
      </MyButton>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={600}
        rowClassName={isSelected}
        data={tableData}
        loading={isFetching || isSearchFetching}
        columns={columns}
        filters={filters()}
        onRowClick={row => setSelectedNotification(row)}
      />

      <ViewNotificationModal
        channel={channel}
        open={viewModalOpen}
        setOpen={setViewModalOpen}
        notification={selectedNotification?.id ? selectedNotification : null}
      />
    </Panel>
  );
};

export default NotificationListPage;
