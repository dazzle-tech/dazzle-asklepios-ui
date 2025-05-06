import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetDrugOrderQuery } from "@/services/encounterService";
import { newApDrugOrder } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import React, { useState } from "react";
import DrugOrderDetails from "./DrugOrderDetails";
import { Row } from "rsuite";
const DrugOrder = ({ patient,genericMedicationListResponse }) => {
    const [order, setOrder] = useState({ ...newApDrugOrder });
    const { data: orders, refetch: ordRefetch } = useGetDrugOrderQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key,
            },

            {
                fieldName: "status_lkey",
                operator: "match",
                value: "1804482322306061"
            }

        ],
    });
    const isSelectedO = rowData => {
        if (rowData && order && rowData.key === order.key) {
            return 'selected-row';
        } else return '';
    };
    const tableColumns = [
        {
            key: "drugorderId",
            dataKey: "drugorderId",
            title: <Translate>Order ID</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData?.drugorderId ?? "";
            }


        },
        {
            key: "visitId",
            dataKey: "visitId",
            title: <Translate>Visit ID</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData?.encounter?.visitId ?? "";
            }


        },
        {
            key: "visitDate",

            title: <Translate>Visit Date</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.encounter?.createdAt ? new Date(rowData.encounter?.createdAt).toLocaleString() : " ";
            }


        },
        {
            key: "createdAt",
            dataKey: "createdAt",
            title: <Translate>Created At</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : " ";
            }


        },
        
        {
            key: "createdBy",
            dataKey: "createdBy",
            title: <Translate>Created By</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.createdBy;
            }


        },
        {
            key: "submittedBy",
            dataKey: "submittedBy",
            title: <Translate>Submitted By </Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.submittedBy;
            }


        },
        {
            key: "submittedAt",
            dataKey: "submittedAt",
            title: <Translate>Submitted at</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.submittedAt ? new Date(rowData.submittedAt).toLocaleString() : " ";
            }


        },


    ]
    return (<>
    <Row>
    <MyTable
            columns={tableColumns}
            data={orders?.object ?? []}

            onRowClick={rowData => {
                setOrder(rowData);
            }}
            rowClassName={isSelectedO}
        />
    </Row>
    <br/>
     <Row>
     {order.key && <DrugOrderDetails order={order} genericMedicationListResponse={genericMedicationListResponse}/>}</Row>  
</>);
}
export default DrugOrder;