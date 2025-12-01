import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState, useRef } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { GrScheduleNew } from "react-icons/gr";
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';

type Resource = {
  id?: number;
  resourceType: string;
  resourceKey: string;
  isAllowParallel?: boolean;
  isActive?: boolean;
};

const AddEditResources = ({
  open,
  setOpen,
  width,
  resource,
  setResource,
  handleAddNew,
  handleUpdate,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  width: number;
  resource: Resource;
  setResource: (resource: Resource) => void;
  handleAddNew: () => void;
  handleUpdate: () => void;
}) => {
  const ResourceTypeEnum = useEnumOptions("ResourceType");
  const [resourceOptions, setResourceOptions] = useState<any[]>([]);
  const [resourceLabelField, setResourceLabelField] = useState<string>('id');
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(false);
  const prevResourceTypeRef = useRef<string>('');

  // Service hooks for fetching resources based on type
  const { data: diagnosticTestsData, isFetching: isLoadingTests } = useGetAllDiagnosticTestsQuery(
    { page: 0, size: 1000, sort: 'id,asc' },
    { skip: resource.resourceType !== 'MEDICAL_TEST' || !open }
  );
  
  const { data: practitionersData, isFetching: isLoadingPractitioners } = useGetAllPractitionersQuery(
    { page: 0, size: 1000, sort: 'id,asc' },
    { skip: resource.resourceType !== 'PRACTITIONER' || !open }
  );
  
  const { data: departmentsData, isFetching: isLoadingDepartments } = useGetDepartmentsQuery(
    { page: 0, size: 1000, sort: 'id,asc' },
    { skip: resource.resourceType !== 'CLINIC' || !open }
  );

  // Clear resourceKey when resourceType changes
  useEffect(() => {
    if (!open) return;
    
    const resourceTypeChanged = prevResourceTypeRef.current !== (resource.resourceType || '');
    
    if (resourceTypeChanged && resource.resourceKey) {
      setResource({ ...resource, resourceKey: '' });
    }
    
    prevResourceTypeRef.current = resource.resourceType || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.resourceType, open]);

  // Handle resource data based on type - using new enum values
  useEffect(() => {
    if (!open) {
      setResourceOptions([]);
      setIsLoadingResources(false);
      return;
    }

    if (!resource.resourceType) {
      setResourceOptions([]);
      setIsLoadingResources(false);
      return;
    }

    // Set loading state based on which resource type is selected
    setIsLoadingResources(
      (resource.resourceType === 'MEDICAL_TEST' && isLoadingTests) ||
      (resource.resourceType === 'PRACTITIONER' && isLoadingPractitioners) ||
      (resource.resourceType === 'CLINIC' && isLoadingDepartments)
    );

    // Handle MEDICAL_TEST
    if (resource.resourceType === 'MEDICAL_TEST' && diagnosticTestsData) {
      setResourceOptions(diagnosticTestsData.data || []);
      setResourceLabelField('name');
      setIsLoadingResources(false);
      return;
    }

    // Handle PRACTITIONER
    if (resource.resourceType === 'PRACTITIONER' && practitionersData) {
      const formattedPractitioners = (practitionersData.data || []).map((p: any) => ({
        id: p.id,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || `Practitioner ${p.id}`,
        ...p,
      }));
      setResourceOptions(formattedPractitioners);
      setResourceLabelField('name');
      setIsLoadingResources(false);
      return;
    }

    // Handle CLINIC (Department)
    if (resource.resourceType === 'CLINIC' && departmentsData) {
      setResourceOptions(departmentsData.data || []);
      setResourceLabelField('name');
      setIsLoadingResources(false);
      return;
    }

    // For other resource types (INPATIENT_ADMISSION, DAY_CASE, EMERGENCY, OPERATION)
    // Show empty options for now - can be extended later
    setResourceOptions([]);
    setResourceLabelField('id');
    setIsLoadingResources(false);
  }, [
    resource.resourceType,
    open,
    diagnosticTestsData,
    practitionersData,
    departmentsData,
    isLoadingTests,
    isLoadingPractitioners,
    isLoadingDepartments,
  ]);

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldLabel="Resource Type"
              fieldName="resourceType"
              fieldType="select"
              selectData={ResourceTypeEnum ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={resource}
              setRecord={setResource}
              menuMaxHeight={200}
              width={520}
              required
              searchable={false}
            />
            {(() => {
              // Static logic - easy to read and edit
              if (!resource.resourceType) {
                return (
                  <MyInput
                    fieldLabel="Resource"
                    fieldName="resourceKey"
                    fieldType="text"
                    record={resource}
                    setRecord={setResource}
                    width={520}
                    required
                    disabled
                    placeholder="Please select Resource Type first"
                  />
                );
              }

              // Show dropdown if we have resource options (PRACTITIONER, MEDICAL_TEST, CLINIC)
              if (resourceOptions.length > 0) {
                // Convert resourceKey appropriately for select matching
                // For select, we need to match the value type with selectDataValue (which is "id")
                const recordForSelect = {
                  ...resource,
                  resourceKey: resource.resourceKey && !isNaN(Number(resource.resourceKey))
                    ? Number(resource.resourceKey) 
                    : resource.resourceKey,
                };

                return (
                  <MyInput
                    fieldLabel="Resource"
                    fieldName="resourceKey"
                    fieldType="select"
                    selectData={resourceOptions}
                    selectDataLabel={resourceLabelField}
                    selectDataValue="id"
                    record={recordForSelect}
                    setRecord={(updated) => {
                      // The value passed is the selected ID (number)
                      // Convert it to string for storage in resourceKey
                      const selectedId = updated.resourceKey;
                      setResource({
                        ...resource,
                        resourceKey: selectedId != null ? String(selectedId) : '',
                      });
                    }}
                    menuMaxHeight={200}
                    width={520}
                    required
                    searchable
                    placeholder={isLoadingResources ? "Loading resources..." : "Select Resource"}
                    disabled={isLoadingResources}
                  />
                );
              } else {
                // For resource types without predefined options, show text input
                return (
                  <MyInput
                    fieldLabel="Resource Key"
                    fieldName="resourceKey"
                    fieldType="text"
                    record={resource}
                    setRecord={setResource}
                    width={520}
                    required
                    placeholder="Enter Resource Key"
                    disabled={isLoadingResources}
                  />
                );
              }
            })()}
            <MyInput
              fieldLabel="Allow Parallel"
              fieldName="isAllowParallel"
              fieldType="checkbox"
              record={resource}
              setRecord={setResource}
            />
          </Form>
        );
      default:
        return null;
    }
  };

  const handleSave = () => {
    if (resource?.id) {
      handleUpdate();
    } else {
      handleAddNew();
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={resource?.id ? 'Edit Resource' : 'New Resource'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={resource?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Resource Info', icon: <GrScheduleNew /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditResources;
