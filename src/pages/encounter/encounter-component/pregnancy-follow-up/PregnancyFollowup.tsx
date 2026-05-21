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
import MyTab from '@/components/MyTab';

const PregnancyFollowup = () => {
  // State to control modals visibility
  const [openStartModal, setOpenStartModal] = useState(false);
  const [openEndModal, setOpenEndModal] = useState(false);

  const tabData = [
   {title: "Current Visit", content: <CurrentVisit />},
   {title: "Previous Followups", content: <PreviousFollowups />},
   {title: "Protocols", content: <Protocols />},
  ];


            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
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
        <MyTab
          lazy
          data={tabData.map(tab => ({
            ...tab,
            content: <div dir={dir}>{tab.content}</div>
          }))}
        />

      {/* Modal for starting pregnancy */}
      <StartNewPregnancyModal
        open={openStartModal}
        setOpen={setOpenStartModal}
        onSave={data => {}}
      />

      {/* Modal for ending pregnancy */}
      <EndPregnancyModal
        open={openEndModal}
        setOpen={setOpenEndModal}
        onSave={data => {}}
      />
    </div>
  );
};

export default PregnancyFollowup;
