import MyTable from '@/components/MyTable';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckToSlot } from '@fortawesome/free-solid-svg-icons';

const PhysicianOrderSummary = () => {

    const handleExecute = (record: any) => {
        console.log('Execute clicked for:', record);
        // logic like API call or modal can go here
    };


    const data = [
        {
            orderType: 'Order Type 1',
            orderName: 'Order Name 1',
            priority: 'Priority 1',
            orderDate: '2021-01-01',
            orderTime: '10:00',
            scheduledDateTime: '2021-01-01 10:00',
            status: 'Status 1',
        },
        {
            orderType: 'Order Type 2',
            orderName: 'Order Name 2',
            priority: 'Priority 2',
            orderDate: '2021-01-02',
            orderTime: '11:00',
            scheduledDateTime: '2021-01-02 11:00',
            status: 'Status 2',
        },
    ];

    const columns = [
        {
            title: 'Order Type',
            dataIndex: 'orderType',
            key: 'orderType',
        },
        {
            title: 'Order Name',
            dataIndex: 'orderName',
            key: 'orderName',
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
        },
        {
            title: 'Order Date&Time',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (text: string, record: any) => {
                return <span>{record.orderDate} / {record.orderTime}</span>;
            }
        },
        {
            title: 'Scheduled Date&Time',
            dataIndex: 'scheduledDateTime',
            key: 'scheduledDateTime',
            render: (text: string, record: any) => {
                return <span>{record.scheduledDateTime}</span>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Execute',
            key: 'execute',
            render: (_: any, record: any) => (
                <FontAwesomeIcon
                    icon={faCheckToSlot}
                    style={{ cursor: 'pointer'}}
                    onClick={() => handleExecute(record)}
                />
            )
        },
    ];

    return (
        <>
            <MyTable data={data} columns={columns} />
        </>
    );
};

export default PhysicianOrderSummary;
