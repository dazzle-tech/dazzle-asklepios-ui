import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faIdCard,
  faTable,
  faPenToSquare,
  faLocationDot,
  faCalendarWeek,
  faUser,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import DynamicCard from '@/components/DynamicCard';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import MyModal from '@/components/MyModal/MyModal';
import './style.less';
import InvasiveDeviceICUModal from './InvasiveDeviceICUModal';
import SectionContainer from '@/components/SectionsoContainer';

interface InvasiveDevice {
  id: number;
  device: string;
  site: string;
  insertionDateTime: string;
  lastDressingChange: string;
  nextCheck: string;
  dailyIndicationReview: 'Completed' | 'Pending' | 'Overdue';
  siteEvaluation: string;
  removalDateTime?: string;
  reasonForRemoval?: string;
  addedBy: string;
  addedAt: string;
  notes?: string;
  functin: string;
}

const sampleDevices: InvasiveDevice[] = [
  {
    id: 1,
    device: 'Central Line',
    site: 'Right IJ',
    insertionDateTime: '2025-09-13 14:30',
    lastDressingChange: '2025-09-16',
    nextCheck: '2025-09-20',
    dailyIndicationReview: 'Completed',
    siteEvaluation: 'Clean',
    addedBy: 'Dr. Smith',
    notes: 'Device status good',
    addedAt: '2025/9/24',
    functin: 'patient'
  },
  {
    id: 2,
    device: 'Foley Catheter',
    site: 'Urethral',
    insertionDateTime: '2025-09-10 09:15',
    lastDressingChange: '2025-09-17',
    nextCheck: '2025-09-19',
    dailyIndicationReview: 'Pending',
    siteEvaluation: 'Clean',
    addedBy: 'Nurse Johnson',
    notes: 'Daily review overdue',
    addedAt: '2025/9/23',
    functin: 'patient'
  }
];

const calculateDeviceDays = (insertionDateTime: string): number => {
  const inserted = new Date(insertionDateTime);
  const now = new Date();
  const diff = Math.floor((+now - +inserted) / (1000 * 60 * 60 * 24));
  return diff;
};

const formatAddedOn = (insertionDateTime: string): string => {
  const inserted = new Date(insertionDateTime);
  return inserted.toISOString().split('T')[0]; // YYYY-MM-DD
};

const InvasiveDeviceICU: React.FC = () => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [openInvasiveDeviceICU, setOpenInvasiveDeviceICU] = useState(false);
  const [editRecord, setEditRecord] = useState<any>({});

  const handleEditClick = (device: InvasiveDevice) => {
    setEditRecord(device);
    setOpenInvasiveDeviceICU(true);
  };

  const tablebuttons = (
    <div className="table-buttons-container-invasive-device-icu">
      <MyButton
        color="var(--deep-blue)"
        prefixIcon={() => <PlusIcon />}
        onClick={() => setOpenInvasiveDeviceICU(true)}
        width="109px"
      >
        Add New
      </MyButton>
    </div>
  );

  const columns: ColumnConfig[] = [
    { key: 'device', title: 'Device', dataKey: 'device', width: 150 },
    { key: 'site', title: 'Site', dataKey: 'site', width: 120 },
    {
      key: 'insertionDateTime',
      title: 'Insertion Date/Time',
      dataKey: 'insertionDateTime',
      width: 150
    },
    {
      key: 'lastDressingChange',
      title: 'Last Dressing Change',
      dataKey: 'lastDressingChange',
      width: 150
    },
    { key: 'nextCheck', title: 'Next Check', dataKey: 'nextCheck', width: 150 },
    {
      key: 'dailyIndicationReview',
      title: 'Daily Indication Review',
      dataKey: 'dailyIndicationReview',
      width: 150
    },
    { key: 'siteEvaluation', title: 'Site Evaluation', dataKey: 'siteEvaluation', width: 150 },
    {
      key: 'removalDateTime',
      title: 'Removal Date/Time',
      dataKey: 'removalDateTime',
      width: 150,
      render: row => row.removalDateTime || '-'
    },
    {
      key: 'reasonForRemoval',
      title: 'Reason for Removal',
      dataKey: 'reasonForRemoval',
      width: 150,
      render: row => row.reasonForRemoval || '-'
    },
    { key: 'addedBy', title: 'Added By', dataKey: 'addedBy', width: 120 },
    { key: 'notes', title: 'Notes', dataKey: 'notes', width: 150, render: row => row.notes || '-' },
    {
      key: 'update',
      title: 'Update',
      dataKey: 'update',
      width: 80,
      render: row => (
        <FontAwesomeIcon
          icon={faPenToSquare}
          style={{ cursor: 'pointer' }}
          onClick={() => handleEditClick(row)}
        />
      )
    }
  ];

  return (
    <div className="invasive-device-icu">
      {/* Toggle View Icons */}
      <div className="icons-2">
        <FontAwesomeIcon
          icon={faIdCard}
          className={`fa-icon ${viewMode === 'card' ? 'active' : ''}`}
          onClick={() => setViewMode('card')}
        />
        <FontAwesomeIcon
          icon={faTable}
          className={`fa-icon ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        />
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <MyTable
          data={sampleDevices}
          columns={columns}
          loading={false}
          sortColumn={null}
          sortType={null}
          page={0}
          rowsPerPage={10}
          tableButtons={tablebuttons}
          totalCount={sampleDevices.length}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
        />
      ) : (
        // Card View
        <div className="card-container-invasive-device-icu">
          {sampleDevices.map(device => (
            <SectionContainer
              title={<></>}
              content={
                <DynamicCard
                  key={device.id}
                  title={device.device}
                  width={600}
                  height={200}
                  data={[
                    {
                      label: 'Notes',
                      value: (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <MyBadgeStatus
                            contant={device.notes || '-'}
                            color={
                              device.notes === 'Device status good'
                                ? '#2ecc71'
                                : device.notes === 'Daily review overdue'
                                ? '#e74c3c'
                                : '#555'
                            }
                          />
                          <FontAwesomeIcon
                            icon={faPenToSquare}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleEditClick(device)}
                          />
                        </div>
                      ),
                      type: 'text',
                      section: 'right',
                      showLabel: false,
                      vertical: 'top',
                      verticalGap: 200
                    },
                    {
                      label: 'device',
                      value: device.device,
                      section: 'left',
                      type: 'strong',
                      showLabel: false
                    },
                    {
                      label: 'Site',
                      value: (
                        <>
                          <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 4 }} />
                          {device.site}
                        </>
                      ),
                      section: 'left',
                      type: 'week',
                      columnGap: 10,
                      showLabel: false
                    },
                    {
                      label: 'Inserted',
                      value: device.insertionDateTime,
                      type: 'week',
                      columnGap: 10,
                      section: 'left',
                      showColon: false,
                      labelDirection: 'column',
                      labelIcon: <FontAwesomeIcon icon={faCalendarWeek} color="#e0e0e0ff" />
                    },
                    {
                      label: 'Days in Place',
                      value: `${calculateDeviceDays(device.insertionDateTime)} days`,
                      section: 'center',
                      type: 'strong',
                      labelDirection: 'column',
                      columnGap: 90,
                      showColon: false,
                      labelIcon: <FontAwesomeIcon icon={faClock} color="#d7d7d7ff" />
                    },
                    {
                      label: 'Last Dressing Change',
                      value: device.lastDressingChange,
                      columnGap: 10,
                      section: 'left',
                      showColon: false,
                      labelDirection: 'column',
                      type: 'week'
                    },
                    {
                      label: 'Daily Review',
                      value: device.dailyIndicationReview,
                      section: 'left',
                      type: 'strong',
                      labelGap: 5,
                      valueColor:
                        device.dailyIndicationReview === 'Completed'
                          ? 'green'
                          : device.dailyIndicationReview === 'Pending'
                          ? 'orange'
                          : 'red',
                      verticalGap: 30
                    },

                    {
                      label: 'Site',
                      value: device.siteEvaluation,
                      section: 'left',
                      verticalGap: 20,
                      labelGap: 5
                    },
                    {
                      label: 'Function',
                      value: device.functin,
                      section: 'right',
                      verticalGap: 40,
                      labelGap: 5
                    },
                    {
                      label: 'Added By',
                      value: (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FontAwesomeIcon icon={faUser} />
                          {'Added by ' + device.addedBy + ' on ' + device.addedAt}
                        </span>
                      ),
                      type: 'week',
                      section: 'left',
                      showLabel: false
                    }
                  ]}
                  showMore={false}
                />
              }
            />
          ))}
        </div>
      )}

      <MyModal
        open={openInvasiveDeviceICU}
        setOpen={setOpenInvasiveDeviceICU}
        title={editRecord?.id ? 'Edit Device' : 'Add Device'}
        size="40vw"
        bodyheight="70vh"
        position="right"
        content={<InvasiveDeviceICUModal record={editRecord} setRecord={setEditRecord} />}
        hideBack={true}
        actionButtonLabel="Save"
        actionButtonFunction={{}}
      />
    </div>
  );
};

export default InvasiveDeviceICU;
