import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { MdSave } from 'react-icons/md';
import TrashIcon from '@rsuite/icons/Trash';
import { Input, Panel, Container, Row, Col, Table, Button, InlineEdit, TagPicker } from 'rsuite';
import {
  useGetDiagnosticsTestTypeQuery,
  useGetLovValuesByCodeQuery,
  useSaveDiagnosticsTestMutation,
  useSaveDiagnosticsTestSpecialPopulationMutation,
  useGetDiagnosticsCodingListQuery,
  useSaveDiagnosticsCodingMutation,
  useRemoveDiagnosticsCodingMutation
} from '@/services/setupService';
import {
  useGetActiveIngredientQuery,
  useSaveActiveIngredientMutation
} from '@/services/medicationsSetupService';
import {
  ButtonToolbar,
  IconButton,
} from 'rsuite';
import { Block, Check } from '@rsuite/icons';
import PlusIcon from '@rsuite/icons/Plus';
import {
  ApActiveIngredient,
  ApDiagnosticTest,
  ApDiagnosticTestSpecialPopulation
} from '@/types/model-types';
import {
  newApActiveIngredient,
  newApDiagnosticCoding,
  newApDiagnosticTest,
  newApDiagnosticTestSpecialPopulation
} from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useNavigate } from 'react-router-dom';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import Laboratory from './Laboratory';
import Pathology from './Pathology';
import Radiology from './Radiology';
import Genetics from './Genetics';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import DiagnosticsTest from './DiagnosticsTest';
import BackButton from '@/components/BackButton/BackButton';
import clsx from 'clsx';
// import EyeExam from './EyeExam';

const { Column, HeaderCell, Cell } = Table;
const NewDiagnosticsTest = ({ selectedDiagnosticsTest, goBack, ...props }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [basicDataSaved, setBasicDataSaved] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const [diagnosticsTest, setDiagnosticsTest] = useState<ApDiagnosticTest>({
    ...newApDiagnosticTest
  });

  const [listCodingRequest, setListCosingRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'diagnostics_key',
        operator: 'match',
        value: diagnosticsTest?.key
      }
    ]
  });

  const [saveDiagnosticsTest, saveDiagnosticsTestMutation] = useSaveDiagnosticsTestMutation();
  const [saveCoding, saveCodingMutation] = useSaveDiagnosticsCodingMutation();
  const [removeDiagnosticCoding, removeDiagnosticCodingMutation] =
    useRemoveDiagnosticsCodingMutation();
  const [diagnosticTestSpecialPopulation, setDiagnosticTestSpecialPopulation] =
    useState<ApDiagnosticTestSpecialPopulation>({ ...newApDiagnosticTestSpecialPopulation });
  const [saveDiagnosticsTestSpecialPopulation, saveDiagnosticsTestpecialPopulationMutation] =
    useSaveDiagnosticsTestSpecialPopulationMutation();

  const { data: DiagnosticsTestTypeLovQueryResponse } =
    useGetLovValuesByCodeQuery('DIAG_TEST-TYPES');
  const { data: CodingList, refetch: fetchCoding } = useGetDiagnosticsCodingListQuery({
    ...listCodingRequest
  });
  const { data: CurrencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const { data: GenderLovQueryResponse } = useGetLovValuesByCodeQuery('MEDICAL_GNDR');
  const { data: SpecialPopulationLovQueryResponse } = useGetLovValuesByCodeQuery(
    'SPECIAL_POPULATION_GROUPS'
  );
  const { data: AgeGroupLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_GROUPS');
  const { data: LabReagentsLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_REAGENTS');
  const { data: codeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
  const [tags, setTags] = useState([]);
  const [typing, setTyping] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [editing, setEditing] = useState(false);
  const [ageDetails, setAgeDetails] = useState(false);
  const [genderDetails, setGenderDetails] = useState(false);
  const [specialPopulationDetails, setSpecialPopulationDetails] = useState(false);
  const [ageGroupSpecificDetails, setAgeGroupSpecificDetailsDetails] = useState(false);
  const [diagnosticCoding, setDiagnosticCoding] = useState({ ...newApDiagnosticCoding });
  const [popupOpen, setPopupOpen] = useState(false);
  const [componentToDisplay, setComponentToDisplay] = useState('');
  const removeTag = tag => {
    const nextTags = tags.filter(item => item !== tag);
    setTags(nextTags);
  };

  const matchingItem = useGetDiagnosticsTestTypeQuery(diagnosticsTest.testTypeLkey || '');
  const isSelectedcode = rowData => {
    if (rowData && diagnosticCoding && rowData.key === diagnosticCoding.key) {
      return 'selected-row';
    } else return '';
  };

  const handleButtonClick = () => {
    setTyping(true);
  };

  const renderInput = () => {
    if (typing) {
      return (
        <Input
          className="tag-input"
          size="xs"
          style={{ width: 70 }}
          value={inputValue}
          onChange={setInputValue}
          // onBlur={addTag}
          // onPressEnter={addTag}
        />
      );
    }
    return (
      <IconButton
        className="tag-add-btn"
        onClick={handleButtonClick}
        icon={<PlusIcon />}
        appearance="ghost"
        size="xs"
      />
    );
  };

  const handleGoBack = () => {
    navigate('/DiagnosticsTest');
  };

  useEffect(() => {
    if (saveDiagnosticsTestMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
      dispatch(notify('Saved Successfully'));
    }
  }, [saveDiagnosticsTestMutation.data]);
  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'diagnostics_key',
        operator: 'match',
        value: diagnosticsTest?.key
      }
    ];
    setListCosingRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [diagnosticsTest.key]);

  useEffect(() => {
    if (selectedDiagnosticsTest) {
      setDiagnosticsTest(selectedDiagnosticsTest);
      setBasicDataSaved(true);
    } else {
      setDiagnosticsTest(newApDiagnosticTest);
    }
  }, [selectedDiagnosticsTest]);

  const isSelected = rowData => {
    if (rowData && diagnosticsTest && rowData.key === diagnosticsTest.key) {
      return 'selected-row';
    } else return '';
  };

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  const handleSaveBasicInfo = async () => {
    try {
      const Response = await saveDiagnosticsTest({
        ...diagnosticsTest,
        createdBy: 'Administrator'
      }).unwrap();
      dispatch(notify('Saved Successfully'));
      setBasicDataSaved(true);
      setDiagnosticsTest({ ...Response });
    } catch (error) {
      console.error('Error saving diagnostics test:', error);
      dispatch(notify('Error saving diagnostics test'));
    }
    if (diagnosticsTest.testTypeLkey === null) {
      return null;
    }
  };
  const handleSaveCoding = async () => {
    try {
      await saveCoding({ ...diagnosticCoding, diagnosticsKey: diagnosticsTest.key }).unwrap();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'Success' }));
      fetchCoding();
    } catch {}
  };
  const handleShowComponent = () => {
    switch (matchingItem.data?.object) {
      case 'Laboratory':
        return <Laboratory diagnosticsTest={diagnosticsTest} />;
      case 'Radiology':
        return <Radiology diagnosticsTest={diagnosticsTest} />;
      case 'Pathology':
        return <Pathology diagnosticsTest={diagnosticsTest} />;
      case 'Genetics':
        return <Genetics diagnosticsTest={diagnosticsTest} />;
      // case 'Eye Exam':
      //   console.log("Ete");
      //   return <EyeExam/>;
      default:
        return <div>No component available</div>;
    }
  };

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>New/Edit Diagnostics</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <BackButton onClick={goBack} appearance="ghost" />
        <Divider vertical />

        <IconButton
          onClick={handleSaveBasicInfo}
          appearance="primary"
          color="green"
          icon={<Check />}
        >
          <Translate> {'Save'} </Translate>
        </IconButton>

        <IconButton appearance="primary" color="red" icon={<Block />}>
          <Translate>Clear</Translate>
        </IconButton>
      </ButtonToolbar>
      <hr />

      <Panel
        bordered
        header={
          <h5 className="title">
            <Translate>Basic Information</Translate>
          </h5>
        }
      >
        <Stack>
          <Stack.Item grow={8}>
            <Form layout="inline" fluid>
              <MyInput
                width={250}
                column
                fieldName="testTypeLkey"
                fieldType="select"
                selectData={DiagnosticsTestTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              <MyInput
                width={250}
                column
                fieldName="testName"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              <MyInput
                width={250}
                column
                fieldName="internalCode"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              <MyInput
                width={250}
                column
                fieldName="price"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              <MyInput
                width={250}
                column
                fieldName="currencyLkey"
                fieldType="select"
                selectData={CurrencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              <MyInput
                width={250}
                column
                fieldName="specialNotes"
                fieldType="textarea"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                isabled={!editing}
                setRecord={setDiagnosticsTest}
              />
              <br />
              <MyInput
                width={400}
                column
                fieldName="genderSpecific"
                fieldType="checkbox"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              {diagnosticsTest.genderSpecific && (
                <MyInput
                  width={200}
                  column
                  fieldName="genderLkey"
                  fieldType="select"
                  selectData={GenderLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={diagnosticsTest}
                  isabled={!editing}
                  setRecord={setDiagnosticsTest}
                />
              )}
              <MyInput
                width={400}
                column
                fieldName="specialPopulation"
                fieldType="checkbox"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              {diagnosticsTest.specialPopulation && (
                <InlineEdit placeholder="Special Pouplation" style={{ width: 200 }}>
                  <TagPicker
                    data={SpecialPopulationLovQueryResponse?.object ?? []}
                    labelKey="lovDisplayVale"
                    valueKey="key"
                    block
                    value={diagnosticTestSpecialPopulation.testKey}
                    onChange={e =>
                      setDiagnosticTestSpecialPopulation({
                        ...diagnosticTestSpecialPopulation,
                        testKey: String(e)
                      })
                    }
                  />
                </InlineEdit>
              )}
              <MyInput
                width={400}
                column
                fieldName="ageSpecific"
                fieldType="checkbox"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              {diagnosticsTest.ageSpecific && (
                <InlineEdit placeholder="Age Group" style={{ width: 200 }}>
                  <TagPicker
                    data={AgeGroupLovQueryResponse?.object ?? []}
                    labelKey="lovDisplayVale"
                    valueKey="key"
                    block
                  />
                </InlineEdit>
              )}
              <MyInput
                width={400}
                column
                fieldName="appointable"
                fieldType="checkbox"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              <br />
            </Form>
            <div
             className={clsx('right-main-container', {'disabled-panel':diagnosticsTest.key
                                                                                                 })} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e5e5ea',
                borderRadius: '10px',
                width: '450px',
                paddingLeft: '10px'
              }}
            >
              <Panel style={{ display: 'flex' }}>
                <Form layout="inline" fluid style={{ display: 'flex' }}>
                  <MyInput
                    column
                    width={150}
                    fieldType="select"
                    fieldLabel="Code Type"
                    selectData={codeTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'codeTypeLkey'}
                    record={diagnosticCoding}
                    setRecord={setDiagnosticCoding}
                  />
                  <MyInput
                    column
                    width={150}
                    fieldType="select"
                    fieldLabel="Code"
                    selectData={[]}
                    selectDataLabel="name"
                    selectDataValue="key"
                    fieldName={'internationalCodeKey'}
                    record={diagnosticCoding}
                    setRecord={setDiagnosticCoding}
                  />
                  <ButtonToolbar
                    zoom={0.8}
                    style={{ padding: '6px', display: 'flex', marginTop: '20px' }}
                  >
                    <IconButton
                      size="xs"
                      onClick={handleSaveCoding}
                      appearance="primary"
                      color="violet"
                      icon={<MdSave />}
                    ></IconButton>

                    <IconButton
                      size="xs"
                      appearance="primary"
                      color="blue"
                      onClick={() => {
                        removeDiagnosticCoding({ ...diagnosticCoding })
                          .unwrap()
                          .then(() => {
                            fetchCoding();
                            dispatch(notify('deleted succsessfuly'));
                          });
                      }}
                      icon={<TrashIcon />}
                    ></IconButton>
                  </ButtonToolbar>
                </Form>
              </Panel>
              <div>
                <Table
                  height={200}
                  width={400}
                  onSortColumn={(sortBy, sortType) => {
                    if (sortBy)
                      setListRequest({
                        ...listRequest,
                        sortBy,
                        sortType
                      });
                  }}
                  headerHeight={33}
                  rowHeight={40}
                  data={CodingList?.object ?? []}
                  onRowClick={rowData => {
                    setDiagnosticCoding(rowData);
                  }}
                  rowClassName={isSelectedcode}
                >
                  <Column sortable flexGrow={1}>
                    <HeaderCell align="center">
                      <Translate>Code Type</Translate>
                    </HeaderCell>
                    <Cell align="center">
                      {rowData =>
                        rowData.codeTypeLkey
                          ? rowData.codeTypeLvalue.lovDisplayVale
                          : rowData.codeTypeLkey
                      }
                    </Cell>
                  </Column>
                  <Column sortable flexGrow={2}>
                    <HeaderCell align="center">
                      <Translate>international Code</Translate>
                    </HeaderCell>
                    <Cell align="center">{rowData => rowData.internationalCodeKey}</Cell>
                  </Column>
                </Table>
              </div>
            </div>
          </Stack.Item>
        </Stack>
      </Panel>
      {diagnosticsTest.key && (
        <Panel>
          {/* {console.log("the value is " + handleShowComponent() + basicDataSaved)} */}
          {handleShowComponent()}
        </Panel>
      )}
    </Panel>
  );
};

export default NewDiagnosticsTest;
