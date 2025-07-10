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
import PatientSide from '@/pages/lab-module/PatienSide';
import MyButton from '@/components/MyButton/MyButton';
const EPrepscriptions = () => {
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
      prescriber: 'pre1',
      numberOfMedications: 1,
      orderStatus: 'pending',
      medications: [
        {
          key: '1',
          medication: 'med11',
          route: 'route11',
          duration: 'dur11',
          qtyToDispense: 'q11',
          unit: 'u11',
          instructions: 'inst11',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '2',
          medication: 'med12',
          route: 'route12',
          duration: 'dur12',
          qtyToDispense: 'q12',
          unit: 'u12',
          instructions: 'inst12',
          stockAvailable: 'yes',
          isValid: false
        },
        {
          key: '3',
          medication: 'med13',
          route: 'route13',
          duration: 'dur13',
          qtyToDispense: 'q13',
          unit: 'u13',
          instructions: 'inst13',
          stockAvailable: 'no',
          isValid: true
        },
        {
          key: '4',
          medication: 'med14',
          route: 'route14',
          duration: 'dur14',
          qtyToDispense: 'q14',
          unit: 'u14',
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
      prescriber: 'pre2',
      numberOfMedications: 2,
      orderStatus: 'pending',
      medications: [
        {
          key: '1',
          medication: 'med21',
          route: 'route21',
          duration: 'dur21',
          qtyToDispense: 'q21',
          unit: 'u21',
          instructions: 'inst21',
          stockAvailable: 'yes',
          isValid: false
        },
        {
          key: '2',
          medication: 'med22',
          route: 'route22',
          duration: 'dur22',
          qtyToDispense: 'q22',
          unit: 'u22',
          instructions: 'inst22',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '3',
          medication: 'med23',
          route: 'route23',
          duration: 'dur23',
          qtyToDispense: 'q23',
          unit: 'u23',
          instructions: 'inst23',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '4',
          medication: 'med24',
          route: 'route24',
          duration: 'dur24',
          qtyToDispense: 'q24',
          unit: 'u24',
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
      prescriber: 'pre3',
      numberOfMedications: 3,
      orderStatus: 'pending',
      medications: [
        {
          key: '1',
          medication: 'med31',
          route: 'route31',
          duration: 'dur31',
          qtyToDispense: 'q31',
          unit: 'u31',
          instructions: 'inst31',
          stockAvailable: 'yes',
          isValid: false
        },
        {
          key: '2',
          medication: 'med32',
          route: 'route32',
          duration: 'dur32',
          qtyToDispense: 'q32',
          unit: 'u32',
          instructions: 'inst32',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '3',
          medication: 'med33',
          route: 'route33',
          duration: 'dur33',
          qtyToDispense: 'q33',
          unit: 'u33',
          instructions: 'inst33',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '4',
          medication: 'med34',
          route: 'route34',
          duration: 'dur34',
          qtyToDispense: 'q34',
          unit: 'u34',
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
      prescriber: 'pre4',
      numberOfMedications: 4,
      orderStatus: 'pending',
      medications: [
        {
          key: '1',
          medication: 'med41',
          route: 'route41',
          duration: 'dur41',
          qtyToDispense: 'q41',
          unit: 'u41',
          instructions: 'inst41',
          stockAvailable: 'yes',
          isValid: true
        },
        {
          key: '2',
          medication: 'med42',
          route: 'route42',
          duration: 'dur42',
          qtyToDispense: 'q42',
          unit: 'u42',
          instructions: 'inst42',
          stockAvailable: 'no',
          isValid: true
        },
        {
          key: '3',
          medication: 'med43',
          route: 'route43',
          duration: 'dur43',
          qtyToDispense: 'q43',
          unit: 'u43',
          instructions: 'inst43',
          stockAvailable: 'yes',
          isValid: false
        },
        {
          key: '4',
          medication: 'med44',
          route: 'route44',
          duration: 'dur44',
          qtyToDispense: 'q44',
          unit: 'u44',
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
        className="icons-style"
        title="Reject"
        color="var(--primary-gray)"
        icon={faCircleXmark}
      />
    </div>
  );

  // Filter orders table
  const filters = () => (
    <Form layout="inline" fluid className='filter-fields-pharmacey'>
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
      <MyButton color="var(--deep-blue)" width="109px">
        Search
      </MyButton>
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
      key: 'duration',
      title: <Translate>Duration</Translate>
    },
    {
      key: 'qtyToDispense',
      title: <Translate>Qty to Dispense</Translate>
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>
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
      <div className="page-title">
        <h5>ePrescriptions</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('ePrescriptions'));
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

export default EPrepscriptions;
