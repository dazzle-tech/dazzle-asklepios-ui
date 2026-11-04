import React, { useState } from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import ChildModal from '@/components/ChildModal';
import { useGetActiveAdminsQuery } from '@/services/userService';
import { FaUserShield } from 'react-icons/fa';

interface ActiveAdminsModalProps {
  open: boolean;
  onClose: () => void;
}

const ActiveAdminsModal: React.FC<ActiveAdminsModalProps> = ({ open, onClose }) => {
  const [showChild, setShowChild] = useState<boolean>(false);
  const { data: activeAdmins, isLoading: isLoadingAdmins } = useGetActiveAdminsQuery(
    { page: 0, size: 100 },
    { skip: !open }
  );

  // Table columns
  const adminTableColumns = [
    {
      key: 'login',
      title: <Translate>Login</Translate>,
      flexGrow: 2
    },
    {
      key: 'firstName',
      title: <Translate>First Name</Translate>,
      flexGrow: 2
    },
    {
      key: 'lastName',
      title: <Translate>Last Name</Translate>,
      flexGrow: 2
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
      flexGrow: 3
    },
    {
      key: 'phoneNumber',
      title: <Translate>Phone Number</Translate>,
      flexGrow: 2
    }
  ];

  // Main modal content
  const conjureFormContentOfMainModal = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <MyTable
              height={400}
              data={Array.isArray(activeAdmins) ? activeAdmins : []}
              columns={adminTableColumns}
              loading={isLoadingAdmins}
            />
          </div>
        );
      default:
        return null;
    }
  };

      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <ChildModal
      open={open}
      setOpen={(value: boolean) => {
        if (!value) {
          onClose();
        }
      }}

      showChild={showChild}
      setShowChild={setShowChild}
      hideActionBtn
      title="Active Admin Users"
      mainContent={(stepNumber) => <div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>}
      mainStep={[{ title: 'Active Admins', icon: <FaUserShield /> }]}
      childTitle=""
      childContent={null}
      childStep={[]}
      mainSize="lg"
    />
  );
};

export default ActiveAdminsModal;

