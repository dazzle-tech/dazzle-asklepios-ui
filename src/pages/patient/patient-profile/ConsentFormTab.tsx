import React from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';

const ConsentFormTab = ({ patient, isClick }) => {
  void patient;
  void isClick;
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

// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
    <MyTable
      data={[]}
      columns={columns}
    />
    </div>
    )
};

export default ConsentFormTab;
