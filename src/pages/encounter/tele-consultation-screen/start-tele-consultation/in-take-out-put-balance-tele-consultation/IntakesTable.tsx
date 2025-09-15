import React, { useState } from 'react';
import { Panel, Divider, Form, Text } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import AddEditIntake from '@/pages/encounter/encounter-component/intake-output-balance/AddEditIntake';
import Translate from '@/components/Translate';

interface IntakesTableProps {
  data: any[];
  totalIntake?: number;
}

const IntakesTable: React.FC<IntakesTableProps> = ({ data, totalIntake = 0 }) => {
  const [popupAddIntakeOpen, setPopupAddIntakeOpen] = useState(false);
  const [recordFilterIntake, setRecordFilterIntake] = useState({ date: '' });
  const [intake, setIntake] = useState<any>({});

  const isSelectedIntake = (rowData: any) => (rowData?.key === intake?.key ? 'selected-row' : '');

  return (
    <div className="container-form-intakes-table">
      <div className="title-div">
        <Text>Intakes</Text>
      </div>
      <Divider />
      <Form fluid layout="inline" className="container-of-header-intake">
        <MyInput
          fieldName="date"
          fieldType="date"
          record={recordFilterIntake}
          setRecord={setRecordFilterIntake}
          showLabel={false}
        />
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={() => setPopupAddIntakeOpen(true)}
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
          { key: 'intakeType', title: <Translate>Intake Type</Translate> },
          { key: 'route', title: <Translate>Route</Translate> },
          { key: 'volume', title: <Translate>Volume</Translate> }
        ]}
        rowClassName={isSelectedIntake}
        onRowClick={(rowData) => setIntake(rowData)}
      />
      <label>Total Intake: {totalIntake}</label>
      <AddEditIntake open={popupAddIntakeOpen} setOpen={setPopupAddIntakeOpen} width={window.innerWidth} />
    </div>
  );
};

export default IntakesTable;
