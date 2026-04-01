import React, { useState, useEffect } from 'react';
import { Tabs, Divider, Form, RadioGroup, Radio, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';
import AvailabilityDayGrid from './AvailabilityDayGrid';
import PreviewAvailabilityModal from './PreviewAvailabilityModal';
import MyModal from '@/components/MyModal/MyModal';
import { useGetActiveFacilitiesQuery, useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { VscNotebookTemplate } from "react-icons/vsc";
import { title } from 'process';
import MyTab from '@/components/MyTab';
import { FaPlus } from "react-icons/fa";
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AddRoomModal from './AddRoomModal';
import AddExceptionModal from './AddExceptionModal';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetAllServicesQuery, useGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useEnumOptions } from '@/services/enumsApi';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

type Channel = {
  id: string;
  name: string;
  color?: string;
};


type Interval = {
  id: string;
  start: number;
  end: number;
  type?: 'NORMAL' | 'BREAK' | 'POOL';
  meta?: {
    name: string;
    capacity: number;
    step: number;
    slotsBefore: number;
    color?: string;
  };
};


type ChannelAvailability = {
  channelId: string;
  intervals: Interval[];
};

type AvailabilityByDay = {
  [dayIndex: number]: ChannelAvailability[];
};

type ChannelsByDay = {
  [dayIndex: number]: Channel[];
};






type AddEditAvailabilityTemplateProps = {
  open: boolean
  setOpen: any;
  template: AvailabilityTemplateResponseVM;
  templatesData: any;
  setTemplatesData: any
};

const AddEditAvailabilityTemplate: React.FC<AddEditAvailabilityTemplateProps> = ({ open, setOpen, template, templatesData, setTemplatesData }) => {
  const [activeChannel, setActiveChannel] = useState({
    id: 0,
    channelName: "",
    type: "Practitioner",
    capacity: 0,
    allowedServices: [],
    color: "",
    intervals: [],
    slotsBefore: 0
  });
  const [record, setRecord] = useState<any>(
    {
      name: '',
      facilityId: null,
      departmentId: null,
      effectiveFrom: null,
      effectiveTo: null,
      status: 'DRAFT',
      step: 60,
      slotsBefore: 5,
    }
  );

  const dispatch = useAppDispatch();
  const [activeDay, setActiveDay] = useState(0);



  const [availability, setAvailability] = useState<AvailabilityByDay>({});
  const [currentColor, setCurrentColor] = useState(record?.color || '#6982F0');
  const [openPreview, setOpenPreview] = useState(false);
  const [openAddChannelModal, setOpenAddChannelModal] = useState(false);
  const [openAddExceptionModal, setOpenAddExceptionModal] = useState<boolean>(false);
  const [publishChannelId, setPublishChannelId] = useState<string | null>(null);
  const [channelsByDay, setChannelsByDay] = useState<ChannelsByDay>({});
  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetActiveFacilitiesQuery({});
   const authSlice = useAppSelector((s) => s.auth);
  const selectedDepartment = authSlice.selectedDepartment;
   const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const { data: departmentListResponse } = useGetActiveDepartmentByFacilityListQuery(
    {
      facilityId: record?.facilityId
    },
    {
      skip: !record?.facilityId
    }
  );
  
 
  // const { data: servicesList, isFetching, refetch } = useGetAllServicesQuery({});
  const { data: servicesList, isFetching, refetch } = useGetServicesByDepartmentQuery(
    {
      sourceId: selectedDepartment?.departmentId
    },
    {
      skip: !selectedDepartment?.departmentId
    }
  );
  const { data: practitionerListResponse } = useGetAllPractitionersQuery({});
  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  console.log("practitionerListResponse");
  console.log(practitionerListResponse);

  const tabData = () => {
    let arr = [];
    {
      days.map((day, index) => (

        arr.push({
          title: day, content:
            <>
              <AvailabilityDayGrid
                step={120}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                channels={channelsByDay[activeDay] ?? []}
                availability={availability}
                setAvailability={setAvailability}
                onAddChannel={handleAddChannel}
                onRemoveChannel={handleRemoveChannel}
                // channelsDummyData={record?.channelsData?.[day] ?? []}
                templatesData={templatesData}
                setTemplatesData={setTemplatesData}
                template={record}
                day={day}
              />
            </>
        })
      ))
    }
    return arr;
  }


  const handleAddChannel = ({ name, color }: { name: string; color?: string }) => {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    setChannelsByDay(prev => ({
      ...prev,
      [activeDay]: [
        ...(prev[activeDay] ?? []),
        {
          id: crypto.randomUUID(),
          name: trimmedName,
          color: color ?? '#4C7EF3'
        }
      ]
    }));
  };

  const handleRemoveChannel = (channelId: string) => {
    setChannelsByDay(prev => ({
      ...prev,
      [activeDay]: (prev[activeDay] ?? []).filter(c => c.id !== channelId)
    }));
  };

  const handlePublish = () => {
    const newId = (templatesData.length + 1).toString();

    const newTemplate = { ...record, id: newId };


    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    daysOfWeek.forEach(day => {
      newTemplate.channelsData[day] = [
        {
          id: 1,
          channelName: 'General Clinic',
          type: 'Department Pool',
          capacity: '3 concurrent',
          allowedServices: ['service1, service2'],
          color: '#6982F0',
          intervals: [
            // { id: `int-${newId}-${day}`, startTime: "09:00", endTime: "12:00", slotDuration: "30 minutes" }
          ]
        }
      ];
    });

    setTemplatesData(prev => [...prev, newTemplate]);
    setRecord(newTemplate);

    dispatch(
      notify({
        msg: 'Added Successfully',
        sev: 'success',
      })
    );
  };


  // Effects
  useEffect(() => {
    setRecord({...template, facilityId: selectedFacility?.id});
  }, [template]);

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div className="availability-template-modal">
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
                        fieldName="name"
                        fieldType="text"
                        fieldLabel="Template Name"
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
                      </Row>
                      {/* <MyButton appearance="ghost" color="#525252" prefixIcon={() => <VscNotebookTemplate />
          }>
            Copy from template
          </MyButton> */}
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
                        fieldName="duration"
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
                        {/* <Row>
                          <Col md={12}> */}
                            <MyInput
                              width="100%"
                              fieldType="select"
                              fieldName="defaultService"
                              selectData={servicesList?.data ?? []}
                              selectDataLabel="name"
                              selectDataValue="id"
                              record={record}
                              setRecord={setRecord}
                            />
                          {/* </Col>
                          <Col md={12}> */}
                            <MyInput
                              width="100%"
                              fieldType="number"
                              fieldName="numberOfResources"
                              record={record}
                              setRecord={setRecord}
                            />
                          {/* </Col>
                        </Row> */}
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
                        {/* <Row> */}
                          {/* <Col md={12}>
                            <MyInput
                              width="100%"
                              fieldType="check"
                              fieldName="requireBilling"
                              record={record}
                              setRecord={setRecord}
                              showLabel={false}
                            />
                          </Col> */}
                          {/* <Col md={12}> */}
                            <MyInput
                              width="100%"
                              fieldType="check"
                              fieldName="requirePreAssesment"
                              record={record}
                              setRecord={setRecord}
                              showLabel={false}
                            />
                          {/* </Col>
                        </Row> */}
                      </Form>
                    </>
                  }
                />
              </Col>
              </Row>

            {/* <Row>
              <Col md={12}>
                <SectionContainer
                  title="Finantial Requirements"
                  content={
                    <Form fluid layout='inline'>

                      <RadioGroup
                        inline
                      >
                        <Radio value="insurance">Insurance</Radio>
                        <Radio value="cashe">Cashe</Radio>
                        <Radio value="both">Both</Radio>
                      </RadioGroup>

                    </Form>
                  }
                />
              </Col>
            </Row> */}

            <SectionContainer
              title="Days"
              content={
                <Form fluid layout='inline'>
                  {days.map((day) => (
                    <MyInput
                      key={day}
                      width="13vw"
                      fieldName="showCompleted"
                      fieldType="check"
                      record=""
                      setRecord={() => { }}
                      fieldLabel={day}
                      showLabel={false}
                    />
                  ))}
                </Form>
              }
            />


            {/* <SectionContainer
              title="Appointment Requirements"
              content={
                <Form fluid layout='inline'>
                  <MyInput
                    width="100%"
                    fieldType="check"
                    fieldName="canBookingFromPatientPortal"
                    record={record}
                    setRecord={setRecord}
                    showLabel={false}
                  />
                  <MyInput
                    width="100%"
                    fieldType="check"
                    fieldName="requireConfirmation"
                    record={record}
                    setRecord={setRecord}
                    showLabel={false}
                  />
                </Form>
              }
            /> */}

            <Divider />

            <div className="days-header">
              <MyTab
                data={tabData()}
              />


              <div className="days-actions">
                <MyButton
                  appearance="subtle"
                  disabled={record?.id ? false : true}
                  onClick={() => setOpenPreview(true)}
                >
                  <Translate>Preview slots</Translate>
                </MyButton>

                <MyButton
                  appearance="primary"
                  disabled={record?.id ? false : true}
                  onClick={() => setOpenAddExceptionModal(true)}
                >
                  <Translate>Add Exception</Translate>
                </MyButton>

                <MyButton
                  appearance="primary"
                  // onClick={() => setOpenPublishModal(true)}
                  disabled={record?.id ? true : false}
                  onClick={() => handlePublish()}
                >
                  Publish new version
                </MyButton>

              </div>
            </div>



            <PreviewAvailabilityModal
              open={openPreview}
              onClose={() => setOpenPreview(false)}
              templateName={record.name}
              step={record.step}
              channelsByDay={channelsByDay}
              availability={availability}
              slotsBeforeAfter={template.slotsBeforeAfter ?? 5}
            />

            <AddExceptionModal
              open={openAddExceptionModal}
              setOpen={setOpenAddExceptionModal}
              template={{}}
            />

          </div>
        );
    }
  };

  // return (
  //   <div className="availability-template-modal">
  //     <SectionContainer
  //      title="Basic Information "
  //      content={
  //        <>

  //     <Form fluid>
  //       <div className="template-header">
  //         <MyInput
  //           fieldName="name"
  //           fieldType="text"
  //           fieldLabel="Template Name"
  //           record={record}
  //           setRecord={setRecord}
  //           width="20vw"
  //           required
  //         />
  //         <MyInput
  //           column
  //           fieldLabel="Facility"
  //           selectData={facilityListResponse ?? []}
  //           fieldType="select"
  //           selectDataLabel="name"
  //           selectDataValue="id"
  //           fieldName="facilityId"
  //           record={record}
  //           setRecord={setRecord}
  //           width="14vw"
  //           required
  //         />

  //         <MyInput
  //           width="12vw"
  //           fieldName="departmentId"
  //           fieldLabel="Department"
  //           fieldType="select"
  //           selectData={departmentListResponse ?? []}
  //           selectDataLabel="name"
  //           selectDataValue="id"
  //           record={record}
  //           setRecord={setRecord}
  //           menuMaxHeight={200}
  //           required
  //         />

  //         {/* <MyButton appearance="ghost" color="#525252" prefixIcon={() => <VscNotebookTemplate />
  //         }>
  //           Copy from template
  //         </MyButton> */}
  //       </div>

  //       <div className="template-header2">

  //         <MyInput
  //           fieldName="status"
  //           fieldType="select"
  //           fieldLabel="Status"
  //           record={record}
  //           setRecord={setRecord}
  //           width="10vw"
  //           isEnum
  //           selectData={[
  //             { label: 'Draft', value: 'DRAFT' },
  //             { label: 'Active', value: 'ACTIVE' }
  //           ]}
  //           selectDataLabel="label"
  //           selectDataValue="value"
  //           readOnly
  //         />

  //         <MyInput
  //           fieldName="duration"
  //           fieldType="number"
  //           record={record}
  //           setRecord={setRecord}
  //           width="10vw"
  //           rightAddon="min"
  //         />

  //         <MyInput
  //           fieldName="versionNo"
  //           fieldType="number"
  //           record={record}
  //           setRecord={setRecord}
  //           width="6vw"
  //         />
  //          <MyInput
  //           fieldName="templateType"
  //           record={record}
  //           setRecord={setRecord}
  //           fieldType='select'
  //           selectData={templateTypeEnum ?? []}
  //           selectDataLabel="label"
  //           selectDataValue='value'
  //           width="6vw"
  //         />
  //       </div>


  //     </Form>

  //     </>
  //      }
  //     />
  //      <Row>
  //       <Col md={12}>
  //         <SectionContainer
  //           title="Department Details"
  //           content={
  //             <>
  //               <Form fluid>
  //                 <Row>
  //                   <Col md={12}>
  //                 <MyInput
  //                   width="100%"
  //                   fieldType="select"
  //                   fieldName="defaultService"
  //                   selectData={servicesList?.data ?? []}
  //                   selectDataLabel="name"
  //                   selectDataValue="id"
  //                   record={record}
  //                   setRecord={setRecord}
  //                 />
  //                 </Col>
  //                 <Col md={12}>
  //                 <MyInput
  //                   width="100%"
  //                   fieldType="number"
  //                   fieldName="numberOfResources"
  //                   record={record}
  //                   setRecord={setRecord}
  //                 />
  //                 </Col>
  //                 </Row>
  //                 <Row>
  //                   <Col md={12}>
  //                 <MyInput
  //                   width="100%"
  //                   fieldType="check"
  //                   fieldName="requirePractitioner"
  //                   record={record}
  //                   setRecord={setRecord}
  //                   showLabel={false}
  //                 />
  //                 </Col>
  //                 {record['requirePractitioner'] && (
  //                   <Col md={12}>
  //                   <MyInput
  //                     width="100%"
  //                     fieldType="select"
  //                     fieldName="defaultPractitioner"
  //                     selectData={practitionerListResponse?.data ?? []}
  //                     selectDataLabel="firstName"
  //                     selectDataValue="id"
  //                     record={record}
  //                     setRecord={setRecord}
  //                   />
  //                   </Col>
  //                 )}
  //                 </Row>
  //                 <Row>
  //                   <Col md={12}>
  //                 <MyInput
  //                   width="100%"
  //                   fieldType="check"
  //                   fieldName="requireBilling"
  //                   record={record}
  //                   setRecord={setRecord}
  //                   showLabel={false}
  //                 />
  //                 </Col>
  //                 <Col md={12}>
  //                 <MyInput
  //                   width="100%"
  //                   fieldType="check"
  //                   fieldName="requirePreAssesment"
  //                   record={record}
  //                   setRecord={setRecord}
  //                   showLabel={false}
  //                 />
  //                 </Col>
  //                 </Row>
  //               </Form>
  //             </>
  //           }
  //         />
  //       </Col>
  //       <Col md={12}>
  //         <SectionContainer
  //           title="Finantial Requirements"
  //           content={
  //             <Form fluid layout='inline'>

  //               <RadioGroup
  //                 inline
  //               >
  //                 <Radio value="insurance">Insurance</Radio>
  //                 <Radio value="cashe">Cashe</Radio>
  //                 <Radio value="both">Both</Radio>
  //               </RadioGroup>

  //             </Form>
  //           }
  //         />
  //       </Col>
  //     </Row>

  //     <SectionContainer
  //       title="Days"
  //       content={
  //         <Form fluid layout='inline'>
  //           {days.map((day) => (
  //             <MyInput
  //               key={day}
  //               width="13vw"
  //               fieldName="showCompleted"
  //               fieldType="check"
  //               record=""
  //               setRecord={() => { }}
  //               fieldLabel={day}
  //               showLabel={false}
  //             />
  //           ))}
  //         </Form>
  //       }
  //     />


  //     <SectionContainer
  //       title="Appointment Requirements"
  //       content={
  //         <Form fluid layout='inline'>
  //           <MyInput
  //             width="100%"
  //             fieldType="check"
  //             fieldName="canBookingFromPatientPortal"
  //             record={record}
  //             setRecord={setRecord}
  //             showLabel={false}
  //           />
  //           <MyInput
  //             width="100%"
  //             fieldType="check"
  //             fieldName="requireConfirmation"
  //             record={record}
  //             setRecord={setRecord}
  //             showLabel={false}
  //           />
  //         </Form>
  //       }
  //     />

  //     <Divider />

  //     <div className="days-header">
  //       <MyTab
  //         data={tabData()}
  //       />


  //       <div className="days-actions">
  //         <MyButton
  //           appearance="subtle"
  //           disabled={record?.id ? false : true}
  //           onClick={() => setOpenPreview(true)}
  //         >
  //           <Translate>Preview slots</Translate>
  //         </MyButton>

  //         <MyButton
  //           appearance="primary"
  //           disabled={record?.id ? false : true}
  //           onClick={() => setOpenAddExceptionModal(true)}
  //         >
  //           <Translate>Add Exception</Translate>
  //         </MyButton>

  //         <MyButton
  //           appearance="primary"
  //           // onClick={() => setOpenPublishModal(true)}
  //           disabled={record?.id ? true : false}
  //           onClick={() => handlePublish()}
  //         >
  //           Publish new version
  //         </MyButton>

  //       </div>
  //     </div>



  //     <PreviewAvailabilityModal
  //       open={openPreview}
  //       onClose={() => setOpenPreview(false)}
  //       templateName={record.name}
  //       step={record.step}
  //       channelsByDay={channelsByDay}
  //       availability={availability}
  //       slotsBeforeAfter={template.slotsBeforeAfter ?? 5}
  //     />

  //     <AddExceptionModal
  //       open={openAddExceptionModal}
  //       setOpen={setOpenAddExceptionModal}
  //       template={{}}
  //     />

  //   </div>
  // );
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        template?.id
          ? <Translate>Edit Availability Template</Translate>
          : <Translate>New Availability Template</Translate>
      }
      size="70vw"
      // content={
      //   <AddEditAvailabilityTemplate template={selectedTemplate} templatesData={templatesData} setTemplatesData={setTemplatesData} />
      // }
      content={conjureFormContent}
    />
  )
};

export default AddEditAvailabilityTemplate;
