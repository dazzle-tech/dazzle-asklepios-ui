import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetNotificationTemplatesByHeaderQuery,
  useRegisterWhatsAppTemplateMutation,
  useRefreshRegisteredWhatsAppTemplateMutation,
  useToggleNotificationTemplateActiveMutation,
  useUpdateRegisteredWhatsAppTemplateMutation,
} from '@/services/notification-management/notificationTemplateService';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';
import {
  NotificationHeaderResponseVM,
  NotificationTemplateChannel,
  NotificationTemplateResponseVM,
} from '@/types/model-types-new';
import { newNotificationTemplateResponseVM } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage, formatEnumString } from '@/utils';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useMemo, useState } from 'react';
import { FaUndo, FaWhatsapp } from 'react-icons/fa';
import { MdDelete, MdModeEdit, MdRefresh } from 'react-icons/md';
import { Form } from 'rsuite';
import AddEditNotificationTemplate from '../components/AddEditNotificationTemplate';
import { getNotificationTemplateChannelConfig } from '../notificationTemplateChannelConfig';
import { formatRecipientRuleDisplay, formatWhatsappButtons, formatWhatsappParameters, stripHtmlBody } from '../notificationTemplateValidation';

interface NotificationTemplatesTabProps {
  header: NotificationHeaderResponseVM;
  channel: NotificationTemplateChannel;
}

const NotificationTemplatesTab: React.FC<NotificationTemplatesTabProps> = ({ header, channel }) => {
  const dispatch = useAppDispatch();
  const headerId = header?.id ?? 0;

  const [template, setTemplate] = useState<NotificationTemplateResponseVM>({
    ...newNotificationTemplateResponseVM,
  });
  const [popupOpen, setPopupOpen] = useState(false);
  const [load, setLoad] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [whatsappAction, setWhatsappAction] = useState<'create' | 'update' | null>(null);
  const [activationAction, setActivationAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [processingTemplateId, setProcessingTemplateId] = useState<number | null>(null);
  const [refreshingTemplateId, setRefreshingTemplateId] = useState<number | null>(null);
  const [searchRecord, setSearchRecord] = useState({ language: '' });

  const {
    data: templatesResponse,
    isFetching,
    refetch,
  } = useGetNotificationTemplatesByHeaderQuery(headerId, {
    skip: !headerId,
  });

  const [toggleTemplateActive] = useToggleNotificationTemplateActiveMutation();
  const [registerWhatsAppTemplate] = useRegisterWhatsAppTemplateMutation();
  const [updateRegisteredWhatsAppTemplate] = useUpdateRegisteredWhatsAppTemplateMutation();
  const [refreshRegisteredWhatsAppTemplate] = useRefreshRegisteredWhatsAppTemplateMutation();
  const { data: languages } = useGetAllLanguagesQuery({});

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

  const channelTemplates = useMemo(() => {
    const all = templatesResponse ?? [];
    const byChannel = all.filter(item => item.channel === channel);
    const search = searchRecord.language?.trim().toLowerCase();
    if (!search) return byChannel;
    return byChannel.filter(item => {
      const langKey = item.language?.toLowerCase() ?? '';
      const langName = getLanguageName(item.language).toLowerCase();
      return langKey.includes(search) || langName.includes(search);
    });
  }, [templatesResponse, channel, searchRecord.language, languageNameByKey]);

  const isSelected = (rowData: NotificationTemplateResponseVM) =>
    rowData?.id && template?.id === rowData.id ? 'selected-row' : '';

  const handleNew = () => {
    setTemplate({
      ...newNotificationTemplateResponseVM,
      notificationHeaderId: headerId,
      channel,
    });
    setPopupOpen(true);
  };

  const handleToggle = async () => {
    if (!template?.id) return;
    setLoad(true);
    try {
      await toggleTemplateActive(template.id).unwrap();
      refetch();
      dispatch(
        notify({
          msg:
            activationAction === 'deactivate'
              ? 'Notification template deactivated successfully'
              : 'Notification template activated successfully',
          sev: 'success',
        })
      );
      setOpenConfirmModal(false);
    } catch {
      dispatch(
        notify({
          msg:
            activationAction === 'deactivate'
              ? 'Failed to deactivate notification template'
              : 'Failed to activate notification template',
          sev: 'error',
        })
      );
    }
    setLoad(false);
  };

  const handleWhatsAppTemplateAction = async () => {
    if (!template?.id || !whatsappAction) return;

    setProcessingTemplateId(template.id);
    setLoad(true);
    try {
      if (whatsappAction === 'create') {
        await registerWhatsAppTemplate(template.id).unwrap();
        dispatch(notify({ msg: 'WhatsApp template created successfully on Meta', sev: 'success' }));
      } else {
        await updateRegisteredWhatsAppTemplate(template.id).unwrap();
        dispatch(notify({ msg: 'WhatsApp template updated successfully on Meta', sev: 'success' }));
      }
      refetch();
      setWhatsappAction(null);
    } catch (error) {
      dispatch(
        notify({
          msg:
            extractErrorMessage(error) ||
            (whatsappAction === 'create'
              ? 'Failed to create WhatsApp template on Meta'
              : 'Failed to update WhatsApp template on Meta'),
          sev: 'error',
        })
      );
    }
    setProcessingTemplateId(null);
    setLoad(false);
  };

  const hasMetaTemplateId = (rowData: NotificationTemplateResponseVM) =>
    Boolean(rowData.whatsappMetaTemplateId?.trim());

  const handleRefreshWhatsAppTemplate = async (rowData: NotificationTemplateResponseVM) => {
    if (!rowData.id || !hasMetaTemplateId(rowData) || processingTemplateId || refreshingTemplateId) {
      return;
    }

    const previousStatus = rowData.whatsappTemplateStatus ?? null;
    setRefreshingTemplateId(rowData.id);
    setLoad(true);
    try {
      const result = await refreshRegisteredWhatsAppTemplate(rowData.id).unwrap();
      refetch();

      const newStatus = result.whatsappTemplateStatus ?? null;
      if (newStatus !== previousStatus) {
        const formattedStatus = newStatus ? formatEnumString(newStatus) : 'unknown';
        dispatch(
          notify({
            msg: `WhatsApp template status updated to ${formattedStatus}`,
            sev: 'success',
          })
        );
      } else {
        const formattedStatus = newStatus ? formatEnumString(newStatus) : 'unchanged';
        dispatch(
          notify({
            msg: `WhatsApp template refreshed. Status is still ${formattedStatus}.`,
            sev: 'info',
          })
        );
      }
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to refresh WhatsApp template from Meta',
          sev: 'error',
        })
      );
    }
    setRefreshingTemplateId(null);
    setLoad(false);
  };

  const getWhatsAppTemplateActionLabel = (rowData: NotificationTemplateResponseVM) =>
    hasMetaTemplateId(rowData) ? 'Update WhatsApp Template on Meta' : 'Create WhatsApp Template on Meta';

  const iconsForActions = (rowData: NotificationTemplateResponseVM) => (
    <div className="container-of-icons">
      {channel === 'WHATSAPP' && rowData?.id && (
        <FaWhatsapp
          title={getWhatsAppTemplateActionLabel(rowData)}
          size={22}
          fill={processingTemplateId === rowData.id ? 'var(--primary-gray)' : 'var(--deep-blue)'}
          className={`icons-style${processingTemplateId === rowData.id ? ' icons-style--loading' : ''}`}
          onClick={event => {
            event.stopPropagation();
            if (processingTemplateId || refreshingTemplateId) return;
            setTemplate({ ...rowData });
            setWhatsappAction(hasMetaTemplateId(rowData) ? 'update' : 'create');
          }}
        />
      )}
      {channel === 'WHATSAPP' && rowData?.id && hasMetaTemplateId(rowData) && (
        <MdRefresh
          title="Refresh WhatsApp Template from Meta"
          size={24}
          fill={refreshingTemplateId === rowData.id ? 'var(--primary-gray)' : 'var(--deep-blue)'}
          className={`icons-style${refreshingTemplateId === rowData.id ? ' icons-style--loading' : ''}`}
          onClick={event => {
            event.stopPropagation();
            handleRefreshWhatsAppTemplate(rowData);
          }}
        />
      )}
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setTemplate({ ...rowData });
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
            setTemplate(rowData);
            setActivationAction('deactivate');
            setOpenConfirmModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setTemplate(rowData);
            setActivationAction('reactivate');
            setOpenConfirmModal(true);
          }}
        />
      )}
    </div>
  );

  const fieldConfig = getNotificationTemplateChannelConfig(channel);

  const truncateCell = (value?: string | null, maxLength = 50) => {
    const text = value ?? '';
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatRecipientRuleCell = (rule?: string | null) =>
    truncateCell(formatRecipientRuleDisplay(rule));

  const tableColumns = [
    {
      key: 'language',
      title: <Translate>Language</Translate>,
      flexGrow: 2,
      render: (rowData: NotificationTemplateResponseVM) => getLanguageName(rowData.language),
    },
    ...(fieldConfig.subject
      ? [
          {
            key: 'subject',
            title: <Translate>{channel === 'WHATSAPP' ? 'Header' : 'Subject'}</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) => rowData.subject ?? '-',
          },
        ]
      : []),
    ...(fieldConfig.title
      ? [
          {
            key: 'title',
            title: <Translate>Title</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) => rowData.title ?? '-',
          },
        ]
      : []),
    ...(fieldConfig.body
      ? [
          {
            key: 'body',
            title: <Translate>Body</Translate>,
            flexGrow: 4,
            render: (rowData: NotificationTemplateResponseVM) =>
              truncateCell(
                channel === 'EMAIL' ? stripHtmlBody(rowData.body) : rowData.body,
                80
              ),
          },
        ]
      : []),
    ...(fieldConfig.toRecipientRule
      ? [
          {
            key: 'toRecipientRule',
            title: <Translate>To Recipient Rule</Translate>,
            flexGrow: 3,
            render: (rowData: NotificationTemplateResponseVM) =>
              formatRecipientRuleCell(rowData.toRecipientRule),
          },
        ]
      : []),
    ...(fieldConfig.ccRecipientRule
      ? [
          {
            key: 'ccRecipientRule',
            title: <Translate>CC Recipient Rule</Translate>,
            flexGrow: 3,
            render: (rowData: NotificationTemplateResponseVM) =>
              formatRecipientRuleCell(rowData.ccRecipientRule),
          },
        ]
      : []),
    ...(fieldConfig.bccRecipientRule
      ? [
          {
            key: 'bccRecipientRule',
            title: <Translate>BCC Recipient Rule</Translate>,
            flexGrow: 3,
            render: (rowData: NotificationTemplateResponseVM) =>
              formatRecipientRuleCell(rowData.bccRecipientRule),
          },
        ]
      : []),
    ...(fieldConfig.phoneRecipientRule
      ? [
          {
            key: 'phoneRecipientRule',
            title: <Translate>Phone Recipient Rule</Translate>,
            flexGrow: 3,
            render: (rowData: NotificationTemplateResponseVM) =>
              formatRecipientRuleCell(rowData.phoneRecipientRule),
          },
        ]
      : []),
    ...(fieldConfig.whatsappTemplateName
      ? [
          {
            key: 'whatsappTemplateName',
            title: <Translate>WhatsApp Template Name</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) =>
              rowData.whatsappTemplateName ?? '-',
          },
        ]
      : []),
    ...(fieldConfig.whatsappLanguageCode
      ? [
          {
            key: 'whatsappLanguageCode',
            title: <Translate>WhatsApp Language Code</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) =>
              rowData.whatsappLanguageCode
                ? formatEnumString(rowData.whatsappLanguageCode)
                : '-',
          },
        ]
      : []),
    ...(fieldConfig.whatsappParameters
      ? [
          {
            key: 'whatsappParameters',
            title: <Translate>WhatsApp Parameters</Translate>,
            flexGrow: 3,
            render: (rowData: NotificationTemplateResponseVM) =>
              truncateCell(formatWhatsappParameters(rowData.whatsappParameters), 80),
          },
        ]
      : []),
    ...(fieldConfig.whatsappTemplateCategory
      ? [
          {
            key: 'whatsappTemplateCategory',
            title: <Translate>WhatsApp Category</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) =>
              rowData.whatsappTemplateCategory
                ? formatEnumString(rowData.whatsappTemplateCategory)
                : '-',
          },
        ]
      : []),
    ...(fieldConfig.whatsappHeaderType
      ? [
          {
            key: 'whatsappHeaderType',
            title: <Translate>WhatsApp Header Type</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) =>
              rowData.whatsappHeaderType ? formatEnumString(rowData.whatsappHeaderType) : '-',
          },
        ]
      : []),
    ...(fieldConfig.whatsappMetaTemplateFooter
      ? [
          {
            key: 'whatsappMetaTemplateFooter',
            title: <Translate>WhatsApp Footer</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) =>
              truncateCell(rowData.whatsappMetaTemplateFooter),
          },
        ]
      : []),
    ...(fieldConfig.whatsappMetaTemplateButtons
      ? [
          {
            key: 'whatsappMetaTemplateButtons',
            title: <Translate>WhatsApp Buttons</Translate>,
            flexGrow: 3,
            render: (rowData: NotificationTemplateResponseVM) =>
              truncateCell(formatWhatsappButtons(rowData.whatsappMetaTemplateButtons), 80),
          },
        ]
      : []),
    ...(fieldConfig.whatsappMetaTemplateId
      ? [
          {
            key: 'whatsappMetaTemplateId',
            title: <Translate>Meta Template ID</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) =>
              rowData.whatsappMetaTemplateId ?? '-',
          },
        ]
      : []),
    ...(fieldConfig.whatsappTemplateStatus
      ? [
          {
            key: 'whatsappTemplateStatus',
            title: <Translate>WhatsApp Template Status</Translate>,
            flexGrow: 2,
            render: (rowData: NotificationTemplateResponseVM) =>
              rowData.whatsappTemplateStatus
                ? formatEnumString(rowData.whatsappTemplateStatus)
                : '-',
          },
        ]
      : []),
    ...(fieldConfig.whatsappTemplateVersion
      ? [
          {
            key: 'whatsappTemplateVersion',
            title: <Translate>Template Version</Translate>,
            flexGrow: 1,
            render: (rowData: NotificationTemplateResponseVM) =>
              rowData.whatsappTemplateVersion ?? '-',
          },
        ]
      : []),
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: NotificationTemplateResponseVM) => (rowData?.isActive ? 'Active' : 'Inactive'),
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: NotificationTemplateResponseVM) => iconsForActions(rowData),
    },
  ];

  return (
    <>
      <MyTable
        height={350}
        data={channelTemplates}
        loading={isFetching || load}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setTemplate(rowData)}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              width="109px"
              height="32px"
              onClick={handleNew}
            >
              Add New
            </MyButton>
          </div>
        }
        filters={
          <div className="container-of-header-actions-notification">
            <Form layout="inline">
              <MyInput
                fieldName="language"
                fieldType="text"
                record={searchRecord}
                setRecord={setSearchRecord}
                showLabel={false}
                placeholder="Search by language"
                width="220px"
              />
            </Form>
          </div>
        }
      />

      <AddEditNotificationTemplate
        open={popupOpen}
        setOpen={setPopupOpen}
        template={template}
        header={header}
        channel={channel}
        refetch={refetch}
      />

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete="Notification Template"
        actionButtonFunction={handleToggle}
        actionType={activationAction}
      />

      <DeletionConfirmationModal
        open={whatsappAction !== null}
        setOpen={open => {
          if (!open) {
            setWhatsappAction(null);
          }
        }}
        itemToDelete="WhatsApp Template"
        actionButtonFunction={handleWhatsAppTemplateAction}
        actionType="confirm"
        actionButtonLabel={whatsappAction === 'update' ? 'Update on Meta' : 'Create on Meta'}
        confirmationQuestion={
          whatsappAction === 'update'
            ? `Update the WhatsApp template "${template.whatsappTemplateName || getLanguageName(template.language)}" on Meta?`
            : `Create the WhatsApp template "${template.whatsappTemplateName || getLanguageName(template.language)}" on Meta?`
        }
      />
    </>
  );
};

export default NotificationTemplatesTab;
