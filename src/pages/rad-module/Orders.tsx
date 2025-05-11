import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetDiagnosticOrderQuery } from "@/services/encounterService";
import { initialListRequest, ListRequest } from "@/types/types";
import { faLandMineOn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { Tooltip, Whisper } from "rsuite";
const Orders = ({order,setOrder,listOrdersResponse,setListOrdersResponse}) => {
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
    const {
        data: ordersList,
        refetch: orderFetch,
        isFetching: isOrderFetching
    } = useGetDiagnosticOrderQuery({ ...listOrdersResponse });

    const filterdOrderList = ordersList?.object.filter(item => item.hasRadiology === true);
      const isSelected = rowData => {
    if (rowData && order && rowData.key === order.key) {
      return 'selected-row';
    } else return '';
  };

    const orderColumns = [
        {
            key: "orderId",
            dataKey: "orderId",
            title: <Translate>ORDER ID</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return rowData.orderId ?? '';
            }
        },
        {
            key: "submittedAt",
            dataKey: "submittedAt",
            title: <Translate>DATE,TIME</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return rowData.submittedAt ? new Date(rowData.submittedAt).toLocaleString() : '';
            }
        },
        {
            key: "mrn",
            title: <Translate>MRN</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return rowData.patient?.patientMrn ?? '';
            }
        },
        {
            key: "name",
            title: <Translate>PATIENT NAME</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                return rowData.patient?.fullName ?? '';
            }
        },
        {
            key: "radStatusLkey",
            dataKey: "radStatusLkey",
            title: <Translate>STATUS</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return rowData.radStatusLvalue?.lovDisplayVale ?? rowData.radStatusLkey;
            }
        },
        {
            key: "marker",
            title: <Translate>MARKER</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.isUrgent ? (
                    <Whisper
                        placement="top"
                        trigger="hover"
                        speaker={<Tooltip>Urgent</Tooltip>}
                    >
                        <FontAwesomeIcon
                            icon={faLandMineOn}
                            style={{
                                fontSize: '1em',
                                marginRight: 10,
                                color: 'red',
                                cursor: 'pointer'
                            }}
                        />
                    </Whisper>
                ) : (
                    null
                );
            }
        }
    ];
    ////order
    const pageIndex = listOrdersResponse.pageNumber - 1;
    // how many rows per page:
    const rowsPerPage = listOrdersResponse.pageSize;
    // total number of items in the backend:
    const totalCount = filterdOrderList?.length ?? 0;
    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
        // MUI gives you a zero-based page, so add 1 for your API
        setManualSearchTriggered(true);
        setListOrdersResponse({ ...listOrdersResponse, pageNumber: newPage + 1 });
    };
    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setManualSearchTriggered(true);
        setListOrdersResponse({
            ...listOrdersResponse,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // reset to first page
        });


    };
    return (<>
        <MyTable
            data={filterdOrderList ?? []}
            columns={orderColumns}
            onRowClick={rowData => {
                setOrder(rowData);
              
                //   setTest({ ...newApDiagnosticOrderTests });
                //   setReport({ ...newApDiagnosticOrderTestsRadReport });
            }}
            rowClassName={isSelected}
            sortColumn={listOrdersResponse.sortBy}
            sortType={listOrdersResponse.sortType}
            onSortChange={(sortBy, sortType) => {
                setListOrdersResponse({ ...listOrdersResponse, sortBy, sortType });
            }}
            loading={isOrderFetching}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />
    </>)
}
export default Orders;