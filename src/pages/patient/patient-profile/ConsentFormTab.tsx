import React from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';

const ConsentFormTab = ({ patient, isClick }) => {
  //Table Columns Content
  const columns = [
    {
      key: 'procedureName',
      title: <Translate>Procedure Name</Translate>,
      flexGrow: 4,
      dataKey: 'procedureName',
    },
    {
      key: 'physician',
      title: <Translate>Physician</Translate>,
      flexGrow: 4,
      dataKey: 'physician',
    },
    {
      key: 'dateTimeOfProcedure',
      title: <Translate>Date and Time of Procedure</Translate>,
      flexGrow: 4,
      dataKey: 'dateTimeOfProcedure',
    },
    {
      key: 'consentStatus',
      title: <Translate>Consent Status</Translate>,
      flexGrow: 4,
      dataKey: 'consentStatus',
    },
    {
      key: 'signDateTime',
      title: <Translate>Sign Date and Time</Translate>,
      flexGrow: 4,
      dataKey: 'signDateTime',
    },
  ];

  return (
    <MyTable
      data={[]}
      columns={columns}
    />)
};

export default ConsentFormTab;
