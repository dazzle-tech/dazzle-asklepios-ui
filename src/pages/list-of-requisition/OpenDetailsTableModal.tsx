import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faIdCard, faTable } from '@fortawesome/free-solid-svg-icons';
import DetailTable from './DetailTable';
import DetailCard from './DetailCard';
import MyModal from '@/components/MyModal/MyModal';
import { useState } from 'react';
//Component Props


export const sampleData = [
  {
    id: 1,
    itemName: 'HP ProBook 450 G9',
    itemCode: 'HP450G9',
    unitOfMeasurement: 'Piece',
    quantity: 12,
    lastPurchasedDate: '2025-07-01',
    maxmanQuantity: 40,
    minimumQuantity: 5,
    specs: 'Intel i5, 16GB RAM, 512GB SSD',
    status: 'Available',
    approvalStatus: 'Approved',
    note: 'Replacement for outdated devices',
    itemClassification: 'Hardware',
    acceptBy: 'IT Manager',
    acceptDateTime: '2025-07-21 09:30 AM',
    approvedBy: 'CIO',
    approvedDate: '2025-07-22',
    approvalNote: 'Procurement completed',
    avatar: '/public/Pictures/HP-ProBook-450-G9.png',
    Accept: true
  },
  {
    id: 2,
    itemName: 'Medical Gloves - Large',
    itemCode: 'MEDGLV-L',
    unitOfMeasurement: 'Box',
    quantity: 75,
    lastPurchasedDate: '2025-06-10',
    maxmanQuantity: 150,
    minimumQuantity: 30,
    specs: '100 gloves per box, latex-free',
    status: 'Pending',
    approvalStatus: 'Pending',
    note: 'Pending supplier confirmation',
    itemClassification: 'Medical Supply',
    acceptBy: 'Procurement Officer',
    acceptDateTime: '2025-07-19 02:00 PM',
    approvedBy: 'Head Nurse',
    approvedDate: '2025-07-20',
    approvalNote: 'Awaiting final check',
    avatar: '/public/Pictures/Medical-Gloves-Large.png',
    Accept: false
  },
  {
    id: 3,
    itemName: 'HP Ink Cartridge 305XL',
    itemCode: 'INK305XL',
    unitOfMeasurement: 'Piece',
    quantity: 20,
    lastPurchasedDate: '2025-07-15',
    maxmanQuantity: 100,
    minimumQuantity: 10,
    specs: 'Black, high yield',
    status: 'Available',
    approvalStatus: 'Approved',
    note: 'Office printer restock',
    itemClassification: 'Stationery',
    acceptBy: 'Admin Assistant',
    acceptDateTime: '2025-07-23 10:15 AM',
    approvedBy: 'Operations Lead',
    approvedDate: '2025-07-23',
    approvalNote: 'Approved instantly',
    avatar: '/public/Pictures/HP-Ink-Cartridge-305XL.png',
    Accept: true
  },
  {
    id: 4,
    itemName: 'Surgical Masks',
    itemCode: 'SURGMASK',
    unitOfMeasurement: 'Box',
    quantity: 200,
    lastPurchasedDate: '2025-06-25',
    maxmanQuantity: 300,
    minimumQuantity: 100,
    specs: '50 masks per box, 3-ply',
    status: 'Available',
    approvalStatus: 'Pending',
    note: 'Monthly refill for clinics',
    itemClassification: 'Medical Supply',
    acceptBy: 'Health Officer',
    acceptDateTime: '2025-07-25 08:45 AM',
    approvedBy: 'Medical Director',
    approvedDate: '2025-07-26',
    approvalNote: 'Pending stock validation',
    avatar: '/public/Pictures/Surgical-Masks.png',
    Accept: false
  },
  {
    id: 5,
    itemName: 'Staplers with Pins',
    itemCode: 'STPL2025',
    unitOfMeasurement: 'Set',
    quantity: 40,
    lastPurchasedDate: '2025-06-05',
    maxmanQuantity: 80,
    minimumQuantity: 20,
    specs: 'Standard stapler + 500 pins',
    status: 'Pending',
    approvalStatus: 'Approved',
    note: 'New staff onboarding kits',
    itemClassification: 'Stationery',
    acceptBy: 'Office Coordinator',
    acceptDateTime: '2025-07-24 01:20 PM',
    approvedBy: 'HR Manager',
    approvedDate: '2025-07-25',
    approvalNote: 'Approved for new joiners',
    avatar: '/public/Pictures/Staplers-with-Pins.png',
    Accept: true
  }
];

const OpenDetailsTableModal = ({ open, setOpen }) => {
  const [activeContent, setActiveContent] = useState<'table' | 'card'>('table');

  //Modalcontent
  const ModalContent = (
    <div>
      <div className="modal-content-icon-positions">
        <FontAwesomeIcon
          icon={faIdCard}
          className="fa-table-cells-row-lock-icon"
          onClick={() => setActiveContent('card')}
        />
        <FontAwesomeIcon
          icon={faTable}
          className="fa-table-cells-row-unlock-icon"
          onClick={() => setActiveContent('table')}
        />
      </div>

      <div>
        {activeContent === 'table' ? (
          <DetailTable />
        ) : (
          <div>
            <DetailCard></DetailCard>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Order Items"
      steps={[
        {
          title: 'Order Items',
          icon: <FontAwesomeIcon icon={faEye} />
        }
      ]}
      size="90vw"
      position="center"
      actionButtonLabel="Save"
      content={ModalContent}
    />
  );
};

export default OpenDetailsTableModal;
