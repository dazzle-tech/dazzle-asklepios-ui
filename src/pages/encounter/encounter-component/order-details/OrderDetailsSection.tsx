import React, { useState } from 'react';
import MyTable from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPlay, faBan } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import OrderModal from './OrderModal';
import { Checkbox } from 'rsuite';
import './styles.less';

const OrderDetailsSection = ({ orders, orderColumns, onRowClick }) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<number | null>(null);
  const [orderList, setOrderList] = useState(orders);
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelEnabled, setCancelEnabled] = useState(false);

  const handleRowClick = row => {
    setSelectedOrder(row);
    onRowClick(row);

    setCancelEnabled(row.status !== 'Completed');
  };

  const handleCancel = () => {
    if (!selectedOrder) return;

    const updatedOrders = orderList.map(order =>
      order.id === selectedOrder.id
        ? {
            ...order,
            status: 'Canceled',
            canceledBy: 'Current User',
            canceledAt: new Date(),
            cancelReason: 'Canceled via UI'
          }
        : order
    );

    setOrderList(updatedOrders);
    setSelectedOrder({
      ...selectedOrder,
      status: 'Canceled',
      canceledBy: 'Current User',
      canceledAt: new Date(),
      cancelReason: 'Canceled via UI'
    });

    setCancelEnabled(false);
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setShowOrderModal(true);
  };

  const handleStart = () => {
    if (!selectedOrder) return;

    if (selectedOrder.status === 'Pending') {
      const updatedOrders = orderList.map(order =>
        order.id === selectedOrder.id ? { ...order, status: 'Active' } : order
      );
      setOrderList(updatedOrders);
      setSelectedOrder({ ...selectedOrder, status: 'Active' });
    }
  };

  return (
    <div className="margin-section">
      <SectionContainer
        title={<h6>Order Details</h6>}
        content={
          <MyTable
            data={
              showCancelled ? orderList : orderList.filter(order => order.status !== 'Canceled')
            }
            columns={orderColumns}
            height={300}
            onRowClick={handleRowClick}
            rowClassName={row => (selectedOrder?.id === row.id ? 'selected-row' : '')}
            tableButtons={
              <div className="flex-container">
                <div className="flex-8">
                  <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faBan} />}
                    onClick={handleCancel}
                    size="small"
                    disabled={!cancelEnabled}
                  >
                    Cancel
                  </MyButton>

                  <Checkbox
                    checked={showCancelled}
                    onChange={() => setShowCancelled(!showCancelled)}
                  >
                    Show Cancelled
                  </Checkbox>
                </div>
                <div className="flex-8">
                  <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faPlay} />}
                    onClick={handleStart}
                    size="small"
                  >
                    Start
                  </MyButton>

                  <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                    onClick={handleAdd}
                    size="small"
                  >
                    Add
                  </MyButton>
                </div>
              </div>
            }
          />
        }
      />

      <OrderModal
        open={showOrderModal}
        setOpen={setShowOrderModal}
        orders={orderList}
        setOrders={setOrderList}
        editingOrder={editingOrder}
        setEditingOrder={setEditingOrder}
      />
    </div>
  );
};

export default OrderDetailsSection;
