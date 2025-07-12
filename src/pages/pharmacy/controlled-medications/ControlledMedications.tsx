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
const ControlledMedications = () => {
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
    <Form layout="inline" fluid className="filter-fields-pharmacey">
      <MyInput
        column
        fieldName=""
        fieldLabel="Patient Name"
        record=""
        setRecord=""
      />
      <MyInput column fieldName="" fieldLabel="Ward" record="" setRecord="" />
      <MyInput
        column
        fieldName=""
        fieldLabel="Drug Name"
        record=""
        setRecord=""
      />
      <MyInput column fieldName="" fieldLabel="Status" record="" setRecord="" fieldType="select" />
      <MyButton color="var(--deep-blue)" width="109px">
        Search
      </MyButton>
    </Form>
  );

  // dummy data
  const data = [
    {key: "1", patientName: "name1", MRN: "MRN1", medication: "medication1", strength: "strength1", dosageForm: "2025-01-01", quantity: 1, controlType: "type1", indication: "indication1", status: "Pending", prescribedBy: "Rawan", prescribedAt: "02:02",dispensedBy: "Hanan", receivedBy: "Bushra", confirmedBy: "Rawan", administeredBy: "Walaa", witnessName: "witness1", notes:"note1"},
    {key: "2", patientName: "name2", MRN: "MRN2", medication: "medication2", strength: "strength2", dosageForm: "2025-01-02", quantity: 2, controlType: "type2", indication: "indication2", status: "Dispensed", prescribedBy: "Hanan", prescribedAt: "03:02",dispensedBy: "Walaa", receivedBy: "Batool", confirmedBy: "Rawan", administeredBy: "Walaa", witnessName: "witness2", notes:"note2"},
    {key: "3", patientName: "name3", MRN: "MRN3", medication: "medication3", strength: "strength3", dosageForm: "2025-01-03", quantity: 3, controlType: "type3", indication: "indication3", status: "Pending", prescribedBy: "Bushra", prescribedAt: "04:02",dispensedBy: "Batool", receivedBy: "Hanan", confirmedBy: "Rawan", administeredBy: "Walaa", witnessName: "witness3", notes:"note3"},
    {key: "4", patientName: "name4", MRN: "MRN4", medication: "medication4", strength: "strength4", dosageForm: "2025-01-04", quantity: 4, controlType: "type4", indication: "indication4", status: "Dispensed", prescribedBy: "Walaa", prescribedAt: "05:02",dispensedBy: "Bushra", receivedBy: "Walaa", confirmedBy: "Rawan", administeredBy: "Walaa", witnessName: "witness4", notes:"note4"}

  ]; 

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
      key: 'medication',
      title: <Translate>Medication</Translate>
    },
    {
      key: 'strength',
      title: <Translate>Strength</Translate>
    },
    {
      key: 'dosageForm',
      title: <Translate>Dosage Form</Translate>
    },
    {
      key: 'quantity',
      title: <Translate>Quantity</Translate>
    },
    {
      key: 'controlType',
      title: <Translate>Control Type</Translate>
    },
    {
      key: 'indication',
      title: <Translate>Indication</Translate>
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>
    },
    {
      key: '',
      title: <Translate>Prescribed By\At</Translate>,
      render: (rowData: any) => {
        return <span>{rowData.prescribedBy + '/' + rowData.prescribedAt}</span>;
      }
    },
    {
      key: 'dispensedBy',
      title: <Translate>Dispensed By</Translate>,
      expandable: true
    },
    {
      key: '',
      title: <Translate>Received/Confirmed By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return <span>{rowData.receivedBy + '/' + rowData.confirmedBy}</span>;
      }
    },
    {
      key: 'administeredBy',
      title: <Translate>Administered By</Translate>,
      expandable: true
    },
     {
      key: 'witnessName',
      title: <Translate>Witness Name</Translate>,
      expandable: true
    },
     {
      key: 'notes',
      title: <Translate>Notes</Translate>,
      expandable: true
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActionsOrders()
    }
  ];

  // Effects
  useEffect(() => {
    // Header page setUp
    const divContent = (
      <div className="page-title">
        <h5>Controlled Medications</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Controlled Medications'));
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
      </div>
      <div className="patient-side-internal-drug-order">
        <PatientSide patient={{}} encounter={{}} />
      </div>
    </div>
  );
};

export default ControlledMedications;
