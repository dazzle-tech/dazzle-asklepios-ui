import React, { useState, useEffect } from 'react';
import { Divider, Form, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyButton from '@/components/MyButton/MyButton';
import ChatModal from '@/components/ChatModal/ChatModal';
import MyModal from '@/components/MyModal/MyModal';
import { Tabs } from 'rsuite';
import PatientSide from '@/pages/lab-module/PatienSide';
import { useLocation } from 'react-router-dom';
import DispenseSelectedOrdersTable from './DispenseSelectedOrdersTable';
import './styles.less';

const InternalDrugOrder = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = location.state;
  // states
  const [openChat, setOpenChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | number>('1');
  const [openOneDispenseModal, setOpenOneDispenseModal] = useState(false);
  // Create state for selected rows data in modal
  const [dispenseData, setDispenseData] = useState<any[]>([]);

  // Handle change in modal inputs
  const handleDispenseChange = (rowKey, field, value) => {
    setDispenseData(prev =>
      prev.map(row => (row.key === rowKey ? { ...row, [field]: value } : row))
    );
  };

  // handle
  const handleSendMessage = msg => {
    if (!msg?.trim()) return;

    const newMsg = {
      message: msg,
      createdAt: new Date().toISOString(),
      senderName: 'Me'
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // Effects
  useEffect(() => {
    // Header page setUp
    const divContent = (
      <div className="page-title">
        <h5>Internal Drug Order</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Internal Drug Order'));
    dispatch(setDivContent(divContentHTML));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <div className="container-internal-drug-order">
      <div className="container-of-tables-int width-100">
        <DispenseSelectedOrdersTable />
      </div>
      <ChatModal
        title="Comment"
        open={openChat}
        setOpen={setOpenChat}
        handleSendMessage={handleSendMessage}
        list={messages}
        fieldShowName="message"
      />
      <MyModal
        open={open}
        setOpen={setOpen}
        title={'Clinical Checks'}
        position="center"
        content={
          <div>
            <Tabs activeKey={activeKey} onSelect={setActiveKey}>
              <Tabs.Tab eventKey="1" title="Diagnosis">
                {/* <Diagnosis /> */}
              </Tabs.Tab>
              <Tabs.Tab eventKey="2" title="Allergies">
                {/* <Allergies /> */}
              </Tabs.Tab>
              <Tabs.Tab eventKey="3" title="Medical Warnings">
                {/* <Warning /> */}
              </Tabs.Tab>
              <Tabs.Tab eventKey="4" title="Diagnostics Results">
                {/* <DiagnosticsResults /> */}
              </Tabs.Tab>
            </Tabs>
          </div>
        }
        steps={[{ title: 'Clinical Checks', icon: <FontAwesomeIcon icon={faUserCheck} /> }]}
      />
      <MyModal
        open={openOneDispenseModal}
        setOpen={setOpenOneDispenseModal}
        title="Dispense Selected Order"
        position="center"
        hideActionBtn={true}
        steps={[{ title: 'Dispense', icon: <FontAwesomeIcon icon={faRightFromBracket} /> }]}
        content={
          <div className="flex-20">
            {/* Form */}
            <Form fluid className="flex-col-20">
              <div className="flex-20-15">
                {/* Card 1: Medication Name & Total Required Qty */}
                <Text className="main-info-patient-side">
                  <span className="section-title">Medication Name</span>
                </Text>

                <div className="flex-row-2">
                  <div className="info-column">
                    <Text className="info-label">Total Required Qty</Text>
                    <Text className="info-value">206</Text>
                  </div>
                  <div className="info-column">
                    <Text className="info-label">Dispense UOM</Text>
                    <Text className="info-value">Capsule</Text>
                  </div>
                </div>

                <Divider className="divider-style" />

                {/* Card 2: Warehouse */}
                <Text className="main-info-patient-side">
                  <span className="section-title">Warehouse & Lot Info</span>
                </Text>
                <div className="flex-row-2">
                  <MyInput
                    fieldLabel="Warehouse"
                    fieldName="warehouse"
                    value={dispenseData[0]?.warehouse || ''}
                    searchable={false}
                    record={{}}
                    setRecord={{}}
                    fieldType="select"
                    selectData={[
                      { label: 'Main', value: 'Main' },
                      { label: 'ICU', value: 'ICU' },
                      { label: 'Pharmacy', value: 'Pharmacy' }
                    ]}
                    selectDataLabel="label"
                    selectDataValue="value"
                    onChange={val => handleDispenseChange(propsData.key, 'warehouse', val)}
                    className="flex-1"
                  />
                  <MyInput
                    fieldLabel="Lot No."
                    fieldName="lotNo"
                    searchable={false}
                    value={dispenseData[0]?.lotNo || ''}
                    record={{}}
                    setRecord={{}}
                    fieldType="select"
                    selectData={propsData?.lotList || []}
                    selectDataLabel="lotNo"
                    selectDataValue="lotNo"
                    onChange={val => handleDispenseChange(propsData.key, 'lotNo', val)}
                    className="flex-1"
                  />
                </div>

                <Divider className="divider-style" />

                <Text className="main-info-patient-side">
                  <span className="section-title">Expiry & Availability</span>
                </Text>
                <div className="flex-row-2">
                  <div className="info-column">
                    <Text className="info-label">Expiry Date</Text>
                    <Text className="info-value">2026-9-10</Text>
                  </div>
                  <div className="info-column">
                    <Text className="info-label">Available Qty.</Text>
                    <Text className="info-value">124</Text>
                  </div>
                </div>
                <Divider className="divider-style" />

                <MyInput
                  fieldLabel="Qty. to Dispense"
                  fieldName="qtyToDispense"
                  value={dispenseData[0]?.qtyToDispense || ''}
                  record={{}}
                  setRecord={{}}
                  fieldType="number"
                  onChange={val => handleDispenseChange(propsData.key, 'qtyToDispense', val)}
                  className="flex-1"
                />
              </div>

              {/* Dispense & Cancel Buttons */}
              <div className="flex-margin-10">
                <MyButton onClick={() => handleDispense(propsData.key)}>
                  <FontAwesomeIcon icon={faPills} /> Dispense
                </MyButton>
              </div>
            </Form>

            {/* Patient Info Side */}
            <div className="patient-side">
              <PatientSide patient={propsData?.patient} encounter={propsData?.encounter} />
            </div>
          </div>
        }
      />
    </div>
  );
};

export default InternalDrugOrder;
