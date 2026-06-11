import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import {
  useCreateNotificationTemplateMutation,
  useUpdateNotificationTemplateMutation,
} from '@/services/notification-management/notificationTemplateService';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';
import {
  NotificationHeaderResponseVM,
  NotificationTemplateChannel,
  NotificationTemplateCreateDTO,
  NotificationTemplateResponseVM,
  NotificationTemplateUpdateDTO,
} from '@/types/model-types-new';
import {
  newNotificationTemplateCreateDTO,
  newNotificationTemplateUpdateDTO,
} from '@/types/model-types-constructor-new';
import { extractErrorMessage } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { MdMailOutline } from 'react-icons/md';
import { Col, Form, Row } from 'rsuite';
import { getNotificationTemplateChannelConfig } from '../notificationTemplateChannelConfig';
import { validateNotificationTemplate } from '../notificationTemplateValidation';
import RecipientRuleInput from './RecipientRuleInput';
import '../styles.less';

interface AddEditNotificationTemplateProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  template: NotificationTemplateResponseVM;
  header: NotificationHeaderResponseVM;
  channel: NotificationTemplateChannel;
  refetch: () => void;
}

const AddEditNotificationTemplate: React.FC<AddEditNotificationTemplateProps> = ({
  open,
  setOpen,
  template,
  header,
  channel,
  refetch,
}) => {
  const dispatch = useAppDispatch();
  const [createDTO, setCreateDTO] = useState<NotificationTemplateCreateDTO>({
    ...newNotificationTemplateCreateDTO,
  });
  const [updateDTO, setUpdateDTO] = useState<NotificationTemplateUpdateDTO>({
    ...newNotificationTemplateUpdateDTO,
  });

  const [createTemplate] = useCreateNotificationTemplateMutation();
  const [updateTemplate] = useUpdateNotificationTemplateMutation();
  const { data: languages } = useGetAllLanguagesQuery({});

  const fieldConfig = getNotificationTemplateChannelConfig(channel);

  useEffect(() => {
    if (template?.id) {
      setUpdateDTO({
        notificationHeaderId: template.notificationHeaderId,
        channel: template.channel,
        language: template.language ?? '',
        subject: template.subject ?? '',
        title: template.title ?? '',
        body: template.body ?? '',
        toRecipientRule: template.toRecipientRule ?? '',
        ccRecipientRule: template.ccRecipientRule ?? '',
        bccRecipientRule: template.bccRecipientRule ?? '',
        phoneRecipientRule: template.phoneRecipientRule ?? '',
      });
    } else {
      setCreateDTO({
        ...newNotificationTemplateCreateDTO,
        notificationHeaderId: header.id ?? 0,
        channel,
      });
    }
  }, [template, header, channel]);

  const handleSubmit = async () => {
    const dto = template?.id ? updateDTO : createDTO;

    const validationErrors = validateNotificationTemplate(channel, dto);
    if (validationErrors.length > 0) {
      dispatch(notify({ msg: validationErrors.join(', '), sev: 'warning' }));
      return;
    }

    if (template?.id) {
      await updateTemplate({ id: template.id, body: updateDTO })
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'The Notification Template was successfully Updated', sev: 'success' }));
          refetch();
          setOpen(false);
          setCreateDTO({ ...newNotificationTemplateCreateDTO });
          setUpdateDTO({ ...newNotificationTemplateUpdateDTO });
        })
        .catch(error => {
          dispatch(
            notify({
              msg: extractErrorMessage(error) || 'Failed to save Notification Template',
              sev: 'warning',
            })
          );
        });
      return;
    }

    await createTemplate(createDTO)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The Notification Template was successfully Created', sev: 'success' }));
        refetch();
        setOpen(false);
        setCreateDTO({ ...newNotificationTemplateCreateDTO });
        setUpdateDTO({ ...newNotificationTemplateUpdateDTO });
      })
      .catch(error => {
        dispatch(
          notify({
            msg: extractErrorMessage(error) || 'Failed to save Notification Template',
            sev: 'warning',
          })
        );
      });
  };

  const conjureFormContentOfMainModal = (stepNumber: number) => {
    const dto = template?.id ? updateDTO : createDTO;
    const setDTO = template?.id ? setUpdateDTO : setCreateDTO;

    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-add-edit-notification-template">
              <Row>
                <Col md={12}>
                  <MyInput
                    fieldName="language"
                    fieldType="select"
                    fieldLabel="Language"
                    selectData={languages ?? []}
                    selectDataLabel="langName"
                    selectDataValue="langKey"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                    required
                  />
                </Col>
                {!template?.id && (
                  <Col md={12}>
                    <MyInput
                      fieldName="isActive"
                      fieldType="checkbox"
                      record={createDTO}
                      setRecord={setCreateDTO}
                      width="100%"
                    />
                  </Col>
                )}
              </Row>
              {fieldConfig.subject && (
                <Row>
                  <MyInput
                    fieldName="subject"
                    fieldType="text"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                    required={fieldConfig.requireSubject}
                  />
                </Row>
              )}
              {fieldConfig.title && (
                <Row>
                  <MyInput
                    fieldName="title"
                    fieldType="text"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                    required={fieldConfig.requireTitle}
                  />
                </Row>
              )}
              {fieldConfig.body && (
                <Row>
                  <MyInput
                    fieldName="body"
                    fieldType="textarea"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                    required={fieldConfig.requireBody}
                  />
                </Row>
              )}
              {fieldConfig.toRecipientRule && (
                <RecipientRuleInput
                  label="To Recipient Rule"
                  value={dto.toRecipientRule}
                  required={fieldConfig.requireToRecipientRule}
                  onChange={value => setDTO({ ...dto, toRecipientRule: value })}
                />
              )}
              {fieldConfig.ccRecipientRule && (
                <RecipientRuleInput
                  label="CC Recipient Rule"
                  value={dto.ccRecipientRule}
                  onChange={value => setDTO({ ...dto, ccRecipientRule: value })}
                />
              )}
              {fieldConfig.bccRecipientRule && (
                <RecipientRuleInput
                  label="BCC Recipient Rule"
                  value={dto.bccRecipientRule}
                  onChange={value => setDTO({ ...dto, bccRecipientRule: value })}
                />
              )}
              {fieldConfig.phoneRecipientRule && (
                <RecipientRuleInput
                  label="Phone Recipient Rule"
                  value={dto.phoneRecipientRule}
                  required={fieldConfig.requirePhoneRecipientRule}
                  onChange={value => setDTO({ ...dto, phoneRecipientRule: value })}
                />
              )}
            </div>
          </Form>
        );
      default:
        return null;
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      actionButtonLabel={template?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSubmit}
      open={open}
      setOpen={setOpen}
      position="right"
      title={template?.id ? 'Edit Notification Template' : 'New Notification Template'}
      content={stepNumber => <div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>}
      steps={[{ title: 'Notification Template Info', icon: <MdMailOutline /> }]}
      size="md"
    />
  );
};

export default AddEditNotificationTemplate;
