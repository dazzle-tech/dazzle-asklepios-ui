import React, { useState } from 'react';
import { Panel, Divider, Form, Text } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import AddEditOutput from '@/pages/encounter/encounter-component/intake-output-balance/AddEditOutput';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';

interface OutputsTableProps {
  data: any[];
  totalOutput?: number;
}

const OutputsTable: React.FC<OutputsTableProps> = ({ data, totalOutput = 0 }) => {
  const [popupAddOutputOpen, setPopupAddOutputOpen] = useState(false);
  const [recordFilterOutput, setRecordFilterOutput] = useState({ date: '' });
  const [output, setOutput] = useState<any>({});

  const isSelectedOutput = (rowData: any) => (rowData?.key === output?.key ? 'selected-row' : '');

  return (
    <SectionContainer 
    title="Outputs"
    content={
      <>
       <Form fluid layout="inline" className="container-of-header-intake">
        <MyInput
          fieldName="date"
          fieldType="date"
          record={recordFilterOutput}
          setRecord={setRecordFilterOutput}
          showLabel={false}
        />
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={() => setPopupAddOutputOpen(true)}
          width="90px"
        >
          Add
        </MyButton>
      </Form>
      <MyTable
        data={data}
        columns={[
          { key: 'date', title: <Translate>Date</Translate> },
          { key: 'time', title: <Translate>Time</Translate> },
          { key: 'outputType', title: <Translate>Output Type</Translate> },
          { key: 'volume', title: <Translate>Volume</Translate> }
        ]}
        rowClassName={isSelectedOutput}
        onRowClick={rowData => setOutput(rowData)}
      />
      <label>Total Output: {totalOutput}</label>
      <AddEditOutput open={popupAddOutputOpen} setOpen={setPopupAddOutputOpen} width={window.innerWidth} />
      </>
    }
    />
  );
};

export default OutputsTable;
