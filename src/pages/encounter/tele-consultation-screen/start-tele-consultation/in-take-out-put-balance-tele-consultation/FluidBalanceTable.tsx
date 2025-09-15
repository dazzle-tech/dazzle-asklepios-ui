import React from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquarePollHorizontal } from '@fortawesome/free-solid-svg-icons';

interface FluidBalanceTableProps {
  data: any[];
  selected: any;
  setSelected: (row: any) => void;
}

const FluidBalanceTable: React.FC<FluidBalanceTableProps> = ({ data, selected, setSelected }) => {
  const isSelected = (rowData: any) => (rowData?.key === selected?.key ? 'selected-row' : '');

  const iconsForActions = (rowData: any) => {
    if (
      rowData.totalIntake - rowData.totalOutput > 2000 ||
      rowData.totalIntake - rowData.totalOutput < -1500
    ) {
      return (
        <div className="container-of-icons">
          <FontAwesomeIcon
            icon={faSquarePollHorizontal}
            color="var(--primary-gray)"
            className="icons-style"
          />
        </div>
      );
    }
  };

  const columns = [
    { key: 'date', title: <Translate>Date</Translate> },
    { key: 'totalIntake', title: <Translate>Total Intake (ml)</Translate> },
    { key: 'totalOutput', title: <Translate>Total Output (ml)</Translate> },
    {
      key: 'netBalance',
      title: <Translate>Net Balance</Translate>,
      render: (row: any) => <span>{row.totalIntake - row.totalOutput}</span>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: (rowData: any) => iconsForActions(rowData)
    }
  ];

  return (
    <MyTable
      data={data}
      columns={columns}
      rowClassName={isSelected}
      onRowClick={(rowData) => setSelected(rowData)}
    />
  );
};

export default FluidBalanceTable;
