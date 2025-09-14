import React, { useState } from 'react';
import MyTable from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import './styles.less';
import SectionContainer from '@/components/SectionsoContainer';

const SlidingScale = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [slidingScaleRules, setSlidingScaleRules] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  // Static data for orders table with different statuses
  const [orders, setOrders] = useState([
    {
      id: 1,
      orderType: 'insulin',
      medicationName: 'insulin_regular',
      route: 'sc',
      frequency: '6',
      frequencyUnit: 'hours',
      startDateTime: new Date('2024-01-15T08:00:00'),
      durationType: 'days',
      duration: '7',
      status: 'Pending',
      createdBy: 'Dr. Smith'
    },
    {
      id: 2,
      orderType: 'analgesic',
      medicationName: 'acetaminophen',
      route: 'oral',
      frequency: '4',
      frequencyUnit: 'hours',
      startDateTime: new Date('2024-01-16T09:00:00'),
      durationType: 'days',
      duration: '5',
      status: 'Active',
      createdBy: 'Dr. Johnson'
    },
    {
      id: 3,
      orderType: 'antihypertensive',
      medicationName: 'lisinopril',
      route: 'oral',
      frequency: '12',
      frequencyUnit: 'hours',
      startDateTime: new Date('2024-01-14T07:00:00'),
      durationType: 'days',
      duration: '10',
      status: 'Completed',
      createdBy: 'Dr. Brown'
    }
  ]);

  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    parameterName: '',
    rangeType: 'between',
    rangeFrom: '',
    rangeTo: '',
    unit: '',
    dose: '',
    doseUnit: '',
    route: '',
    notes: ''
  });

  // Safety & Monitoring state
  const [safetyForm, setSafetyForm] = useState({
    maxDose24h: '',
    holdCriteria: [],
    linkedParameter: [],
    monitoringFrequency: '',
    monitoringUnit: 'hours',
    specialInstructions: ''
  });

  const { data: resourceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
  const { data: MedLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: valueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: holdCriteriaLovQueryResponse } = useGetLovValuesByCodeQuery('HOLD_CRITERIA');
  const { data: linkedParameterLovQueryResponse } = useGetLovValuesByCodeQuery('LINKED_PARAMETER');
  const { data: orderTypesLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_TYPES');

  // Static fallback data
  const orderTypesData = orderTypesLovQueryResponse?.object ?? [
    { lovDisplayVale: 'Insulin', key: 'insulin' },
    { lovDisplayVale: 'Analgesic', key: 'analgesic' },
    { lovDisplayVale: 'Antihypertensive', key: 'antihypertensive' }
  ];

  const medicationsData = MedLovQueryResponse?.object ?? [
    { lovDisplayVale: 'Acetaminophen', key: 'acetaminophen' },
    { lovDisplayVale: 'Insulin Regular', key: 'insulin_regular' },
    { lovDisplayVale: 'Lisinopril', key: 'lisinopril' }
  ];

  const routesData = resourceTypeLovQueryResponse?.object ?? [
    { lovDisplayVale: 'Oral', key: 'oral' },
    { lovDisplayVale: 'SC', key: 'sc' },
    { lovDisplayVale: 'IV', key: 'iv' }
  ];

  const timeUnitsData = timeUnitLovQueryResponse?.object ?? [
    { lovDisplayVale: 'Hours', key: 'hours' },
    { lovDisplayVale: 'Days', key: 'days' }
  ];

  const valueUnitsData = valueUnitLovQueryResponse?.object ?? [
    { lovDisplayVale: 'mg', key: 'mg' },
    { lovDisplayVale: 'units', key: 'units' },
    { lovDisplayVale: 'ml', key: 'ml' }
  ];

  // Table columns for orders
  const orderColumns = [
    {
      key: 'orderType',
      title: 'Type',
      width: 120,
      render: row =>
        orderTypesData.find(t => t.key === row.orderType)?.lovDisplayVale || row.orderType
    },
    {
      key: 'medicationName',
      title: 'Medication',
      width: 150,
      render: row =>
        medicationsData.find(m => m.key === row.medicationName)?.lovDisplayVale ||
        row.medicationName
    },
    {
      key: 'route',
      title: 'Route',
      width: 80,
      render: row => routesData.find(r => r.key === row.route)?.lovDisplayVale || row.route
    },
    {
      key: 'frequency',
      title: 'Frequency',
      width: 120,
      render: row =>
        `Every ${row.frequency} ${
          timeUnitsData.find(t => t.key === row.frequencyUnit)?.lovDisplayVale || row.frequencyUnit
        }`
    },
    {
      key: 'startDateTime',
      title: 'Start Date Time',
      width: 160,
      render: row => new Date(row.startDateTime).toLocaleString()
    },
    {
      key: 'createdBy',
      title: 'Created By/At',
      width: 120,
      render: row =>
        `${row.createdBy || 'Current User'} / ${new Date(row.startDateTime).toLocaleDateString()}`
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: row => (
        <span className={`status-badge status-${row.status?.toLowerCase().replace(' ', '-')}`}>
          {row.status}
        </span>
      )
    }
  ];

  // Table columns for sliding scale rules - dynamic based on selected order status
  const getRuleColumns = () => {
    const baseColumns = [
      {
        key: 'parameterName',
        title: 'Parameter Name',
        width: 150
      },
      {
        key: 'range',
        title: 'Parameter Range (From–To)',
        width: 200,
        render: row => {
          if (row.rangeType === 'lessThan') return `Less than ${row.rangeFrom}`;
          if (row.rangeType === 'moreThan') return `More than ${row.rangeFrom}`;
          return `${row.rangeFrom} – ${row.rangeTo}`;
        }
      },
      {
        key: 'unit',
        title: 'Unit',
        width: 80,
        render: row => valueUnitsData.find(u => u.key === row.unit)?.lovDisplayVale || row.unit
      },
      {
        key: 'dose',
        title: 'Dose',
        width: 100,
        render: row =>
          `${row.dose} ${
            valueUnitsData.find(u => u.key === row.doseUnit)?.lovDisplayVale || row.doseUnit
          }`
      },
      {
        key: 'route',
        title: 'Route',
        width: 80,
        render: row => routesData.find(r => r.key === row.route)?.lovDisplayVale || row.route
      },
      {
        key: 'notes',
        title: 'Notes',
        width: 150
      }
    ];

    // Add action column only if selected order is Active
    if (selectedOrder?.status === 'Active') {
      baseColumns.push({
        key: 'actions',
        title: 'Actions',
        width: 100,
        render: (row, index) => (
          <div className="table-actions">
            <MyButton size="xs" appearance="ghost" onClick={() => handleEditRule(row, index)}>
              <FontAwesomeIcon icon={faEdit} />
            </MyButton>
            <MyButton
              size="xs"
              appearance="ghost"
              onClick={() => handleDeleteRule(index)}
              color="red"
            >
              <FontAwesomeIcon icon={faTrash} />
            </MyButton>
          </div>
        )
      });
    }

    return baseColumns;
  };

  // Handle order row click
  const handleOrderRowClick = order => {
    setSelectedOrder(order);

    // Set data based on order status
    if (order.status === 'Pending') {
      setSlidingScaleRules([]);
      setSafetyForm({
        maxDose24h: '',
        holdCriteria: [],
        linkedParameter: [],
        monitoringFrequency: '',
        monitoringUnit: 'hours',
        specialInstructions: ''
      });
    } else if (order.status === 'Active') {
      // Set sample data that can be edited
      setSlidingScaleRules([
        {
          id: 1,
          parameterName: 'Blood Glucose',
          rangeType: 'between',
          rangeFrom: '150',
          rangeTo: '200',
          unit: 'mg',
          dose: '2',
          doseUnit: 'units',
          route: 'sc',
          notes: 'Monitor closely'
        }
      ]);
      setSafetyForm({
        maxDose24h: '20',
        holdCriteria: ['bp_low'],
        linkedParameter: ['blood_glucose'],
        monitoringFrequency: '4',
        monitoringUnit: 'hours',
        specialInstructions: 'Check blood glucose before administration'
      });
    } else if (order.status === 'Completed') {
      // Set readonly data
      setSlidingScaleRules([
        {
          id: 1,
          parameterName: 'Blood Glucose',
          rangeType: 'between',
          rangeFrom: '150',
          rangeTo: '200',
          unit: 'mg',
          dose: '2',
          doseUnit: 'units',
          route: 'sc',
          notes: 'Treatment completed successfully'
        },
        {
          id: 2,
          parameterName: 'Blood Pressure',
          rangeType: 'lessThan',
          rangeFrom: '90',
          rangeTo: '',
          unit: 'mg',
          dose: '1',
          doseUnit: 'units',
          route: 'sc',
          notes: 'Hold if BP too low'
        }
      ]);
      setSafetyForm({
        maxDose24h: '20',
        holdCriteria: ['bp_low', 'hr_low'],
        linkedParameter: ['blood_glucose', 'blood_pressure'],
        monitoringFrequency: '4',
        monitoringUnit: 'hours',
        specialInstructions: 'Treatment completed. All parameters monitored successfully.'
      });
    }
  };

  // Rule handlers
  const handleAddRule = () => {
    if (!selectedOrder || selectedOrder.status !== 'Active') return;

    setEditingRule(null);
    setRuleForm({
      parameterName: '',
      rangeType: 'between',
      rangeFrom: '',
      rangeTo: '',
      unit: '',
      dose: '',
      doseUnit: '',
      route: '',
      notes: ''
    });
    setShowRuleModal(true);
  };

  const handleEditRule = (rule, index) => {
    if (!selectedOrder || selectedOrder.status !== 'Active') return;

    setEditingRule(index);
    setRuleForm(rule);
    setShowRuleModal(true);
  };

  const handleDeleteRule = index => {
    if (!selectedOrder || selectedOrder.status !== 'Active') return;

    const updatedRules = slidingScaleRules.filter((_, i) => i !== index);
    setSlidingScaleRules(updatedRules);
  };

  const handleSaveRule = () => {
    if (editingRule !== null) {
      const updatedRules = [...slidingScaleRules];
      updatedRules[editingRule] = ruleForm;
      setSlidingScaleRules(updatedRules);
    } else {
      setSlidingScaleRules([...slidingScaleRules, { ...ruleForm, id: Date.now() }]);
    }
    setShowRuleModal(false);
  };

  const renderRuleModal = () => (
    <MyModal
      open={showRuleModal}
      setOpen={setShowRuleModal}
      title={editingRule !== null ? 'Edit Rule' : 'Add New Rule'}
      icon={faPlus}
      size="700px"
      actionButtonLabel="Save"
      actionButtonFunction={handleSaveRule}
      content={() => (
        <div className="rule-form">
          <Form className="form-row1">
            <MyInput
              fieldName="parameterName"
              fieldType="text"
              record={ruleForm}
              setRecord={setRuleForm}
              fieldLabel="Parameter Name"
              width={250}
              required
            />
          </Form>

          <div className="form-row1">
            <div className="range-group">
              <label>Parameter Range</label>
              <div className="range-inputs">
                <select
                  value={ruleForm.rangeType}
                  onChange={e => setRuleForm({ ...ruleForm, rangeType: e.target.value })}
                  className="range-type-select"
                >
                  <option value="lessThan">Less than</option>
                  <option value="between">Between</option>
                  <option value="moreThan">More than</option>
                </select>
                <Form>
                  <MyInput
                    fieldName="rangeFrom"
                    fieldType="number"
                    record={ruleForm}
                    setRecord={setRuleForm}
                    fieldLabel="From"
                    width={100}
                    showLabel={false}
                    placeholder="From"
                  />
                </Form>

                {ruleForm.rangeType === 'between' && (
                  <>
                    <span>–</span>
                    <Form>
                      <MyInput
                        fieldName="rangeTo"
                        fieldType="number"
                        record={ruleForm}
                        setRecord={setRuleForm}
                        fieldLabel="To"
                        width={100}
                        showLabel={false}
                        placeholder="To"
                      />
                    </Form>
                  </>
                )}
              </div>
            </div>
          </div>

          <Form className="form-row1">
            <MyInput
              fieldName="unit"
              fieldType="select"
              record={ruleForm}
              setRecord={setRuleForm}
              fieldLabel="Unit"
              selectData={valueUnitsData}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              width={150}
              required
              searchable={false}
            />
          </Form>

          <div className="form-row1">
            <div className="dose-group">
              <label>Dose</label>
              <Form className="dose-inputs">
                <MyInput
                  fieldName="dose"
                  fieldType="number"
                  record={ruleForm}
                  setRecord={setRuleForm}
                  fieldLabel="Dose"
                  width={100}
                  showLabel={false}
                  placeholder="Dose"
                />
                <MyInput
                  fieldName="doseUnit"
                  fieldType="select"
                  record={ruleForm}
                  setRecord={setRuleForm}
                  fieldLabel="Unit"
                  selectData={valueUnitsData}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  width={100}
                  showLabel={false}
                  searchable={false}
                />
              </Form>
            </div>
          </div>

          <Form className="form-row1">
            <MyInput
              fieldName="route"
              fieldType="select"
              record={ruleForm}
              setRecord={setRuleForm}
              fieldLabel="Route"
              selectData={routesData}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              width={150}
              required
              searchable={false}
            />
          </Form>

          <Form className="form-row1">
            <MyInput
              fieldName="notes"
              fieldType="textarea"
              record={ruleForm}
              setRecord={setRuleForm}
              fieldLabel="Notes"
              width={400}
              height={80}
            />
          </Form>
        </div>
      )}
    />
  );

  // Check if fields should be disabled (readonly for Completed status)
  const isReadonly = selectedOrder?.status === 'Completed';
  const canEdit = selectedOrder?.status === 'Active';

  return (
    <div className={`order-details-container ${mode === 'light' ? 'light' : 'dark'}`}>
      {/* Order Details Section */}
      <div className="margin-section">
        <SectionContainer
          title={<h6>Order Details</h6>}
          content={
            <MyTable
              data={orders}
              columns={orderColumns}
              height={300}
              onRowClick={handleOrderRowClick}
            />
          }
        />
      </div>

      {/* Show message when no order is selected */}
      {!selectedOrder && (
        <div className="margin-section">
          <div className="no-selection-message">
            <p>Please select an order from the table above to view details</p>
          </div>
        </div>
      )}

      {/* Show message for Pending orders */}
      {selectedOrder?.status === 'Pending' && (
        <div className="margin-section">
          <div className="pending-message">
            <p>This order is pending. No additional details available.</p>
          </div>
        </div>
      )}

      {/* Sliding Scale Rules Section - Show only for Active and Completed */}
      {selectedOrder && selectedOrder.status !== 'Pending' && (
        <div className="margin-section">
          <SectionContainer
            title={<h6>Sliding Scale Rules - {selectedOrder.status}</h6>}
            content={
              <MyTable
                data={slidingScaleRules}
                columns={getRuleColumns()}
                height={300}
                onRowClick={canEdit ? row => console.log('Rule clicked:', row) : undefined}
                tableButtons={
                  canEdit ? (
                    <MyButton
                      prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                      onClick={handleAddRule}
                      size="small"
                    >
                      Add Rule
                    </MyButton>
                  ) : null
                }
              />
            }
          />
        </div>
      )}

      {/* Safety & Monitoring Section - Show only for Active and Completed */}
      {selectedOrder && selectedOrder.status !== 'Pending' && (
        <div className="margin-section">
          <SectionContainer
            title={<h6>Safety & Monitoring - {selectedOrder.status}</h6>}
            content={
              <div className="margin-section">
                <Form className="form-row1">
                  <MyInput
                    fieldName="maxDose24h"
                    fieldType="number"
                    record={safetyForm}
                    setRecord={canEdit ? setSafetyForm : undefined}
                    fieldLabel="Max Dose / 24h"
                    width={200}
                    disabled={isReadonly}
                  />
                </Form>

                <Form className="form-row1">
                  <MyInput
                    fieldName="holdCriteria"
                    fieldType="multyPicker"
                    record={safetyForm}
                    setRecord={canEdit ? setSafetyForm : undefined}
                    fieldLabel="Hold Criteria"
                    selectData={
                      holdCriteriaLovQueryResponse?.object ?? [
                        { lovDisplayVale: 'Blood Pressure < 90/60', key: 'bp_low' },
                        { lovDisplayVale: 'Heart Rate < 60', key: 'hr_low' }
                      ]
                    }
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    width={400}
                    disabled={isReadonly}
                    searchable={false}
                  />
                </Form>

                <Form className="form-row1">
                  <MyInput
                    fieldName="linkedParameter"
                    fieldType="multyPicker"
                    record={safetyForm}
                    setRecord={canEdit ? setSafetyForm : undefined}
                    fieldLabel="Linked Parameter"
                    selectData={
                      linkedParameterLovQueryResponse?.object ?? [
                        { lovDisplayVale: 'Blood Glucose', key: 'blood_glucose' },
                        { lovDisplayVale: 'Blood Pressure', key: 'blood_pressure' }
                      ]
                    }
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    width={400}
                    disabled={isReadonly}
                    searchable={false}
                  />
                </Form>

                <div className="form-row1">
                  <div className="monitoring-group">
                    <label>Monitoring Frequency</label>
                    <Form className="monitoring-inputs">
                      <MyInput
                        fieldName="monitoringFrequency"
                        fieldType="number"
                        record={safetyForm}
                        setRecord={canEdit ? setSafetyForm : undefined}
                        fieldLabel="Frequency"
                        width={100}
                        showLabel={false}
                        placeholder="Number"
                        disabled={isReadonly}
                      />
                      <MyInput
                        fieldName="monitoringUnit"
                        fieldType="select"
                        record={safetyForm}
                        setRecord={canEdit ? setSafetyForm : undefined}
                        fieldLabel="Unit"
                        selectData={timeUnitsData}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        width={120}
                        showLabel={false}
                        disabled={isReadonly}
                        searchable={false}
                      />
                    </Form>
                  </div>
                </div>

                <Form className="form-row1">
                  <MyInput
                    fieldName="specialInstructions"
                    fieldType="textarea"
                    record={safetyForm}
                    setRecord={canEdit ? setSafetyForm : undefined}
                    fieldLabel="Special Instructions"
                    width={500}
                    height={100}
                    disabled={isReadonly}
                  />
                </Form>
              </div>
            }
          />
        </div>
      )}

      {/* Modals */}
      {renderRuleModal()}
    </div>
  );
};

export default SlidingScale;