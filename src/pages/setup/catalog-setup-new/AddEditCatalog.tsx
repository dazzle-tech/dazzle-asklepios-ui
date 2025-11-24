import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { GrCatalog } from "react-icons/gr";
import MyModal from '@/components/MyModal/MyModal';
import { useAddCatalogMutation, useUpdateCatalogMutation } from '@/services/setup/catalog/catalogService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { CatalogCreateVM, CatalogUpdateVM } from '@/types/model-types-new';
import { newCatalogCreateVM, newCatalogUpdateVM } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
const AddEditCatalog = ({ open, setOpen, diagnosticsTestCatalogHeader, setDiagnosticsTestCatalogHeader, width }) => {

  const dispatch = useAppDispatch();
  // Fetch test Type Lov Response
  const testTypeEnum = useEnumOptions('TestType');

  const [catalogCreateVM, setCatalogCreateVM] = useState<CatalogCreateVM>({...newCatalogCreateVM});
  const [catalogUpdateVM, setCatalogUpdateVM] = useState<CatalogUpdateVM>({...newCatalogUpdateVM});

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  const { data: departmentListResponse } =
  useGetActiveDepartmentByFacilityListQuery(
    {
      facilityId: diagnosticsTestCatalogHeader?.id
        ? catalogUpdateVM.facilityId
        : catalogCreateVM.facilityId
    },
    {
      skip: !(diagnosticsTestCatalogHeader?.id
        ? catalogUpdateVM.facilityId
        : catalogCreateVM.facilityId)
    }
  );

   

  useEffect(() => {
      if(diagnosticsTestCatalogHeader?.id)
        setCatalogUpdateVM({
          name: diagnosticsTestCatalogHeader?.name,
          description: diagnosticsTestCatalogHeader?.description,
          type: diagnosticsTestCatalogHeader?.type,
          departmentId: diagnosticsTestCatalogHeader?.departmentId,
          facilityId: diagnosticsTestCatalogHeader?.facilityId,
        });

  },[diagnosticsTestCatalogHeader]);

  // save diagnostics test catalog header
    const [addCatalog] = useAddCatalogMutation();
    const [updateCatalog] = useUpdateCatalogMutation();
   // handle Save catalog
   
    const handleSave = () => {
      setOpen(false);
      if(!diagnosticsTestCatalogHeader?.id)
      addCatalog(catalogCreateVM)
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'The Catalog has been added successfully', sev: 'success' }));
        })
        .catch(() => {
          dispatch(notify({ msg: 'Failed to add this Catalog', sev: 'error' }));
        });
        else
          updateCatalog({id: diagnosticsTestCatalogHeader?.id, body: catalogUpdateVM})
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'The Catalog has been updated successfully', sev: 'success' }));
        })
        .catch(() => {
          dispatch(notify({ msg: 'Failed to update this Catalog', sev: 'error' }));
        });
    };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
           <MyInput
              width="100%"
              fieldName="type"
              fieldType="select"
              selectData={testTypeEnum ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
              setRecord={!diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM}
              searchable={false}
            />
            {/* <MyInput
              width="100%"
              fieldType="select"
              fieldName="facilityId"
              fieldLabel="Facility"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
              setRecord={!diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM}
            /> */}
            <MyInput
                  placeholder="Select Facility"
                  width="100%"
                  fieldType="select"
                  fieldLabel="Facility"
                  selectData={facilityListResponse ?? []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="facilityId"
                  record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                 setRecord={!diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM}
                  searchable={false}
                />
            <MyInput
              width="100%"
              fieldName="departmentId"
              fieldType="select"
              selectData={departmentListResponse ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
              setRecord={!diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM}
               menuMaxHeight={200}
            />
            <MyInput
              width="100%"
              fieldName="name"
              fieldLabel="Catalog Name"
              // record={diagnosticsTestCatalogHeader}
              // setRecord={setDiagnosticsTestCatalogHeader}
              record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
              setRecord={!diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM}
            />

            <MyInput
              width="100%"
              fieldName="description"
              // record={diagnosticsTestCatalogHeader}
              // setRecord={setDiagnosticsTestCatalogHeader}
              record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
              setRecord={!diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM}
            />
          </Form>
        );
      
    }
  };
  return (
    <MyModal
      actionButtonLabel={diagnosticsTestCatalogHeader?.id ? 'Save' : 'Create'} 
      actionButtonFunction={handleSave}
      open={open}
      setOpen={setOpen}
      position="right"
      title={diagnosticsTestCatalogHeader?.id ? 'Edit Catalog' : 'New Catalog'}
      content={conjureFormContentOfMainModal}
      steps={[
        {
          title: 'Catalog Info',
          icon: <GrCatalog />,
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditCatalog;
