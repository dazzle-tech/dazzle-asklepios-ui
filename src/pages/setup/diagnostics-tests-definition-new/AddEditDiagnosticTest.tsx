import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useEnumCapitalized, useEnumOptions } from '@/services/enumsApi';
import {
  useCreatePathologyMutation,
  useUpdatePathologyMutation
} from '@/services/setup/diagnosticTest/diagnosticTestPathologyService';
import {
  useCreateLaboratoryMutation,
  useUpdateLaboratoryMutation
} from '@/services/setup/diagnosticTest/laboratoryService';
import {
  useCreateRadiologyMutation,
  useUpdateRadiologyMutation
} from '@/services/setup/diagnosticTest/radiologyTestService';
import { useGetLovsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newLaboratory, newPathology, newRadiology } from '@/types/model-types-constructor-new';
import { initialListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { SearchIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GrTestDesktop } from 'react-icons/gr';
import { LuTestTubes } from 'react-icons/lu';
import { Dropdown, Form, Input, InputGroup } from 'rsuite';
import Laboratory from './Laboratory';
import Pathology from './Pathology';
import Radiology from './Radiology';
import './styles.less';
import { useGetFacilityByIdQuery } from '@/services/security/facilityService';
import { skipToken } from '@tanstack/react-query';


interface AddEditDiagnosticTestProps {
  open: boolean;
  setOpen: any;
  diagnosticsTest: any;
  setDiagnosticsTest: any;
  width: number;
  handleSave: any;
  testRequest?: {
    id: number;
    diagnosticTestId?: number;
    type?: string;
  };
}

const AddEditDiagnosticTest: React.FC<AddEditDiagnosticTestProps> = ({
  open,
  setOpen,
  diagnosticsTest,
  setDiagnosticsTest,
  width,
  handleSave,
  testRequest
}) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const [diagnosticTestPathology, setDiagnosticTestPathology] = useState({ ...newPathology });
  const [diagnosticTestSpecialPopulation, setDiagnosticTestSpecialPopulation] = useState<any>([]);
  const [ageGroupList, setAgeGroupList] = useState<any>([]);
  const [diagnosticTestLaboratory, setDiagnosticTestLaboratory] = useState({ ...newLaboratory });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [diagnosticTestRadiology, setDiagnosticTestRadiology] = useState({ ...newRadiology });

  // Fetch diagnostics test type Lov response

  const testType = useEnumOptions('TestType');
  // Fetch Currency Lov response

  const Currency = useEnumCapitalized('Currency');
  // Fetch Gender
  const genders = useEnumOptions('Gender');
  // Fetch Special Population Lov response
  const { data: SpecialPopulationLovQueryResponse } = useGetLovValuesByCodeQuery(
    'SPECIAL_POPULATION_GROUPS'
  );
  const { data: unitsLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch LOV list for search
  const { data: lovListResponseData } = useGetLovsQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  const { data: facility } = useGetFacilityByIdQuery(selectedDepartment?.facilityId ?? skipToken, { skip: !selectedDepartment?.facilityId });
  // Fetch Age Group Lov response

  const ageGroups = useEnumOptions('AgeGroupType');

  const TestResultType = useEnumOptions('TestResultType');

  // save Diagnostics Test Laboratory

  const [addDiagnosticTest] = useCreateLaboratoryMutation();
  const [updateDiagnosticTest] = useUpdateLaboratoryMutation();
  // save Diagnostics Test Radiology

  const [addDiagnosticTestRadiology] = useCreateRadiologyMutation();
  const [updateDiagnosticTestRadiology] = useUpdateRadiologyMutation();
  // save Diagnostics Test Pathology
  const [addPathology] = useCreatePathologyMutation();
  const [updatePathology] = useUpdatePathologyMutation();

  // Filter LOV data based on search
  const filteredData = (lovListResponseData?.object ?? []).filter(item =>
    `${item.lovCode}`.toLowerCase().includes(searchKeyword.toLowerCase())
  );
  // Display selected LOV
  const resultLovDisplay = (() => {
    if (!diagnosticsTest?.listOfValueId) return '';
    if (!lovListResponseData?.object?.length) return '';

    const found = lovListResponseData.object.find(
      x => String(x.key) === String(diagnosticsTest.listOfValueId)
    );

    return found ? `${found.lovCode}` : '';
  })();

  // show details component according to Test type of diagnostic test
  const handleShowComponent = () => {
    switch (diagnosticsTest.type) {
      case 'LABORATORY':
        return (
          <Laboratory
            diagnosticsTest={diagnosticsTest}
            diagnosticTestLaboratory={diagnosticTestLaboratory}
            setDiagnosticTestLaboratory={setDiagnosticTestLaboratory}
          />
        );
      case 'RADIOLOGY':
        return (
          <Radiology
            diagnosticsTest={diagnosticsTest}
            diagnosticTestRadiology={diagnosticTestRadiology}
            setDiagnosticTestRadiology={setDiagnosticTestRadiology}
          />
        );
      case 'PATHOLOGY':
        return (
          <Pathology
            diagnosticsTest={diagnosticsTest}
            diagnosticTestPathology={diagnosticTestPathology}
            setDiagnosticTestPathology={setDiagnosticTestPathology}
          />
        );
      default:
        return <div>No component available</div>;
    }
  };

  // handle save laboratory details

  const handleSaveLab = async () => {
    try {
      setOpen(false);

      if (diagnosticTestLaboratory.id) {
        await updateDiagnosticTest({
          id: diagnosticTestLaboratory.id,
          body: {
            ...diagnosticTestLaboratory,
            testId: diagnosticsTest?.id
          }
        }).unwrap();
        await handleSave();

        dispatch(notify({ msg: 'Laboratory Details Updated Successfully', sev: 'success' }));
      } else {
        const created = await addDiagnosticTest({
          testId: diagnosticsTest?.id,
          property: diagnosticTestLaboratory.property,
          system: diagnosticTestLaboratory.system,
          scale: diagnosticTestLaboratory.scale,
          reagents: diagnosticTestLaboratory.reagents,
          method: diagnosticTestLaboratory.method,
          testDurationTime: diagnosticTestLaboratory.testDurationTime,
          timeUnit: diagnosticTestLaboratory.timeUnit,
          resultUnit: diagnosticTestLaboratory.resultUnit,
          sampleContainer: diagnosticTestLaboratory.sampleContainer,
          sampleVolume: diagnosticTestLaboratory.sampleVolume,
          sampleVolumeUnit: diagnosticTestLaboratory.sampleVolumeUnit,
          tubeColor: diagnosticTestLaboratory.tubeColor,
          testDescription: diagnosticTestLaboratory.testDescription,
          sampleHandling: diagnosticTestLaboratory.sampleHandling,
          turnaroundTime: diagnosticTestLaboratory.turnaroundTime,
          turnaroundTimeUnit: diagnosticTestLaboratory.turnaroundTimeUnit,
          preparationRequirements: diagnosticTestLaboratory.preparationRequirements,
          medicalIndications: diagnosticTestLaboratory.medicalIndications,
          associatedRisks: diagnosticTestLaboratory.associatedRisks,
          testInstructions: diagnosticTestLaboratory.testInstructions,
          category: diagnosticTestLaboratory.category,
          tubeType: diagnosticTestLaboratory.tubeType,
          timing: diagnosticTestLaboratory.timing
        }).unwrap();

        dispatch(notify({ msg: ' Saved Successfully', sev: 'success' }));
      }
    } catch (error: any) {
      console.error('Error saving laboratory details:', error);
      dispatch(
        notify({
          msg: 'Failed to save Laboratory Details',
          sev: 'error'
        })
      );
    } finally {
    }
  };

  // handle save radiology details
  const handleSaveRad = async () => {
    try {
      setOpen(false);
      if (diagnosticTestRadiology.id) {
        await updateDiagnosticTestRadiology({
          id: diagnosticTestRadiology.id,
          body: {
            ...diagnosticTestRadiology,
            testId: diagnosticsTest?.id
          }
        }).unwrap();

        dispatch(notify({ msg: 'Radiology Details Updated Successfully', sev: 'success' }));
      } else {
        await addDiagnosticTestRadiology({
          ...diagnosticTestRadiology,
          testId: diagnosticsTest?.id
        }).unwrap();
        dispatch(notify({ msg: 'Radiology Details Saved Successfully', sev: 'success' }));
      }
    } catch (error: any) {
      console.error('Error saving radiology details:', error);
      dispatch(
        notify({
          msg: 'Failed to save Radiology Details',
          sev: 'error'
        })
      );
    } finally {
    }
  };

  // handle save pathology details
  const handleSavePath = async () => {
    try {
      setOpen(false);
      if (diagnosticTestPathology.id) {
        await updatePathology({
          id: diagnosticTestPathology.id,
          body: {
            ...diagnosticTestPathology,
            testId: diagnosticsTest?.id
          }
        }).unwrap();
        dispatch(notify({ msg: 'Pathology Details Updated Successfully', sev: 'success' }));
      } else {
        await addPathology({
          ...diagnosticTestPathology,
          testId: diagnosticsTest?.id
        }).unwrap();
        dispatch(notify({ msg: 'Pathology Details Saved Successfully', sev: 'success' }));
      }
    } catch (error: any) {
      console.error('Error saving pathology details:', error);
      dispatch(
        notify({
          msg: 'Failed to save Pathology Details',
          sev: 'error'
        })
      );
    } finally {
    }
  };

  useEffect(() => {
    setDiagnosticsTest({
      ...diagnosticsTest,
      specialPopulationValues: diagnosticTestSpecialPopulation?.testKey
    });
  }, [diagnosticTestSpecialPopulation]);

  useEffect(() => {
    if (diagnosticsTest?.id) {
      // Fetch existing special population values and set to state
      setDiagnosticTestSpecialPopulation({
        testKey: diagnosticsTest?.specialPopulationValues || []
      });
    }
  }, [diagnosticsTest?.id]);

  useEffect(() => {
    setDiagnosticsTest({ ...diagnosticsTest, ageGroupList: ageGroupList?.ageGroupList });
  }, [ageGroupList]);

  useEffect(() => {
    if (diagnosticsTest?.id) {
      // Fetch existing age group values and set to state
      setAgeGroupList({ ageGroupList: diagnosticsTest?.ageGroupList || [] });
    }
  }, [diagnosticsTest?.id]);

  useEffect(() => {
    if (open && diagnosticsTest?.id && diagnosticsTest?.type === 'LABORATORY') {
      setDiagnosticsTest(prev => ({
        ...prev,
        defaultProfileResultType: diagnosticsTest.defaultProfileResultType ?? null,
        defaultProfileResultUnit: diagnosticsTest.defaultProfileResultUnit ?? null,
        listOfValueId: diagnosticsTest.listOfValueId ?? null
      }));
    }
  }, [open, diagnosticsTest?.id]);
  useEffect(() => {
    if (testRequest?.type) {
      setDiagnosticsTest(prev => ({
        ...prev,
        type: testRequest.type
      }));
    }
  }, [open, testRequest?.type]);

  useEffect(() => {
    if (open && !diagnosticsTest?.id) {
      console.log('Facility data in useEffect:', facility);

      setDiagnosticsTest(prev => ({
        ...prev,
        currency: facility?.defaultCurrency ?? null
      }));
    }
  }, [open, facility]);

  useEffect(() => {

  if (!diagnosticsTest?.appointable) {
    
      setDiagnosticsTest(prev => ({
        ...prev,
        defaultDurationMinutes: undefined, defaultBufferAfterMinutes: 0, defaultBufferBeforeMinutes: 0
      }));
    
  }
}, [diagnosticsTest?.appointable]);
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  required
                  width="%100%"
                  fieldLabel="Test Type"
                  fieldType="select"
                  fieldName="type"
                  selectData={testType ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}

                />
              </div>
              <div className="container-of-field-diagnostic">
                <MyInput
                  required
                  width="100%"
                  fieldName="name"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
            </div>

            {diagnosticsTest.type === 'LABORATORY' && (
              <>
                <br />
                <div className="container-of-two-fields-diagnostic">
                  <div className="container-of-field-diagnostic">
                    <MyInput
                      required
                      width="100%"
                      fieldLabel="Result Type"
                      fieldType="select"
                      fieldName="defaultProfileResultType"
                      selectData={TestResultType ?? []}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={diagnosticsTest}
                      setRecord={setDiagnosticsTest}
                    />
                  </div>
                  {diagnosticsTest.defaultProfileResultType === 'LOV' && (
                    <div style={{ width: 320 }}>
                      <div className="container-of-menu-diagnostic">
                        <InputGroup className="search-input-diagnostic" inside>
                          <Input
                            placeholder="Search LOV"
                            value={searchKeyword}
                            onChange={setSearchKeyword}
                          />
                          <InputGroup.Button>
                            <SearchIcon />
                          </InputGroup.Button>
                        </InputGroup>

                        {searchKeyword && (
                          <Dropdown.Menu className="menu-diagnostic">
                            {filteredData.map(mod => (
                              <Dropdown.Item
                                key={mod.key}
                                onClick={() => {
                                  setDiagnosticsTest(prev => ({
                                    ...prev,
                                    listOfValueId: mod.key
                                  }));
                                  setSearchKeyword('');
                                }}
                              >
                                <span>{mod.lovCode}</span>
                                <span>{mod.lovName}</span>
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        )}
                      </div>

                      <br />

                      <Input
                        className="search-result-diagnostic"
                        disabled
                        value={resultLovDisplay}
                        placeholder="Selected LOV"
                      />
                    </div>

                  )}

                  {diagnosticsTest.defaultProfileResultType === 'NUMBER' && (
                    <div className="container-of-field-diagnostic">
                      <MyInput
                        width="100%"
                        menuMaxHeight={200}
                        fieldLabel="Result Unit"
                        fieldName="defaultProfileResultUnit"
                        fieldType="select"
                        selectData={unitsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={diagnosticsTest}
                        setRecord={setDiagnosticsTest}
                      />
                    </div>)}
                </div>
              </>
            )}
            <br />
            <MyInput
              required
              width="100%"
              fieldName="internalCode"
              record={diagnosticsTest}
              setRecord={setDiagnosticsTest}
            />
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  required
                  width="100%"
                  fieldName="price"
                  fieldType='number'
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
              <div className="container-of-field-diagnostic">
                <MyInput
                  disabled={true}
                  width="%100%"
                  fieldLabel="Currency"
                  fieldType="select"
                  fieldName="currency"
                  selectData={Currency ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
            </div>
            <br />
            <MyInput
              width="100%"
              fieldName="specialNotes"
              fieldType="textarea"
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={diagnosticsTest}
              setRecord={setDiagnosticsTest}
            />
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  width="100%"
                  fieldName="genderSpecific"
                  fieldType="checkbox"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
              {diagnosticsTest.genderSpecific && (
                <div className="container-of-field-diagnostic">
                  <MyInput
                    width="%100"
                    fieldLabel="Gender"
                    fieldType="select"
                    fieldName="gender"
                    selectData={genders ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={diagnosticsTest}
                    setRecord={setDiagnosticsTest}
                  />
                </div>
              )}
            </div>
            <br />
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  width="100%"
                  fieldName="specialPopulation"
                  fieldType="checkbox"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
              {diagnosticsTest.specialPopulation && (
                <div className="container-of-field-diagnostic">
                  <MyInput
                    width="100%"
                    fieldLabel="Special Pouplation"
                    selectData={SpecialPopulationLovQueryResponse?.object ?? []}
                    fieldType="checkPicker"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName="testKey"
                    record={diagnosticTestSpecialPopulation}
                    setRecord={setDiagnosticTestSpecialPopulation}
                    menuMaxHeight={150}
                  />
                </div>
              )}
            </div>
            <br />
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  width="100%"
                  fieldName="ageSpecific"
                  fieldType="checkbox"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
              {diagnosticsTest.ageSpecific && (
                <div className="container-of-field-diagnostic">
                  <MyInput
                    width="100%"
                    fieldLabel="Age Group"
                    selectData={ageGroups ?? []}
                    fieldType="checkPicker"
                    selectDataLabel="label"
                    selectDataValue="value"
                    fieldName="ageGroupList"
                    record={ageGroupList}
                    setRecord={setAgeGroupList}
                    menuMaxHeight={100}
                  />
                </div>
              )}
            </div>
            <br />
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  width="100%"
                  fieldName="appointable"
                  fieldType="checkbox"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
            </div>

            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  fieldType="number"
                  fieldName="parallelCapacityValue"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                  width="100%"
                  required
                />
              </div>
              {diagnosticsTest?.appointable && (
                  <div className="container-of-field-diagnostic">
                    <MyInput
                      fieldType="number"
                      fieldName="defaultDurationMinutes"
                      record={diagnosticsTest}
                      setRecord={setDiagnosticsTest}
                      width="100%"
                      required={diagnosticsTest?.appointable}
                    />
                  </div>
                )}
            </div>
             {diagnosticsTest?.appointable && (
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  fieldType="number"
                  fieldName="defaultBufferBeforeMinutes"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                  width="100%"
                  required={diagnosticsTest?.appointable}
                />
              </div>
              <div className="container-of-field-diagnostic">
                <MyInput
                  fieldType="number"
                  fieldName="defaultBufferAfterMinutes"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                  width="100%"
                  required={diagnosticsTest?.appointable}
                />
              </div>
            </div>
             )}
          </Form>
        );
      case 1:
        return handleShowComponent();
    }
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      actionButtonLabel={diagnosticsTest?.id ? 'Save' : 'Create'}
      actionButtonFunction={
        diagnosticsTest?.type == 'LABORATORY'
          ? handleSaveLab
          : diagnosticsTest?.type == 'RADIOLOGY'
            ? handleSaveRad
            : diagnosticsTest?.type == 'PATHOLOGY'
              ? handleSavePath
              : () => { }
      }
      open={open}
      setOpen={setOpen}
      position="right"
      title={diagnosticsTest?.id ? 'Edit Diagnostic Test' : 'New Diagnostic Test'}
      content={(stepNumber) => (<div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>)}
      steps={[
        {
          title: 'Basic Info',
          icon: <GrTestDesktop />,
          disabledNext: !diagnosticsTest?.id,
          footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        {
          title: 'Details',
          icon: <LuTestTubes />
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditDiagnosticTest;
