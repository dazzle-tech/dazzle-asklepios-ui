import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { DepartmentStockHeader, MainStockTable, SidePanels } from './components';
import './style.less';
import Translate from '@/components/Translate';

/**
 * DepartmentStock Component
 *
 * This component displays a comprehensive department stock management interface
 * with a main data table, search filters, and side panels showing various stock metrics.
 *
 * Features:
 * - Main stock table with pagination
 * - Search and filter functionality
 * - Export and refill request actions
 * - Side panels for quick stock insights
 */
const DepartmentStock = () => {
  const dispatch = useAppDispatch();

  // Pagination state management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch LOV (List of Values) data for dropdowns
  const { data: productsLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
  const { data: payPymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('INVENTORY_PRODUCT_STATUS');

  /**
   * Sample data for the main items table
   * Contains 12 medical products with various stock information
   * Each item includes: name, code, type, inventory details, quantities, and status
   */
  const itemsData = [
    {
      key: '1',
      name: 'Paracetamol 500mg',
      code: 'PAR-500',
      type: 'Medication',
      inventoryType: 'Lot',
      availableQuantity: 150,
      baseUOM: 'Tablets',
      reservedQuantity: 25,
      reorderPoint: 50,
      consumedToday: 15,
      lastReplenished: '2024-01-15',
      status: 'Available'
    },
    {
      key: '2',
      name: 'Morphine 10mg',
      code: 'MOR-10',
      type: 'Medication',
      inventoryType: 'Serial',
      availableQuantity: 25,
      baseUOM: 'Vials',
      reservedQuantity: 5,
      reorderPoint: 30,
      consumedToday: 8,
      lastReplenished: '2024-01-14',
      status: 'Low Stock'
    },
    {
      key: '3',
      name: 'Surgical Gloves Large',
      code: 'SGL-L',
      type: 'Equipment',
      inventoryType: 'Lot',
      availableQuantity: 200,
      baseUOM: 'Pairs',
      reservedQuantity: 40,
      reorderPoint: 75,
      consumedToday: 25,
      lastReplenished: '2024-01-16',
      status: 'Reserved'
    },
    {
      key: '4',
      name: 'Syringe 10ml',
      code: 'SYR-10',
      type: 'Equipment',
      inventoryType: 'Lot',
      availableQuantity: 0,
      baseUOM: 'Units',
      reservedQuantity: 0,
      reorderPoint: 100,
      consumedToday: 50,
      lastReplenished: '2024-01-10',
      status: 'Out of Stock'
    },
    {
      key: '5',
      name: 'Ibuprofen 400mg',
      code: 'IBU-400',
      type: 'Medication',
      inventoryType: 'Lot',
      availableQuantity: 180,
      baseUOM: 'Tablets',
      reservedQuantity: 30,
      reorderPoint: 60,
      consumedToday: 22,
      lastReplenished: '2024-01-13',
      status: 'Available'
    },
    {
      key: '6',
      name: 'Bandages 4x4',
      code: 'BAN-4X4',
      type: 'Equipment',
      inventoryType: 'Lot',
      availableQuantity: 300,
      baseUOM: 'Pieces',
      reservedQuantity: 50,
      reorderPoint: 80,
      consumedToday: 35,
      lastReplenished: '2024-01-12',
      status: 'Available'
    },
    {
      key: '7',
      name: 'Amoxicillin 250mg',
      code: 'AMO-250',
      type: 'Medication',
      inventoryType: 'Lot',
      availableQuantity: 45,
      baseUOM: 'Capsules',
      reservedQuantity: 10,
      reorderPoint: 25,
      consumedToday: 12,
      lastReplenished: '2024-01-11',
      status: 'Low Stock'
    },
    {
      key: '8',
      name: 'Aspirin 100mg',
      code: 'ASP-100',
      type: 'Medication',
      inventoryType: 'Lot',
      availableQuantity: 220,
      baseUOM: 'Tablets',
      reservedQuantity: 35,
      reorderPoint: 70,
      consumedToday: 18,
      lastReplenished: '2024-01-17',
      status: 'Available'
    },
    {
      key: '9',
      name: 'Surgical Mask N95',
      code: 'SM-N95',
      type: 'Equipment',
      inventoryType: 'Lot',
      availableQuantity: 500,
      baseUOM: 'Pieces',
      reservedQuantity: 80,
      reorderPoint: 120,
      consumedToday: 45,
      lastReplenished: '2024-01-18',
      status: 'Available'
    },
    {
      key: '10',
      name: 'Insulin Regular',
      code: 'INS-REG',
      type: 'Medication',
      inventoryType: 'Serial',
      availableQuantity: 15,
      baseUOM: 'Vials',
      reservedQuantity: 3,
      reorderPoint: 20,
      consumedToday: 5,
      lastReplenished: '2024-01-09',
      status: 'Low Stock'
    },
    {
      key: '11',
      name: 'Gauze Pads 4x4',
      code: 'GP-4X4',
      type: 'Equipment',
      inventoryType: 'Lot',
      availableQuantity: 180,
      baseUOM: 'Pieces',
      reservedQuantity: 30,
      reorderPoint: 60,
      consumedToday: 20,
      lastReplenished: '2024-01-19',
      status: 'Available'
    },
    {
      key: '12',
      name: 'Omeprazole 20mg',
      code: 'OME-20',
      type: 'Medication',
      inventoryType: 'Lot',
      availableQuantity: 90,
      baseUOM: 'Capsules',
      reservedQuantity: 15,
      reorderPoint: 40,
      consumedToday: 10,
      lastReplenished: '2024-01-20',
      status: 'Available'
    }
  ];

  /**
   * Side panel data - Most Used Products
   * Shows products with highest daily consumption
   */
  const mostUsedProductsData = [
    { key: '1', product: 'Paracetamol 500mg', quantityPerDay: 45 },
    { key: '2', product: 'Ibuprofen 400mg', quantityPerDay: 32 },
    { key: '3', product: 'Surgical Gloves Large', quantityPerDay: 28 },
    { key: '4', product: 'Syringe 10ml', quantityPerDay: 25 }
  ];

  /**
   * Side panel data - Recently Expired Stock
   * Shows products that have expired recently
   */
  const recentlyExpiredStockData = [
    {
      key: '1',
      product: 'Amoxicillin 250mg',
      lotSerialNumber: 'LOT-2023-001',
      expiryDate: '2024-01-10'
    },
    {
      key: '2',
      product: 'Morphine 10mg',
      lotSerialNumber: 'SER-2023-005',
      expiryDate: '2024-01-08'
    },
    { key: '3', product: 'Bandages 4x4', lotSerialNumber: 'LOT-2023-003', expiryDate: '2024-01-05' }
  ];

  /**
   * Side panel data - Incoming Transfers
   * Shows products being transferred to this department
   */
  const incomingTransfersData = [
    {
      key: '1',
      product: 'Paracetamol 500mg',
      from: 'Central Pharmacy',
      quantity: 500,
      uom: 'Tablets'
    },
    { key: '2', product: 'Surgical Gloves Large', from: 'Main Store', quantity: 200, uom: 'Pairs' },
    { key: '3', product: 'Syringe 10ml', from: 'Medical Supply', quantity: 300, uom: 'Units' }
  ];

  /**
   * Side panel data - Products Near Expiry
   * Shows products that will expire soon
   */
  const productNearExpiryData = [
    {
      key: '1',
      product: 'Morphine 10mg',
      lotSerialNumber: 'SER-2023-008',
      expiryDate: '2024-02-15'
    },
    {
      key: '2',
      product: 'Ibuprofen 400mg',
      lotSerialNumber: 'LOT-2023-012',
      expiryDate: '2024-02-20'
    },
    { key: '3', product: 'Bandages 4x4', lotSerialNumber: 'LOT-2023-015', expiryDate: '2024-02-25' }
  ];

  /**
   * Effect hook to set up page header and cleanup
   * Sets the page title and code in the global state
   */
  useEffect(() => {
    // Header page setUp
    const divContent = (
      <div className="page-title">
        <h5><Translate>Department Stock</Translate></h5>
      </div>
    );
    dispatch(setPageCode('DepartmentStock'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  /**
   * Calculate pagination for the main table
   * Slices the data array based on current page and rows per page
   */
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = itemsData.slice(startIndex, endIndex);

  /**
   * Button event handlers for main actions
   */

  /**
   * Handle Export XLS button click
   * TODO: Implement export functionality
   */
  const handleExportXLS = () => {
    console.log('Export XLS clicked');
    // TODO: Add export logic here
  };

  /**
   * Handle Refill Request button click
   * TODO: Implement refill request functionality
   */
  const handleRefillRequest = () => {
    console.log('Refill Request clicked');
    // TODO: Add refill request logic here
  };

  /**
   * Main component render
   * Returns the complete Department Stock interface
   */
  return (
    <div className="container-internal-drug-order">
      {/* Main content area with table and filters */}
      <div className="container-of-tables-int">
        {/* Header section with department/stock selectors and action buttons */}

        {/* Main stock table with pagination and filters */}
        <MainStockTable
          data={paginatedData}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={itemsData.length}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          productsLovQueryResponse={productsLovQueryResponse}
          payPymentMethodLovQueryResponse={payPymentMethodLovQueryResponse}
        />
      </div>

      {/* Side panel with four small tables showing stock insights */}
      <SidePanels
        mostUsedProductsData={mostUsedProductsData}
        recentlyExpiredStockData={recentlyExpiredStockData}
        incomingTransfersData={incomingTransfersData}
        productNearExpiryData={productNearExpiryData}
      />
    </div>
  );
};

export default DepartmentStock;
