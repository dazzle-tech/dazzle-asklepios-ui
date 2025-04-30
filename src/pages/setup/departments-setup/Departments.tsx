import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Modal, Pagination, Panel, Table, Col, Row } from 'rsuite';
import CheckIcon from '@rsuite/icons/Check';
import CloseIcon from '@rsuite/icons/Close';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
const { Column, HeaderCell, Cell } = Table;
import { faSheetPlastic } from '@fortawesome/free-solid-svg-icons';
import { RxComponent2 } from 'react-icons/rx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  useGetFacilitiesQuery,
  useGetDepartmentsQuery,
  useSaveDepartmentMutation
} from '@/services/setupService';
import { Button } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApDepartment } from '@/types/model-types';
import { newApDepartment, newApMedicalSheets } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { SchemaModel, StringType } from 'schema-typed';
import { notify } from '@/utils/uiReducerActions';
import { useDispatch } from 'react-redux';
import {
  useSaveMedicalSheetMutation,
  useGetMedicalSheetsByDepartmentIdQuery
} from '@/services/setupService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import AddEditDepartment from './AddEditDepartment';
import ChooseDepartment from './ChooseScreen';

const Departments = () => {
  const [department, setDepartment] = useState<ApDepartment>({ ...newApDepartment });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openScreensPopup, setOpenScreensPopup] = useState(false);
  // const [generateCode, setGenerateCode] = useState();
  // const [recordOfDepartmentCode, setRecordOfDepartmentCode] = useState({ departmentCode: '' });

  const [recordOfDepartmentCode, setRecordOfDepartmentCode] = useState({ departmentCode: '' });
        const [generateCode, setGenerateCode] = useState();
  
         useEffect(() => {
            setRecordOfDepartmentCode({ departmentCode: department?.departmentCode ?? generateCode });
          }, [recordOfDepartmentCode]);

  const [recordOfSearch, setRecordOfSearch] = useState({ name: '' });
  // useEffect(() => {
  //   setRecordOfDepartmentCode({ departmentCode: department?.departmentCode ?? generateCode });
  // }, [recordOfDepartmentCode]);

  const inputRef = useRef(null);
  const formRef = React.useRef();
  const dispatch = useDispatch();
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
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // const [facilityListRequest, setFacilityListRequest] = useState<ListRequest>({
  //   ...initialListRequest
  // });

  const [saveDepartment, saveDepartmentMutation] = useSaveDepartmentMutation();
  // const [saveMedicalSheet] = useSaveMedicalSheetMutation();
  // const { data: depTTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');
  // const { data: encTypesLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: medicalSheet } = useGetMedicalSheetsByDepartmentIdQuery(department?.key, {
    skip: !department.key
  });
  // const { data: facilityListResponse } = useGetFacilitiesQuery(facilityListRequest);
  const { data: departmentListResponse } = useGetDepartmentsQuery(listRequest);
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Departments</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Departments'));
  dispatch(setDivContent(divContentHTML));

  const handleNew = () => {
    generateFiveDigitCode();
    setDepartment({ ...newApDepartment });
    setPopupOpen(true);
  };

  // const handleSave = () => {
  //   setPopupOpen(false);
  //   saveDepartment({ ...department, departmentCode: generateCode })
  //     .unwrap()
  //     .then(() => {
  //       dispatch(notify({ msg: 'Departments Saved successfully' }));
  //     });
  // };
  useEffect(() => {
    handleFilterChange('name', recordOfSearch['name']);
  }, [recordOfSearch]);

  useEffect(() => {
    if (saveDepartmentMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDepartmentMutation.data]);

  const isSelected = rowData => {
    if (rowData && department && rowData.key === department.key) {
      return 'selected-row';
    } else return '';
  };
  useEffect(() => {
    console.log('medical' + department.key);
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
    console.log('sh', showScreen);
  }, [showScreen]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
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
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  const generateFiveDigitCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000);
    setGenerateCode(code);
  };

  const model = SchemaModel({
    facilityKey: StringType().isRequiredOrEmpty('Facility is Required')
  });

  // const handleSubmit = async (values: any) => {
  //   const errors = model.getErrorMessages();
  //   if (errors.length > 0) {
  //     console.log("Validation failed", errors);
  //     return
  //   } else {
  //     console.log("Validation succeeded", values);
  //     handleSave()
  //   }
  // };

  const iconsForActions = (rowData: ApDepartment) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {rowData?.deletedAt ? (
        // back to this function when update the filter(status) in back end
        <FontAwesomeIcon title="Active" icon={faRotateRight} fill="var(--primary-gray)" />
      ) : (
        <MdDelete title="Deactivate" size={24} fill="var(--primary-pink)" />
      )}

     <FontAwesomeIcon
      icon={faSheetPlastic} 
      style={{
        cursor: ['5673990729647001', '5673990729647002', '5673990729647005'].includes(rowData?.departmentTypeLkey) ? 'pointer' : 'not-allowed',
        color: "var(--primary-gray)"
      }}
     title="Medical Sheets"
      // fill="var(--primary-gray)"
      size={"lg"}
      onClick={() => setOpenScreensPopup(true)}
      />

      {/* <RxComponent2
      style={{
        cursor: ['5673990729647001', '5673990729647002', '5673990729647005'].includes(rowData?.departmentTypeLkey) ? 'pointer' : 'not-allowed'
    }}
        title="Medical Sheets"
        size={20}
        fill="var(--primary-gray)"
        onClick={() => setOpenScreensPopup(true)}
      /> */}
    </div>
  );

  // const conjureFormContent = (stepNumber = 0) => {
  //   switch (stepNumber) {
  //     case 0:
  //       return (
  //         <Form
  //           //  ref={formRef} model={model} formValue={department} onSubmit={handleSubmit}
  //           fluid
  //         >
  //           <div className="container-of-two-fields-departments">
  //             <MyInput
  //               width={250}
  //               fieldName="facilityKey"
  //               required
  //               fieldType="select"
  //               selectData={facilityListResponse?.object ?? []}
  //               selectDataLabel="facilityName"
  //               selectDataValue="key"
  //               record={department}
  //               setRecord={setDepartment}
  //             />
  //             <MyInput
  //               width={250}
  //               fieldName="departmentTypeLkey"
  //               fieldLabel="Department Type"
  //               fieldType="select"
  //               selectData={depTTypesLovQueryResponse?.object ?? []}
  //               selectDataLabel="lovDisplayVale"
  //               selectDataValue="key"
  //               record={department}
  //               setRecord={setDepartment}
  //             />
  //           </div>

  //           <MyInput width={520} fieldName="name" record={department} setRecord={setDepartment} />
  //           <div className="container-of-two-fields-departments">
  //             <MyInput
  //               width={250}
  //               fieldName="phoneNumber"
  //               record={department}
  //               setRecord={setDepartment}
  //             />
  //             <MyInput
  //               width={250}
  //               fieldName="email"
  //               record={department}
  //               setRecord={setDepartment}
  //             />
  //           </div>

  //           <MyInput
  //             width={520}
  //             fieldName="departmentCode"
  //             record={recordOfDepartmentCode}
  //             setRecord={setRecordOfDepartmentCode}
  //             disabled={true}
  //           />

  //           {/* <label>Department Code</label>
  //           <Input style={{ width: 260 }} disabled value={department?.departmentCode ?? generateCode} /> */}

  //           <div className="container-of-two-fields-departments">
  //             <Form style={{ width: 250 }}>
  //               <MyInput
  //                 fieldLabel="Appointable"
  //                 fieldType="checkbox"
  //                 fieldName="appointable"
  //                 record={department}
  //                 setRecord={setDepartment}
  //               />
  //             </Form>
  //             {department?.appointable ? (
  //               <MyInput
  //                 width={250}
  //                 fieldName="encountertypelkey"
  //                 fieldType="select"
  //                 fieldLabel="Encounter Type"
  //                 selectData={encTypesLovQueryResponse?.object ?? []}
  //                 selectDataLabel="lovDisplayVale"
  //                 selectDataValue="key"
  //                 record={department}
  //                 setRecord={setDepartment}
  //               />
  //             ) : null}
  //           </div>

  //           {/* <Stack spacing={2} divider={<Divider vertical />}>
  //             <Button appearance="primary" type='submit'
  //             >
  //               Save
  //             </Button>
  //             <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
  //               Cancel
  //             </Button>
  //           </Stack> */}
  //         </Form>
  //       );
  //   }
  // };

  //table columns
  const tableColumns = [
    {
      key: 'facilityKey',
      title: <Translate>Facility</Translate>,
      flexGrow: 1,
      dataKey: 'facilityKey'
    },
    {
      key: 'name',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4,
      dataKey: 'name'
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
      flexGrow: 4,
      dataKey: 'phoneNumber'
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
      flexGrow: 4,
      dataKey: 'email'
    },
    {
      key: 'departmentCode',
      title: <Translate>Department Code</Translate>,
      flexGrow: 1,
      dataKey: 'departmentCode'
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

  return (
    <Panel>
      {/* <ButtonToolbar> */}
      {/* <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton> */}
      <div className="container-of-header-actions-department">
      <Form layout="inline">
        <MyInput
          placeholder="Search by Department Name"
          fieldName="name"
          fieldType="text"
          record={recordOfSearch}
          setRecord={setRecordOfSearch}
          showLabel={false}
          width={'220px'}
        />
      </Form>
      <MyButton
        prefixIcon={() => <AddOutlineIcon />}
        color="var(--deep-blue)"
        onClick={handleNew}
        width="109px"
      >
        Add New
      </MyButton>
      </div>
      {/* <IconButton
          disabled={!department.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !department.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Delete Selected
        </IconButton>
        <IconButton
          disabled={!['5673990729647001', '5673990729647002', '5673990729647005'].includes(department?.departmentTypeLkey)}
          appearance="primary"
          icon={<CombinationIcon />}
          onClick={() => setOpenScreensPopup(true)}
        >
          Screen Components
        </IconButton> */}
      {/* </ButtonToolbar> */}
      {/* <hr /> */}

      <MyTable
        height={400}
        data={departmentListResponse?.object ?? []}
        columns={tableColumns}
        rowClassName={isSelected}
        // loading={isLoading}
        onRowClick={rowData => {
          setDepartment(rowData);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
      />

     
      {/* <div style={{ padding: 20 }}>
        <Pagination
          prev
          next
          first
          last
          ellipsis
          boundaryLinks
          maxButtons={5}
          size="xs"
          layout={['limit', '|', 'pager']}
          limitOptions={[5, 15, 30]}
          limit={listRequest.pageSize}
          activePage={listRequest.pageNumber}
          onChangePage={pageNumber => {
            setListRequest({ ...listRequest, pageNumber });
          }}
          onChangeLimit={pageSize => {
            setListRequest({ ...listRequest, pageSize });
          }}
          total={departmentListResponse?.extraNumeric ?? 0}
        />
      </div> */}


      <AddEditDepartment 
      open={popupOpen}
      setOpen={setPopupOpen}
      department={department}
      setDepartment={setDepartment}
      saveDepartment={saveDepartment}
      recordOfDepartmentCode={recordOfDepartmentCode}
      setRecordOfDepartmentCode={setRecordOfDepartmentCode}
      />
      {/* <MyModal
        open={popupOpen}
        setOpen={setPopupOpen}
        title={department?.key ? 'Edit Department' : 'New Department'}
        position="right"
        content={conjureFormContent}
        actionButtonLabel={department?.key ? 'Save' : 'Create'}
        actionButtonFunction={handleSave}
        steps={[{ title: 'Department Info', icon: faLaptop }]}
      /> */}

      {/* <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Department</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form ref={formRef} model={model} formValue={department} onSubmit={handleSubmit} fluid>
            <Stack direction="row" spacing={10}>
              <MyInput
                width={290}
                fieldName="facilityKey"
                required
                fieldType="select"
                selectData={facilityListResponse?.object ?? []}
                selectDataLabel="facilityName"
                selectDataValue="key"
                record={department}
                setRecord={setDepartment}
              />
              <MyInput
                width={290}
                fieldName="departmentTypeLkey"
                fieldLabel="Department Type"
                fieldType="select"
                selectData={depTTypesLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={department}
                setRecord={setDepartment}
              />
            </Stack>
            <br />
            <Stack direction="row" spacing={10}>
              <MyInput width={200} fieldName="name" record={department} setRecord={setDepartment} />
              <MyInput width={170} fieldName="phoneNumber" record={department} setRecord={setDepartment} />
              <MyInput width={200} fieldName="email" record={department} setRecord={setDepartment} />
            </Stack>
            <br />
            <label>Department Code</label>
            <Input style={{ width: 260 }} disabled value={department?.departmentCode ?? generateCode} />
            <br />
            <MyInput
              fieldLabel="Appointable"
              fieldType="checkbox"
              fieldName="appointable"
              record={department}
              setRecord={setDepartment}
            />
            {
              department?.appointable ?
                <MyInput
                  fieldName="encountertypelkey"
                  fieldType="select"
                  fieldLabel="Encounter Type"
                  selectData={encTypesLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={department}
                  setRecord={setDepartment}
                />
                : null
            }
            <MyInput
              fieldLabel="Is Valid"
              checkedLabel="Valid"
              unCheckedLabel="inValid"
              fieldType="checkbox"
              fieldName="isValid"
              record={department}
              setRecord={setDepartment}
            />
            <Stack spacing={2} divider={<Divider vertical />}>
              <Button appearance="primary" type='submit'
              >
                Save
              </Button>
              <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Form>
        </Modal.Body>
      </Modal> */}

     <ChooseDepartment   
        open={openScreensPopup}
        setOpen={setOpenScreensPopup}
        showScreen={showScreen}
        setShowScreen={setShowScreen}
        department={department}
      />


      {/* <Modal open={openScreensPopup} onClose={() => setOpenScreensPopup(false)} size="lg">
        <Modal.Header>
          <Modal.Title>Choose the screens you want to appear</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Panel
              style={{ border: '1px solid #87e6ed', borderRadius: '10px', paddingLeft: '5px' }}
            >
              <Row>
                <Col xs={6}>
                  <MyInput  
                    fieldType="check"
                    fieldName={'patientDashboard'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'clinicalVisit'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'diagnosticsOrder'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'prescription'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'procedures'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'patientHistory'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'allergies'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'medicalWarnings'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'optometricExam'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'vaccineReccord'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'diagnosticsResult'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'dentalCare'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'drugOrder'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'consultation'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'cardiology'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'audiometryPuretone'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'psychologicalExam'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'observation'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType="check"
                    fieldName={'vaccination'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen}
                  />
                </Col>
                <Col xs={6}></Col>
              </Row>
            </Panel>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            appearance="primary"
            color="cyan"
            onClick={() => {
              try {
                saveMedicalSheet({ ...showScreen, departmentKey: department.key }).unwrap();
                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                setOpenScreensPopup(false);
              } catch (error) {
                dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
              }
            }}
          >
            Save
          </Button>
          <Button appearance="ghost" color="cyan" onClick={() => setOpenScreensPopup(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal> */}
    </Panel>
  );
};

export default Departments;
