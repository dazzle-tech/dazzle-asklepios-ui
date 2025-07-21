import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSprayCanSparkles } from '@fortawesome/free-solid-svg-icons';
import AddEditFluidOrder from './AddEditFluidOrder';
import "./styles.less";
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
      fluidType: 'type1',
      volume: '100',
      route: 'route1',
      infusionRate: 'rate1',
      frequency: 1,
      duration: 'Until Complete',
      untilComplete : true,
      device: 'device1',
      indication: 'indication1',
      notesToNurse: 'note1',
      priority: 'high',
      allergyChecked: 'yes',
      startTime: '20:20',
      estimatedEndTime: '05:05',
      createdBy: 'Rawan',
      createdAt: '19:19'
    },
    {
      key: '2',
      fluidType: 'type2',
      volume: '200',
      route: 'route2',
      infusionRate: 'rate2',
      frequency: 2,
      duration: '3',
       untilComplete : false,
      device: 'device2',
      indication: 'indication2',
      notesToNurse: 'note2',
      priority: 'low',
      allergyChecked: 'no',
      startTime: '21:21',
      estimatedEndTime: '06:06',
      createdBy: 'Rawan',
      createdAt: '20:20'
    },
    {
      key: '3',
      fluidType: 'type3',
      volume: '300',
      route: 'route3',
      infusionRate: 'rate3',
      frequency: 3,
      duration: 'Until Complete',
       untilComplete : true,
      device: 'device3',
      indication: 'indication3',
      notesToNurse: 'note3',
      priority: 'high',
      allergyChecked: 'yes',
      startTime: '22:22',
      estimatedEndTime: '07:07',
      createdBy: 'Hanan',
      createdAt: '21:21'
    },
    {
      key: '4',
      fluidType: 'type4',
      volume: '400',
      route: 'route4',
      infusionRate: 'rate4',
      frequency: 4,
      duration: '5',
       untilComplete : false,
      device: 'device4',
      indication: 'indication4',
      notesToNurse: 'note4',
      priority: 'low',
      allergyChecked: 'no',
      startTime: '23:23',
      estimatedEndTime: '08:08',
      createdBy: 'Bushra',
      createdAt: '22:22'
    },
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
    setFluidOrder({untilCompleted: true});
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
        <MyButton
          color="var(--deep-blue)"
          width="90px"
        >
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
      <Additives 
      open={openAdditivesPopup}
      setOpen={setOpenAdditivesPopup}
      />
    </div>
  );
};
export default IVFluidOrder;
