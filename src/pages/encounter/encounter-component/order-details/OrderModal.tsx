import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput/MyInput';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
import { initialListRequest, ListRequest } from '@/types/types';
import './styles.less';

interface Order {
  id: number;
  orderType: string;
  medicationName: string;
  route: string;
  frequency: string;
  frequencyUnit: string;
  startDateTime: Date | null;
  durationType: string;
  duration: string;
  status: string;
  createdBy: string;
}

interface OrderModalProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  orders: Order[];
  setOrders: (val: Order[]) => void;
  editingOrder: number | null;
  setEditingOrder: (val: number | null) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({
  open,
  setOpen,
  orders,
  setOrders,
  editingOrder,
  setEditingOrder
}) => {
  const [activeIngredientsListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const { data: medLov } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: timeUnitsLov } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const [orderForm, setOrderForm] = useState<Order>({
    id: 0,
    orderType: '',
    medicationName: '',
    route: '',
    frequency: '',
    frequencyUnit: 'hours',
    startDateTime: null,
    durationType: 'days',
    duration: '',
    status: 'Pending',
    createdBy: 'Current User'
  });

  const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(
    activeIngredientsListRequest
  );
  useEffect(() => {
    if (editingOrder !== null) {
      const editData = orders[editingOrder];
      setOrderForm({ ...editData });
    } else {
      setOrderForm({
        id: 0,
        orderType: '',
        medicationName: '',
        route: '',
        frequency: '',
        frequencyUnit: 'hours',
        startDateTime: null,
        durationType: 'days',
        duration: '',
        status: 'Pending',
        createdBy: 'Current User'
      });
    }
  }, [editingOrder, orders]);

  const handleSave = () => {
    const newOrder: Order = {
      ...orderForm,
      id: editingOrder !== null ? orders[editingOrder].id : Date.now(),
      startDateTime: orderForm.startDateTime ? new Date(orderForm.startDateTime) : null
    };

    if (editingOrder !== null) {
      const updatedOrders = [...orders];
      updatedOrders[editingOrder] = newOrder;
      setOrders(updatedOrders);
    } else {
      setOrders([...orders, newOrder]);
    }

    setOpen(false);
    setEditingOrder(null);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={editingOrder !== null ? 'Edit Order' : 'Add New Order'}
      size="32vw"
      bodyheight="55vh"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      steps={[{ title: 'Add New Rule', icon: <FontAwesomeIcon icon={faSave} /> }]}
      content={() => (
        <Form fluid className="order-form">
          {/* Row 1 */}
          <div className="order-row">
            <div className="order-col">
              <MyInput
                fieldName="orderType"
                fieldType="select"
                record={orderForm}
                setRecord={setOrderForm}
                fieldLabel="Order Type"
                selectData={[
                  { lovDisplayVale: 'Insulin', key: 'insulin' },
                  { lovDisplayVale: 'Analgesic', key: 'analgesic' },
                  { lovDisplayVale: 'Antihypertensive', key: 'antihypertensive' }
                ]}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                searchable={false}
                width={200}
              />
            </div>
            <div className="order-col">
              <MyInput
                fieldName="medicationName"
                fieldType="select"
                record={orderForm}
                setRecord={setOrderForm}
                fieldLabel="Medication Name"
                selectData={activeIngredientListResponseData?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                searchable={false}
                width={200}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="order-row">
            {/* Route */}
            <div className="order-col">
              <MyInput
                fieldName="route"
                fieldType="select"
                record={orderForm}
                setRecord={setOrderForm}
                fieldLabel="Route"
                selectData={
                  medLov?.object ?? [
                    { lovDisplayVale: 'Oral', key: 'oral' },
                    { lovDisplayVale: 'SC', key: 'sc' },
                    { lovDisplayVale: 'IV', key: 'iv' }
                  ]
                }
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                searchable={false}
                width={200}
              />
            </div>

            {/* Frequency + Unit */}
            <div className="monitoring-inputs">
              <div>
                <MyInput
                  fieldName="frequency"
                  fieldType="number"
                  record={orderForm}
                  setRecord={setOrderForm}
                  fieldLabel="Frequency"
                  width={99}
                />
              </div>
              <div>
                <MyInput
                  fieldName="frequencyUnit"
                  fieldType="select"
                  record={orderForm}
                  setRecord={setOrderForm}
                  selectData={
                    timeUnitsLov?.object ?? [
                      { lovDisplayVale: 'Hours', key: 'hours' },
                      { lovDisplayVale: 'Days', key: 'days' }
                    ]
                  }
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  searchable={false}
                  showLabel={false}
                  width={99}
                />
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="order-row">
            <div className="order-col">
              <MyInput
                fieldName="startDateTime"
                fieldType="datetime"
                record={orderForm}
                setRecord={setOrderForm}
                fieldLabel="Start Date/Time"
                width={200}
              />
            </div>
            <div className="order-col">
              <MyInput
                fieldName="duration"
                fieldType="number"
                record={orderForm}
                setRecord={setOrderForm}
                fieldLabel="Duration"
                width={200}
              />
            </div>
          </div>
        </Form>
      )}
    />
  );
};

export default OrderModal;
