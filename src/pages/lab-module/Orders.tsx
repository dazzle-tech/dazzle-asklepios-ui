import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetDiagnosticOrderQuery } from "@/services/encounterService";
import { faLandMineOn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDateWithoutSeconds } from "@/utils";
import './styles.less';
import React, { useState } from "react";
import { Panel, Tooltip, Whisper } from "rsuite";
import { orderBy } from "lodash";
const Orders = ({ order, setOrder, listOrdersResponse, setListOrdersResponse }) => {
    const { data: ordersList, refetch: orderFetch, isFetching: isOrderFetcheng } = useGetDiagnosticOrderQuery({ ...listOrdersResponse 
        ,sortBy:'isUrgent' ,sortType:'desc' });
    const filterdOrderList = ordersList?.object.filter((item) => item.hasLaboratory === true);
    const isSelected = rowData => {
        if (rowData && order && rowData.key === order.key) {
            return 'selected-row';
        } else return '';
    };
    const tableColomns = [
        {
            key: "orderId",
            dataKey: "orderId",
            title: <Translate> ORDER ID</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return rowData.orderId;
            }

        }
        ,
        {
            key: "submittedAt",
            dataKey: "submittedAt",
            title: <Translate>DATE,TIME</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                return formatDateWithoutSeconds(rowData.submittedAt);
            }

        }
        ,
        {
            key: "",

            title: <Translate>MRN</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return rowData.patient?.patientMrn;
            }
        }
        ,
        {
            key: "",

            title: <Translate>PATIENT NAME</Translate>,
            flexGrow: 3,
            fullText: true,
            render: (rowData: any) => {
                return rowData.patient?.fullName;
            }

        }
        ,
        {
            key: "",
            dataKey: "",
            title: <Translate>SATUTS</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                return rowData.labStatusLvalue ? rowData.labStatusLvalue.lovDisplayVale : rowData.labStatusLkey;
            }

        },
        {
            key: "",
            dataKey: "",
            title: <Translate>MARKER</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                return rowData.isUrgent ?
                    <Whisper
                        placement="top"
                        trigger="hover"
                        speaker={<Tooltip>Urgent</Tooltip>}
                    >
                        <FontAwesomeIcon
                            icon={faLandMineOn}
                            className="urgent-icon-style"
                        />
                    </Whisper> : ""

            }
        }
    ];
    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handlePageChange = (_: unknown, newPage: number) => {
        setPageIndex(newPage);
    }
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPageIndex(0);

    };
    const totalCount = filterdOrderList?.length ?? 0;
    const paginatedData = filterdOrderList?.slice(
        pageIndex * rowsPerPage,
        pageIndex * rowsPerPage + rowsPerPage
    );
    return (
        <Panel className="panel-border">
            <MyTable
                data={paginatedData || []}
                columns={tableColomns}
                height={200}

                sortColumn={listOrdersResponse.sortBy}
                sortType={listOrdersResponse.sortType}
                onSortChange={(sortBy, sortType) => {
                    if (sortBy)
                        setListOrdersResponse({
                            ...listOrdersResponse,
                            sortBy,
                            sortType
                        });
                }}
                onRowClick={rowData => {
                    setOrder(rowData);



                }}
                rowClassName={isSelected}
                loading={isOrderFetcheng}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            ></MyTable>

        </Panel>
    );
}
export default Orders;