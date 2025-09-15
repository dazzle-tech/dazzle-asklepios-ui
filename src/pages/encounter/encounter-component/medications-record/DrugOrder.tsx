import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetDrugOrderQuery } from '@/services/encounterService';
import { newApDrugOrder } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';
import DrugOrderDetails from './DrugOrderDetails';
import { Divider, Row } from 'rsuite';
import { formatDateWithoutSeconds } from '@/utils';
const DrugOrder = ({ patient, genericMedicationListResponse }) => {
  const [order, setOrder] = useState({ ...newApDrugOrder });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },

      {
        fieldName: 'status_lkey',
        operator: 'match',
        value: '1804482322306061'
      }
    ]
  });
  const { data: orders, refetch: ordRefetch } = useGetDrugOrderQuery(listRequest);
  const isSelectedO = rowData => {
    if (rowData && order && rowData.key === order.key) {
      return 'selected-row';
    } else return '';
  };
  const tableColumns = [
    {
      key: 'drugorderId',
      dataKey: 'drugorderId',
      title: <Translate>Order ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData?.drugorderId ?? '';
      }
    },
    {
      key: 'visitId',
      dataKey: 'visitId',
      title: <Translate>Visit ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData?.encounter?.visitId ?? '';
      }
    },
    {
      key: 'visitDate',

      title: <Translate>Visit Date</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData.encounter?.createdAt);
      }
    },
    {
      key: 'createdAt',
      dataKey: 'createdAt',
      title: <Translate>Created At</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData?.createdAt);
      }
    },

    {
      key: 'createdBy',
      dataKey: 'createdBy',
      title: <Translate>Created By</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.createdBy;
      }
    },
    {
      key: 'submittedBy',
      dataKey: 'submittedBy',
      title: <Translate>Submitted By </Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.submittedBy;
      }
    },
    {
      key: 'submittedAt',
      dataKey: 'submittedAt',
      title: <Translate>Submitted at</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData.submittedAt);
      }
    }
  ];
  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = orders?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API

    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };

  return (
    <>
      <MyTable
        columns={tableColumns}
        data={orders?.object ?? []}
        onRowClick={rowData => {
          setOrder(rowData);
        }}
        rowClassName={isSelectedO}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <Divider />
      <Row>
        {order.key && (
          <DrugOrderDetails
            order={order}
            genericMedicationListResponse={genericMedicationListResponse}
          />
        )}
      </Row>
    </>
  );
};
export default DrugOrder;
