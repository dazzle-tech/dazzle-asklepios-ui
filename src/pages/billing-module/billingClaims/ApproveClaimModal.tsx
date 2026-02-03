import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './approve.less';
import { Form } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import Section from '@/components/Section';

const ApproveClaimModal = () => {
  const [record, setRecord] = useState<any>({
    hospitalAmount: 0,
    personalContribution: 0,
    totalAmount: 0
  });

  return (
    <div className="approve-claim-form">
        <Form fluid layout='inline'>
                  <div className="approve-grid">

            <MyInput
            fieldLabel="Response Number"
            fieldName="responseNumber"
            record={record}
            setRecord={setRecord}
            required
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Item Code"
            fieldName="itemCode"
            record={record}
            setRecord={setRecord}
            required
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Item Description"
            fieldName="itemDescription"
            record={record}
            setRecord={setRecord}
            required
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Hospital Amount"
            fieldName="hospitalAmount"
            fieldType="number"
            record={record}
            setRecord={setRecord}
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Date of Submission"
            fieldName="submissionDate"
            fieldType="date"
            record={record}
            setRecord={setRecord}
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Response Date"
            fieldName="responseDate"
            fieldType="date"
            record={record}
            setRecord={setRecord}
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Personal Contribution"
            fieldName="personalContribution"
            fieldType="number"
            record={record}
            setRecord={setRecord}
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Total Amount"
            fieldName="totalAmount"
            fieldType="number"
            record={record}
            setRecord={setRecord}
            disabled
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Note"
            fieldName="note"
            record={record}
            setRecord={setRecord}
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Diagnosis"
            fieldName="diagnosis"
            record={record}
            setRecord={setRecord}
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Clinical Note"
            fieldName="clinicalNote"
            record={record}
            setRecord={setRecord}
            width={"12vw"}
            column

            />

            <MyInput
            fieldLabel="Observation"
            fieldName="observation"
            record={record}
            setRecord={setRecord}
            width={"12vw"}
            column
            />
                  </div>


<div>
<Section
  key="additional-services"
  title={<Translate>Additional Services</Translate>}
  setOpen={() => {}}
  rightLink={null}
  openedContent={null}
  content={
    <div className="additional-services-grid">
      <div className="grid-header">
        <span>Service</span>
        <span>Hospital Amount</span>
        <span>Personal Contribution</span>
      </div>
      {[0, 1, 2, 3, 4].map(index => (
        <React.Fragment key={index}>
          <MyInput
            fieldName={`service_${index}`}
            fieldType="select"
            showLabel={false}
            record={record}
            setRecord={setRecord}
            column
          />

          <MyInput
            fieldName={`hospitalAmount_${index}`}
            fieldType="number"
            showLabel={false}
            record={record}
            setRecord={setRecord}
            column
          />

          <MyInput
            fieldName={`personalContribution_${index}`}
            fieldType="number"
            showLabel={false}
            record={record}
            setRecord={setRecord}
            column
          />
        </React.Fragment>
      ))}
    </div>
  }
/>





</div>


        </Form>
    </div>
  );
};

export default ApproveClaimModal;
