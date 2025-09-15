// FluidAdministrationTable.tsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { faStop, faPause, faPlay, faFile } from '@fortawesome/free-solid-svg-icons';
import { Whisper, Tooltip } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';

interface Props {
  fluidOrder: any;
  setFluidOrder: Function;
  addLog: (action: string) => void;
}

const FluidAdministrationTable: React.FC<Props> = ({ fluidOrder, setFluidOrder, addLog }) => {
  const [paused, setPaused] = useState(false);
  const [showLogPopup, setShowLogPopup] = useState(false);

  const administrationColumns = [
    { key: 'time', title: 'Time' },
    { key: 'amount', title: 'Amount (ml)' },
    { key: 'actualRate', title: 'Actual Rate' },
    { key: 'rateVariationReason', title: 'Rate Variation Reason' },
    { key: 'nurseNote', title: 'Nurse Note' },
    { key: 'duration', title: 'Duration (min)' },
    {
      key: 'actions',
      title: 'Actions',
      render: row => (
        <div className="flex-gap-2">
          <Whisper speaker={<Tooltip>End</Tooltip>}>
            <FontAwesomeIcon
              icon={faStop}
              className="cursor-pointer"
              onClick={() => addLog('End')}
            />
          </Whisper>
          <Whisper speaker={<Tooltip>{paused ? 'Resume' : 'Pause'}</Tooltip>}>
            <FontAwesomeIcon
              icon={paused ? faPlay : faPause}
              className="cursor-pointer"
              onClick={() => {
                addLog(paused ? 'Resume' : 'Pause');
                setPaused(!paused);
              }}
            />
          </Whisper>
          <Whisper speaker={<Tooltip>Log</Tooltip>}>
            <FontAwesomeIcon
              icon={faFile}
              className="cursor-pointer"
              onClick={() => setShowLogPopup(true)}
            />
          </Whisper>
        </div>
      )
    }
  ];
  //
  const mockAdministrationData = [
    {
      key: '1',
      time: '08:00',
      amount: 100, // ml
      actualRate: 125, // ml/hr
      rateVariationReason: 'N/A',
      nurseNote: 'Started infusion',
      duration: 30 // minutes
    },
    {
      key: '2',
      time: '08:30',
      amount: 50,
      actualRate: 120,
      rateVariationReason: 'Patient resting',
      nurseNote: 'Reduced rate temporarily',
      duration: 30
    },
    {
      key: '3',
      time: '09:00',
      amount: 75,
      actualRate: 125,
      rateVariationReason: 'N/A',
      nurseNote: 'Resume normal rate',
      duration: 30
    },
    {
      key: '4',
      time: '09:30',
      amount: 100,
      actualRate: 125,
      rateVariationReason: 'N/A',
      nurseNote: 'Monitoring OK',
      duration: 30
    }
  ];
  //
  const mockLogs = [
    {
      action: 'Start',
      time: '2025-08-21 08:00',
      doneBy: 'Nurse A'
    },
    {
      action: 'Pause',
      time: '2025-08-21 08:15',
      doneBy: 'Nurse A'
    },
    {
      action: 'Resume',
      time: '2025-08-21 08:30',
      doneBy: 'Nurse A'
    },
    {
      action: 'End',
      time: '2025-08-21 09:00',
      doneBy: 'Nurse A'
    },
    {
      action: 'Start',
      time: '2025-08-21 10:00',
      doneBy: 'Nurse B'
    },
    {
      action: 'Complete',
      time: '2025-08-21 10:45',
      doneBy: 'Nurse B'
    }
  ];

  return (
    <div>
      <MyTable height={300} data={mockAdministrationData} columns={administrationColumns} />

      <div className="margin-top-but">
       <MyButton
  color="green"
  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
  onClick={() => {
    if (fluidOrder?.status !== 'Completed') {
      setFluidOrder(prev => ({ ...prev, status: 'Completed' }));
      addLog('Complete');
    }
  }}
  disabled={fluidOrder?.status === 'Completed'}
>
  Complete
</MyButton>
      </div>

      <MyModal
        open={showLogPopup}
        setOpen={setShowLogPopup}
        title="Action Log"
        actionButtonLabel="Close"
        actionButtonFunction={() => setShowLogPopup(false)}
        isDisabledActionBtn={false}
        content={() => (
          <MyTable
            height={300}
            data={mockLogs}
            columns={[
              { key: 'action', title: 'Action' },
              { key: 'time', title: 'Time' },
              { key: 'doneBy', title: 'Done By' }
            ]}
          />
        )}
        size="30vw"
        bodyheight="55vh"
        cancelButtonLabel="Close"
      />
    </div>
  );
};

export default FluidAdministrationTable;
