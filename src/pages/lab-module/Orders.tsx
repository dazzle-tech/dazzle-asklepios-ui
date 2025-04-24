import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetDiagnosticOrderQuery } from "@/services/encounterService";
import { faLandMineOn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './styles.less';
import React from "react";
import { Divider, Pagination, Panel, Tooltip, Whisper } from "rsuite";
const Orders = ({ order, setOrder, listOrdersResponse, setListOrdersResponse }) => {
    const { data: ordersList, refetch: orderFetch, isFetching: isOrderFetcheng } = useGetDiagnosticOrderQuery({ ...listOrdersResponse });
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
                return rowData.submittedAt ? new Date(rowData.submittedAt).toLocaleString() : "";
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
    ]
    return (
        <Panel className="panel-border">
            <MyTable
                data={filterdOrderList || []}
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
            ></MyTable>
            <Divider />
            <Pagination
                prev
                next
                first
                last
                ellipsis
                boundaryLinks
                maxButtons={5}
                size="xs"
                layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                limitOptions={[4, 15, 30]}
                limit={listOrdersResponse.pageSize}
                activePage={listOrdersResponse.pageNumber}

                onChangePage={pageNumber => {
                    setListOrdersResponse({ ...listOrdersResponse, pageNumber });
                }}
                onChangeLimit={pageSize => {
                    setListOrdersResponse({ ...listOrdersResponse, pageSize });
                }}
                total={filterdOrderList?.length || 0}
            />
        </Panel>
    );
}
export default Orders;