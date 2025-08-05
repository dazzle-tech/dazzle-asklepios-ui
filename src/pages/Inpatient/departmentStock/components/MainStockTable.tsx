import React from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCalculator, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';

interface MainStockTableProps {
  data: any[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  productsLovQueryResponse: any;
  payPymentMethodLovQueryResponse: any;
}

/**
 * MainStockTable Component
 *
 * Main stock table with search filters, pagination, and action buttons
 */
const MainStockTable: React.FC<MainStockTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  productsLovQueryResponse,
  payPymentMethodLovQueryResponse
}) => {
  /**
   * Actions column renderer for main table
   * Provides action buttons for each row: View Transactions, Adjust Quantity, Product Card
   */
  const actionsForItems = rowData => {
    const handleViewTransactions = () => {
      console.log('View transactions for:', rowData.name);
      // TODO: Implement view transactions logic
    };

    const handleAdjustQuantity = () => {
      console.log('Adjust quantity for:', rowData.name);
      // TODO: Implement adjust quantity logic
    };

    const handleProductCard = () => {
      console.log('Product card for:', rowData.name);
      // TODO: Implement product card logic
    };

    return (
      <div className="container-of-actions">
        <FontAwesomeIcon
          icon={faEye}
          title="View Transactions"
          className="action-icon"
          onClick={handleViewTransactions}
        />
        <FontAwesomeIcon
          icon={faCalculator}
          title="Adjust Quantity"
          className="action-icon"
          onClick={handleAdjustQuantity}
        />
        <FontAwesomeIcon
          icon={faCreditCard}
          title="Product Card"
          className="action-icon"
          onClick={handleProductCard}
        />
      </div>
    );
  };

  /**
   * Search and filter form for the main table
   */
  const filters = () => (
    <Form layout="inline" fluid className="filter-fields-pharmacey">
      <MyInput
        column
        fieldType="multyPicker"
        fieldLabel="Product Type"
        fieldName="productType"
        selectData={productsLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        width="140px"
        record={{}}
        placeholder="Select Product Types"
      />
      <MyInput
        column
        fieldType="select"
        fieldName="status"
        fieldLabel="Status"
        selectData={payPymentMethodLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        width="130px"
        record={{}}
        placeholder="Select Status"
      />
      <MyInput
        column
        fieldType="text"
        fieldName="productName"
        fieldLabel="Product Name"
        placeholder="Enter Product Name"
        width="154px"
        record={{}}
        setRecord={{}}
      />
      <MyInput
        column
        fieldType="text"
        fieldName="productCode"
        fieldLabel="Product Code"
        placeholder="Enter Product Code"
        width="149px"
        record={{}}
        setRecord={{}}
      />
      <MyInput
        column
        fieldType="text"
        fieldName="barcode"
        fieldLabel="Barcode"
        placeholder="Enter Barcode"
        width="115px"
        record={{}}
        setRecord={{}}
      />
      <MyButton color="var(--deep-blue)" width="109px">
        Search
      </MyButton>
    </Form>
  );

  /**
   * Main table columns configuration
   */
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      width: 150
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      width: 100
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      width: 100
    },
    {
      key: 'inventoryType',
      title: <Translate>Inventory Type</Translate>,
      width: 120,
      render: rowData => {
        const inventoryType = rowData.inventoryType || 'Lot';

        const getInventoryTypeConfig = inventoryType => {
          switch (inventoryType) {
            case 'Lot':
              return {
                backgroundColor: 'var(--light-blue)',
                color: 'var(--primary-blue)',
                contant: 'Lot',
                width: 80
              };
            case 'Serial':
              return {
                backgroundColor: 'var(--icon-gray)',
                color: 'var(--light-gray)',
                contant: 'Serial',
                width: 80
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: 'Unknown'
              };
          }
        };

        const config = getInventoryTypeConfig(inventoryType);
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
      key: 'availableQuantity',
      title: <Translate>Available Quantity</Translate>,
      width: 120,
      render: (rowData: any) => (
        <span
          className={
            rowData.availableQuantity === 0
              ? 'available-quantity-zero'
              : 'available-quantity-normal'
          }
        >
          {rowData.availableQuantity}
        </span>
      )
    },
    {
      key: 'baseUOM',
      title: <Translate>Base UOM</Translate>,
      width: 80
    },
    {
      key: 'reservedQuantity',
      title: <Translate>Reserved Quantity</Translate>,
      expandable: true,
      width: 120
    },
    {
      key: 'reorderPoint',
      title: <Translate>Reorder Point</Translate>,
      expandable: true,
      width: 100
    },
    {
      key: 'consumedToday',
      title: <Translate>Consumed Today</Translate>,
      expandable: true,
      width: 120
    },
    {
      key: 'lastReplenished',
      title: <Translate>Last Replenished</Translate>,
      expandable: true,
      width: 120,
      render: (row: any) =>
        row?.lastReplenished ? (
          <span className="date-table-style">{formatDateWithoutSeconds(row.lastReplenished)}</span>
        ) : (
          ' '
        )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      width: 100,
      render: rowData => {
        const status = rowData.status || 'Normal';

        const getStatusConfig = status => {
          switch (status) {
            case 'Available':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Available'
              };
            case 'Low Stock':
              return {
                backgroundColor: 'var(--light-orange)',
                color: 'var(--primary-orange)',
                contant: 'Low Stock'
              };
            case 'Out of Stock':
              return {
                backgroundColor: 'var(--light-red)',
                color: 'var(--primary-red)',
                contant: 'Out of Stock'
              };
            case 'Reserved':
              return {
                backgroundColor: 'var(--light-purple)',
                color: 'var(--primary-purple)',
                contant: 'Reserved'
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
      width: 120,
      render: rowData => actionsForItems(rowData)
    }
  ];

  return (
    <MyTable
      data={data}
      columns={tableColumns}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      height={500}
      filters={filters()}
    />
  );
};

export default MainStockTable;
