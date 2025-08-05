import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSprayCanSparkles } from '@fortawesome/free-solid-svg-icons';
import AddEditFluidOrder from './AddEditFluidOrder';
import './styles.less';
import Additives from './additives';
const IVFluidOrder = () => {
  const [fluidOrder, setFluidOrder] = useState({});
  const [openAddEditFluidOrderPopup, setOpenAddEditFluidOrderPopup] = useState<boolean>(false);
  const [openAdditivesPopup, setOpenAdditivesPopup] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && fluidOrder && rowData.key === fluidOrder.key) {
      return 'selected-row';
    } else return '';
  };

  //dummy data
  const data = [
    {
      key: '1',
      fluidType: 'Normal Saline 0.9%',
      volume: '1000',
      route: 'Peripheral IV',
      infusionRate: '125',
      frequency: 1,
      duration: 'Until Complete',
      untilComplete: true,
      device: 'IV Pump',
      indication: 'Dehydration treatment',
      notesToNurse: 'Monitor for fluid overload',
      priority: 'high',
      allergyChecked: 'yes',
      startTime: '08:30',
      estimatedEndTime: '16:30',
      createdBy: 'Dr. Sarah Johnson',
      createdAt: '08:00'
    },
    {
      key: '2',
      fluidType: "Lactated Ringer's",
      volume: '500',
      route: 'Central Line',
      infusionRate: '83',
      frequency: 1,
      duration: '6',
      untilComplete: false,
      device: 'IV Pump',
      indication: 'Post-operative fluid replacement',
      notesToNurse: 'Check potassium levels',
      priority: 'medium',
      allergyChecked: 'yes',
      startTime: '14:00',
      estimatedEndTime: '20:00',
      createdBy: 'Dr. Michael Chen',
      createdAt: '13:45'
    },
    {
      key: '3',
      fluidType: 'D5W',
      volume: '250',
      route: 'Peripheral IV',
      infusionRate: '42',
      frequency: 1,
      duration: 'Until Complete',
      untilComplete: true,
      device: 'IV Pump',
      indication: 'Maintenance fluids',
      notesToNurse: 'Monitor blood glucose',
      priority: 'low',
      allergyChecked: 'yes',
      startTime: '22:00',
      estimatedEndTime: '06:00',
      createdBy: 'Dr. Emily Rodriguez',
      createdAt: '21:30'
    },
    {
      key: '4',
      fluidType: 'Normal Saline 0.9%',
      volume: '750',
      route: 'Peripheral IV',
      infusionRate: '150',
      frequency: 1,
      duration: '5',
      untilComplete: false,
      device: 'IV Pump',
      indication: 'Blood pressure support',
      notesToNurse: 'Monitor BP every 2 hours',
      priority: 'high',
      allergyChecked: 'yes',
      startTime: '16:30',
      estimatedEndTime: '21:30',
      createdBy: 'Dr. David Thompson',
      createdAt: '16:15'
    }
  ];

  //icons column (Additives)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        title="Additives"
        color="var(--primary-gray)"
        className="icons-style"
        icon={faSprayCanSparkles}
        onClick={() => setOpenAdditivesPopup(true)}
      />
    </div>
  );

  //table columns
  const tableColumns = [
    {
      key: 'fluidType',
      title: <Translate>Fluid Type</Translate>
    },
    {
      key: 'volume',
      title: <Translate>Volume</Translate>
    },
    {
      key: 'route',
      title: <Translate>Route</Translate>
    },
    {
      key: 'infusionRate',
      title: <Translate>Infusion Rate</Translate>
    },
    {
      key: 'frequency',
      title: <Translate>Frequency</Translate>
    },
    {
      key: 'duration',
      title: <Translate>Duration</Translate>
    },
    {
      key: 'device',
      title: <Translate>Device</Translate>
    },
    {
      key: 'indication',
      title: <Translate>Indication</Translate>
    },
    {
      key: 'additives',
      title: <Translate>Additives</Translate>,
      render: () => iconsForActions()
    },
    {
      key: 'notesToNurse',
      title: <Translate>Notes to Nurse</Translate>,
      expandable: true
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      expandable: true
    },
    {
      key: 'allergyChecked',
      title: <Translate>Allergy Checked</Translate>,
      expandable: true
    },
    {
      key: 'startTime',
      title: <Translate>Start Time</Translate>,
      expandable: true
    },
    {
      key: 'estimatedEndTime',
      title: <Translate>Estimated end time</Translate>,
      expandable: true
    },
    {
      key: '',
      title: <Translate>Created By\At</Translate>,
      expandable: true
    }
  ];

  const handleNew = () => {
    setOpenAddEditFluidOrderPopup(true);
    setFluidOrder({ untilCompleted: true });
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <div className="container-of-buttons-iv">
        <MyButton color="var(--deep-blue)" width="90px">
          Submit
        </MyButton>
        <MyButton
          color="var(--deep-blue)"
          prefixIcon={() => <PlusIcon />}
          onClick={handleNew}
          width="100px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setFluidOrder(rowData);
        }}
      />
      <AddEditFluidOrder
        open={openAddEditFluidOrderPopup}
        setOpen={setOpenAddEditFluidOrderPopup}
        width={width}
        fluidOrder={fluidOrder}
        setFluidOrder={setFluidOrder}
      />
      <Additives open={openAdditivesPopup} setOpen={setOpenAdditivesPopup} />
    </div>
  );
};
export default IVFluidOrder;
