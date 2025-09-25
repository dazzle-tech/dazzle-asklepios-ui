import React, { useState, useEffect } from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import DynamicCard from '@/components/DynamicCard';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Slider, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import './style.less';

const sedationData = [
  { label: 'RASS Score', value: <MyBadgeStatus contant="-1" color="#2ecc71" /> },
  { label: 'Target', value: 'RASS -1 to 0' },
  { label: 'Last SAT', value: '06:00' },
];

const rassDefaultColors: Record<string, string> = {
  'Combative': '#e53935',
  'Very agitated': '#f44336',
  'Agitated': '#ef5350',
  'Restless': '#ef9a9a',
  'Alert and calm': '#cddc39',
  'Drowsy': '#81d4fa',
  'Light sedation': '#80cbc4',
  'Moderate sedation': '#4db6ac',
  'Deep sedation': '#2e7d32',
  'Unarousable': '#000000',
};

const columns: ColumnConfig[] = [
  { key: 'sedationLevel', title: 'Sedation Level', dataKey: 'sedationLevel', width: 150 },
  { key: 'targetNumber', title: 'Target', dataKey: 'targetNumber', width: 100 },
  { key: 'lastTime', title: 'Last Time', dataKey: 'lastTime', width: 100 },
  {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdByAt',
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
  { id: 1, sedationLevel: 'Alert and calm', targetNumber: '0', lastTime: '08:00', createdBy: "Nurse Layla",createdAt: "2025-09-21 11:15 AM", },
  { id: 2, sedationLevel: 'Light sedation', targetNumber: '-1', lastTime: '12:00', createdBy: "Dr. Ahmad", createdAt: "2025-09-21 09:30 AM", },
  { id: 3, sedationLevel: 'Moderate sedation', targetNumber: '-2', lastTime: '16:00', createdBy: "Dr. Ali", createdAt: "2025-09-23 12:30 PM", },
];

const SedationAnalgesiaSection: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const { data: rassLovResponse } = useGetLovValuesByCodeQuery('RASS_SCORE');
  const [rassOptions, setRassOptions] = useState<string[]>([]);
  const [rassColors, setRassColors] = useState<Record<string, string>>({});
  const [record, setRecord] = useState({
    sedationLevel: '',
    targetNumber: '',
    lastTime: '',
    analgesiaLevel: 0,
    painScore: 0,
  });
  const [tableData, setTableData] = useState<any[]>(initialTableData);

  useEffect(() => {
    if (rassLovResponse?.object) {
      const options: string[] = [];
      const colors: Record<string, string> = {};
      rassLovResponse.object.forEach((item: any) => {
        const label = item.lovDisplayVale;
        options.push(label);
        colors[label] = item.color || rassDefaultColors[label] || '#000000';
      });
      setRassOptions(options);
      setRassColors(colors);
      if (options.length > 0)
        setRecord(prev => ({ ...prev, sedationLevel: options[0] }));
    }
  }, [rassLovResponse]);

  const handleSedationChange = (index: number) => {
    setRecord(prev => ({ ...prev, sedationLevel: rassOptions[index] }));
  };

  const handleSave = () => {
    setTableData(prev => [...prev, { ...record, id: prev.length + 1 }]);
    setRecord({
      sedationLevel: rassOptions[0] || '',
      targetNumber: '',
      lastTime: '',
      analgesiaLevel: 0,
      painScore: 0,
    });
    setOpenModal(false);
  };

  const modalContent = (
    <>
      <Form fluid>
        <div style={{ marginBottom: 20 }}>
          <label>Sedation Level</label>
          <Slider
            value={rassOptions.indexOf(record.sedationLevel)}
            min={0}
            max={rassOptions.length - 1}
            step={1}
            progress
            onChange={handleSedationChange}
            disabled={rassOptions.length === 0}
          />
          <div style={{ marginTop: 5, fontWeight: 500, color: rassColors[record.sedationLevel] }}>
            {record.sedationLevel}
          </div>
        </div>

        <div className="flex-row-active-problems">
          <MyInput
            width="14vw"
            fieldLabel="Target"
            fieldName="targetNumber"
            fieldType="number"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width="14vw"
            fieldLabel="Last Time"
            fieldName="lastTime"
            fieldType="time"
            record={record}
            setRecord={setRecord}
          />
        </div>
      </Form>

      <div style={{ marginTop: 20, maxHeight: '40vh', overflow: 'auto' }}>
        <MyTable
          data={tableData}
          columns={columns}
          loading={false}
          sortColumn="sedationLevel"
          sortType="asc"
          page={0}
          rowsPerPage={5}
          totalCount={tableData.length}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
        />
      </div>
    </>
  );

  return (
    <>
      <SectionContainer
        title={<>
          <span className="today-goals-section-title">
                        <FontAwesomeIcon
                          color="#b4b4b4ff"
                          icon={faBed}
                          className="title-icon-main-title"
                        />
            Sedation & Analgesia
          </span>


                                        <div className="add-button-for-cards-over-view">
                                <MyButton
                                  prefixIcon={() => <PlusIcon />}
                                  onClick={() => setOpenModal(true)}
                                >
                                  Add
                                </MyButton></div>
                          </>
        }
        content={
          <>

            <DynamicCard
              width="100%"
              data={sedationData.map(item => ({
                label: item.label,
                value: item.value,
                type: 'text',
                section: 'left',
                showLabel: true,
                labelGap: 200,
              }))}
            />
          </>
        }
      />

      <MyModal
        open={openModal}
        setOpen={setOpenModal}
        title="Add Sedation & Analgesia"
        size="50vw"
        bodyheight="70vh"
        position="center"
        content={modalContent}
        hideBack={true}
        actionButtonLabel="Save"
        actionButtonFunction={handleSave}
      />
    </>
  );
};

export default SedationAnalgesiaSection;
