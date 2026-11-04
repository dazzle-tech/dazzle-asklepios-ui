import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { Facility } from '@/types/model-types-new';
import { ApUser } from '@/types/model-types-new';
import { useGetUsersByFacilityQuery } from '@/services/security/UserRoleService';
import { formatEnumString } from '@/utils';

interface UsersTabProps {
  facility: Facility;
}

const UsersTab: React.FC<UsersTabProps> = ({ facility }) => {

  const facilityId = facility?.id ? Number(facility.id) : 0;
  const { data: users, isFetching } = useGetUsersByFacilityQuery(facilityId, {
    skip: !facility?.id || isNaN(facilityId),
  });

  const [searchTerm, setSearchTerm] = useState({ value: '' });

  const filteredUsers = useMemo(() => {
    const q = searchTerm.value?.trim().toLowerCase();
    if (!q) return users ?? [];

    return (users ?? []).filter((u: ApUser) => {
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase();
      return (
        (u.login ?? '').toLowerCase().includes(q) ||
        (u.firstName ?? '').toLowerCase().includes(q) ||
        (u.lastName ?? '').toLowerCase().includes(q) ||
        fullName.includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        String(u.phoneNumber ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm.value]);

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
      render: (rowData: ApUser) => <p>{rowData?.jobRole ? formatEnumString(rowData.jobRole) : ''}</p>,
    },
  ];

  const filters = () => (
    <div className="container-of-header-actions-medication-matrix">
      <Form layout="inline" className="form-medication-matrix">
        <MyInput
          fieldName="value"
          fieldType="text"
          record={searchTerm}
          setRecord={setSearchTerm}
          showLabel={false}
          placeholder="Search users"
          width="220px"
          height={32}
        />
      </Form>
    </div>
  );

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <MyTable
        height={450}
        data={filteredUsers}
        loading={isFetching}
        columns={tableColumns}
        filters={filters()}
      />
    </div>
  );
};

export default UsersTab;
