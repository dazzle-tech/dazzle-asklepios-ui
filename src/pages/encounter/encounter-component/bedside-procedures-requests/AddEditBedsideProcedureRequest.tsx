import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { useGetCptListQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form, Radio, RadioGroup } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { initialListRequest, ListRequest } from '@/types/types';
import { faSuitcaseMedical } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
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
              label="CPT Code"
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
            <label><Translate>Executed By</Translate></label>
            <RadioGroup name="executedBy" inline>
              <Radio value="nurse"><Translate>Nurse</Translate></Radio>
              <Radio value="physician"><Translate>Physician</Translate></Radio>
            </RadioGroup>
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
      open={open}
      setOpen={setOpen}
      title="Bedside Procedures Requests"
      position="right"
      content={<div dir={dir}>{conjureFormContent()}</div>}
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
