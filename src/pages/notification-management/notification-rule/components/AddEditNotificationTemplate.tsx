import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import Section from '@/components/Section/Section';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useCreateNotificationTemplateMutation,
  useUpdateNotificationTemplateMutation,
} from '@/services/notification-management/notificationTemplateService';
import { useEnumOptions } from '@/services/enumsApi';
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
import { extractErrorMessage, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { MdMailOutline } from 'react-icons/md';
import { Col, Form, Row } from 'rsuite';
import { getNotificationTemplateChannelConfig } from '../notificationTemplateChannelConfig';
import {
  normalizeWhatsappTemplateName,
  normalizeNotificationTemplatePayload,
  sanitizeWhatsappParameters,
  sanitizeWhatsappTemplateNameInput,
  validateNotificationTemplate,
} from '../notificationTemplateValidation';
import HtmlBodyEditor from './HtmlBodyEditor';
import RecipientRuleInput from './RecipientRuleInput';
import WhatsAppButtonsInput from './WhatsAppButtonsInput';
import WhatsAppParametersInput from './WhatsAppParametersInput';
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
  const whatsappLanguageCodeOptions = useEnumOptions('WhatsAppLanguageCode');
  const whatsappTemplateCategoryOptions = useEnumOptions('WhatsAppTemplateCategory');

  const fieldConfig = getNotificationTemplateChannelConfig(channel);

  useEffect(() => {
    if (!open) return;

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
        whatsappTemplateName: normalizeWhatsappTemplateName(template.whatsappTemplateName),
        whatsappLanguageCode: template.whatsappLanguageCode ?? '',
        whatsappParameters: template.whatsappParameters ?? [],
        whatsappTemplateCategory: template.whatsappTemplateCategory ?? '',
        whatsappMetaTemplateFooter: template.whatsappMetaTemplateFooter ?? '',
        whatsappMetaTemplateButtons: template.whatsappMetaTemplateButtons ?? [],
        whatsappHeaderType: template.whatsappHeaderType ?? '',
      });
    } else {
      setCreateDTO({
        ...newNotificationTemplateCreateDTO,
        notificationHeaderId: header.id ?? 0,
        channel,
      });
    }
  }, [template, header, channel, open]);

  const sanitizeWhatsappButtons = () => {
    const buttons = (template?.id ? updateDTO.whatsappMetaTemplateButtons : createDTO.whatsappMetaTemplateButtons) ?? [];
    return buttons.filter(
      button =>
        button.type?.trim() ||
        button.text?.trim() ||
        button.url?.trim() ||
        button.phoneNumber?.trim() ||
        button.couponCode?.trim() ||
        button.flowId?.trim()
    );
  };

  const applyWhatsappHeaderType = <
    T extends NotificationTemplateCreateDTO | NotificationTemplateUpdateDTO,
  >(
    dto: T
  ): T => {
    if (channel !== 'WHATSAPP') {
      return dto;
    }

    const subject = dto.subject?.trim() || null;
    return {
      ...dto,
      subject,
      whatsappHeaderType: subject ? 'TEXT' : null,
    };
  };

  const buildSubmitPayload = () => {
    const whatsappMetaTemplateButtons = sanitizeWhatsappButtons();
    const whatsappParameters = sanitizeWhatsappParameters(
      template?.id ? updateDTO.whatsappParameters : createDTO.whatsappParameters
    );

    if (template?.id) {
      return normalizeNotificationTemplatePayload(
        applyWhatsappHeaderType({
          ...updateDTO,
          whatsappTemplateName: normalizeWhatsappTemplateName(updateDTO.whatsappTemplateName),
          whatsappParameters,
          whatsappMetaTemplateButtons,
        })
      );
    }

    return normalizeNotificationTemplatePayload(
      applyWhatsappHeaderType({
        ...createDTO,
        whatsappTemplateName: normalizeWhatsappTemplateName(createDTO.whatsappTemplateName),
        whatsappParameters,
        whatsappMetaTemplateButtons,
      })
    );
  };

  const handleSubmit = async () => {
    const dto = buildSubmitPayload();

    const validationErrors = validateNotificationTemplate(channel, dto);
    if (validationErrors.length > 0) {
      dispatch(notify({ msg: validationErrors.join(', '), sev: 'warning' }));
      return;
    }

    if (template?.id) {
      await updateTemplate({ id: template.id, body: dto as NotificationTemplateUpdateDTO })
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

    await createTemplate(dto as NotificationTemplateCreateDTO)
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
    const bodyValue = template?.id ? updateDTO.body || template.body || '' : createDTO.body;
    const isWhatsAppChannel = channel === 'WHATSAPP';

    const renderWhatsAppTemplateSection = () => (
      <Section
        title={
          <span className="whatsapp-template-section__title">
            <FaWhatsapp /> <Translate>WhatsApp Template</Translate>
          </span>
        }
        content={
          <div className="whatsapp-template-section">
            {fieldConfig.whatsappTemplateName && (
              <Row>
                <div className="whatsapp-parameters-field">
                  <MyInput
                    fieldName="whatsappTemplateName"
                    fieldType="text"
                    fieldLabel="WhatsApp Template Name"
                    placeholder="appointment_reminder"
                    record={dto}
                    setRecord={record =>
                      setDTO({
                        ...dto,
                        whatsappTemplateName: sanitizeWhatsappTemplateNameInput(record.whatsappTemplateName),
                      })
                    }
                    width="100%"
                    required={fieldConfig.requireWhatsappTemplateName}
                  />
                  <div className="whatsapp-parameters-field__hint">
                    Use lowercase letters, numbers, and <code>_</code> only. Spaces become <code>_</code>.
                    Example: <code>appointment_reminder</code>
                  </div>
                </div>
              </Row>
            )}
            {fieldConfig.whatsappLanguageCode && (
              <Row>
                <MyInput
                  fieldName="whatsappLanguageCode"
                  fieldType="select"
                  fieldLabel="WhatsApp Language Code"
                  selectData={whatsappLanguageCodeOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  isEnum
                  record={dto}
                  setRecord={setDTO}
                  width="100%"
                  required={fieldConfig.requireWhatsappLanguageCode}
                />
              </Row>
            )}
            {fieldConfig.whatsappParameters && (
              <Row>
                <WhatsAppParametersInput
                  value={dto.whatsappParameters}
                  onChange={parameters => setDTO({ ...dto, whatsappParameters: parameters })}
                />
              </Row>
            )}
            {fieldConfig.whatsappTemplateCategory && (
              <Row>
                <MyInput
                  fieldName="whatsappTemplateCategory"
                  fieldType="select"
                  fieldLabel="WhatsApp Template Category"
                  selectData={whatsappTemplateCategoryOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  isEnum
                  record={dto}
                  setRecord={setDTO}
                  width="100%"
                  required={fieldConfig.requireWhatsappTemplateCategory}
                />
              </Row>
            )}
            {fieldConfig.subject && (
              <Row>
                <MyInput
                  fieldName="subject"
                  fieldType="text"
                  fieldLabel="Header"
                  record={dto}
                  setRecord={setDTO}
                  width="100%"
                />
              </Row>
            )}
            {fieldConfig.whatsappHeaderType && (
              <Row>
                <MyInput
                  fieldName="whatsappHeaderTypeDisplay"
                  fieldType="text"
                  fieldLabel="WhatsApp Header Type"
                  record={{
                    whatsappHeaderTypeDisplay: dto.subject?.trim()
                      ? formatEnumString('TEXT')
                      : '',
                  }}
                  width="100%"
                  disabled
                />
              </Row>
            )}
            {fieldConfig.body && (
              <Row>
                <MyInput
                  fieldName="body"
                  fieldType="textarea"
                  fieldLabel="Body"
                  record={dto}
                  setRecord={setDTO}
                  width="100%"
                  required={fieldConfig.requireBody}
                />
              </Row>
            )}
            {fieldConfig.whatsappMetaTemplateFooter && (
              <Row>
                <MyInput
                  fieldName="whatsappMetaTemplateFooter"
                  fieldType="textarea"
                  fieldLabel="WhatsApp Template Footer"
                  record={dto}
                  setRecord={setDTO}
                  width="100%"
                  rows={2}
                />
              </Row>
            )}
            {fieldConfig.whatsappMetaTemplateButtons && (
              <Row>
                <WhatsAppButtonsInput
                  value={dto.whatsappMetaTemplateButtons}
                  onChange={buttons => setDTO({ ...dto, whatsappMetaTemplateButtons: buttons })}
                />
              </Row>
            )}
            {template?.id && fieldConfig.whatsappMetaTemplateId && (
              <Row>
                <MyInput
                  fieldName="whatsappMetaTemplateId"
                  fieldType="text"
                  fieldLabel="WhatsApp Meta Template ID"
                  record={template}
                  width="100%"
                  disabled
                />
              </Row>
            )}
            {template?.id && fieldConfig.whatsappTemplateStatus && (
              <Row>
                <MyInput
                  fieldName="whatsappTemplateStatus"
                  fieldType="text"
                  fieldLabel="WhatsApp Template Status"
                  record={template}
                  width="100%"
                  disabled
                />
              </Row>
            )}
            {template?.id && fieldConfig.whatsappTemplateVersion && (
              <Row>
                <MyInput
                  fieldName="whatsappTemplateVersion"
                  fieldType="number"
                  fieldLabel="WhatsApp Template Version"
                  record={template}
                  width="100%"
                  disabled
                />
              </Row>
            )}
          </div>
        }
        setOpen={() => {}}
        rightLink={null}
        openedContent={null}
      />
    );

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
              {fieldConfig.subject && !isWhatsAppChannel && (
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
              {fieldConfig.body && !isWhatsAppChannel && (
                <Row>
                  {channel === 'EMAIL' ? (
                    <HtmlBodyEditor
                      key={open ? `template-body-${template?.id ?? 'new'}` : 'template-body-closed'}
                      editorKey={open ? template?.id ?? 'new' : 'closed'}
                      label="Body"
                      value={bodyValue}
                      required={fieldConfig.requireBody}
                      onChange={value =>
                        template?.id
                          ? setUpdateDTO(prev => ({ ...prev, body: value }))
                          : setCreateDTO(prev => ({ ...prev, body: value }))
                      }
                    />
                  ) : (
                    <MyInput
                      fieldName="body"
                      fieldType="textarea"
                      record={dto}
                      setRecord={setDTO}
                      width="100%"
                      required={fieldConfig.requireBody}
                    />
                  )}
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
              {isWhatsAppChannel && fieldConfig.whatsappTemplateName && renderWhatsAppTemplateSection()}
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
      size={channel === 'WHATSAPP' ? 'lg' : 'md'}
    />
  );
};

export default AddEditNotificationTemplate;
