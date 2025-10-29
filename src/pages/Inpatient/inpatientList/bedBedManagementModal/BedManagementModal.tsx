import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import BedManagmentFirstTab from './BedManagmentFirstTab';
import BedTransactionsSecondTab from './BedTransactionsSecondTab';
import MyTab from '@/components/MyTab';
const BedManagementModal = ({ open, setOpen, departmentKey }) => {

  const tabData = [
    {title: "Bed Management", content: <BedManagmentFirstTab departmentKey={departmentKey} />},
    {title: "Bed Transactions", content: <BedTransactionsSecondTab departmentKey={departmentKey} />}
  ];

  // modal content
  const modalContent = (
    <MyTab 
     data={tabData}
     className="tab-container"
    />
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Bed Management"
      steps={[{ title: 'Bed Management', icon: <FontAwesomeIcon icon={faBed} /> }]}
      size="95vw"
      bodyheight="85vh"
      actionButtonFunction={null}
      content={modalContent}
      hideActionBtn={true}
    />
  );
};
export default BedManagementModal;
