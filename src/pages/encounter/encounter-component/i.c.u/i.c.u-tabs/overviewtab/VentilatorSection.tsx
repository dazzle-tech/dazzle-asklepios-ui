import React, { useState } from "react";
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import DynamicCard from '@/components/DynamicCard';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMaskFace  } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import MyModal from "@/components/MyModal/MyModal";
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { Form, RadioGroup, Radio } from 'rsuite';
import './style.less';
const ventilatorData = [
  { label: 'Mode', value: 'PRVC', section: 'left', showLabel: true, type: 'text', labelGap: 280 },
  { label: 'FiO₂', value: '45%', section: 'left', showLabel: true, type: 'text', labelGap: 300 },
  { label: 'PEEP', value: '10', section: 'left', showLabel: true, type: 'text', labelGap: 300 },
];

const columns: ColumnConfig[] = [
  { key: 'mode', title: 'Mode', dataKey: 'mode', width: 70 },
  { key: 'fio2', title: 'FiO2', dataKey: 'fio2', width: 70 },
  { key: 'peep', title: 'PEEP', dataKey: 'peep', width: 70 },
  { key: 'tidalVolume', title: 'Tidal Volume', dataKey: 'tidalVolume', width: 70 },
  { key: 'minuteVolume', title: 'Minute Volume', dataKey: 'minuteVolume', width: 70 },
  { key: 'ps', title: 'PS', dataKey: 'ps', width: 70 },
  { key: 'ratePatient', title: 'Rate: Patient', dataKey: 'ratePatient', width: 70 },
  { key: 'setRate', title: 'Set Rate', dataKey: 'setRate', width: 70 },
  { key: 'pc', title: 'PC', dataKey: 'pc', width: 80, expandable:true },
  { key: 'etco2', title: 'ETCO2', dataKey: 'etco2', width: 80, expandable:true },
  { key: 'cuff', title: 'Cuff', dataKey: 'cuff', width: 80, expandable:true },
  { key: 'pap', title: 'PAP', dataKey: 'pap', width: 80, expandable:true },
  { key: 'rateVentilator', title: 'Rate: Ventilator', dataKey: 'rateVentilator', width: 100, expandable:true },
  { key: 'ettPositionCm', title: 'ETT Position (cm)', dataKey: 'ettPositionCm', width: 120, expandable:true },
  { key: 'suction', title: 'Suction', dataKey: 'suction', width: 100, expandable:true },
   {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdByAt',
   expandable:true,
    width: 200,
    render: row => (
      <>
        {row.createdBy}
        <br />
        <span className="date-table-style">{row.createdAt}</span>
      </>
    )
  }
];

const initialTableData = [
  {
    id: 1,
    mode: 'PRVC',
    fio2: 45,
    peep: 10,
    tidalVolume: 500,
    minuteVolume: 7,
    ps: 12,
    ratePatient: 18,
    setRate: 16,
    pc: 15,
    etco2: 35,
    cuff: 20,
    pap: 25,
    rateVentilator: 16,
    ettPositionCm: 22,
    suction: 'Oral',
    createdBy: "Dr. Ahmad",
    createdAt: "2025-09-21 09:30 AM",
  },
  {
    id: 2,
    mode: 'SIMV',
    fio2: 50,
    peep: 8,
    tidalVolume: 480,
    minuteVolume: 6.5,
    ps: 10,
    ratePatient: 20,
    setRate: 18,
    pc: 14,
    etco2: 36,
    cuff: 22,
    pap: 24,
    rateVentilator: 18,
    ettPositionCm: 21,
    suction: 'ETT',
    createdBy: "Nurse Layla",
    createdAt: "2025-09-21 11:15 AM",
  },
];

const VentilatorSection = () => {
  const [openVentilator, setOpenVentilator] = useState(false);
  const [record, setRecord] = useState<any>({});
const [tableData, setTableData] = useState<any[]>(initialTableData);

  const VentilatorForm = (<>
    <Form fluid>
      <div className="ventilator-drop-down-list-handle">
        <MyInput
          width="30vw"
          fieldLabel="Mode"
          fieldName="mode"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={[
            { key: 'PRVC', lovDisplayVale: 'PRVC' },
            { key: 'SIMV', lovDisplayVale: 'SIMV' },
            { key: 'AC', lovDisplayVale: 'AC' },
            { key: 'CPAP', lovDisplayVale: 'CPAP' },
          ]}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          searchable={false}
        />
      </div>

    <div className="ventilator-grid">
      <MyInput width="15vw" fieldLabel="FIO2" fieldName="fio2" fieldType="number" record={record} setRecord={setRecord} rightAddon="%" rightAddonwidth="auto" />
      <MyInput width="12vw" fieldLabel="PEEP" fieldName="peep" fieldType="number" record={record} setRecord={setRecord} rightAddon="cmH₂O" rightAddonwidth="auto"/>
      <MyInput width="14vw" fieldLabel="Tidal Volume" fieldName="tidalVolume" fieldType="number" record={record} setRecord={setRecord} rightAddon="mL" rightAddonwidth="auto"/>
      <MyInput width="14vw" fieldLabel="Minute Volume" fieldName="minuteVolume" fieldType="number" record={record} setRecord={setRecord} rightAddon="L/min" rightAddonwidth="auto"/>
      <MyInput width="12vw" fieldLabel="PS" fieldName="ps" fieldType="number" record={record} setRecord={setRecord} rightAddon="cmH₂O" rightAddonwidth="auto"/>
      <MyInput width="13vw" fieldLabel="Rate: Patient" fieldName="ratePatient" fieldType="number" record={record} setRecord={setRecord} rightAddon="bpm" rightAddonwidth="auto"/>
      <MyInput width="11vw" fieldLabel="Set Rate" fieldName="setRate" fieldType="number" record={record} setRecord={setRecord} rightAddon="breaths/min" rightAddonwidth="auto"/>
      <MyInput width="12vw" fieldLabel="PC" fieldName="pc" fieldType="number" record={record} setRecord={setRecord} rightAddon="cmH₂O" rightAddonwidth="auto"/>
      <MyInput width="12vw" fieldLabel="ETCO2" fieldName="etco2" fieldType="number" record={record} setRecord={setRecord} rightAddon="mmHg" rightAddonwidth="auto"/>
      <MyInput width="13vw" fieldLabel="Cuff" fieldName="cuff" fieldType="number" record={record} setRecord={setRecord} rightAddon="cmH₂O" rightAddonwidth="auto"/>
      <MyInput width="12vw" fieldLabel="PAP" fieldName="pap" fieldType="number" record={record} setRecord={setRecord} rightAddon="cmH₂O" rightAddonwidth="auto"/>
      <MyInput width="10vw" fieldLabel="Rate: Ventilator" fieldName="rateVentilator" fieldType="number" record={record} setRecord={setRecord} rightAddon="breaths/min" rightAddonwidth="auto"/>
      <MyInput width="15vw" fieldLabel="ETT Position (cm)" fieldName="ettPositionCm" fieldType="number" record={record} setRecord={setRecord} rightAddon="cm" rightAddonwidth="auto"/>
    </div>


      <div className='radio-buttons-overview-cards'>
        <RadioGroup
          name="suction"
          value={record.suction}
          onChange={(value) => setRecord(prev => ({ ...prev, suction: value }))}
          inline
        >
          <Radio value="Oral">Oral</Radio>
          <Radio value="ETT">ETT</Radio>
          <Radio value="None">None</Radio>
        </RadioGroup>
      </div>
    </Form>
          <div style={{ marginTop: 20 }}>
            <MyTable
              data={tableData}
              columns={columns}
              loading={false}
              sortColumn="mode"
              sortType="asc"
              page={0}
              rowsPerPage={5}
              totalCount={tableData.length}
              onPageChange={() => {}}
              onRowsPerPageChange={() => {}}
            />
          </div>
  </>);

  return (
    <SectionContainer
      title={<>

        <span className="today-goals-section-title">
                  <FontAwesomeIcon
                      color="#b4b4b4ff"
                      icon={faMaskFace }
                      className="title-icon-main-title"
                    />
          Ventilator
        </span>


          <div className="add-button-for-cards-over-view">
            <MyButton
              prefixIcon={() => <PlusIcon />}
              onClick={() => setOpenVentilator(true)}
            >
              Add
            </MyButton>
          </div>
      </>}
      content={
        <>

          {/* DynamicCard */}
          <DynamicCard width="100%" data={ventilatorData} />



          <MyModal
            open={openVentilator}
            setOpen={setOpenVentilator}
            title="New/Edit Ventilator"
            size="55vw"
            bodyheight="80vh"
            position="center"
            content={VentilatorForm}
            hideBack={true}
            actionButtonLabel="Save"
          />
        </>
      }
    />
  );
};

export default VentilatorSection;
