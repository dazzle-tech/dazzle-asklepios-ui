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
import { EmailSettings as EmailSettingsType } from '@/types/model-types-new';
import { newEmailSettings } from '@/types/model-types-constructor-new';
import {
  useGetAllEmailSettingsQuery,
  useCreateEmailSettingsMutation,
  useUpdateEmailSettingsMutation,
  useTestEmailSettingsConnectionMutation,
} from '@/services/system-configurations/emailSettingsService';
import '../organization-definition/styles.less';

/** Mirrors EmailSettings entity @NotNull / column constraints. */
const EMAIL_SETTINGS_FIELDS = {
  serverName: { required: true, maxLength: 255, label: 'Server Name' },
  host: { required: true, maxLength: 255, label: 'Host' },
  description: { required: true, maxLength: 500, label: 'Description' },
  smtpPort: { required: true, label: 'SMTP Port' },
  fromAddress: { required: true, maxLength: 255, label: 'From Address' },
  password: { required: true, label: 'Password' },
  protocol: { required: true, label: 'Protocol' },
  tls: { required: true, label: 'TLS' },
  emailPrefix: { required: false, maxLength: 255, label: 'Email Prefix' },
  emailFooter: { required: false, label: 'Email Footer' },
} as const;

const validateEmailSettings = (payload: {
  serverName: string;
  host: string;
  description: string;
  smtpPort: number;
  fromAddress: string;
  password: string;
  protocol: string;
  tls: boolean;
  emailPrefix: string | null;
  emailFooter: string | null;
}) => {
  const errors: string[] = [];

  if (!payload.serverName) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.serverName.label} is required`);
  } else if (payload.serverName.length > EMAIL_SETTINGS_FIELDS.serverName.maxLength) {
    errors.push(
      `${EMAIL_SETTINGS_FIELDS.serverName.label} must be at most ${EMAIL_SETTINGS_FIELDS.serverName.maxLength} characters`
    );
  }

  if (!payload.host) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.host.label} is required`);
  } else if (payload.host.length > EMAIL_SETTINGS_FIELDS.host.maxLength) {
    errors.push(
      `${EMAIL_SETTINGS_FIELDS.host.label} must be at most ${EMAIL_SETTINGS_FIELDS.host.maxLength} characters`
    );
  }

  if (!payload.description) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.description.label} is required`);
  } else if (payload.description.length > EMAIL_SETTINGS_FIELDS.description.maxLength) {
    errors.push(
      `${EMAIL_SETTINGS_FIELDS.description.label} must be at most ${EMAIL_SETTINGS_FIELDS.description.maxLength} characters`
    );
  }

  if (!Number.isInteger(payload.smtpPort)) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.smtpPort.label} is required`);
  }

  if (!payload.fromAddress) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.fromAddress.label} is required`);
  } else if (payload.fromAddress.length > EMAIL_SETTINGS_FIELDS.fromAddress.maxLength) {
    errors.push(
      `${EMAIL_SETTINGS_FIELDS.fromAddress.label} must be at most ${EMAIL_SETTINGS_FIELDS.fromAddress.maxLength} characters`
    );
  }

  if (!payload.password) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.password.label} is required`);
  }

  if (!payload.protocol) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.protocol.label} is required`);
  }

  if (payload.tls !== true && payload.tls !== false) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.tls.label} is required`);
  }

  if (payload.emailPrefix && payload.emailPrefix.length > EMAIL_SETTINGS_FIELDS.emailPrefix.maxLength) {
    errors.push(
      `${EMAIL_SETTINGS_FIELDS.emailPrefix.label} must be at most ${EMAIL_SETTINGS_FIELDS.emailPrefix.maxLength} characters`
    );
  }

  return errors;
};

const validateEmailConnection = (payload: {
  serverName: string;
  host: string;
  smtpPort: number;
  fromAddress: string;
  password: string;
  protocol: string;
  tls: boolean;
}) => {
  const errors: string[] = [];

  if (!payload.serverName) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.serverName.label} is required`);
  }
  if (!payload.host) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.host.label} is required`);
  }
  if (!Number.isInteger(payload.smtpPort)) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.smtpPort.label} is required`);
  }
  if (!payload.fromAddress) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.fromAddress.label} is required`);
  }
  if (!payload.password) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.password.label} is required`);
  }
  if (!payload.protocol) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.protocol.label} is required`);
  }
  if (payload.tls !== true && payload.tls !== false) {
    errors.push(`${EMAIL_SETTINGS_FIELDS.tls.label} is required`);
  }

  return errors;
};

const EmailSettings = () => {
  const dispatch = useAppDispatch();
  const [emailSettings, setEmailSettings] = useState<EmailSettingsType>({ ...newEmailSettings });

  const { data: emailSettingsList, isLoading, refetch } = useGetAllEmailSettingsQuery();
  const [createEmailSettings, { isLoading: isCreating }] = useCreateEmailSettingsMutation();
  const [updateEmailSettings, { isLoading: isUpdating }] = useUpdateEmailSettingsMutation();
  const [testEmailConnection, { isLoading: isTestingConnection }] =
    useTestEmailSettingsConnectionMutation();

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [dispatch]);

  useEffect(() => {
    if (emailSettingsList && emailSettingsList.length > 0) {
      const nextSettings = emailSettingsList[0];
      if (!emailSettings.id || emailSettings.id !== nextSettings.id) {
        setEmailSettings(nextSettings);
      }
    } else if (emailSettings.id) {
      setEmailSettings({ ...newEmailSettings });
    }
  }, [emailSettingsList, emailSettings.id]);

  const divContent = 'Email Settings';
  dispatch(setPageCode('EMAIL_SETTINGS'));
  dispatch(setDivContent(divContent));

  const buildPayload = () => ({
    serverName: String(emailSettings.serverName ?? '').trim(),
    host: String(emailSettings.host ?? '').trim(),
    description: String(emailSettings.description ?? '').trim(),
    smtpPort: Number(emailSettings.smtpPort),
    fromAddress: String(emailSettings.fromAddress ?? '').trim(),
    password: String(emailSettings.password ?? ''),
    protocol: String(emailSettings.protocol ?? '').trim(),
    tls: emailSettings.tls === true,
    emailPrefix: String(emailSettings.emailPrefix ?? '').trim() || null,
    emailFooter: String(emailSettings.emailFooter ?? '').trim() || null,
  });

  const buildConnectionPayload = () => ({
    ...(emailSettings.id ? { id: emailSettings.id } : {}),
    serverName: String(emailSettings.serverName ?? '').trim(),
    host: String(emailSettings.host ?? '').trim(),
    smtpPort: Number(emailSettings.smtpPort),
    fromAddress: String(emailSettings.fromAddress ?? '').trim(),
    password: String(emailSettings.password ?? ''),
    protocol: String(emailSettings.protocol ?? '').trim(),
    tls: emailSettings.tls === true,
  });

  const handleTestConnection = async () => {
    const payload = buildConnectionPayload();
    const validationErrors = validateEmailConnection(payload);

    if (validationErrors.length > 0) {
      dispatch(notify({ msg: validationErrors.join(', '), sev: 'warning' }));
      return;
    }

    try {
      await testEmailConnection(payload).unwrap();
      dispatch(notify({ msg: 'Email connection tested successfully.', sev: 'success' }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to connect to the email server.',
          sev: 'error',
        })
      );
    }
  };

  const handleSave = async () => {
    const payload = buildPayload();
    const validationErrors = validateEmailSettings(payload);

    if (validationErrors.length > 0) {
      dispatch(notify({ msg: validationErrors.join(', '), sev: 'warning' }));
      return;
    }

    try {
      if (emailSettings.id) {
        await updateEmailSettings({
          id: emailSettings.id,
          ...payload,
        }).unwrap();
        dispatch(notify({ msg: 'Email settings updated successfully', sev: 'success' }));
      } else {
        await createEmailSettings(payload).unwrap();
        dispatch(notify({ msg: 'Email settings saved successfully', sev: 'success' }));
      }
      refetch();
    } catch (error: any) {
      const status = error?.status ?? error?.originalStatus;
      const errorMessage =
        status === 409
          ? 'Email settings already exist. Please update the existing configuration.'
          : error?.data?.message || error?.message || 'Failed to save email settings';
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
            title={<Translate>Server Configuration</Translate>}
            content={
              <div className="organization-section">
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Server Name</Translate>}
                      fieldName="serverName"
                      record={emailSettings}
                      setRecord={setEmailSettings}
                      required={EMAIL_SETTINGS_FIELDS.serverName.required}
                      maxLength={EMAIL_SETTINGS_FIELDS.serverName.maxLength}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Host</Translate>}
                      fieldName="host"
                      record={emailSettings}
                      setRecord={setEmailSettings}
                      required={EMAIL_SETTINGS_FIELDS.host.required}
                      maxLength={EMAIL_SETTINGS_FIELDS.host.maxLength}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>SMTP Port</Translate>}
                      fieldName="smtpPort"
                      fieldType="number"
                      record={emailSettings}
                      setRecord={setEmailSettings}
                      required={EMAIL_SETTINGS_FIELDS.smtpPort.required}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>From Address</Translate>}
                      fieldName="fromAddress"
                      record={emailSettings}
                      setRecord={setEmailSettings}
                      required={EMAIL_SETTINGS_FIELDS.fromAddress.required}
                      maxLength={EMAIL_SETTINGS_FIELDS.fromAddress.maxLength}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Password</Translate>}
                      fieldName="password"
                      fieldType="password"
                      record={emailSettings}
                      setRecord={setEmailSettings}
                      required={EMAIL_SETTINGS_FIELDS.password.required}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>Protocol</Translate>}
                      fieldName="protocol"
                      record={emailSettings}
                      setRecord={setEmailSettings}
                      required={EMAIL_SETTINGS_FIELDS.protocol.required}
                      width="100%"
                      disabled={isLoadingData}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldLabel={<Translate>TLS</Translate>}
                      fieldName="tls"
                      fieldType="check"
                      record={emailSettings}
                      setRecord={setEmailSettings}
                      required={EMAIL_SETTINGS_FIELDS.tls.required}
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
            title={<Translate>Email Content</Translate>}
            content={
              <div className="organization-section">
                <Row>
                  <MyInput
                    fieldLabel={<Translate>Description</Translate>}
                    fieldName="description"
                    fieldType="textarea"
                    record={emailSettings}
                    setRecord={setEmailSettings}
                    width="100%"
                    rows={3}
                    required={EMAIL_SETTINGS_FIELDS.description.required}
                    maxLength={EMAIL_SETTINGS_FIELDS.description.maxLength}
                    disabled={isLoadingData}
                  />
                </Row>
                <Row>
                  <MyInput
                    fieldLabel={<Translate>Email Prefix</Translate>}
                    fieldName="emailPrefix"
                    fieldType="textarea"
                    record={emailSettings}
                    setRecord={setEmailSettings}
                    width="100%"
                    rows={4}
                    maxLength={EMAIL_SETTINGS_FIELDS.emailPrefix.maxLength}
                    disabled={isLoadingData}
                  />
                </Row>
                <Row>
                  <MyInput
                    fieldLabel={<Translate>Email Footer</Translate>}
                    fieldName="emailFooter"
                    fieldType="textarea"
                    record={emailSettings}
                    setRecord={setEmailSettings}
                    width="100%"
                    rows={4}
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

export default EmailSettings;
