// Import React and required components
import React, { useState } from 'react';
import { Tabs } from 'rsuite';
import CurrentVisit from './CurrentVisit/CurrentVisit';
import PreviousFollowups from './PreviousFollowups/PreviousFollowups';
import Protocols from './Protocols/Protocols';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import './Style.less';

import StartNewPregnancyModal from './StartNewPregnancyModal';
import EndPregnancyModal from './EndPregnancyModal';

const PregnancyFollowup = () => {
  // State to control modals visibility
  const [openStartModal, setOpenStartModal] = useState(false);
  const [openEndModal, setOpenEndModal] = useState(false);

  return (
    <>
      {/* Top buttons to trigger modals */}
      <div className="main-pregnancy-btn-right">
        <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setOpenStartModal(true)}>
          Start New Pregnancy
        </MyButton>

        <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setOpenEndModal(true)}>
          End Pregnancy
        </MyButton>
      </div>

      {/* Tabs section for different views */}
      <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
        <Tabs.Tab eventKey="1" title="CurrentVisit">
          <CurrentVisit />
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="PreviousFollowups">
          <PreviousFollowups />
        </Tabs.Tab>
        <Tabs.Tab eventKey="3" title="Protocols">
          <Protocols />
        </Tabs.Tab>
      </Tabs>

      {/* Modal for starting pregnancy */}
      <StartNewPregnancyModal
        open={openStartModal}
        setOpen={setOpenStartModal}
        onSave={data => console.log('Start Pregnancy Data:', data)}
      />

      {/* Modal for ending pregnancy */}
      <EndPregnancyModal
        open={openEndModal}
        setOpen={setOpenEndModal}
        onSave={data => console.log('End Pregnancy Data:', data)}
      />
    </>
  );
};

export default PregnancyFollowup;
