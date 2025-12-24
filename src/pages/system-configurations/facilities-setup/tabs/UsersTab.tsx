import React from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { Facility } from '@/types/model-types-new';
import { ApUser } from '@/types/model-types-new';
import { useGetUsersByFacilityQuery } from '@/services/security/UserRoleService';

interface UsersTabProps {
  facility: Facility;
}

const UsersTab: React.FC<UsersTabProps> = ({ facility }) => {
  const { data: users, isFetching } = useGetUsersByFacilityQuery(facility?.id as number, {
    skip: !facility?.id,
  });

  const tableColumns = [
    {
      key: 'login',
      title: <Translate>Login</Translate>,
      flexGrow: 2,
      dataKey: 'login',
    },
    {
      key: 'firstName',
      title: <Translate>First Name</Translate>,
      flexGrow: 2,
      dataKey: 'firstName',
    },
    {
      key: 'lastName',
      title: <Translate>Last Name</Translate>,
      flexGrow: 2,
      dataKey: 'lastName',
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
      flexGrow: 3,
      dataKey: 'email',
    },
    {
      key: 'phoneNumber',
      title: <Translate>Phone Number</Translate>,
      flexGrow: 2,
      dataKey: 'phoneNumber',
    },
    {
      key: 'activated',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: ApUser) => <p>{rowData?.activated ? 'Active' : 'Inactive'}</p>,
    },
    {
      key: 'jobRole',
      title: <Translate>Job Role</Translate>,
      flexGrow: 2,
      dataKey: 'jobRole',
    },
  ];

  return (
    <div>
      <MyTable
        height={450}
        data={users ?? []}
        loading={isFetching}
        columns={tableColumns}
      />
    </div>
  );
};

export default UsersTab;

