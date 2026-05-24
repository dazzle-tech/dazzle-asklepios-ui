import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import './styles.less';
import { GrCatalog } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import {
  useAddCatalogMutation,
  useUpdateCatalogMutation
} from '@/services/setup/catalog/catalogService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { CatalogCreateVM, CatalogUpdateVM } from '@/types/model-types-new';
import { newCatalogCreateVM, newCatalogUpdateVM } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
const AddEditCatalog = ({ open, setOpen, diagnosticsTestCatalogHeader, width }) => {
  const dispatch = useAppDispatch();
  const [catalogCreateVM, setCatalogCreateVM] = useState<CatalogCreateVM>({
    ...newCatalogCreateVM
  });
  const [catalogUpdateVM, setCatalogUpdateVM] = useState<CatalogUpdateVM>({
    ...newCatalogUpdateVM
  });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const { data: departmentListResponse } = useGetActiveDepartmentByFacilityListQuery(
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
  // Fetch test Type enum Response
  const testTypeEnum = useEnumOptions('TestType');
  const [addCatalog] = useAddCatalogMutation();
  const [updateCatalog] = useUpdateCatalogMutation();

  useEffect(() => {
    if (diagnosticsTestCatalogHeader?.id)
      setCatalogUpdateVM({
        name: diagnosticsTestCatalogHeader?.name,
        description: diagnosticsTestCatalogHeader?.description,
        type: diagnosticsTestCatalogHeader?.type,
        departmentId: diagnosticsTestCatalogHeader?.departmentId,
        facilityId: diagnosticsTestCatalogHeader?.facilityId,
        appointable: diagnosticsTestCatalogHeader?.appointable,
        parallelCapacityValue: diagnosticsTestCatalogHeader.parallelCapacityValue ?? 1,
        defaultDurationMinutes: diagnosticsTestCatalogHeader?.defaultDurationMinutes,
        defaultBufferBeforeMinutes: diagnosticsTestCatalogHeader.defaultBufferBeforeMinutes ?? 0,
        defaultBufferAfterMinutes: diagnosticsTestCatalogHeader.defaultBufferAfterMinutes ?? 0,
      });
  }, [diagnosticsTestCatalogHeader]);

  // handle Save catalog
  const handleSave = () => {

    let messages = [];
    const obj = !diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM;
    const isEmpty = (val) => val === null || val === undefined || val === '';
    const isNotEmpty = (val) => val !== null && val !== undefined && val !== '';
    if (
      obj?.parallelCapacityValue === null ||
      obj?.parallelCapacityValue === undefined ||
      obj?.parallelCapacityValue < 1
    ) {
      messages.push(
        'Field Parallel Capacity Value is required and should be greater than or equal to 1'
      );
    }
    if (obj?.appointable) {
      if (isEmpty(obj?.defaultDurationMinutes) || obj?.defaultDurationMinutes <= 0) {
        messages.push('Field Default Duration Minutes is required and should be greater than 0')
      }
      if (isEmpty(obj?.defaultBufferBeforeMinutes) || obj?.defaultBufferBeforeMinutes < 0) {
        messages.push('Field Default Buffer Before Minutes is required and should be greater then or equal 0')
      }
      if (isEmpty(obj?.defaultBufferAfterMinutes) || obj?.defaultBufferAfterMinutes < 0) {
        messages.push('Field Default Buffer After Minutes is required and should be greater then or equal 0')
      }
    }
    else {
      if (isNotEmpty(obj?.defaultDurationMinutes) && obj?.defaultDurationMinutes <= 0) {
        messages.push('Field Default Duration Minutes should be greater than 0')
      }
      if (isNotEmpty(obj?.defaultBufferBeforeMinutes) && obj?.defaultBufferBeforeMinutes < 0) {
        messages.push('Field Default Buffer Before Minutes should be greater then or equal 0')
      }
      if (isNotEmpty(obj?.defaultBufferAfterMinutes) && obj?.defaultBufferAfterMinutes < 0) {
        messages.push('Field Default Buffer After Minutes should be greater then or equal 0')
      }
    }
    if (messages.length > 0) {
      dispatch(
        notify({
          msg: messages.join(', '),
          sev: 'warning',
        })
      );

      return;
    }


    if (!diagnosticsTestCatalogHeader?.id) {
      addCatalog(catalogCreateVM)
        .unwrap()
        .then(() => {
          setOpen(false);
          setCatalogCreateVM({ ...newCatalogCreateVM });
          dispatch(notify({ msg: 'The Catalog has been added successfully', sev: 'success' }));
        })
        .catch(() => {
          dispatch(notify({ msg: 'Failed to add this Catalog', sev: 'warning' }));
        });
    } else {
      updateCatalog({ id: diagnosticsTestCatalogHeader?.id, body: catalogUpdateVM })
        .unwrap()
        .then(() => {
          setOpen(false);
          dispatch(notify({ msg: 'The Catalog has been updated successfully', sev: 'success' }));
        })
        .catch(() => {
          dispatch(notify({ msg: 'Failed to update this Catalog', sev: 'warning' }));
        });
    }
  };

  useEffect(() => {
    const appointable = !diagnosticsTestCatalogHeader?.id
      ? catalogCreateVM?.appointable
      : catalogUpdateVM?.appointable;

    if (!appointable) {
      if (!diagnosticsTestCatalogHeader?.id) {
        setCatalogCreateVM(prev => ({
          ...prev,
          defaultDurationMinutes: undefined, defaultBufferAfterMinutes: 0, defaultBufferBeforeMinutes: 0
        }));
      } else {
        setCatalogUpdateVM(prev => ({
          ...prev,
          defaultDurationMinutes: undefined, defaultBufferAfterMinutes: 0, defaultBufferBeforeMinutes: 0
        }));
      }
    }
  }, [catalogCreateVM?.appointable, catalogUpdateVM?.appointable]);
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="type"
                  fieldType="select"
                  selectData={testTypeEnum ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                  setRecord={
                    !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                  }
                  searchable={false}
                  required
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width={"100%"}
                  column
                  fieldLabel="Appointable"
                  fieldType="checkbox"
                  fieldName="appointable"
                  record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                  setRecord={
                    !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col md={12}>
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
                  setRecord={
                    !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                  }
                  searchable={false}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="departmentId"
                  fieldType="select"
                  selectData={departmentListResponse ?? []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                  setRecord={
                    !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                  }
                  menuMaxHeight={200}
                />
              </Col>
            </Row>
            <Row>
              <MyInput
                width="100%"
                fieldName="name"
                fieldLabel="Catalog Name"
                record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                setRecord={
                  !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                }
                required
              />
            </Row>
            <Row>
              <MyInput
                width="100%"
                fieldName="description"
                record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                setRecord={
                  !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                }
                required
              />
            </Row>
            <Row>
              <Col md={12}>
                <MyInput
                  fieldType="number"
                  fieldName="parallelCapacityValue"
                  record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                  setRecord={
                    !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                  }
                  width="100%"
                  required
                  showZero
                />
              </Col>
              {(
                !diagnosticsTestCatalogHeader?.id
                  ? catalogCreateVM?.appointable
                  : catalogUpdateVM?.appointable
              ) && (
                  <Col md={12}>
                    <MyInput
                      fieldType="number"
                      fieldName="defaultDurationMinutes"
                      record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                      setRecord={
                        !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                      }
                      width="100%"
                      required={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM?.appointable : catalogUpdateVM?.appointable}
                    showZero
                   />
                  </Col>
                )}
            </Row>
            {(
              !diagnosticsTestCatalogHeader?.id
                ? catalogCreateVM?.appointable
                : catalogUpdateVM?.appointable
            ) && (
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldType="number"
                      fieldName="defaultBufferBeforeMinutes"
                      record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                      setRecord={
                        !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                      }
                      width="100%"
                      required={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM?.appointable : catalogUpdateVM?.appointable}
                      showZero
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      fieldType="number"
                      fieldName="defaultBufferAfterMinutes"
                      record={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM : catalogUpdateVM}
                      setRecord={
                        !diagnosticsTestCatalogHeader?.id ? setCatalogCreateVM : setCatalogUpdateVM
                      }
                      width="100%"
                      required={!diagnosticsTestCatalogHeader?.id ? catalogCreateVM?.appointable : catalogUpdateVM?.appointable}
                      showZero
                    />
                  </Col>
                </Row>
              )}
          </Form>
        );
    }
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      actionButtonLabel={diagnosticsTestCatalogHeader?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      open={open}
      setOpen={setOpen}
      position="right"
      title={diagnosticsTestCatalogHeader?.id ? 'Edit Catalog' : 'New Catalog'}
      content={(stepNumber) => (<div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>)}
      steps={[
        {
          title: 'Catalog Info',
          icon: <GrCatalog />
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditCatalog;
