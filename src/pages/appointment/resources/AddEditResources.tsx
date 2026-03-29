import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppSelector } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetActiveAppointableDepartmentByTypeQuery } from '@/services/security/departmentService';
import { useGetAllActiveAppointableDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetActiveAppointablePractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetActiveAppointableProceduresQuery } from '@/services/setup/procedure/procedureService';
import React, { useEffect, useRef, useState } from 'react';
import { GrScheduleNew } from "react-icons/gr";
import { Form } from 'rsuite';
import './styles.less';

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
  handleAddNew: (resourceName?: string) => void;
  handleUpdate: (resourceName?: string) => void;
}) => {
      const authSlice = useAppSelector(state => state.auth);
    
       const selectedFacility = authSlice.selectedDepartment.facilityId;
     
  const ResourceTypeEnum = useEnumOptions("ResourceType");
  
  const DEFAULT_RESOURCE_TYPE = 'CLINIC';
  const [resourceOptions, setResourceOptions] = useState<any[]>([]);

  const [resourceLabelField, setResourceLabelField] = useState<string>('id');
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(false);
  const prevResourceTypeRef = useRef<string>('');

  // Set default resource type to CLINIC for new resources
  useEffect(() => {
    // Only set default for new resources (when resource.id is not set)
    if (resource?.id) {
      return;
    }

    // Skip if resourceType is already set to a valid value
    if (resource?.resourceType && resource.resourceType !== null && resource.resourceType !== '') {
      return;
    }

    // Set default to CLINIC when modal opens for new resource
    if (open && Array.isArray(ResourceTypeEnum) && ResourceTypeEnum.length > 0) {
      const normalize = (v: any) => String(v ?? '').trim().toLowerCase();

      const match =
        ResourceTypeEnum.find(
          (x: any) =>
            normalize(x?.label) === normalize(DEFAULT_RESOURCE_TYPE) ||
            normalize(x?.value) === normalize(DEFAULT_RESOURCE_TYPE)
        ) || null;

      if (match?.value) {
        setResource({
          ...resource,
          resourceType: match.value
        });
      } else {
        // Fallback: use DEFAULT_RESOURCE_TYPE directly
        setResource({
          ...resource,
          resourceType: DEFAULT_RESOURCE_TYPE
        });
      }
    } else if (open) {
      // Set default even if enum not loaded yet
      setResource({
        ...resource,
        resourceType: DEFAULT_RESOURCE_TYPE
      });
    }
  }, [ResourceTypeEnum, resource?.resourceType, resource?.id, open]);

  // Service hooks for fetching resources based on type
  const { data: diagnosticTestsData, isFetching: isLoadingTests } = useGetAllActiveAppointableDiagnosticTestsQuery(
    { page: 0, size: 1000, sort: 'id,asc' },
    { skip: resource.resourceType !== 'MEDICAL_TEST' || !open }
  );
  
  const { data: practitionersData, isFetching: isLoadingPractitioners } = useGetActiveAppointablePractitionersQuery(
    { page: 0, size: 1000, sort: 'id,asc' },
    { skip: resource.resourceType !== 'PRACTITIONER' || !open }
  );
  
  const {data:procedureData,isFetching:isLoadingProcedure}=useGetActiveAppointableProceduresQuery(
      { page: 0, size: 1000, sort: 'id,asc' },
    { skip: resource.resourceType !== 'PROCEDURE' || !open }
  )
    const [fetchDepartmentsByType, { data: departments ,isFetching:isLoadingDepartmentType}] = useLazyGetActiveAppointableDepartmentByTypeQuery();
 
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
 const DEPT_TYPES = ["CLINIC", "EMERGENCY", "INPATIENT_ADMISSION", "DAY_CASE"];

const TYPE_MAP: Record<string, string> = {
  CLINIC: "OUTPATIENT_CLINIC",
  EMERGENCY: "EMERGENCY_ROOM",
  INPATIENT_ADMISSION: "INPATIENT_WARD",
  DAY_CASE: "DAY_CASE",
};

useEffect(() => {
  if (!open) return;

  const apiType = TYPE_MAP[resource.resourceType];

  if (apiType) {
    fetchDepartmentsByType({
      type: apiType,
      facilityId: selectedFacility,
      page: 0,
      size: 100,
    });
  } else {
    setResourceOptions([]);
  }
}, [resource.resourceType, selectedFacility, open, fetchDepartmentsByType]);


useEffect(() => {
  if (!open) return;

  const isDeptType = DEPT_TYPES.includes(resource.resourceType);

  if (isDeptType) {
    setResourceOptions(departments?.data || []);
    setResourceLabelField("name");
  }
}, [departments, resource.resourceType, open]);

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

  const isDeptType = DEPT_TYPES.includes(resource.resourceType);

  setIsLoadingResources(
    (resource.resourceType === "MEDICAL_TEST" && isLoadingTests) ||
    (resource.resourceType === "PRACTITIONER" && isLoadingPractitioners) ||
    (resource.resourceType === "PROCEDURE" && isLoadingProcedure) ||
    (isDeptType && isLoadingDepartmentType)
  );

  if (resource.resourceType === "MEDICAL_TEST" && diagnosticTestsData) {
    setResourceOptions(diagnosticTestsData.data || []);
    setResourceLabelField("name");
    setIsLoadingResources(false);
    return;
  }
  if (resource.resourceType === "PROCEDURE" && procedureData) {
    setResourceOptions(procedureData.data || []);
    setResourceLabelField("name");
    setIsLoadingResources(false);
    return;
  }
  if (resource.resourceType === "PRACTITIONER" && practitionersData) {
    const formattedPractitioners = (practitionersData.data || []).map((p: any) => ({
      id: p.id,
      name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || `Practitioner ${p.id}`,
      ...p,
    }));
    setResourceOptions(formattedPractitioners);
    setResourceLabelField("name");
    setIsLoadingResources(false);
    return;
  }
  
  // أي نوع ثاني غير departments وغير اللي فوق
  if (!isDeptType) {
    setResourceOptions([]);
    setResourceLabelField("id");
    setIsLoadingResources(false);
  }
}, [
  resource.resourceType,
  open,
  diagnosticTestsData,
  practitionersData,
  isLoadingTests,
  isLoadingPractitioners,
  isLoadingDepartmentType,
  isLoadingProcedure
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
              disabled
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
    // Get resource name from resourceOptions based on resourceKey
    const selectedResource = resourceOptions.find((opt: any) => 
      String(opt.id) === String(resource.resourceKey)
    );
    const resourceName = selectedResource 
      ? (selectedResource[resourceLabelField] || selectedResource.name || selectedResource.id || resource.resourceKey)
      : resource.resourceKey;

    if (resource?.id) {
      handleUpdate(resourceName);
    } else {
      handleAddNew(resourceName);
    }
  };
            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={resource?.id ? 'Edit Resource' : 'New Resource'}
      position="right"
      content={(stepNumber) => (
        <div dir={dir}>
          {conjureFormContent(stepNumber)}
        </div>
      )}
      actionButtonLabel={resource?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Resource Info', icon: <GrScheduleNew /> }]}
      size={'40vw'}
    />
  );
};

export default AddEditResources;
