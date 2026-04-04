

import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { MdHolidayVillage } from "react-icons/md";
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import { useCreateOrganizationHolidayMutation, useUpdateOrganizationHolidayMutation } from '@/services/system-configurations/organizationHolidaysService';
import { OrganizationHolidayCreateDTO, OrganizationHolidayUpdateDTO } from '@/types/model-types-new';
import { newOrganizationHolidayCreateDTO, newOrganizationHolidayUpdateDTO } from '@/types/model-types-constructor-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import './styles.less';
const AddEditOrganizationHoliday = ({ open, setOpen, holiday, refetch, organization }) => {
  const dispatch = useAppDispatch();

  const [facilityIds, setFacilityIds] = useState({facilityIds: []})
  // DTOs
  const [createDTO, setCreateDTO] = useState<OrganizationHolidayCreateDTO>({ ...newOrganizationHolidayCreateDTO });
  const [updateDTO, setUpdateDTO] = useState<OrganizationHolidayUpdateDTO>({ ...newOrganizationHolidayUpdateDTO });

  const [createHoliday] = useCreateOrganizationHolidayMutation();
  const [updateHoliday] = useUpdateOrganizationHolidayMutation();
  const holidayTypeEnum = useEnumOptions('HolidayType');
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  // Initialize DTOs
  useEffect(() => {
    if (holiday?.id) {
      setUpdateDTO({
        id: holiday.id,
        name: holiday.name,
        holidayType: holiday.holidayType,
        startDate: holiday.startDate,
        endDate: holiday.endDate,
        reason: holiday.reason,
        allFacilities: holiday.allFacilities,
        facilityIds: holiday.facilityIds,
        recurring: holiday.recurring,
        isActive: holiday.isActive,
      });
    } else {
      setCreateDTO({ ...newOrganizationHolidayCreateDTO, organizationDefinitionId: organization?.id });
    }
    setFacilityIds({facilityIds :holiday.facilityIds
          ? holiday.facilityIds.split(',').map(id => Number(id))
          : []});
  }, [holiday, organization]);

   useEffect(() => {
      if (!holiday?.id) {
        if (createDTO.allFacilities) {
          setCreateDTO(prev => ({
            ...prev,
            facilityIds: undefined
          }));
          setFacilityIds({facilityIds: []})
        } 
      } else {
        if (updateDTO.allFacilities) {
          setUpdateDTO(prev => ({
            ...prev,
            facilityIds: undefined
          }));
          setFacilityIds({facilityIds: []})
        } 
      }
    }, [
      createDTO.allFacilities,
      updateDTO.allFacilities
    ]);
    
  const handleSubmit = async () => {
    let dto = holiday?.id ? updateDTO : createDTO;
     dto = { ...dto, facilityIds: facilityIds.facilityIds?.join(',') };
    // Validations
    let errorMsg = '';
    if (!dto.name) errorMsg = 'Name can’t be empty';
    if (!dto.holidayType) errorMsg = errorMsg ? `${errorMsg}, Holiday Type can’t be empty` : 'Holiday Type can’t be empty';
    if (!dto.startDate) errorMsg = errorMsg ? `${errorMsg}, Start Date can’t be empty` : 'Start Date can’t be empty';
    if (!dto.endDate) errorMsg = errorMsg ? `${errorMsg}, End Date can’t be empty` : 'End Date can’t be empty';
    if (!dto.allFacilities && !dto.facilityIds) errorMsg = errorMsg ? `${errorMsg}, You should select at least one facility` : 'You should select at least one facility';
    if (dto.allFacilities && dto.facilityIds) errorMsg = errorMsg ? `${errorMsg}, Facilities must be null` : 'Facilities must be null';
    if (dto.startDate && dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
      errorMsg = errorMsg ? `${errorMsg}, End Date cannot be before Start Date` : 'End Date cannot be before Start Date';
    }

    if (errorMsg) {
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      return;
    }

    try {
      if (holiday?.id) {
        let obj = { ...updateDTO, facilityIds: facilityIds.facilityIds?.join(',') };
        await updateHoliday(obj).unwrap();
        dispatch(notify({ msg: 'The Holiday was successfully Updated', sev: 'success' }));
      } else {
        let obj = { ...createDTO, facilityIds: facilityIds.facilityIds?.join(',') };
        await createHoliday(obj).unwrap();
        dispatch(notify({ msg: 'The Holiday was successfully Created', sev: 'success' }));
      }

      refetch();
      setOpen(false);
      // Reset
      setCreateDTO({ ...newOrganizationHolidayCreateDTO, organizationDefinitionId: organization?.id });
      setUpdateDTO({ ...newOrganizationHolidayUpdateDTO });
    } catch (e) {
      dispatch(notify({ msg: 'Failed to save Holiday', sev: 'warning' }));
    }
  };

  const conjureFormContentOfMainModal = stepNumber => {
    const dto = holiday?.id ? updateDTO : createDTO;
    const setDTO = holiday?.id ? setUpdateDTO : setCreateDTO;

    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className='container-of-add-edit-organization-holiday'>
              <Row>
                <Col md={12}>
                  <MyInput fieldName="name" fieldType="text" record={dto} setRecord={setDTO} width="100%" required />
                </Col>
                <Col md={12}>
                  <MyInput fieldName="holidayType" fieldType="select" selectData={holidayTypeEnum} selectDataLabel="label" selectDataValue="value" record={dto} setRecord={setDTO} width="100%" required />
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <MyInput fieldName="startDate" fieldType="date" record={dto} setRecord={setDTO} width="100%" required />
                </Col>
                <Col md={12}>
                  <MyInput fieldName="endDate" fieldType="date" record={dto} setRecord={setDTO} width="100%" required />
                </Col>
              </Row>
              <Row>
                <MyInput fieldName="reason" fieldType="textarea" record={dto} setRecord={setDTO} width="100%" />
              </Row>
              <Row>
                <Col md={12}>
                  <MyInput fieldName="allFacilities" fieldType="checkbox" record={dto} setRecord={setDTO} width="100%" />
                </Col>
                <Col md={12}>
                  {/* <MyInput fieldName="facilityId" fieldType="select" record={dto} setRecord={setDTO} width="100%" disabled={dto.allFacilities} /> */}
                  <MyInput
                fieldName="facilityIds"
                fieldType="multyPicker"
                fieldLabel="Facilities"
                selectData={facilityListResponse}
                selectDataLabel="name"
                selectDataValue="id"
                record={facilityIds}
                setRecord={setFacilityIds}
                width="100%"
                 disabled={dto.allFacilities}
              />
                </Col>
              </Row>
              <Row>
                <MyInput fieldName="recurring" fieldType="checkbox" record={dto} setRecord={setDTO} width="100%" />
              </Row>
            </div>
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
      actionButtonLabel={holiday?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSubmit}
      open={open}
      setOpen={setOpen}
      position="right"
      title={holiday?.id ? 'Edit Holiday' : 'New Holiday'}
      content={(stepNumber) => <div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>}
      steps={[{ title: 'Holiday Info', icon: <MdHolidayVillage /> }]}
      size='sm'
    />
  );
};

export default AddEditOrganizationHoliday;