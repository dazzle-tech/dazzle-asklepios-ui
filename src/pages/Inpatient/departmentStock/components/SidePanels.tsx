import React from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

/**
 * SidePanels Component
 *
 * Displays four small tables showing stock insights:
 * - Most Used Products
 * - Recently Expired Stock
 * - Incoming Transfers
 * - Product Near Expiry
 */
const SidePanels = ({
  mostUsedProductsData,
  recentlyExpiredStockData,
  incomingTransfersData,
  productNearExpiryData
}: any) => {
  // Column definitions for side panel tables
  const mostUsedProductsColumns = [
    {
      key: 'product',
      title: <Translate>Product</Translate>,
      width: 150
    },
    {
      key: 'quantityPerDay',
      title: <Translate>Qty/Day</Translate>,
      width: 80
    }
  ];

  const recentlyExpiredStockColumns = [
    {
      key: 'product',
      title: <Translate>Product</Translate>,
      width: 120
    },
    {
      key: 'lotSerialNumber',
      title: <Translate>Lot/Serial</Translate>,
      width: 100
    },
    {
      key: 'expiryDate',
      title: <Translate>Expiry Date</Translate>,
      width: 100,
      render: (row: any) => <span className="date-table-style">{row.expiryDate}</span>
    }
  ];

  const incomingTransfersColumns = [
    {
      key: 'product',
      title: <Translate>Product</Translate>,
      width: 120
    },
    {
      key: 'from',
      title: <Translate>From</Translate>,
      width: 100
    },
    {
      key: 'quantity',
      title: <Translate>Qty</Translate>,
      width: 60
    },
    {
      key: 'uom',
      title: <Translate>UOM</Translate>,
      width: 60
    }
  ];

  const productNearExpiryColumns = [
    {
      key: 'product',
      title: <Translate>Product</Translate>,
      width: 120
    },
    {
      key: 'lotSerialNumber',
      title: <Translate>Lot/Serial</Translate>,
      width: 100
    },
    {
      key: 'expiryDate',
      title: <Translate>Expiry Date</Translate>,
      width: 100,
      render: (row: any) => <span className="date-table-style">{row.expiryDate}</span>
    }
  ];

  return (
    <div className="patient-side-internal-drug-order">
      <div className="side-panel-tables">
        {/* Most Used Products table */}
        <div className="side-panel-table">
          <div className="side-panel-header-div">
            <div className="side-panel-title-div">Most Used Product</div>
          </div>
          <div>
            <MyTable data={mostUsedProductsData} columns={mostUsedProductsColumns} height={120} />
          </div>
        </div>

        {/* Recently Expired Stock table */}
        <div className="side-panel-table">
          <div className="side-panel-header-div">
            <div className="side-panel-title-div">Recently Expired Stock</div>
          </div>
          <div>
            <MyTable
              data={recentlyExpiredStockData}
              columns={recentlyExpiredStockColumns}
              height={120}
            />
          </div>
        </div>

        {/* Incoming Transfers table */}
        <div className="side-panel-table">
          <div className="side-panel-header-div">
            <div className="side-panel-title-div">Incoming Transfers</div>
          </div>
          <div>
            <MyTable data={incomingTransfersData} columns={incomingTransfersColumns} height={120} />
          </div>
        </div>

        {/* Product Near Expiry table */}
        <div className="side-panel-table">
          <div className="side-panel-header-div">
            <div className="side-panel-title-div">Product Near Expiry</div>
          </div>
          <div>
            <MyTable data={productNearExpiryData} columns={productNearExpiryColumns} height={120} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidePanels;
