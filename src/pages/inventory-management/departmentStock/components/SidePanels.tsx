import React from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';
import Section from '@/components/Section';

interface SidePanelsProps {
  mostUsedProductsData: any[];
  recentlyExpiredStockData: any[];
  incomingTransfersData: any[];
  productNearExpiryData: any[];
}

/**
 * SidePanels Component
 *
 * Displays four small tables showing stock insights:
 * - Most Used Products
 * - Recently Expired Stock
 * - Incoming Transfers
 * - Product Near Expiry
 */
const SidePanels: React.FC<SidePanelsProps> = ({
  mostUsedProductsData,
  recentlyExpiredStockData,
  incomingTransfersData,
  productNearExpiryData
}) => {
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
        <Section
          title="Most Used Product"
          content={
            <MyTable data={mostUsedProductsData} columns={mostUsedProductsColumns} height={120} />
          }
          rightLink=""
          setOpen={() => {}}
          openedContent=""
          isContainOnlyTable
        />

        {/* Recently Expired Stock table */}
        <Section
          title="Recently Expired Stock"
          content={
            <MyTable
              data={recentlyExpiredStockData}
              columns={recentlyExpiredStockColumns}
              height={120}
            />
          }
          setOpen={() => {}}
          rightLink=""
          openedContent=""
          isContainOnlyTable
        />

        {/* Incoming Transfers table */}
        <Section
          title="Incoming Transfers"
          content={
            <MyTable data={incomingTransfersData} columns={incomingTransfersColumns} height={120} />
          }
          rightLink=""
          setOpen={() => {}}
          openedContent=""
          isContainOnlyTable
        />

        {/* Product Near Expiry table */}
        <Section
          title="Product Near Expiry"
          content={
            <MyTable data={productNearExpiryData} columns={productNearExpiryColumns} height={120} />
          }
          setOpen={() => {}}
          rightLink=""
          openedContent=""
          isContainOnlyTable
        />
      </div>
    </div>
  );
};

export default SidePanels;
