import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { faSheetPlastic } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetDepartmentsQuery, useSaveDepartmentMutation } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApDepartment } from '@/types/model-types';
import { newApDepartment, newApMedicalSheets } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useDispatch } from 'react-redux';
import { useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import AddEditDepartment from './AddEditDepartment';
import ChooseDepartment from './ChooseScreen';
import { notify } from '@/utils/uiReducerActions';

const Departments = () => {
  const dispatch = useDispatch();

  const [department, setDepartment] = useState<ApDepartment>({ ...newApDepartment });
  const [load, setLoad] = useState<boolean>(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [openScreensPopup, setOpenScreensPopup] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [recordOfDepartmentCode, setRecordOfDepartmentCode] = useState({ departmentCode: '' });
  const [generateCode, setGenerateCode] = useState();
  const [record, setRecord] = useState({ filter: '', value: '' });
  const [showScreen, setShowScreen] = useState({
    ...newApMedicalSheets,
    departmentKey: department.key,
    facilityKey: department.facilityKey,
    patientDashboard: true,
    clinicalVisit: true,
    diagnosticsOrder: true,
    prescription: true,
    drugOrder: true,
    consultation: true,
    procedures: true,
    patientHistory: true,
    allergies: true,
    medicalWarnings: true,
    medicationsRecord: true,
    vaccineReccord: true,
    diagnosticsResult: true,
    observation: true
  });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ],
    pageSize: 15
  });
  // Fetch  medicalSheets list response
  const { data: medicalSheet } = useGetMedicalSheetsByDepartmentIdQuery(department?.key, {
    skip: !department.key
  });
  // Fetch Department list response
  const { data: departmentListResponse, isFetching } = useGetDepartmentsQuery(listRequest);
  // Save Department
  const [saveDepartment, saveDepartmentMutation] = useSaveDepartmentMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = departmentListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Facility Name', value: 'facilityName' },
    { label: 'Department Name', value: 'name' },
    { label: 'Department Type', value: 'departmentType' }
  ];
  // Header page setUp
  const divContent = (
    <div className='page-title'>
      <h5>Departments</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Departments'));
  dispatch(setDivContent(divContentHTML));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && department && rowData.key === department.key) {
      return 'selected-row';
    } else return '';
  };
  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    setRecordOfDepartmentCode({ departmentCode: department?.departmentCode ?? generateCode });
  }, [recordOfDepartmentCode]);

  useEffect(() => {
    if (saveDepartmentMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDepartmentMutation.data]);

  useEffect(() => {
    if (medicalSheet?.object?.key !== null) {
      setShowScreen({ ...medicalSheet?.object });
    } else {
      setShowScreen({
        ...newApMedicalSheets,
        departmentKey: department.key,
        facilityKey: department.facilityKey,
        patientDashboard: true,
        clinicalVisit: true,
        diagnosticsOrder: true,
        prescription: true,
        drugOrder: true,
        consultation: true,
        procedures: true,
        patientHistory: true,
        allergies: true,
        medicalWarnings: true,
        medicationsRecord: true,
        vaccineReccord: true,
        diagnosticsResult: true,
        observation: true
      });
    }
  }, [medicalSheet]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (record['filter']) {
      handleFilterChange(record['filter'], record['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ],
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [record]);

  // Handle click on Add New Button
  const handleNew = () => {
    generateFiveDigitCode();
    setDepartment({ ...newApDepartment });
    setPopupOpen(true);
  };
  // Handle Save Department
  const handleSave = () => {
    setPopupOpen(false);
    setLoad(true);
    saveDepartment({ ...department, departmentCode: generateCode })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Departments Saved successfully', sev: 'success' }));
      }).catch(() => {
        dispatch(notify({ msg: 'Failed to save this Departments', sev: 'error' }));
      });
    setLoad(false);
  };
  // Filter table
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({
        ...listRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ]
      });
    }
  };
  // Generate code for department
  const generateFiveDigitCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000);
    setGenerateCode(code);
  };
  //icons column (Medical sheets, Edite, Active/Deactivate)
  const iconsForActions = (rowData: ApDepartment) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className='icons-style'
        onClick={() => { setPopupOpen(true); }}
      />
      {rowData?.deletedAt ? (
        <FontAwesomeIcon title="Active" icon={faRotateRight} fill="var(--primary-gray)" className='icons-style' />
      ) : (
        <MdDelete title="Deactivate" size={24} fill="var(--primary-pink)" className='icons-style'/>
      )}
      <FontAwesomeIcon
        icon={faSheetPlastic}
        style={{
          cursor: ['5673990729647001', '5673990729647002', '5673990729647005'].includes(
            rowData?.departmentTypeLkey
          )
            ? 'pointer'
            : 'not-allowed',
          color: 'var(--primary-gray)'
        }}
        title="Medical Sheets"
        size={'lg'}
        onClick={() => {
          if(['5673990729647001', '5673990729647002', '5673990729647005'].includes(
            rowData?.departmentTypeLkey
          ))
          setOpenScreensPopup(true);
        }}
      />
    </div>
  );
  //table columns
  const tableColumns = [
    {
      key: 'facilityName',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      render: rowData => rowData?.facility?.facilityName ? rowData?.facility?.facilityName : ' '

    },
    {
      key: 'name',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'departmentType',
      title: <Translate>Department Type</Translate>,
      flexGrow: 4,
      render: rowData => <p>{rowData?.departmentTypeLvalue.lovDisplayVale}</p>
    },
    {
      key: 'phoneNumber',
      title: <Translate>Phone Number</Translate>,
      flexGrow: 4
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
      flexGrow: 4
    },
    {
      key: 'departmentCode',
      title: <Translate>Department Code</Translate>,
      flexGrow: 1
    },
    {
      key: 'appointable',
      title: <Translate>Appointable</Translate>,
       render: (rowData: ApDepartment) => {
        return <p>{rowData?.appointable ? 'Yes' : 'No'}</p>;
      }
    },
    {
      key: 'deletedAt',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: (rowData: ApDepartment) => {
        return <p>{rowData?.deletedAt ? 'Inactive' : 'Active'}</p>;
      }
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 4,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // Filter form rendered above the table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={record}
        setRecord={updatedRecord => {
          setRecord({
            ...record,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />

      <MyInput
        fieldName="value"
        fieldType="text"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  return (
    <Panel>
      <div className='container-of-add-new-button'>
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        data={departmentListResponse?.object ?? []}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
            setDepartment(rowData);
          }}
        filters={filters()}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={load || isFetching}
      />
      <AddEditDepartment
        open={popupOpen}
        setOpen={setPopupOpen}
        department={department}
        setDepartment={setDepartment}
        recordOfDepartmentCode={recordOfDepartmentCode}
        setRecordOfDepartmentCode={setRecordOfDepartmentCode}
        width={width}
        handleSave={handleSave}
      />
      <ChooseDepartment
        open={openScreensPopup}
        setOpen={setOpenScreensPopup}
        showScreen={showScreen}
        setShowScreen={setShowScreen}
        department={department}
        width={width}
      />
    </Panel>
  );
};

export default Departments;
