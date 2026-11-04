import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import Section from '@/components/Section/Section';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';
import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { WhatsAppSettings as WhatsAppSettingsType } from '@/types/model-types-new';
import { newWhatsAppSettings } from '@/types/model-types-constructor-new';
import {
  useGetAllWhatsAppSettingsQuery,
  useCreateWhatsAppSettingsMutation,
  useUpdateWhatsAppSettingsMutation,
  useTestWhatsAppSettingsConnectionMutation,
} from '@/services/system-configurations/whatsappSettingsService';
import '../organization-definition/styles.less';

/** Mirrors WhatsAppSettings entity @NotNull / column constraints. */
const WHATSAPP_SETTINGS_FIELDS = {
  name: { required: true, maxLength: 255, label: 'Name' },
  description: { required: true, maxLength: 500, label: 'Description' },
  apiVersion: { required: true, maxLength: 50, label: 'API Version' },
  phoneNumberId: { required: true, maxLength: 255, label: 'Phone Number ID' },
  whatsappBusinessAccountId: { required: true, maxLength: 255, label: 'WhatsApp Business Account ID' },
  accessToken: { required: true, label: 'Access Token' },
  verifyToken: { required: true, maxLength: 255, label: 'Verify Token' },
  webhookUrl: { required: false, maxLength: 500, label: 'Webhook URL' },
  enabled: { required: true, label: 'Enabled' },
} as const;

const validateWhatsAppSettings = (payload: {
  name: string;
  description: string;
  apiVersion: string;
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string | null;
  enabled: boolean;
}) => {
  const errors: string[] = [];

  if (!payload.name) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.name.label} is required`);
  } else if (payload.name.length > WHATSAPP_SETTINGS_FIELDS.name.maxLength) {
    errors.push(
      `${WHATSAPP_SETTINGS_FIELDS.name.label} must be at most ${WHATSAPP_SETTINGS_FIELDS.name.maxLength} characters`
    );
  }

  if (!payload.description) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.description.label} is required`);
  } else if (payload.description.length > WHATSAPP_SETTINGS_FIELDS.description.maxLength) {
    errors.push(
      `${WHATSAPP_SETTINGS_FIELDS.description.label} must be at most ${WHATSAPP_SETTINGS_FIELDS.description.maxLength} characters`
    );
  }

  if (!payload.apiVersion) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.apiVersion.label} is required`);
  } else if (payload.apiVersion.length > WHATSAPP_SETTINGS_FIELDS.apiVersion.maxLength) {
    errors.push(
      `${WHATSAPP_SETTINGS_FIELDS.apiVersion.label} must be at most ${WHATSAPP_SETTINGS_FIELDS.apiVersion.maxLength} characters`
    );
  }

  if (!payload.phoneNumberId) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.phoneNumberId.label} is required`);
  } else if (payload.phoneNumberId.length > WHATSAPP_SETTINGS_FIELDS.phoneNumberId.maxLength) {
    errors.push(
      `${WHATSAPP_SETTINGS_FIELDS.phoneNumberId.label} must be at most ${WHATSAPP_SETTINGS_FIELDS.phoneNumberId.maxLength} characters`
    );
  }

  if (!payload.whatsappBusinessAccountId) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.whatsappBusinessAccountId.label} is required`);
  } else if (
    payload.whatsappBusinessAccountId.length > WHATSAPP_SETTINGS_FIELDS.whatsappBusinessAccountId.maxLength
  ) {
    errors.push(
      `${WHATSAPP_SETTINGS_FIELDS.whatsappBusinessAccountId.label} must be at most ${WHATSAPP_SETTINGS_FIELDS.whatsappBusinessAccountId.maxLength} characters`
    );
  }

  if (!payload.accessToken) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.accessToken.label} is required`);
  }

  if (!payload.verifyToken) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.verifyToken.label} is required`);
  } else if (payload.verifyToken.length > WHATSAPP_SETTINGS_FIELDS.verifyToken.maxLength) {
    errors.push(
      `${WHATSAPP_SETTINGS_FIELDS.verifyToken.label} must be at most ${WHATSAPP_SETTINGS_FIELDS.verifyToken.maxLength} characters`
    );
  }

  if (payload.webhookUrl && payload.webhookUrl.length > WHATSAPP_SETTINGS_FIELDS.webhookUrl.maxLength) {
    errors.push(
      `${WHATSAPP_SETTINGS_FIELDS.webhookUrl.label} must be at most ${WHATSAPP_SETTINGS_FIELDS.webhookUrl.maxLength} characters`
    );
  }

  if (payload.enabled !== true && payload.enabled !== false) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.enabled.label} is required`);
  }

  return errors;
};

const validateWhatsAppConnection = (payload: {
  apiVersion: string;
  phoneNumberId: string;
  accessToken: string;
}) => {
  const errors: string[] = [];

  if (!payload.apiVersion) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.apiVersion.label} is required`);
  }
  if (!payload.phoneNumberId) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.phoneNumberId.label} is required`);
  }
  if (!payload.accessToken) {
    errors.push(`${WHATSAPP_SETTINGS_FIELDS.accessToken.label} is required`);
  }

  return errors;
};

const WhatsAppSettings = () => {
  const dispatch = useAppDispatch();
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettingsType>({ ...newWhatsAppSettings });

  const { data: whatsAppSettingsList, isLoading, refetch } = useGetAllWhatsAppSettingsQuery();
  const [createWhatsAppSettings, { isLoading: isCreating }] = useCreateWhatsAppSettingsMutation();
  const [updateWhatsAppSettings, { isLoading: isUpdating }] = useUpdateWhatsAppSettingsMutation();
  const [testWhatsAppConnection, { isLoading: isTestingConnection }] =
    useTestWhatsAppSettingsConnectionMutation();

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [dispatch]);

  useEffect(() => {
    if (whatsAppSettingsList && whatsAppSettingsList.length > 0) {
      const nextSettings = whatsAppSettingsList[0];
      if (!whatsAppSettings.id || whatsAppSettings.id !== nextSettings.id) {
        setWhatsAppSettings(nextSettings);
      }
    } else if (whatsAppSettings.id) {
      setWhatsAppSettings({ ...newWhatsAppSettings });
    }
  }, [whatsAppSettingsList, whatsAppSettings.id]);

  const divContent = 'WhatsApp Settings';
  dispatch(setPageCode('WHATSAPP_SETTINGS'));
  dispatch(setDivContent(divContent));

  const buildPayload = () => ({
    name: String(whatsAppSettings.name ?? '').trim(),
    description: String(whatsAppSettings.description ?? '').trim(),
    apiVersion: String(whatsAppSettings.apiVersion ?? '').trim(),
    phoneNumberId: String(whatsAppSettings.phoneNumberId ?? '').trim(),
    whatsappBusinessAccountId: String(whatsAppSettings.whatsappBusinessAccountId ?? '').trim(),
    accessToken: String(whatsAppSettings.accessToken ?? ''),
    verifyToken: String(whatsAppSettings.verifyToken ?? '').trim(),
    webhookUrl: String(whatsAppSettings.webhookUrl ?? '').trim() || null,
    enabled: whatsAppSettings.enabled === true,
  });

  const buildConnectionPayload = () => ({
    apiVersion: String(whatsAppSettings.apiVersion ?? '').trim(),
    phoneNumberId: String(whatsAppSettings.phoneNumberId ?? '').trim(),
    accessToken: String(whatsAppSettings.accessToken ?? ''),
  });

  const handleTestConnection = async () => {
    const payload = buildConnectionPayload();
    const validationErrors = validateWhatsAppConnection(payload);

    if (validationErrors.length > 0) {
      dispatch(notify({ msg: validationErrors.join(', '), sev: 'warning' }));
      return;
    }

    try {
      await testWhatsAppConnection(payload).unwrap();
      dispatch(notify({ msg: 'WhatsApp connection tested successfully.', sev: 'success' }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to connect to the WhatsApp Cloud API.',
          sev: 'error',
        })
      );
    }
  };

  const handleSave = async () => {
    const payload = buildPayload();
    const validationErrors = validateWhatsAppSettings(payload);

    if (validationErrors.length > 0) {
      dispatch(notify({ msg: validationErrors.join(', '), sev: 'warning' }));
      return;
    }

    try {
      if (whatsAppSettings.id) {
        await updateWhatsAppSettings({
          id: whatsAppSettings.id,
          ...payload,
        }).unwrap();
        dispatch(notify({ msg: 'WhatsApp settings updated successfully', sev: 'success' }));
      } else {
        await createWhatsAppSettings(payload).unwrap();
        dispatch(notify({ msg: 'WhatsApp settings saved successfully', sev: 'success' }));
      }
      refetch();
    } catch (error: any) {
      const status = error?.status ?? error?.originalStatus;
      const errorMessage =
        status === 409
          ? 'WhatsApp settings already exist. Please update the existing configuration.'
          : error?.data?.message || error?.message || 'Failed to save WhatsApp settings';
      dispatch(notify({ msg: errorMessage, sev: 'error' }));
    }
  };

  const isLoadingData = isLoading || isCreating || isUpdating || isTestingConnection;

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Form fluid dir={dir}>
      <div className="organization-sections-container">
        <div className="organization-section-Column">
          <Section
            title={<Translate>API Configuration</Translate>}
            content={
              <div className="organization-section">
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Name</Translate>}
                      fieldName="name"
                      record={whatsAppSettings}
                      setRecord={setWhatsAppSettings}
                      required={WHATSAPP_SETTINGS_FIELDS.name.required}
                      maxLength={WHATSAPP_SETTINGS_FIELDS.name.maxLength}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>API Version</Translate>}
                      fieldName="apiVersion"
                      record={whatsAppSettings}
                      setRecord={setWhatsAppSettings}
                      required={WHATSAPP_SETTINGS_FIELDS.apiVersion.required}
                      maxLength={WHATSAPP_SETTINGS_FIELDS.apiVersion.maxLength}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Phone Number ID</Translate>}
                      fieldName="phoneNumberId"
                      record={whatsAppSettings}
                      setRecord={setWhatsAppSettings}
                      required={WHATSAPP_SETTINGS_FIELDS.phoneNumberId.required}
                      maxLength={WHATSAPP_SETTINGS_FIELDS.phoneNumberId.maxLength}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>WhatsApp Business Account ID</Translate>}
                      fieldName="whatsappBusinessAccountId"
                      record={whatsAppSettings}
                      setRecord={setWhatsAppSettings}
                      required={WHATSAPP_SETTINGS_FIELDS.whatsappBusinessAccountId.required}
                      maxLength={WHATSAPP_SETTINGS_FIELDS.whatsappBusinessAccountId.maxLength}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Enabled</Translate>}
                      fieldName="enabled"
                      fieldType="check"
                      record={whatsAppSettings}
                      setRecord={setWhatsAppSettings}
                      required={WHATSAPP_SETTINGS_FIELDS.enabled.required}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                </Row>
              </div>
            }
            setOpen={() => {}}
            rightLink={null}
            openedContent={null}
            disabled={isLoadingData}
          />
        </div>
        <div className="organization-section-Column">
          <Section
            title={<Translate>Credentials & Webhook</Translate>}
            content={
              <div className="organization-section">
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Access Token</Translate>}
                      fieldName="accessToken"
                      fieldType="password"
                      record={whatsAppSettings}
                      setRecord={setWhatsAppSettings}
                      required={WHATSAPP_SETTINGS_FIELDS.accessToken.required}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Verify Token</Translate>}
                      fieldName="verifyToken"
                      fieldType="password"
                      record={whatsAppSettings}
                      setRecord={setWhatsAppSettings}
                      required={WHATSAPP_SETTINGS_FIELDS.verifyToken.required}
                      maxLength={WHATSAPP_SETTINGS_FIELDS.verifyToken.maxLength}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                </Row>
                <Row>
                  <MyInput
                    fieldLabel={<Translate>Webhook URL</Translate>}
                    fieldName="webhookUrl"
                    record={whatsAppSettings}
                    setRecord={setWhatsAppSettings}
                    width="100%"
                    maxLength={WHATSAPP_SETTINGS_FIELDS.webhookUrl.maxLength}
                    disabled={isLoadingData}
                  />
                </Row>
                <Row>
                  <MyInput
                    fieldLabel={<Translate>Description</Translate>}
                    fieldName="description"
                    fieldType="textarea"
                    record={whatsAppSettings}
                    setRecord={setWhatsAppSettings}
                    width="100%"
                    rows={4}
                    required={WHATSAPP_SETTINGS_FIELDS.description.required}
                    maxLength={WHATSAPP_SETTINGS_FIELDS.description.maxLength}
                    disabled={isLoadingData}
                  />
                </Row>
              </div>
            }
            setOpen={() => {}}
            rightLink={null}
            openedContent={null}
            disabled={isLoadingData}
          />
        </div>
      </div>
      <div className="organization-modal-actions">
        <MyButton
          appearance="default"
          onClick={handleTestConnection}
          disabled={isLoadingData}
          loading={isTestingConnection}
        >
          Test Connection
        </MyButton>
        <MyButton
          appearance="primary"
          onClick={handleSave}
          disabled={isLoadingData}
          loading={isCreating || isUpdating}
        >
          Save
        </MyButton>
      </div>
    </Form>
  );
};

export default WhatsAppSettings;
