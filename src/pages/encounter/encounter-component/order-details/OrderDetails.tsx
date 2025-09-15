import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import OrderDetailsSection from './OrderDetailsSection';
import SlidingScaleRulesSection from './SlidingScaleRulesSection';
import SafetyMonitoringSection from './SafetyMonitoringSection';
import { Form, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';

const SlidingScale = () => {
  const mode = useSelector((state: any) => state.ui.mode);

  // --- State ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [slidingScaleRules, setSlidingScaleRules] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>(null);

  const [ruleForm, setRuleForm] = useState({
    parameterName: '',
    rangeType: '',
    rangeFrom: '',
    rangeTo: '',
    unit: '',
    dose: '',
    doseUnit: '',
    route: '',
    notes: ''
  });
  const [safetyForm, setSafetyForm] = useState({
    maxDose24h: '',
    holdCriteria: [],
    linkedParameter: [],
    monitoringFrequency: '',
    monitoringUnit: 'hours',
    specialInstructions: ''
  });

  // --- LOV Data ---
  const { data: orderTypesLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_TYPES');
  const { data: MedLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: resourceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: valueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: holdCriteriaLovQueryResponse } = useGetLovValuesByCodeQuery('HOLD_CRITERIA');
  const { data: linkedParameterLovQueryResponse } = useGetLovValuesByCodeQuery('LINKED_PARAMETER');

  // --- Static Fallback Data ---
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

  // --- Orders Table ---
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
      createdBy: 'Dr. Smith',
      canceledBy: null,
      canceledAt: null,
      cancelReason: ''
    },
    {
      id: 2,
      orderType: 'insulin',
      medicationName: 'insulin_nph',
      route: 'sc',
      frequency: '12',
      frequencyUnit: 'hours',
      startDateTime: new Date('2024-01-16T08:00:00'),
      durationType: 'days',
      duration: '5',
      status: 'Active',
      createdBy: 'Dr. Adams',
      canceledBy: null,
      canceledAt: null,
      cancelReason: ''
    },
    {
      id: 3,
      orderType: 'analgesic',
      medicationName: 'acetaminophen',
      route: 'oral',
      frequency: '4',
      frequencyUnit: 'hours',
      startDateTime: new Date('2024-01-16T09:00:00'),
      durationType: 'days',
      duration: '5',
      status: 'Active',
      createdBy: 'Dr. Johnson',
      canceledBy: null,
      canceledAt: null,
      cancelReason: ''
    },
    {
      id: 4,
      orderType: 'antihypertensive',
      medicationName: 'lisinopril',
      route: 'oral',
      frequency: '12',
      frequencyUnit: 'hours',
      startDateTime: new Date('2024-01-14T07:00:00'),
      durationType: 'days',
      duration: '10',
      status: 'Canceled',
      createdBy: 'Dr. Brown',
      canceledBy: 'Dr. Smith',
      canceledAt: new Date('2024-01-15T10:00:00'),
      cancelReason: 'Patient allergy'
    },
    {
      id: 5,
      orderType: 'antihypertensive',
      medicationName: 'amlodipine',
      route: 'oral',
      frequency: '24',
      frequencyUnit: 'hours',
      startDateTime: new Date('2024-01-17T07:00:00'),
      durationType: 'days',
      duration: '14',
      status: 'Completed',
      createdBy: 'Dr. Brown',
      canceledBy: null,
      canceledAt: null,
      cancelReason: ''
    },
    {
      id: 6,
      orderType: 'antibiotic',
      medicationName: 'amoxicillin',
      route: 'oral',
      frequency: '8',
      frequencyUnit: 'hours',
      startDateTime: new Date('2024-01-18T10:00:00'),
      durationType: 'days',
      duration: '7',
      status: 'Active',
      createdBy: 'Dr. Lee',
      canceledBy: null,
      canceledAt: null,
      cancelReason: ''
    }
  ]);

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
      dataKey: 'startDateTime',
      width: 160,
      render: (rowData: any) =>
        rowData?.startDateTime ? (
          <>
            {new Date(rowData.startDateTime).toLocaleDateString()}
            <br />
            <span className="date-table-style">
              {new Date(rowData.startDateTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'createdBy',
      title: 'Created By/At',
      width: 120,
      expandable: true,
      render: (row: any) => (
        <>
          {row.createdBy || 'Current User'}
          <br />
          <span className="date-table-style">
            {new Date(row.startDateTime).toLocaleDateString()}
          </span>
        </>
      )
    },
    {
      key: 'canceledByAt',
      title: 'Canceled By/At',
      width: 120,
      expandable: true,

      render: (row: any) =>
        row.canceledBy ? (
          <>
            {row.canceledBy}
            <br />
            <span className="date-table-style">
              {row.canceledAt ? new Date(row.canceledAt).toLocaleDateString() : ''}
            </span>
          </>
        ) : (
          ''
        )
    },
    {
      key: 'cancelReason',
      title: 'Cancel Reason',
      width: 150,
      expandable: true,
      render: (row: any) => row.cancelReason || ''
    },
    {
      key: 'status',
      title: 'Status',
      dataKey: 'status',
      width: 100,
      render: (row: any) => {
        let backgroundColor = '';
        let color = '';

        switch (row.status) {
          case 'Pending':
            backgroundColor = 'var(--light-orange)';
            color = 'var(--primary-orange)';
            break;
          case 'Active':
            backgroundColor = 'var( --very-light-blue)';
            color = 'var(--deep-blue)';
            break;
          case 'Completed':
            backgroundColor = 'var(--light-green)';
            color = 'var(--primary-green)';
            break;
          case 'Canceled':
            backgroundColor = 'var(--light-red)';
            color = 'var(--primary-red)';
            break;
          default:
            backgroundColor = 'var(--light-gray)';
            color = 'var(--primary-gray)';
        }

        return (
          <MyBadgeStatus backgroundColor={backgroundColor} color={color} contant={row.status} />
        );
      }
    }
  ];

  // --- Sliding Scale Rule Columns ---
  const getRuleColumns = [
    {
      key: 'parameterName',
      title: 'Parameter Name',
      width: 150,
      render: () => (
        <Form>
          <MyInput
            fieldName="parameterName"
            fieldType="text"
            record={ruleForm}
            setRecord={setRuleForm}
            width="100%"
            showLabel={false}
            disabled={isReadonly || !canEdit}
          />
        </Form>
      )
    },
    {
      key: 'rangeType',
      title: 'Range Type',
      width: 120,
      render: () => (
        <Form>
          <MyInput
            fieldName={'rangeType'}
            fieldType="select"
            record={ruleForm}
            setRecord={setRuleForm}
            selectData={[
              { key: 'lessThan', lovDisplayVale: 'Less than' },
              { key: 'between', lovDisplayVale: 'Between' },
              { key: 'moreThan', lovDisplayVale: 'More than' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            width="100%"
            showLabel={false}
            disabled={isReadonly || !canEdit}
            onChange={value => {
              setRuleForm(prev => ({ ...prev, rangeType: value, rangeTo: '' })); // reset rangeTo
            }}
            searchable={false}
          />
        </Form>
      )
    },
    {
      key: 'rangeFrom',
      title:
        ruleForm.rangeType === 'moreThan'
          ? 'More Than'
          : ruleForm.rangeType === 'lessThan'
          ? 'Less Than'
          : 'From',
      width: 120,
      render: () => (
        <Form>
          <MyInput
            fieldName="rangeFrom"
            fieldType="number"
            record={ruleForm}
            setRecord={setRuleForm}
            showLabel={false}
            placeholder={
              ruleForm.rangeType === 'moreThan'
                ? 'More Than'
                : ruleForm.rangeType === 'lessThan'
                ? 'Less Than'
                : 'From'
            }
            disabled={isReadonly || !canEdit}
          />
        </Form>
      )
    },
    {
      key: 'rangeTo',
      title: 'To',
      width: 80,
      render: () =>
        ruleForm.rangeType === 'between' ? (
          <Form>
            <MyInput
              fieldName="rangeTo"
              fieldType="number"
              record={ruleForm}
              setRecord={setRuleForm}
              showLabel={false}
              placeholder="To"
              disabled={isReadonly || !canEdit}
              searchable={false}
            />
          </Form>
        ) : null
    },
    {
      key: 'unit',
      title: 'Unit',
      width: 100,
      render: () => (
        <Form>
          <MyInput
            fieldName={'unit'}
            fieldType="select"
            record={ruleForm}
            setRecord={setRuleForm}
            selectData={valueUnitsData}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            showLabel={false}
            disabled={isReadonly || !canEdit}
            searchable={false}
          />{' '}
        </Form>
      )
    },
    {
      key: 'dose',
      title: 'Dose',
      width: 80,
      render: () => (
        <Form>
          <MyInput
            fieldName={'dose'}
            fieldType="number"
            record={ruleForm}
            setRecord={setRuleForm}
            showLabel={false}
            disabled={isReadonly || !canEdit}
          />
        </Form>
      )
    },
    {
      key: 'doseUnit',
      title: 'Dose Unit',
      width: 100,
      render: () => (
        <Form>
          <MyInput
            fieldName={'doseUnit'}
            fieldType="select"
            record={ruleForm}
            setRecord={setRuleForm}
            selectData={valueUnitsData}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            showLabel={false}
            disabled={isReadonly || !canEdit}
            searchable={false}
          />
        </Form>
      )
    },
    {
      key: 'route',
      title: 'Route',
      width: 100,
      render: () => (
        <Form>
          <MyInput
            fieldName={'route'}
            fieldType="select"
            record={ruleForm}
            setRecord={setRuleForm}
            selectData={medicationsData}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            showLabel={false}
            disabled={isReadonly || !canEdit}
            searchable={false}
          />{' '}
        </Form>
      )
    },
    {
      key: 'notes',
      title: 'Notes',
      width: 200,
      render: () => (
        <Form>
          <MyInput
            fieldName={'note'}
            fieldType="text"
            record={ruleForm}
            setRecord={setRuleForm}
            showLabel={false}
            disabled={isReadonly || !canEdit}
          />
        </Form>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (_, rowIndex) => {
        if (selectedOrder?.status !== 'Active') return null;

        return (
          <div className="flex-gap-2">
            <Whisper placement="top" speaker={<Tooltip>Add Rule</Tooltip>}>
              <FontAwesomeIcon icon={faPlus} className="icons-style" onClick={handleAddRule} />
            </Whisper>

            <Whisper placement="top" speaker={<Tooltip>Delete Rule</Tooltip>}>
              <FontAwesomeIcon
                icon={faTrash}
                className="icons-style"
                color="var(--primary-pink)"
                onClick={() => {
                  setCancelObject({ rowIndex });
                  setShowCancelModal(true);
                }}
              />
            </Whisper>
          </div>
        );
      }
    }
  ];

  // --- Handlers ---
  const handleOrderRowClick = row => {
    setSelectedOrder(row);

    if (row.status === 'Active' && slidingScaleRules.length === 0) {
      setSlidingScaleRules([
        {
          parameterName: '',
          rangeType: '',
          rangeFrom: '',
          rangeTo: '',
          unit: '',
          dose: '',
          doseUnit: '',
          route: '',
          notes: ''
        }
      ]);
    }

    if (row.status === 'Completed' && slidingScaleRules.length === 0) {
      setSlidingScaleRules([
        {
          parameterName: 'Example Parameter',
          rangeType: 'between',
          rangeFrom: 0,
          rangeTo: 10,
          unit: 'mg',
          dose: 1,
          doseUnit: 'mg',
          route: 'oral',
          notes: 'Completed rule'
        }
      ]);
    }
  };

  const handleDeleteRule = index => {
    setSlidingScaleRules(slidingScaleRules.filter((_, i) => i !== index));
  };

  const handleAddRule = () => {
    setSlidingScaleRules([
      ...slidingScaleRules,
      {
        parameterName: '',
        rangeType: '',
        rangeFrom: '',
        rangeTo: '',
        unit: '',
        dose: '',
        doseUnit: '',
        route: '',
        notes: ''
      }
    ]);
  };

  // --- Rendering ---
  const canEdit = selectedOrder?.status === 'Active';
  const isReadonly = selectedOrder?.status === 'Completed';
  const displayedRules = selectedOrder?.status === 'Pending' ? [] : slidingScaleRules;
  const columnsToRender = getRuleColumns.filter(col => {
    if (col.key === 'rangeTo' && ruleForm.rangeType !== 'between') {
      return false;
    }
    if (col.key === 'actions' && selectedOrder?.status !== 'Active') {
      return false;
    }
    return true;
  });

  return (
    <div className={`order-details-container ${mode === 'light' ? 'light' : 'dark'}`}>
      <OrderDetailsSection
        orders={orders}
        orderColumns={orderColumns}
        onRowClick={handleOrderRowClick}
      />

      <SlidingScaleRulesSection
        rules={displayedRules}
        columns={columnsToRender}
        canEdit={canEdit}
        onRowClick={row => console.log('Rule clicked', row)}
      />

      <SafetyMonitoringSection
        formData={safetyForm}
        setFormData={setSafetyForm}
        canEdit={canEdit}
        isReadonly={isReadonly}
        holdCriteriaData={holdCriteriaLovQueryResponse?.object ?? []}
        linkedParameterData={linkedParameterLovQueryResponse?.object ?? []}
        timeUnitsData={timeUnitsData}
      />

      <DeletionConfirmationModal
        open={showCancelModal}
        setOpen={setShowCancelModal}
        itemToDelete="rule"
        actionType="delete"
        actionButtonFunction={() => {
          if (cancelObject?.rowIndex !== undefined) {
            handleDeleteRule(cancelObject.rowIndex);
          }
          setShowCancelModal(false);
        }}
        confirmationQuestion="Are you sure you want to delete this rule?"
      />
    </div>
  );
};

export default SlidingScale;
