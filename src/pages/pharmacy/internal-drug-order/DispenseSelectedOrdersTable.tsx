import Translate from '@/components/Translate';
import React, { useState } from 'react';
import { Form, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRightFromBracket, faPrint } from '@fortawesome/free-solid-svg-icons';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { faComments, faBarcode, faBatteryEmpty } from '@fortawesome/free-solid-svg-icons';
import { TbUrgent } from 'react-icons/tb';
import MyInput from '@/components/MyInput';
import MyNestedTable from '@/components/MyNestedTable';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import DispenseModal from './DispenseModal';

const DispenseSelectedOrdersTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  // Create state for selected rows data in modal
  const [dispenseData, setDispenseData] = useState<any[]>([]);
  const [openDispenseModal, setOpenDispenseModal] = useState(false);

  // Fetch orders tatus Lov response
  const { data: orderstatusLovQueryResponse } = useGetLovValuesByCodeQuery('PHARMACY_ORDER_STATUS');

  // Icons column (start)
  const iconsForActionsOrders = () => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        className="icons-style"
        title="Start"
        color="var(--primary-gray)"
        icon={faPlay}
      />
    </div>
  );
  // dummy data
  const data = [
    {
      key: '1',
      wardName: 'ICU Ward A',
      medicationName: 'Paracetamol 500mg',
      patientCount: '8',
      tolalRequiredDoses: '24',
      dispenseUOM: 'Tablets',
      orderStatus: 'Pending',
      medications: [
        {
          key: '1',
          medication: 'Aspirin 100mg',
          route: 'Oral',
          frequency: 1,
          dose: '1',
          unit: 'Tablet',
          duration: '30 days',
          qtyToDispense: '30',
          patientName: 'Mohammed Saleh',
          totalCountAndUOM: '30 Tablets',
          instructions: 'Take 1 tablet daily with food',
          DayNo: 'Day 1',
          status: 'Received'
        },
        {
          key: '2',
          medication: 'Aspirin 100mg',
          route: 'Oral',
          frequency: 1,
          dose: '1',
          unit: 'Tablet',
          duration: '30 days',
          qtyToDispense: '30',
          patientName: 'Aisha Rahman',
          totalCountAndUOM: '30 Tablets',
          instructions: 'Take 1 tablet daily after breakfast',
          DayNo: 'Day 1',
          status: 'Received'
        },
        {
          key: '3',
          medication: 'Aspirin 100mg',
          route: 'Oral',
          frequency: 1,
          dose: '1',
          unit: 'Tablet',
          duration: '30 days',
          qtyToDispense: '30',
          patientName: 'Khalid Ibrahim',
          totalCountAndUOM: '30 Tablets',
          instructions: 'Take 1 tablet daily with water',
          DayNo: 'Day 1',
          status: 'Received'
        },
        {
          key: '4',
          medication: 'Aspirin 100mg',
          route: 'Oral',
          frequency: 1,
          dose: '1',
          unit: 'Tablet',
          duration: '30 days',
          qtyToDispense: '30',
          patientName: 'Noor Al-Zahra',
          totalCountAndUOM: '30 Tablets',
          instructions: 'Take 1 tablet daily',
          DayNo: 'Day 2',
          status: 'Received'
        }
      ]
    },
    {
      key: '2',
      wardName: 'Cardiology Ward',
      medicationName: 'Aspirin 100mg',
      patientCount: '12',
      tolalRequiredDoses: '36',
      dispenseUOM: 'Tablets',
      orderStatus: 'Partially Dispensed',
      medications: [
        {
          key: '1',
          medication: 'Paracetamol 500mg',
          route: 'Oral',
          frequency: 3,
          dose: '1',
          unit: 'Tablet',
          duration: '7 days',
          qtyToDispense: '21',
          patientName: 'Ahmed Hassan',
          totalCountAndUOM: '21 Tablets',
          instructions: 'Take 1 tablet every 8 hours for fever',
          DayNo: 'Day 1',
          status: 'InTransit'
        },
        {
          key: '2',
          medication: 'Paracetamol 500mg',
          route: 'Oral',
          frequency: 3,
          dose: '1',
          unit: 'Tablet',
          duration: '5 days',
          qtyToDispense: '15',
          patientName: 'Fatima Ali',
          totalCountAndUOM: '15 Tablets',
          instructions: 'Take 1 tablet every 8 hours for pain',
          DayNo: 'Day 1',
          status: 'Pending'
        },
        {
          key: '3',
          medication: 'Paracetamol 500mg',
          route: 'Oral',
          frequency: 2,
          dose: '1',
          unit: 'Tablet',
          duration: '3 days',
          qtyToDispense: '6',
          patientName: 'Omar Khalil',
          totalCountAndUOM: '6 Tablets',
          instructions: 'Take 1 tablet every 12 hours',
          DayNo: 'Day 2',
          status: 'InTransit'
        },
        {
          key: '4',
          medication: 'Paracetamol 500mg',
          route: 'Oral',
          frequency: 4,
          dose: '1',
          unit: 'Tablet',
          duration: '10 days',
          qtyToDispense: '40',
          patientName: 'Layla Ahmed',
          totalCountAndUOM: '40 Tablets',
          instructions: 'Take 1 tablet every 6 hours for fever',
          DayNo: 'Day 1',
          status: 'Received'
        }
      ]
    },
    {
      key: '3',
      wardName: 'Pediatrics Ward',
      medicationName: 'Amoxicillin 250mg',
      patientCount: '6',
      tolalRequiredDoses: '18',
      dispenseUOM: 'Capsules',
      orderStatus: 'Dispensed',
      medications: [
        {
          key: '1',
          medication: 'Ibuprofen 400mg',
          route: 'Oral',
          frequency: 3,
          dose: '1',
          unit: 'Tablet',
          duration: '5 days',
          qtyToDispense: '15',
          patientName: 'Samir Mansour',
          totalCountAndUOM: '15 Tablets',
          instructions: 'Take 1 tablet every 8 hours for pain',
          dayNo: 'Day 1',
          status: 'Prepared'
        },
        {
          key: '2',
          medication: 'Ibuprofen 400mg',
          route: 'Oral',
          frequency: 2,
          dose: '1',
          unit: 'Tablet',
          duration: '3 days',
          qtyToDispense: '6',
          patientName: 'Rania Fawzi',
          totalCountAndUOM: '6 Tablets',
          instructions: 'Take 1 tablet every 12 hours',
          dayNo: 'Day 1',
          status: 'InTransit'
        },
        {
          key: '3',
          medication: 'Ibuprofen 400mg',
          route: 'Oral',
          frequency: 3,
          dose: '1',
          unit: 'Tablet',
          duration: '7 days',
          qtyToDispense: '21',
          patientName: 'Tarek El-Sayed',
          totalCountAndUOM: '21 Tablets',
          instructions: 'Take 1 tablet every 8 hours with food',
          dayNo: 'Day 1',
          status: 'Pending'
        },
        {
          key: '4',
          medication: 'Ibuprofen 400mg',
          route: 'Oral',
          frequency: 2,
          dose: '1',
          unit: 'Tablet',
          duration: '5 days',
          qtyToDispense: '10',
          patientName: 'Hanaa Mostafa',
          totalCountAndUOM: '10 Tablets',
          instructions: 'Take 1 tablet every 12 hours',
          dayNo: 'Day 2',
          status: 'Received'
        }
      ]
    }
  ];
  //Table columns
  const orderColumns = [
    {
      key: 'wardName',
      title: <Translate>Ward Name</Translate>
    },
    {
      key: 'medicationName',
      title: <Translate>Medication Name</Translate>
    },
    {
      key: 'patientCount',
      title: <Translate>Patient Count</Translate>
    },
    {
      key: 'tolalRequiredDoses',
      title: <Translate>Tolal Required Doses</Translate>
    },
    {
      key: 'dispenseUOM',
      title: <Translate>Dispense UOM</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActionsOrders()
    }
  ];
  //Table columns
  const tableMedicationsColumns = [
    {
      key: 'patientName',
      title: <Translate>Patient Name</Translate>
    },

    {
      key: 'instructions',
      title: <Translate>Instructions</Translate>
    },
    {
      key: 'totalCountAndUOM',
      title: <Translate>Total Count & UOM</Translate>
    },
    {
      key: 'DayNo',
      title: <Translate>Day No.</Translate>,
      render: rowData => {
        return rowData.DayNo || rowData.dayNo || 'N/A';
      }
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => {
        const status = rowData.status || 'Pending';

        const getStatusConfig = status => {
          switch (status) {
            case 'Pending':
              return {
                backgroundColor: 'var(--light-orange)',
                color: 'var(--primary-orange)',
                contant: 'Pending'
              };
            case 'Prepared':
              return {
                backgroundColor: 'var(--light-blue)',
                color: 'var(--primary-blue)',
                contant: 'Prepared'
              };
            case 'InTransit':
              return {
                backgroundColor: 'var(--light-yellow)',
                color: 'var(--primary-yellow)',
                contant: 'InTransit'
              };
            case 'Received':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Received'
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: 'Unknown'
              };
          }
        };

        const config = getStatusConfig(status);
        return (
          <MyBadgeStatus
            backgroundColor={config.backgroundColor}
            color={config.color}
            contant={config.contant}
          />
        );
      }
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: rowData => {
        const tooltipDoctor = <Tooltip>Clinical Check</Tooltip>;
        const tooltipNurse = <Tooltip>MAR</Tooltip>;
        const tooltipComments = <Tooltip>Comments</Tooltip>;
        const tooltipPrintLabel = <Tooltip>Print Label</Tooltip>;
        const tooltipUnavailable = <Tooltip>Unavailable</Tooltip>;
        const tooltipStat = <Tooltip>STAT</Tooltip>;
        const tooltipDispense = <Tooltip>Dispense</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {/* Dispense */}
            <Whisper trigger="hover" placement="top" speaker={tooltipDispense}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => setOpenOneDispenseModal(true)}
                  style={{ backgroundColor: 'black', color: 'white' }}
                >
                  <FontAwesomeIcon icon={faRightFromBracket} />
                </MyButton>
              </div>
            </Whisper>
            {/* Comments */}
            <Whisper trigger="hover" placement="top" speaker={tooltipComments}>
              <div>
                <MyButton size="small" onClick={() => setOpenChat(true)}>
                  <FontAwesomeIcon icon={faComments} />
                </MyButton>
              </div>
            </Whisper>

            {/* MAR */}
            <Whisper trigger="hover" placement="top" speaker={tooltipNurse}>
              <div>
                <MyButton
                  size="small"
                  style={{ backgroundColor: 'var(--primary-gray)', color: 'white' }}
                >
                  <FontAwesomeIcon icon={faPills} />
                </MyButton>
              </div>
            </Whisper>

            {/* Clinical Check */}
            <Whisper trigger="hover" placement="top" speaker={tooltipDoctor}>
              <div>
                <MyButton size="small" onClick={() => setOpen(true)}>
                  <FontAwesomeIcon icon={faUserCheck} />
                </MyButton>
              </div>
            </Whisper>

            {/* Print Label */}
            <Whisper trigger="hover" placement="top" speaker={tooltipPrintLabel}>
              <div>
                <MyButton
                  size="small"
                  style={{ backgroundColor: 'var(--primary-gray)', color: 'white' }}
                >
                  <FontAwesomeIcon icon={faBarcode} />
                </MyButton>
              </div>
            </Whisper>

            {/* Unavailable */}
            <Whisper trigger="hover" placement="top" speaker={tooltipUnavailable}>
              <div>
                <MyButton size="small">
                  <FontAwesomeIcon icon={faBatteryEmpty} />
                </MyButton>
              </div>
            </Whisper>

            {/* STAT */}
            {rowData?.isCritical && (
              <Whisper trigger="hover" placement="top" speaker={tooltipStat}>
                <div>
                  <MyButton size="small">
                    <TbUrgent size={16} />
                  </MyButton>
                </div>
              </Whisper>
            )}
          </Form>
        );
      },
      expandable: false
    }
  ];
  // Filter orders table
  const filters = () => (
    <>
      <Form layout="inline" fluid className="filter-fields-pharmacey">
        <MyInput
          column
          fieldName=""
          fieldLabel="Ward Name"
          record={{}}
          setRecord={{}}
          fieldType="select"
        />
        <MyInput
          column
          fieldType="select"
          fieldName=""
          fieldLabel="Order Status"
          selectData={orderstatusLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={{}}
        />

        <MyInput
          column
          fieldType="date"
          fieldLabel="From Date"
          fieldName=""
          record={{}}
          setRecord={{}}
        />
        <MyInput
          column
          fieldType="date"
          fieldLabel="To Date"
          fieldName=""
          record={{}}
          setRecord={{}}
        />
      </Form>
      <AdvancedSearchFilters searchFilter={true} />
    </>
  );
  // Function to get nested table data
  const getNestedTable = rowData => {
    return {
      data: rowData.medications || [],
      columns: tableMedicationsColumns
    };
  };
  //
  const handleRowClick = rowData => {
    setSelectedRowKeys(prev => {
      if (prev.includes(rowData.key)) {
        return prev.filter(key => key !== rowData.key);
      } else {
        return [...prev, rowData.key];
      }
    });
  };
  // Handle "Dispense Selected" click
  const handleDispenseSelected = () => {
    const selectedRowsData = data.filter(row => selectedRowKeys.includes(row.key));

    const modalData = selectedRowsData.map(row => ({
      ...row,
      warehouse: '',
      lotNo: '',
      expiryDate: '',
      qtyToDispense: '',
      status: row.orderStatus
        ? row.orderStatus.charAt(0).toUpperCase() + row.orderStatus.slice(1).toLowerCase()
        : 'Pending'
    }));

    setDispenseData(modalData);
    setOpenDispenseModal(true);
  };
  // Handle change in modal inputs
  const handleDispenseChange = (rowKey, field, value) => {
    setDispenseData(prev =>
      prev.map(row => (row.key === rowKey ? { ...row, [field]: value } : row))
    );
  };

  // Complete Dispensing action
  const handleCompleteDispense = rowKey => {
    setDispenseData(prev =>
      prev.map(row => (row.key === rowKey ? { ...row, status: 'Dispensed' } : row))
    );
  };
  
  return (
    <div className="container-of-tables-int width-100">
      <MyNestedTable
        data={data}
        columns={orderColumns}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={data.length}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        getNestedTable={getNestedTable}
        height={500}
        filters={filters()}
        onRowClick={handleRowClick}
        rowClassName={rowData => (selectedRowKeys.includes(rowData.key) ? 'selected-row' : '')}
        tableButtons={
          <div className="gap-f-10">
            <MyButton appearance="ghost">
              <FontAwesomeIcon icon={faPrint} /> Print
            </MyButton>
            <MyButton onClick={handleDispenseSelected}>
              <FontAwesomeIcon icon={faRightFromBracket} /> Dispense Selected
            </MyButton>
          </div>
        }
      />
      <DispenseModal
        open={openDispenseModal}
        setOpen={setOpenDispenseModal}
        dispenseData={dispenseData}
        handleDispenseChange={handleDispenseChange}
        handleCompleteDispense={handleCompleteDispense}
      />
    </div>
  );
};
export default DispenseSelectedOrdersTable;
