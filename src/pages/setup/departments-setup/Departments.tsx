import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Modal, Pagination, Panel, Schema, Table, Col, Row } from 'rsuite';
import CheckIcon from '@rsuite/icons/Check';
import CloseIcon from '@rsuite/icons/Close';

const { Column, HeaderCell, Cell } = Table;
import {
  useGetFacilitiesQuery,
  useGetDepartmentsQuery,
  useSaveDepartmentMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApDepartment } from '@/types/model-types';
import { newApDepartment, newApMedicalSheets } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { SchemaModel, StringType } from 'schema-typed';
import { notify } from '@/utils/uiReducerActions';
import { useDispatch } from 'react-redux';
import CombinationIcon from '@rsuite/icons/Combination';
import { useSaveMedicalSheetMutation, useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';
const Departments = () => {

  const [department, setDepartment] = useState<ApDepartment>({ ...newApDepartment });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openScreensPopup, setOpenScreensPopup] = useState(false);
  const [generateCode, setGenerateCode] = useState();
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
  const [facilityListRequest, setFacilityListRequest] = useState<ListRequest>({
    ...initialListRequest
  });

  const [saveDepartment, saveDepartmentMutation] = useSaveDepartmentMutation();
  const [saveMedicalSheet] = useSaveMedicalSheetMutation();
  const { data: depTTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');
  const { data: encTypesLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: medicalSheet } = useGetMedicalSheetsByDepartmentIdQuery(
    department?.key,
    { skip: !department.key }
  );
  const { data: facilityListResponse } = useGetFacilitiesQuery(facilityListRequest);
  const { data: departmentListResponse } = useGetDepartmentsQuery(listRequest);



  const handleNew = () => {
    generateFiveDigitCode()
    setDepartment({ ...newApDepartment })
    setPopupOpen(true);
    console.log(depTTypesLovQueryResponse)
  };



  const handleSave = () => {

    setPopupOpen(false);
    saveDepartment({ ...department, departmentCode: generateCode }).unwrap().then(() => {
      dispatch(notify({ msg: 'Departments Saved successfully' }));

    })
  };

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
    console.log("medical" + department.key)
    if (medicalSheet?.object?.key !== null) {
      setShowScreen({ ...medicalSheet?.object });
    }
    else {
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

      })
    }
  }, [medicalSheet]);
  useEffect(() => {
    console.log("sh", showScreen)
  }, [showScreen]);

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
    facilityKey: StringType().isRequiredOrEmpty('Facility is Required'),

  });

  const handleSubmit = async (values: any) => {
    const errors = model.getErrorMessages();
    if (errors.length > 0) {
      console.log("Validation failed", errors);
      return
    } else {
      console.log("Validation succeeded", values);
      handleSave()
    }
  };


  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>Departments</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
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
        </IconButton>
      </ButtonToolbar>
      <hr />
      <Table
        height={400}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortColumn={(sortBy, sortType) => {
          if (sortBy)
            setListRequest({
              ...listRequest,
              sortBy,
              sortType
            });
        }}
        headerHeight={80}
        rowHeight={60}
        bordered
        cellBordered
        data={departmentListResponse?.object ?? []}
        onRowClick={rowData => {
          setDepartment(rowData);

        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('facilityKey', e)} />
            <Translate>Facility</Translate>
          </HeaderCell>
          <Cell dataKey="facilityKey" />
        </Column>

        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('name', e)} />
            <Translate>Department Name</Translate>
          </HeaderCell>
          <Cell dataKey="name" />
        </Column>

        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('name', e)} />
            <Translate>Department Type</Translate>
          </HeaderCell>
          <Cell>
            {rowData => (
              <Translate>{rowData?.departmentTypeLvalue.lovDisplayVale}</Translate>
            )}

          </Cell>
 
        </Column>

        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('phoneNumber', e)} />
            <Translate>Phone Number</Translate>
          </HeaderCell>
          <Cell dataKey="phoneNumber" />
        </Column>

        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('email', e)} />
            <Translate>Email</Translate>
          </HeaderCell>
          <Cell dataKey="email" />
        </Column>
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('departmentCode', e)} />
            <Translate>Department Code</Translate>
          </HeaderCell>
          <Cell dataKey="departmentCode" />
        </Column>

        {/* <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('appointable', e)} />
            <Translate>Appointable</Translate>
          </HeaderCell>
          <Cell >
          {rowData =>
             rowData.appointable?<CheckIcon style={{ fontSize: "2rem", marginRight: 10 }}/>:<CloseIcon style={{ fontSize: "2rem", marginRight: 10 }}/>
          }
          </Cell>
        </Column>         */}



      </Table>
      <div style={{ padding: 20 }}>
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
      </div>

      <Modal open={popupOpen} overflow>
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

      </Modal>
      <Modal open={openScreensPopup} onClose={() => setOpenScreensPopup(false)} size="lg">
        <Modal.Header>
          <Modal.Title>
            Choose the screens you want to appear</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Panel style={{ border: '1px solid #87e6ed', borderRadius: '10px', paddingLeft: '5px' }}>
              <Row >
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'patientDashboard'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'clinicalVisit'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'diagnosticsOrder'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'prescription'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>


              </Row>
              <Row >
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'procedures'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'patientHistory'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'allergies'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'medicalWarnings'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>


              </Row>
              <Row  >
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'optometricExam'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'vaccineReccord'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'diagnosticsResult'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'dentalCare'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>


              </Row >
              <Row  >
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'drugOrder'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'consultation'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'cardiology'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'audiometryPuretone'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>

              </Row>
              <Row >
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'psychologicalExam'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'observation'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                  <MyInput
                    fieldType='check'
                    fieldName={'vaccination'}
                    showLabel={false}
                    record={showScreen}
                    setRecord={setShowScreen} />
                </Col>
                <Col xs={6}>
                </Col>
              </Row>
            </Panel>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
          <Button
            appearance="primary"
            color="cyan"
            onClick={() => {
              try {
                saveMedicalSheet({ ...showScreen, departmentKey: department.key }).unwrap();
                dispatch(notify({ msg: 'Saved successfully', sev: "success" }));
                setOpenScreensPopup(false);
              }
              catch (error) {
                dispatch(notify({ msg: 'Saved Faild', sev: "error" }));
              }
            }
            }
          >
            Save
          </Button>
          <Button
            appearance="ghost"
            color="cyan"
            onClick={() => setOpenScreensPopup(false)}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Panel>
  );
};

export default Departments;
