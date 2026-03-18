import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import Section from '@/components/Section/Section';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import clsx from 'clsx';
import { OrganizationDefinition as OrganizationDefinitionType } from '@/types/model-types-new';
import { newOrganizationDefinition } from '@/types/model-types-constructor-new';
import {
  useGetAllOrganizationDefinitionsQuery,
  useCreateOrganizationDefinitionMutation,
  useUpdateOrganizationDefinitionMutation,
} from '@/services/system-configurations/organizationDefinitionService';
import ActiveAdminsModal from './ActiveAdminsModal';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';

const OrganizationDefinition = () => {
  const dispatch = useAppDispatch();
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [organization, setOrganization] = useState<OrganizationDefinitionType>({ ...newOrganizationDefinition });
  const [showAdminsModal, setShowAdminsModal] = useState(false);

  // API hooks
  const { data: organizations, isLoading, refetch } = useGetAllOrganizationDefinitionsQuery({});
  const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationDefinitionMutation();
  const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationDefinitionMutation();

  const {
    data: langData,
    isFetching: langsLoading,
    refetch: refetchLangs
  } = useGetAllLanguagesQuery({});
  const timeZone = useEnumOptions('TimeZone');

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [dispatch]);

  // Load existing organization if available
  useEffect(() => {
    if (organizations && organizations.length > 0) {
      setOrganization(organizations[0]);
    } else {
      setOrganization({ ...newOrganizationDefinition });
    }
  }, [organizations]);

  // Page header setup
  const divContent = 'Organization Definition';
  dispatch(setPageCode('ORGANIZATION_DEFINITION'));
  dispatch(setDivContent(divContent));

  // Handle save organization
  const handleSave = async () => {
    // Validation
    let errorMsg = '';
    if (!organization.name) {
      errorMsg = 'Organization Name is required';
      // return;
    }
    if (organization.taxValue === undefined || organization.taxValue === null) {
      // dispatch(notify({ msg: 'Tax Value is required', sev: 'warning' }));
      errorMsg = errorMsg ? `${errorMsg}, Tax Value is required` : 'Tax Value is required';
      // return;
    }
    if (!organization.defaultTimeZone) {
      errorMsg = errorMsg ? `${errorMsg}, Default Time Zone is required` : 'Default Time Zone is required';
      // dispatch(notify({ msg: 'Default Time Zone is required', sev: 'warning' }));
      // return;
    }
    if (!organization.defaultLanguageId) {
      errorMsg = errorMsg ? `${errorMsg}, Default Language is required` : 'Default Language is required';
      // dispatch(notify({ msg: 'Default Language is required', sev: 'warning' }));
      // return;
    }
    if (errorMsg) {
          dispatch(notify({ msg: errorMsg, sev: 'warning' }));
          return;
        }

    try {
      if (organization.id) {
        // Update existing organization
        const updatePayload = {
          id: organization.id!,
          name: organization.name!,
          description: organization.description || null,
          address: organization.address || null,
          contactName: organization.contactName || null,
          contactAddress: organization.contactAddress || null,
          contactEmail: organization.contactEmail || null,
          contactMobile: organization.contactMobile || null,
          contactLandNumber: organization.contactLandNumber || null,
          taxValue: organization.taxValue!,
          defaultTimeZone: organization.defaultTimeZone!,
          defaultLanguageId: organization.defaultLanguageId!,
          workingDays: organization.workingDays ?? [],
        };
        console.log("organization to update: ", updatePayload);
        await updateOrganization(updatePayload).unwrap();
        dispatch(notify({ msg: 'Organization updated successfully', sev: 'success' }));
      } else {
        // Create new organization
        await createOrganization({
          name: organization.name!,
          description: organization.description || null,
          address: organization.address || null,
          contactName: organization.contactName || null,
          contactAddress: organization.contactAddress || null,
          contactEmail: organization.contactEmail || null,
          contactMobile: organization.contactMobile || null,
          contactLandNumber: organization.contactLandNumber || null,
          taxValue: organization.taxValue || null,
          defaultTimeZone: organization.defaultTimeZone,
          defaultLanguageId: organization.defaultLanguageId
        }).unwrap();
        dispatch(notify({ msg: 'Organization saved successfully', sev: 'success' }));
      }
      refetch();
    } catch (error: any) {
      console.log("error: ", error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to save organization';
      dispatch(notify({ msg: errorMessage, sev: 'error' }));
    }
  };

  const isLoadingData = isLoading || isCreating || isUpdating;

  return (
    <div className="organization-definition-container">
      <Form fluid>
        {/* Section 1: Information */}
        <Section
          title={<Translate>Information</Translate>}
          content={
            <>
              <div className={clsx('organization-form-section', { 'two-columns': width > 600 })}>
                <MyInput
                  fieldLabel="Organization Name"
                  fieldName="name"
                  record={organization}
                  setRecord={setOrganization}
                  required
                  width={width > 600 ? "48%" : "100%"}
                  disabled={isLoadingData}
                />
                <MyInput
                  fieldLabel="Organization Address"
                  fieldName="address"
                  record={organization}
                  setRecord={setOrganization}
                  width={width > 600 ? "48%" : "100%"}
                  disabled={isLoadingData}
                />
              </div>
              <MyInput
                fieldLabel="Organization Description"
                fieldName="description"
                fieldType="textarea"
                record={organization}
                setRecord={setOrganization}
                width="100%"
                rows={3}
                disabled={isLoadingData}
              />
            </>
          }
          setOpen={() => { }}
          rightLink={null}
          openedContent={null}
          disabled={isLoadingData}
        />

        {/* Section 2: Contact */}
        <Section
          title={<Translate>Contact</Translate>}
          content={
            <>
              <div className={clsx('organization-form-section', { 'two-columns': width > 600 })}>
                <MyInput
                  fieldLabel="Organization Contact Name"
                  fieldName="contactName"
                  record={organization}
                  setRecord={setOrganization}
                  width={width > 600 ? "48%" : "100%"}
                  disabled={isLoadingData}
                />
                <MyInput
                  fieldLabel="Contact Email"
                  fieldName="contactEmail"
                  fieldType="text"
                  record={organization}
                  setRecord={setOrganization}
                  width={width > 600 ? "48%" : "100%"}
                  disabled={isLoadingData}
                />
              </div>
              <MyInput
                fieldLabel="Contact Address"
                fieldName="contactAddress"
                fieldType="textarea"
                record={organization}
                setRecord={setOrganization}
                width="100%"
                rows={2}
                disabled={isLoadingData}
              />
              <div className={clsx('organization-form-section', { 'two-columns': width > 600 })}>
                <MyInput
                  fieldLabel="Contact Mobile"
                  fieldName="contactMobile"
                  fieldType="text"
                  record={organization}
                  setRecord={setOrganization}
                  width={width > 600 ? "48%" : "100%"}
                  disabled={isLoadingData}
                />
                <MyInput
                  fieldLabel="Contact Land Number"
                  fieldName="contactLandNumber"
                  fieldType="text"
                  record={organization}
                  setRecord={setOrganization}
                  width={width > 600 ? "48%" : "100%"}
                  disabled={isLoadingData}
                />
              </div>
            </>
          }
          setOpen={() => { }}
          rightLink={null}
          openedContent={null}
          disabled={isLoadingData}
        />

        {/* Tax Value */}
        <Section
          title={<Translate>Tax Information</Translate>}
          content={
            <div className="organization-form-section">
              <MyInput
                fieldLabel="Tax Value (%)"
                fieldName="taxValue"
                fieldType="number"
                record={organization}
                setRecord={setOrganization}
                width={width > 600 ? "48%" : "100%"}
                disabled={isLoadingData}
                required
              />
            </div>
          }
          setOpen={() => { }}
          rightLink={null}
          openedContent={null}
          disabled={isLoadingData}
        />

        <Section
          title={<Translate>Appointment Configuration</Translate>}
          content={
            <div className="organization-form-section">

              <MyInput
                fieldName="defaultTimeZone"
                fieldType="select"
                selectData={timeZone ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={organization}
                setRecord={setOrganization}
                width={width > 600 ? "48%" : "100%"}
                disabled={isLoadingData}
                required
              />
              <MyInput
                width="100%"
                fieldName="defaultLanguageId"
                fieldLabel='Default Language'
                fieldType="select"
                selectData={langData}
                selectDataLabel="langName"
                selectDataValue="id"
                // defaultSelectValue={langdefult?.object?.key?.toString() ?? ''}
                record={organization}
                setRecord={setOrganization}
                placeholder="Select Language"
                searchable={false}
              />
            </div>
          }
          setOpen={() => { }}
          rightLink={null}
          openedContent={null}
          disabled={isLoadingData}
        />

        {/* Action Buttons */}
        <div className="organization-modal-actions">
          <MyButton
            appearance="default"
            onClick={() => setShowAdminsModal(true)}
            title={<Translate>View Active Admins</Translate>}
            disabled={isLoadingData}
            style={{ marginRight: '10px' }}
          >
            <Translate>View Active Admins</Translate>
          </MyButton>
          <MyButton
            appearance="primary"
            onClick={handleSave}
            title={<Translate>Save</Translate>}
            disabled={isLoadingData}
          >
            <Translate>Save</Translate>
          </MyButton>
        </div>
      </Form>

      {/* Active Admins Modal */}
      <ActiveAdminsModal
        open={showAdminsModal}
        onClose={() => setShowAdminsModal(false)}
      />

    </div>
  );
};

export default OrganizationDefinition;

