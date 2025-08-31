import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import PatientSide from '@/pages/lab-module/PatienSide';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { formatDateWithoutSeconds } from '@/utils';
import PatientSearch from '@/pages/patient/patient-profile/tabs/FamilyMember/PatientSearch';
import SearchIcon from '@rsuite/icons/Search';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { initialListRequest, ListRequest } from '@/types/types';
import { fromCamelCaseToDBName } from '@/utils';
import MedicationsModal from './MedicationsModal';
import { newApPatientRelation } from '@/types/model-types-constructor';

const EPrescriptions = () => {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({
    ...newApPatientRelation
  });
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openMedicationsModal, setOpenMedicationsModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState('');

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: !searchKeyword || searchKeyword.length < 3
  });
  const search = target => {
    setPatientSearchTarget(target);
    setSearchResultVisible(true);

    if (searchKeyword && searchKeyword.length >= 3 && selectedCriterion) {
      setListRequest({
        ...listRequest,
        ignore: false,
        filters: [
          {
            fieldName: fromCamelCaseToDBName(selectedCriterion),
            operator: 'containsIgnoreCase',
            value: searchKeyword
          }
        ]
      });
    }
  };
  // dummy data
  const data = [
    {
      key: '1',
      prescriptionId: 'PRES-001',
      patientName: 'Ahmed Hassan',
      prescribedByAt: 'Dr. Sarah Johnson / Cardiology Ward',
      prescribedAt: '2025-01-01T12:00:00',
      prescribedBy: 'Dr. Sarah Johnson',
      status: 'New',
      medications: [
        {
          key: '1',
          medication: 'Paracetamol 500mg',
          instructions: 'Take 1 tablet every 8 hours for fever',
          duration: '7 days',
          qtyToDispense: '21',
          DispenseBy: 'Dr. Sarah Johnson',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Main Pharmacy',
          availableQty: '150',
          unit: 'Tablets',
          priceCurrency: '$5.50 USD'
        },
        {
          key: '2',
          medication: 'Ibuprofen 400mg',
          instructions: 'Take 1 tablet every 8 hours for pain',
          duration: '5 days',
          qtyToDispense: '15',
          DispenseBy: 'Dr. Sarah Johnson',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Emergency Pharmacy',
          availableQty: '75',
          unit: 'Tablets',
          priceCurrency: '$3.25 USD'
        },
        {
          key: '3',
          medication: 'Amoxicillin 250mg',
          instructions: 'Take 1 capsule every 8 hours',
          duration: '10 days',
          qtyToDispense: '30',
          DispenseBy: 'Dr. Sarah Johnson',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Main Pharmacy',
          availableQty: '0',
          unit: 'Capsules',
          priceCurrency: '$12.80 USD'
        },
        {
          key: '4',
          medication: 'Omeprazole 20mg',
          instructions: 'Take 1 capsule daily before breakfast',
          duration: '14 days',
          qtyToDispense: '28',
          DispenseBy: 'Dr. Sarah Johnson',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Cardiology Pharmacy',
          availableQty: '45',
          unit: 'Capsules',
          priceCurrency: '$18.90 USD'
        }
      ]
    },
    {
      key: '2',
      prescriptionId: 'PRES-002',
      patientName: 'Fatima Ali',
      prescribedByAt: 'Dr. Mohammed Ahmed / Emergency Ward',
      prescribedAt: '2025-01-01T12:00:00',
      prescribedBy: 'Dr. Mohammed Ahmed',
      status: 'Completed',
      medications: [
        {
          key: '1',
          medication: 'Aspirin 100mg',
          instructions: 'Take 1 tablet daily with food',
          duration: '30 days',
          qtyToDispense: '30',
          DispenseBy: 'Dr. Mohammed Ahmed',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Cardiology Pharmacy',
          availableQty: '200',
          unit: 'Tablets',
          priceCurrency: '$2.10 USD'
        },
        {
          key: '2',
          medication: 'Metformin 500mg',
          instructions: 'Take 1 tablet twice daily with meals',
          duration: '30 days',
          qtyToDispense: '60',
          DispenseBy: 'Dr. Mohammed Ahmed',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Diabetes Clinic',
          availableQty: '120',
          unit: 'Tablets',
          priceCurrency: '$8.75 USD'
        },
        {
          key: '3',
          medication: 'Lisinopril 10mg',
          instructions: 'Take 1 tablet daily in the morning',
          duration: '30 days',
          qtyToDispense: '30',
          DispenseBy: 'Dr. Mohammed Ahmed',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Main Pharmacy',
          availableQty: '85',
          unit: 'Tablets',
          priceCurrency: '$15.40 USD'
        },
        {
          key: '4',
          medication: 'Atorvastatin 20mg',
          instructions: 'Take 1 tablet daily at bedtime',
          duration: '30 days',
          qtyToDispense: '30',
          DispenseBy: 'Dr. Mohammed Ahmed',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Cardiology Pharmacy',
          availableQty: '0',
          unit: 'Tablets',
          priceCurrency: '$22.60 USD'
        }
      ]
    },
    {
      key: '3',
      prescriptionId: 'PRES-003',
      patientName: 'Omar Khalil',
      prescribedByAt: 'Dr. Layla Mansour / ICU Ward',
      prescribedAt: '2025-01-01T12:00:00',
      prescribedBy: 'Dr. Layla Mansour',
      status: 'New',
      medications: [
        {
          key: '1',
          medication: 'Morphine 10mg',
          instructions: 'Administer 1 vial every 8 hours for severe pain',
          duration: '3 days',
          qtyToDispense: '9',
          DispenseBy: 'Dr. Layla Mansour',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'ICU Pharmacy',
          availableQty: '25',
          unit: 'Vials',
          priceCurrency: '$45.20 USD'
        },
        {
          key: '2',
          medication: 'Furosemide 40mg',
          instructions: 'Administer 1 vial daily for fluid retention',
          duration: '5 days',
          qtyToDispense: '15',
          DispenseBy: 'Dr. Layla Mansour',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'ICU Pharmacy',
          availableQty: '60',
          unit: 'Vials',
          priceCurrency: '$8.90 USD'
        },
        {
          key: '3',
          medication: 'Insulin Regular',
          instructions: 'Administer 3 units before each meal',
          duration: '7 days',
          qtyToDispense: '21',
          DispenseBy: 'Dr. Layla Mansour',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Diabetes Clinic',
          availableQty: '100',
          unit: 'Units',
          priceCurrency: '$12.50 USD'
        },
        {
          key: '4',
          medication: 'Heparin 5000IU',
          instructions: 'Administer 1 unit twice daily',
          duration: '10 days',
          qtyToDispense: '30',
          DispenseBy: 'Dr. Layla Mansour',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'ICU Pharmacy',
          availableQty: '0',
          unit: 'Units',
          priceCurrency: '$18.75 USD'
        }
      ]
    },
    {
      key: '4',
      prescriptionId: 'PRES-004',
      patientName: 'Aisha Rahman',
      prescribedByAt: 'Dr. Khalid Ibrahim / Pediatrics Ward',
      prescribedAt: '2025-01-01T12:00:00',
      prescribedBy: 'Dr. Khalid Ibrahim',
      status: 'Completed',
      medications: [
        {
          key: '1',
          medication: 'Amoxicillin 125mg',
          instructions: 'Take 1 teaspoon three times daily',
          duration: '7 days',
          qtyToDispense: '21',
          DispenseBy: 'Dr. Khalid Ibrahim',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Pediatrics Pharmacy',
          availableQty: '80',
          unit: 'Suspension',
          priceCurrency: '$6.25 USD'
        },
        {
          key: '2',
          medication: 'Paracetamol 120mg',
          instructions: 'Take 1 teaspoon every 6 hours for fever',
          duration: '5 days',
          qtyToDispense: '15',
          DispenseBy: 'Dr. Khalid Ibrahim',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Pediatrics Pharmacy',
          availableQty: '0',
          unit: 'Suspension',
          priceCurrency: '$4.10 USD'
        },
        {
          key: '3',
          medication: 'Salbutamol Inhaler',
          instructions: 'Use 2 puffs every 4 hours as needed',
          duration: '30 days',
          qtyToDispense: '1',
          DispenseBy: 'Dr. Khalid Ibrahim',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Respiratory Clinic',
          availableQty: '35',
          unit: 'Inhaler',
          priceCurrency: '$28.90 USD'
        },
        {
          key: '4',
          medication: 'Multivitamin Drops',
          instructions: 'Take 1 drop daily',
          duration: '30 days',
          qtyToDispense: '30',
          DispenseBy: 'Dr. Khalid Ibrahim',
          DispenseAt: '2025-01-01T12:00:00',
          warehouse: 'Pediatrics Pharmacy',
          availableQty: '0',
          unit: 'Drops',
          priceCurrency: '$9.75 USD'
        }
      ]
    }
  ];

  // Actions column (View, Complete, Print)
  const actionsForOrders = rowData => {
    const isCompleted = rowData?.status === 'Completed';

    const handleViewClick = () => {
      setSelectedPrescription(rowData);
      setOpenMedicationsModal(true);
    };

    return (
      <div className="container-of-actions">
        <FontAwesomeIcon
          icon={faEye}
          title="View"
          id="icon1"
          className="icons-style"
          style={{ cursor: 'pointer' }}
          onClick={handleViewClick}
        />
        <FontAwesomeIcon
          icon={faCircleCheck}
          title="Complete"
          id="icon2"
          className="icons-style"
          style={{ cursor: 'pointer' }}
        />
        <FontAwesomeIcon
          icon={faPrint}
          title="Print"
          id="icon3"
          className="icons-style"
          style={{
            cursor: isCompleted ? 'pointer' : 'not-allowed',
            color: isCompleted ? 'var(--primary-gray)' : '#ccc',
            opacity: isCompleted ? 1 : 0.5
          }}
        />
      </div>
    );
  };

  // Filter orders table
  const filters = () => (<>
    <Form layout="inline" fluid className="filter-fields-pharmacey">
      <MyInput
        column
        fieldType="text"
        fieldName="prescriptionId"
        fieldLabel="Prescription ID"
        placeholder="Search"
        record={{}}
        setRecord={{}}
      />
      <MyInput
        column
        fieldType="text"
        fieldName="patientName"
        fieldLabel="Patient Name"
        placeholder="Search Patient"
        record={{}}
        setRecord={{}}
        disabled={true}
        value={selectedPatientRelation.relativePatientObject?.fullName ?? ''}
        rightAddon={<SearchIcon style={{ cursor: 'pointer' }} onClick={() => search('relation')} />}
      />
      <PatientSearch
        selectedPatientRelation={selectedPatientRelation}
        setSelectedPatientRelation={setSelectedPatientRelation}
        searchResultVisible={searchResultVisible}
        setSearchResultVisible={setSearchResultVisible}
        patientSearchTarget={patientSearchTarget}
        setPatientSearchTarget={setPatientSearchTarget}
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
          <AdvancedSearchFilters searchFilter={true}/>

  </>);
  console.log('selectedPatientRelation', selectedPatientRelation);
  //Table columns
  const tableOrdersColumns = [
    {
      key: 'prescriptionId',
      title: <Translate>Prescription ID</Translate>
    },
    {
      key: 'patientName',
      title: <Translate>Patient Name</Translate>
    },
    {
      key: 'prescribedByAt',
      title: <Translate>Prescribed By/At</Translate>,
      render: (row: any) =>
        row?.prescribedAt ? (
          <>
            {row?.prescribedBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.prescribedAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      width: 120,
      render: rowData => {
        const status = rowData.status || 'New';

        const getStatusConfig = status => {
          switch (status) {
            case 'New':
              return {
                backgroundColor: 'var(--light-orange)',
                color: 'var(--primary-orange)',
                contant: 'New'
              };
            case 'Completed':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Completed'
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: 'Unknown'
              };
          }
        };

        const config = getStatusConfig(status);
        return (
          <MyBadgeStatus
            backgroundColor={config.backgroundColor}
            color={config.color}
            contant={config.contant}
          />
        );
      }
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 3,
      render: rowData => actionsForOrders(rowData)
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
      <div className="container-of-tables-int" style={{ width: '100%' }}>
        <MyTable
          data={data}
          columns={tableOrdersColumns}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={data.length}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          height={500}
          filters={filters()}
        />
      </div>
      <div className="patient-side-internal-drug-order">
        <PatientSide patient={selectedPatientRelation?.relativePatientObject} encounter={{}} />
      </div>

      {/* Medications Modal */}
      <MedicationsModal
        open={openMedicationsModal}
        setOpen={setOpenMedicationsModal}
        selectedPrescription={selectedPrescription}
      />
    </div>
  );
};

export default EPrescriptions;
