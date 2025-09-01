import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { SidePanels } from '@/pages/Inpatient/departmentStock/components';
import MainStockTableComponent from './MainStockTableComponent';
import './style.less';

const RefillModalComponent = () => {
  const dispatch = useAppDispatch();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { data: productsLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
  const { data: payPymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery(
    'INVENTORY_PRODUCT_STATUS'
  );

  const itemsData = [
    {
      key: '1',
      name: 'Vitamin C 1000mg',
      code: 'VITC-1000',
      type: 'Supplement',
      inventoryType: 'Lot',
      availableQuantity: 75,
      baseUOM: 'Tablets',
      reservedQuantity: 10,
      reorderPoint: 50,
      consumedToday: 5,
      lastReplenished: '2024-08-20',
      status: 'Available'
    },
    {
      key: '2',
      name: 'Antibiotic Cream',
      code: 'ABC-001',
      type: 'Topical',
      inventoryType: 'Lot',
      availableQuantity: 20,
      baseUOM: 'Tubes',
      reservedQuantity: 2,
      reorderPoint: 15,
      consumedToday: 1,
      lastReplenished: '2024-08-22',
      status: 'Low Stock'
    }
  ];

  const mostUsedProductsData = [{ key: '1', product: 'Vitamin C 1000mg', quantityPerDay: 10 }];

  const recentlyExpiredStockData = [
    {
      key: '1',
      product: 'Antibiotic Cream',
      lotSerialNumber: 'LOT-2023-014',
      expiryDate: '2024-08-01'
    }
  ];

  const incomingTransfersData = [
    {
      key: '1',
      product: 'Vitamin C 1000mg',
      from: 'Central Store',
      quantity: 150,
      uom: 'Tablets'
    }
  ];

  const productNearExpiryData = [
    {
      key: '1',
      product: 'Face Mask',
      lotSerialNumber: 'LOT-2023-099',
      expiryDate: '2024-09-15'
    }
  ];

  useEffect(() => {
    const divContent = (
      <div className="page-title">
        <h5>Department Stock</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('DepartmentStock'));
    dispatch(setDivContent(divContentHTML));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = itemsData.slice(startIndex, endIndex);

  return (
    <div className="container-internal-drug-order">
      <div className="container-of-tables-int">
        <MainStockTableComponent
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
      <div className="side-panel-refill-modal-component">
        <SidePanels
          mostUsedProductsData={mostUsedProductsData}
          recentlyExpiredStockData={recentlyExpiredStockData}
          incomingTransfersData={incomingTransfersData}
          productNearExpiryData={productNearExpiryData}
        />
      </div>
    </div>
  );
};

export default RefillModalComponent;
