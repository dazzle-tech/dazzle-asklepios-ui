import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import {
  useGetOperationListQuery,
  useSaveOperationRequestsMutation
} from '@/services/operationService';
import {
  useGetDepartmentsQuery,
  useGetFacilitiesQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { newApOperationRequests } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faHeadSideMask, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { AttachmentUploadModal } from '@/components/AttachmentModals';
import SectionContainer from '@/components/SectionsoContainer';
const Details = ({
  open,
  setOpen,
  user,
  request,
  setRequest,
  refetch,
  encounter,
  patient,
  refetchrequest
}) => {
  const dispatch = useAppDispatch();
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  const { data: FacilityList } = useGetFacilitiesQuery({ ...initialListRequest });
  const { data: departmentList } = useGetDepartmentsQuery({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'facility_key',
        operator: 'match',
        value: request?.facilityKey
      },
      {
        fieldName: 'department_type_lkey',
        operator: 'match',
        //Operation Theater
        value: '5673990729647006'
      }
    ]
  });
  const { data: operationList } = useGetOperationListQuery({ ...initialListRequest });
  //get lovs
  const { data: procedureLevelLov } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: bodyPartsLov } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sidesLov } = useGetLovValuesByCodeQuery('SIDES');
  const { data: orderPriorityLov } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');

  const { data: anesthTypesLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: operationOrderTypeLov } = useGetLovValuesByCodeQuery('OPERATION_ORDER_TYPE');

  //save operation request
  const [save, saveMutation] = useSaveOperationRequestsMutation();

  const handleSave = async () => {
    try {
      const Response = await save({
        ...request,
        createdBy: user?.key,
        operationDateTime: new Date(request?.operationDateTime).getTime(),
        encounterKey: encounter?.key,
        patientKey: patient?.key,
        statusLkey: '3621653475992516'
      }).unwrap();

      dispatch(notify({ msg: Response.msg, sev: 'success' }));
      refetch();
      refetchrequest();
      setOpen(false);
      setRequest({
        ...newApOperationRequests,
        encounterKey: encounter?.key,
        patientKey: patient?.key
      });
    } catch (error) {
      dispatch(notify({ msg: 'Error saving procedure care', sev: 'error' }));
    }
  };

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Details"
        size="60vw"
        actionButtonFunction={handleSave}
        steps={[{ title: 'Request', icon: <FontAwesomeIcon icon={faHeadSideMask} /> }]}
        footerButtons={
          <MyButton
            onClick={() => setIsAttachmentModalOpen(true)}
            prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}
          >
            Add Attachment
          </MyButton>
        }
        content={
          <Form fluid className="gap-10">
            {/* First Row: Facility, Department, Operation Date Time, Priority */}
            <SectionContainer
              title={<></>}
              content={
                <Row gutter={20} className="rows-gap">
                  <Col md={6}>
                    <MyInput
                      fieldType="select"
                      selectData={FacilityList?.object ?? []}
                      selectDataLabel="facilityName"
                      selectDataValue="key"
                      width="100%"
                      fieldName="facilityKey"
                      record={request}
                      setRecord={setRequest}
                      fieldLabel="Facility"
                      showLabel={true}
                    />
                  </Col>
                  <Col md={6}>
                    <MyInput
                      fieldType="select"
                      selectData={departmentList?.object ?? []}
                      selectDataLabel="name"
                      selectDataValue="key"
                      width="100%"
                      fieldName="departmentKey"
                      record={request}
                      setRecord={setRequest}
                      fieldLabel="Department"
                      showLabel={true}
                    />
                  </Col>
                  <Col md={6}>
                    <MyInput
                      width="100%"
                      fieldType="datetime"
                      fieldName="operationDateTime"
                      record={request}
                      setRecord={setRequest}
                      fieldLabel="Operation Date Time"
                      showLabel={true}
                    />
                  </Col>
                  <Col md={6}>
                    <MyInput
                      fieldType="select"
                      selectData={orderPriorityLov?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      width="100%"
                      fieldName="priorityLkey"
                      record={request}
                      setRecord={setRequest}
                      searchable={false}
                      fieldLabel="Priority"
                      showLabel={true}
                    />
                  </Col>
                </Row>
              }
            ></SectionContainer>
            <div className="margin-top10">
              <SectionContainer
                title={<></>}
                content={
                  <>
                    {/* Second Row: Operation, Operation Level, Operation Type */}
                    <Row gutter={20} className="rows-gap">
                      <Col md={8}>
                        <MyInput
                          fieldType="select"
                          selectData={operationList?.object ?? []}
                          selectDataLabel="name"
                          selectDataValue="key"
                          width="100%"
                          fieldName="operationKey"
                          record={request}
                          setRecord={setRequest}
                          fieldLabel="Operation"
                          showLabel={true}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          fieldType="select"
                          selectData={procedureLevelLov?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          width="100%"
                          fieldName="operationLevelLkey"
                          record={request}
                          setRecord={setRequest}
                          fieldLabel="Operation Level"
                          showLabel={true}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          fieldType="select"
                          selectData={operationOrderTypeLov?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          width="100%"
                          fieldName="operationTypeLkey"
                          record={request}
                          setRecord={setRequest}
                          searchable={false}
                          fieldLabel="Operation Type"
                          showLabel={true}
                        />
                      </Col>
                    </Row>

                    {/* Third Row: Body Part, Side Of Procedure, Planned Anesthesia Type */}
                    <Row gutter={20} className="rows-gap">
                      <Col md={8}>
                        <MyInput
                          fieldType="select"
                          selectData={bodyPartsLov?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          width="100%"
                          fieldName="bodyPartLkey"
                          record={request}
                          setRecord={setRequest}
                          fieldLabel="Body Part"
                          showLabel={true}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          fieldType="select"
                          selectData={sidesLov?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          width="100%"
                          fieldName="sideOfProcedureLkey"
                          record={request}
                          setRecord={setRequest}
                          searchable={false}
                          fieldLabel="Side Of Procedure"
                          showLabel={true}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          fieldType="select"
                          selectData={anesthTypesLov?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          width="100%"
                          fieldName="plannedAnesthesiaTypeLkey"
                          record={request}
                          setRecord={setRequest}
                          searchable={false}
                          fieldLabel="Planned Anesthesia Type"
                          showLabel={true}
                        />
                      </Col>
                    </Row>

                    {/* Fourth Row: Diagnosis and Checkboxes */}
                    <Row gutter={20} className="rows-gap">
                      <Col md={12}>
                        <Icd10Search
                          object={request}
                          setOpject={setRequest}
                          fieldName="diagnosisKey"
                          fieldLabel="Diagnosis"
                        />
                      </Col>
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="implantOrDeviceExpected"
                          record={request}
                          setRecord={setRequest}
                          fieldLabel="Implant Or Device Expected"
                          showLabel={true}
                        />
                      </Col>
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="needBloodProducts"
                          record={request}
                          setRecord={setRequest}
                          fieldLabel="Need Blood Products"
                          showLabel={true}
                        />
                      </Col>
                    </Row>
                  </>
                }
              ></SectionContainer>
            </div>

            <div className="margin-top10">
              <SectionContainer
                title={<></>}
                content={
                  <Row gutter={20} className="rows-gap">
                    <Col md={12}>
                      <MyInput
                        fieldName="extraDocumentation"
                        fieldLabel="Extra Documentation"
                        fieldType="textarea"
                        record={request}
                        setRecord={setRequest}
                        showLabel={true}
                        width="100%"
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="textarea"
                        fieldName="notes"
                        record={request}
                        setRecord={setRequest}
                        fieldLabel="Notes"
                        showLabel={true}
                      />
                    </Col>
                  </Row>
                }
              ></SectionContainer>
            </div>
          </Form>
        }
      ></MyModal>
      <AttachmentUploadModal
        isOpen={isAttachmentModalOpen}
        setIsOpen={setIsAttachmentModalOpen}
        encounterId={encounter?.id || encounter?.key}
        refetchData={() => {}}
        source="OPERATION_REQUEST_ATTACHMENT"
      />
    </>
  );
};
export default Details;
