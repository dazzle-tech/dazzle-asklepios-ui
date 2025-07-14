import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { useGetCptListQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form, Radio, RadioGroup } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { initialListRequest, ListRequest } from '@/types/types';
import { faSuitcaseMedical } from '@fortawesome/free-solid-svg-icons';
const AddEditBedsideProcedureRequest = ({
  open,
  setOpen,
  width,
  bedsideProceduresRequest,
  setBedsideProceduresRequest
}) => {
  const [listRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ],
    pageSize: 15
  });
  // Fetch the CPT list data based on current filters
  const { data: cptListResponseLoading } = useGetCptListQuery(listRequest);

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldName="cptCode"
              fieldType="select"
              selectData={cptListResponseLoading?.object ?? []}
              selectDataLabel="description"
              selectDataValue="cptCode"
              record={bedsideProceduresRequest}
              setRecord={setBedsideProceduresRequest}
              width="100%"
              menuMaxHeight={200}
            />
            <MyInput
              width="100%"
              fieldName="executionDateTime"
              fieldType="datetime"
              record={bedsideProceduresRequest}
              setRecord={setBedsideProceduresRequest}
            />
            <label>Executed By</label>
            <RadioGroup name="executedBy" inline>
              <Radio value="nurse">Nurse</Radio>
              <Radio value="physician">Physician </Radio>
            </RadioGroup>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Bedside Procedures Requests"
      position="right"
      content={conjureFormContent}
      actionButtonLabel={'Create'}
      actionButtonFunction=""
      steps={[
        { title: 'Bedside Procedures Requests', icon: <FontAwesomeIcon icon={faSuitcaseMedical} /> }
      ]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditBedsideProcedureRequest;
