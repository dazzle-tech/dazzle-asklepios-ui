import React, { useEffect, useState } from 'react';
import { Form, Checkbox, CheckboxGroup, RadioGroup, Radio, Text, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddResourceModal.less';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus, FaTrash } from "react-icons/fa";
import SectionContainer from '@/components/SectionsoContainer';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { Department } from '@/types/model-types-new';
import { useGetAllServicesQuery, useGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';
import { newAvailabilityTemplateCreateDTO } from '@/types/model-types-constructor-new';
import { useCreateAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';



const AddResourceModal = ({
  // record,
  // setRecord,
  mainTemplate,
  open,
  setOpen,
  selectedDepartment,
  selectedFacility
}: {
  // record: any;
  // setRecord: any;
  mainTemplate: any;
  open: boolean;
  setOpen: any;
  selectedDepartment: any
  selectedFacility: any;
}) => {
  // console.log(mainTemplate);
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState({...newAvailabilityTemplateCreateDTO});
  useEffect(() => {
  setRecord({...record, parentTemplateId: mainTemplate?.id, facilityId: selectedFacility?.id, departmentId: mainTemplate?.departmentId});
  },[mainTemplate, selectedFacility]);
  const [currentColor, setCurrentColor] = useState(mainTemplate?.color || '#6982F0');

  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  const DayOfWeek = useEnumOptions('DayOfWeek');
  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetActiveFacilitiesQuery({});
  const { data: departmentListResponse } = useGetActiveDepartmentByFacilityListQuery(
    {
      facilityId: record?.facilityId
    },
    {
      skip: !record?.facilityId
    }
  );
  const { data: servicesByDepartmentList, isFetching: isFetchingServicesByDepartmentList, refetch: refetchservicesByDepartmentList } = useGetServicesByDepartmentQuery(
    {
      sourceId: selectedDepartment?.departmentId
    },
    {
      skip: !selectedDepartment?.departmentId
    }
  );
  const { data: practitionerListResponse } = useGetPractitionerByDepartmentQuery(
      {
        departmentId: record?.departmentId
      },
      {
        skip: !record?.departmentId
      }
    );
    const { data: servicesList, isFetching, refetch } = useGetAllServicesQuery({});
    const allServices = servicesList?.data ?? [];

  const conjureFormContent = () => (
    <Form fluid>
      <Row>
        <Col md={12}>
          <SectionContainer
            title="Basic Information "
            content={
              <>

                <Form fluid>
                  <Row>
                    <Col md={12}>
                      <MyInput
                        fieldName="templateName"
                        fieldType="text"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                        required
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        fieldName="status"
                        fieldType="select"
                        fieldLabel="Status"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                        isEnum
                        selectData={statusEnum ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        readOnly
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                     
                      <MyInput
                        fieldName="templateType"
                        record={record}
                        setRecord={setRecord}
                        fieldType='select'
                        selectData={templateTypeEnum ?? []}
                        selectDataLabel="label"
                        selectDataValue='value'
                        width="100%"
                      />
                    </Col>
                    {/* {record.templateType === 'PRACTITIONER' ?
                    (
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldName="departmentId"
                        fieldLabel="Department"
                        fieldType="select"
                        selectData={departmentListResponse ?? []}
                        selectDataLabel="name"
                        selectDataValue="id"
                        record={record}
                        setRecord={setRecord}
                        menuMaxHeight={200}
                        required
                      />
                    </Col>
                    ) : (record.templateType === 'PRACTITIONER') ? (

                    )
                  } */}
                  </Row>

                  <Row>
                    <Col md={12}>
                       <MyInput
                        column
                        fieldLabel="Facility"
                        selectData={facilityListResponse ?? []}
                        fieldType="select"
                        selectDataLabel="name"
                        selectDataValue="id"
                        fieldName="facilityId"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                        required
                        disabled
                      />
                    </Col>
                    <div className="block">
                      <Translate>Color</Translate>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={currentColor}
                          onChange={e => {
                            const nextColor = e.target.value;
                            setCurrentColor(nextColor);
                            setRecord(prev => ({ ...prev, templateColor: nextColor }));
                          }}
                        />
                      </div>
                    </div>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <MyInput
                        fieldName="durationMinutes"
                        fieldLabel='duration'
                        fieldType="number"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                        rightAddon="min"
                        required
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        fieldName="versionNo"
                        fieldType="number"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                      />
                    </Col>
                  </Row>




                </Form>

              </>
            }
          />
        </Col>
        <Col md={12}>
          <SectionContainer
            title="Department Details"
            content={
              <>
                <Form fluid>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldName="defaultServiceId"
                    selectData={servicesByDepartmentList?.data ?? []}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={record}
                    setRecord={setRecord}
                  />
                  <MyInput
                    width="100%"
                    fieldType="number"
                    fieldLabel="NumberOfResources"
                    fieldName="numberOfResourcesExpected"
                    record={record}
                    setRecord={setRecord}
                  />
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="check"
                        fieldName="requirePractitioner"
                        record={record}
                        setRecord={setRecord}
                        showLabel={false}
                      />
                    </Col>
                    {record['requirePractitioner'] && (
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="select"
                          fieldName="defaultPractitioner"
                          selectData={practitionerListResponse?.data ?? []}
                          selectDataLabel="firstName"
                          selectDataValue="id"
                          record={record}
                          setRecord={setRecord}
                        />
                      </Col>
                    )}
                  </Row>
                  <MyInput
                    width="100%"
                    fieldType="check"
                    fieldName="requirePreAssesment"
                    record={record}
                    setRecord={setRecord}
                    showLabel={false}
                  />
                </Form>
              </>
            }
          />
        </Col>
      </Row>

      <Row>
        <Col md={24}>
          <SectionContainer
            title="Services Allowed"
            content={
              <Form fluid>
                <Row>
                  {allServices.map((service: any) => {
                    const fieldName = `service_${service.id}`;
                    // const isChecked = selectedServiceIds.includes(service.id);
                    const isChecked = servicesByDepartmentList?.data?.some(s => s.id === service.id);
                    return (
                      <Col md={8} key={service.id}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName={fieldName}
                          record={{ [fieldName]: isChecked }}
                          setRecord={(next: any) => {
                            const checked = Boolean(next[fieldName]);
                            setRecord(prev => {
                              const prevIds = prev?.allowedServiceIds ?? [];
                              if (checked) {
                                if (prevIds.includes(service.id)) return prev;
                                return {
                                  ...prev,
                                  allowedServiceIds: [...prevIds, service.id]
                                };
                              }
                              return {
                                ...prev,
                                allowedServiceIds: prevIds.filter(
                                  (id: any) => id !== service.id
                                )
                              };
                            });
                          }}
                          showLabel={false}
                          label={service.name}
                        />
                      </Col>
                    );
                  })}
                </Row>
              </Form>
            }
          />
        </Col>
      </Row>


      {/* <SectionContainer
        title="Days"
        content={
          <Form fluid layout='inline'>
            {DayOfWeek?.map(day => (
              <MyInput
                key={day.value}
                width="13vw"
                fieldName={day.value}
                fieldType="check"
                record={workingDaysRecord}
                setRecord={setWorkingDaysRecord}
                label={day.label}
                showLabel={false}
              />
            ))}
          </Form>
        }
      /> */}
    </Form>
  );

   const [create] = useCreateAvailabilityTemplateMutation();
    const handleSaveMainInfo = () => {
      if (!record?.templateName?.trim()) {
        dispatch(notify({ msg: 'Template Name is required', sev: 'warning' }));
        return;
      }
      if (!record?.facilityId) {
        dispatch(notify({ msg: 'Facility is required', sev: 'warning' }));
        return;
      }
      if (!record?.departmentId) {
        dispatch(notify({ msg: 'Department is required', sev: 'warning' }));
        return;
      }
  
      // if (template?.id) {
  
      //   dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      //   setOpen(false);
      //   return;
      // }
  
  
  
      console.log("objectToAdd: ", { ...record, numberOfResourcesExpected: Number(record.numberOfResourcesExpected), durationMinutes: Number(record?.durationMinutes) });
      create({ ...record, resourceId: record?.departmentId, numberOfResourcesExpected: Number(record.numberOfResourcesExpected), durationMinutes: Number(record?.durationMinutes) }).unwrap();
      // setRecord(newTemplate);
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      setOpen(false);
    };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Resource"
      size="md"
      content={conjureFormContent}
      actionButtonFunction={handleSaveMainInfo}
      actionButtonLabel="Add"

    />
  );
};

export default AddResourceModal;
