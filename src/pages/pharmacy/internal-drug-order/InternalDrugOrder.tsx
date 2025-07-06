import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { faCapsules } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import './styles.less';
import PatientSide from '@/pages/lab-module/PatienSide';
const InternalDrugOrder = () => {
  const dispatch = useAppDispatch();
  const [order, serOrder] = useState({});
  // Fetch orders tatus Lov response
  const { data: orderstatusLovQueryResponse } = useGetLovValuesByCodeQuery('PHARMACY_ORDER_STATUS');

  // class name for selected row
  const isSelectedOrder = rowData => {
    if (rowData && order && order?.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };
  // dummy data
  const data = [
    {
      key: '1',
      patientName: 'pat1',
      MRN: 'MRN1',
      wardName: 'ward1',
      bed: 'bed1',
      prescriber: 'pre1',
      numberOfMedications: 1,
      orderStatus: 'pending',
      medications: [
        {
          key: '1',
          medication: 'med11',
          route: 'route11',
          frequency: 11,
          dose: 'dose11',
          duration: 'dur11',
          qtyToDispense: 'q11',
          totalDoses: 11,
          startDateTime: '2025-01-01',
          instructions: 'inst11',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '2',
          medication: 'med12',
          route: 'route12',
          frequency: 12,
          dose: 'dose12',
          duration: 'dur12',
          qtyToDispense: 'q12',
          totalDoses: 12,
          startDateTime: '2025-01-02',
          instructions: 'inst12',
          stockAvailable: 'yes',
          isValid: false
        },
        {
          key: '3',
          medication: 'med13',
          route: 'route13',
          frequency: 13,
          dose: 'dose13',
          duration: 'dur13',
          qtyToDispense: 'q13',
          totalDoses: 13,
          startDateTime: '2025-01-03',
          instructions: 'inst13',
          stockAvailable: 'no',
          isValid: true
        },
        {
          key: '4',
          medication: 'med14',
          route: 'route14',
          frequency: 14,
          dose: 'dose14',
          duration: 'dur14',
          qtyToDispense: 'q14',
          totalDoses: 14,
          startDateTime: '2025-01-04',
          instructions: 'inst14',
          stockAvailable: 'yes',
          isValid: true
        }
      ]
    },
    {
      key: '2',
      patientName: 'pat2',
      MRN: 'MRN2',
      wardName: 'ward2',
      bed: 'bed2',
      prescriber: 'pre2',
      numberOfMedications: 2,
      orderStatus: 'pending',
      medications: [
        {
          key: '1',
          medication: 'med21',
          route: 'route21',
          frequency: 21,
          dose: 'dose21',
          duration: 'dur21',
          qtyToDispense: 'q21',
          totalDoses: 21,
          startDateTime: '2025-02-01',
          instructions: 'inst21',
          stockAvailable: 'yes',
          isValid: false
        },
        {
          key: '2',
          medication: 'med22',
          route: 'route22',
          frequency: 22,
          dose: 'dose22',
          duration: 'dur22',
          qtyToDispense: 'q22',
          totalDoses: 22,
          startDateTime: '2025-02-02',
          instructions: 'inst22',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '3',
          medication: 'med23',
          route: 'route23',
          frequency: 23,
          dose: 'dose23',
          duration: 'dur23',
          qtyToDispense: 'q23',
          totalDoses: 23,
          startDateTime: '2025-02-03',
          instructions: 'inst23',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '4',
          medication: 'med24',
          route: 'route24',
          frequency: 24,
          dose: 'dose24',
          duration: 'dur24',
          qtyToDispense: 'q24',
          totalDoses: 24,
          startDateTime: '2025-02-04',
          instructions: 'inst24',
          stockAvailable: 'no',
          isValid: true
        }
      ]
    },
    {
      key: '3',
      patientName: 'pat3',
      MRN: 'MRN3',
      wardName: 'ward3',
      bed: 'bed3',
      prescriber: 'pre3',
      numberOfMedications: 3,
      orderStatus: 'pending',
      medications: [
        {
          key: '1',
          medication: 'med31',
          route: 'route31',
          frequency: 31,
          dose: 'dose31',
          duration: 'dur31',
          qtyToDispense: 'q31',
          totalDoses: 31,
          startDateTime: '2025-03-01',
          instructions: 'inst31',
          stockAvailable: 'yes',
          isValid: false
        },
        {
          key: '2',
          medication: 'med32',
          route: 'route32',
          frequency: 32,
          dose: 'dose32',
          duration: 'dur32',
          qtyToDispense: 'q32',
          totalDoses: 32,
          startDateTime: '2025-03-02',
          instructions: 'inst32',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '3',
          medication: 'med33',
          route: 'route33',
          frequency: 33,
          dose: 'dose33',
          duration: 'dur33',
          qtyToDispense: 'q33',
          totalDoses: 33,
          startDateTime: '2025-03-03',
          instructions: 'inst33',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '4',
          medication: 'med34',
          route: 'route34',
          frequency: 34,
          dose: 'dose34',
          duration: 'dur34',
          qtyToDispense: 'q34',
          totalDoses: 34,
          startDateTime: '2025-03-04',
          instructions: 'inst34',
          stockAvailable: 'no',
          isValid: true
        }
      ]
    },
    {
      key: '4',
      patientName: 'pat4',
      MRN: 'MRN4',
      wardName: 'ward4',
      bed: 'bed4',
      prescriber: 'pre4',
      numberOfMedications: 4,
      orderStatus: 'pending',
      medications: [
        {
          key: '1',
          medication: 'med41',
          route: 'route41',
          frequency: 41,
          dose: 'dose41',
          duration: 'dur41',
          qtyToDispense: 'q41',
          totalDoses: 41,
          startDateTime: '2025-04-01',
          instructions: 'inst41',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '2',
          medication: 'med42',
          route: 'route42',
          frequency: 42,
          dose: 'dose42',
          duration: 'dur42',
          qtyToDispense: 'q42',
          totalDoses: 42,
          startDateTime: '2025-04-02',
          instructions: 'inst42',
          stockAvailable: 'no',
          isValid: true
        },
        {
          key: '3',
          medication: 'med43',
          route: 'route43',
          frequency: 43,
          dose: 'dose43',
          duration: 'dur43',
          qtyToDispense: 'q43',
          totalDoses: 43,
          startDateTime: '2025-04-03',
          instructions: 'inst43',
          stockAvailable: 'yes',
          isValid: false
        },
        {
          key: '4',
          medication: 'med44',
          route: 'route44',
          frequency: 44,
          dose: 'dose44',
          duration: 'dur44',
          qtyToDispense: 'q44',
          totalDoses: 44,
          startDateTime: '2025-04-04',
          instructions: 'inst44',
          stockAvailable: 'no',
          isValid: true
        }
      ]
    }
  ];

  // Icons column (start)
  const iconsForActionsOrders = () => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        className="icons-style"
        title="Start"
        color="var(--primary-gray)"
        icon={faPlay}
      />
    </div>
  );

  // Icons column (Dispense, Reject)
  const iconsForActionsMedications = () => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        className="icons-style"
        title="Dispense"
        color="var(--primary-gray)"
        icon={faCapsules}
      />
      <FontAwesomeIcon
        className="icons-vaccine"
        title="Reject"
        color="var(--primary-gray)"
        icon={faCircleXmark}
      />
    </div>
  );

  // Filter orders table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        column
        fieldName=""
        fieldLabel="Ward Name"
        record=""
        setRecord=""
        fieldType="select"
      />
      <MyInput
        column
        fieldType="select"
        fieldName=""
        fieldLabel="Order Status"
        selectData={orderstatusLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={{}}
        setRecord={{}}
      />
      <MyInput
        column
        width={250}
        fieldType="select"
        fieldName=""
        fieldLabel="Medication Name"
        selectData={[]}
        selectDataLabel=""
        selectDataValue=""
        record={{}}
        setRecord={{}}
      />
      <MyInput
        column
        fieldType="date"
        fieldLabel="From Date"
        fieldName=""
        record={{}}
        setRecord={{}}
      />
      <MyInput
        column
        fieldType="date"
        fieldLabel="To Date"
        fieldName=""
        record={{}}
        setRecord={{}}
      />
    </Form>
  );

  //Table columns
  const tableOrdersColumns = [
    {
      key: 'patientName',
      title: <Translate>Patient Name</Translate>
    },
    {
      key: 'MRN',
      title: <Translate>MRN</Translate>
    },
    {
      key: 'wardName',
      title: <Translate>Ward Name</Translate>
    },
    {
      key: 'bed',
      title: <Translate>Bed</Translate>
    },
    {
      key: 'prescriber',
      title: <Translate>Prescriber</Translate>
    },
    {
      key: 'numberOfMedications',
      title: <Translate>Number of Medications</Translate>
    },
    {
      key: 'orderStatus',
      title: <Translate>Order Status</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActionsOrders()
    }
  ];

  //Table columns
  const tableMedicationsColumns = [
    {
      key: 'medication',
      title: <Translate>Medication</Translate>
    },
    {
      key: 'route',
      title: <Translate>Route</Translate>
    },
    {
      key: 'frequency',
      title: <Translate>Frequency</Translate>
    },
    {
      key: 'dose',
      title: <Translate>Dose</Translate>
    },
    {
      key: 'duration',
      title: <Translate>Duration</Translate>
    },
    {
      key: 'qtyToDispense',
      title: <Translate>Qty to Dispense</Translate>
    },
    {
      key: 'totalDoses',
      title: <Translate>Total Doses</Translate>
    },
    {
      key: 'startDateTime',
      title: <Translate>Start DateTime</Translate>
    },
    {
      key: 'instructions',
      title: <Translate>Instructions</Translate>
    },
    {
      key: 'stockAvailable',
      title: <Translate>Stock Available</Translate>
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActionsMedications()
    }
  ];

  // Effects
  useEffect(() => {
    // Header page setUp
    const divContent = (
      <div className="title-vaccine">
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
      <div className="container-of-tables-int">
        <MyTable
          height={450}
          data={data}
          columns={tableOrdersColumns}
          rowClassName={isSelectedOrder}
          filters={filters()}
          onRowClick={rowData => {
            serOrder(rowData);
          }}
        />

        <MyTable
          height={450}
          data={order.medications ? order.medications : []}
          columns={tableMedicationsColumns}
        />
      </div>
      <div className="patient-side-internal-drug-order">
        <PatientSide patient={{}} encounter={{}} />
      </div>
    </div>
  );
};

export default InternalDrugOrder;
