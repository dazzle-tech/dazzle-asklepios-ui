import React from 'react';
import MyTable from '../../MyTable/MyTable';
import Translate from '../../Translate';

interface ToothHistoryTabProps {
  selectedTooth: any;
  dentalActionsMap: any;
}

const ToothHistoryTab: React.FC<ToothHistoryTabProps> = ({ selectedTooth, dentalActionsMap }) => {
  const columns = [
    {
      key: 'actionType',
      title: 'Action Type',
      render: (rowData: any) => (
        <small>
          {dentalActionsMap[rowData.dentalActionId]?.type === 'TREATMENT' ? (
            <b style={{ color: 'green' }}>Treatment</b>
          ) : (
            <b style={{ color: 'red' }}>Condition</b>
          )}
        </small>
      )
    },
    {
      key: 'auditDetails',
      title: 'Audit Details',
      render: (rowData: any) => (
        <span>
          <Translate>
            <b>
              {rowData.logType === 'SAVE'
                ? 'Added '
                : rowData.logType === 'CHANGE'
                ? 'Changed To'
                : 'Cancelled '}
            </b>{' '}
          </Translate>
          <Translate> {dentalActionsMap[rowData.dentalActionId]?.description}</Translate>
          <Translate> @ {rowData.logOwner}</Translate>
        </span>
      )
    }
  ];

  return <MyTable data={selectedTooth.history || []} columns={columns} height={650} />;
};

export default ToothHistoryTab;
