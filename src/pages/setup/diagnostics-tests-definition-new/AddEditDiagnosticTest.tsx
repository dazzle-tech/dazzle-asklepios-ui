import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetDiagnosticsTestTypeQuery,
  useGetLovValuesByCodeQuery,
  useSaveDiagnosticsRadiologyTestMutation,
  useSaveDiagnosticsTestLaboratoryMutation,
  useSaveDiagnosticsTestMutation,
  useSaveDiagnosticsTestPathologyMutation,
} from '@/services/setupService';
import {
  ApDiagnosticTestLaboratory,
  ApDiagnosticTestPathology,
  ApDiagnosticTestRadiology,
} from '@/types/model-types';
import {
  newApDiagnosticTestLaboratory,
  newApDiagnosticTestPathology,
  newApDiagnosticTestRadiology,
} from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { GrTestDesktop } from 'react-icons/gr';
import { LuTestTubes } from 'react-icons/lu';
import { Form } from 'rsuite';
import Laboratory from './Laboratory';
import Pathology from './Pathology';
import Radiology from './Radiology';
import './styles.less';
const AddEditDiagnosticTest = ({ open, setOpen, diagnosticsTest, setDiagnosticsTest, width, handleSave }) => {
  const dispatch = useAppDispatch();
  const [diagnosticTestRadiology, setDiagnosticTestRadiology] = useState<ApDiagnosticTestRadiology>(
    { ...newApDiagnosticTestRadiology }
  );
  const [diagnosticTestPathology, setDiagnosticTestPathology] = useState<ApDiagnosticTestPathology>(
    { ...newApDiagnosticTestPathology }
  );
  const [diagnosticTestSpecialPopulation, setDiagnosticTestSpecialPopulation] = useState([])
  const [ageGroupList, setAgeGroupList] = useState([])
  const [diagnosticTestLaboratory, setDiagnosticTestLaboratory] = useState<ApDiagnosticTestLaboratory>({ ...newApDiagnosticTestLaboratory });
  // Fetch diagnostics test type Lov response
   
  const testType = useEnumOptions('TestType');
  // Fetch Currency Lov response

  const Currency = useEnumOptions('Currency');
  // Fetch Gender 
  const genders = useEnumOptions('Gender')
  // Fetch Special Population Lov response
  const { data: SpecialPopulationLovQueryResponse } = useGetLovValuesByCodeQuery(
    'SPECIAL_POPULATION_GROUPS'
  );
  // Fetch Age Group Lov response

  const ageGroups = useEnumOptions('AgeGroupType')

  // save Diagnostics Test Laboratory
  const [saveDiagnosticsTestLaboratory] = useSaveDiagnosticsTestLaboratoryMutation();
  // save Diagnostics Test Radiology
  const [saveDiagnosticsTestRadiology] = useSaveDiagnosticsRadiologyTestMutation();
  // save Diagnostics Test Pathology
  const [saveDiagnosticsTestPathology] = useSaveDiagnosticsTestPathologyMutation();
  const matchingItem = useGetDiagnosticsTestTypeQuery(diagnosticsTest.testTypeLkey || '');

  // show details component according to Test type of diagnostic test
  const handleShowComponent = () => {
    switch (matchingItem.data?.object) {
      case 'Laboratory':
        return (
          <Laboratory
            diagnosticsTest={diagnosticsTest}
            diagnosticTestLaboratory={diagnosticTestLaboratory}
            setDiagnosticTestLaboratory={setDiagnosticTestLaboratory}
          />
        );
      case 'Radiology':
        return (
          <Radiology
            diagnosticsTest={diagnosticsTest}
            diagnosticTestRadiology={diagnosticTestRadiology}
            setDiagnosticTestRadiology={setDiagnosticTestRadiology}
          />
        );
      case 'Pathology':
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
    setOpen(false);
    await saveDiagnosticsTestLaboratory({
      ...diagnosticTestLaboratory,
      createdBy: 'Administrator',
      testKey: diagnosticsTest?.key
    }).unwrap();
    dispatch(notify('Laboratory Details Saved Successfully'));
  };

  // handle save radiology details
  const handleSaveRad = async () => {
    setOpen(false);
    await saveDiagnosticsTestRadiology({
      ...diagnosticTestRadiology,
      createdBy: 'Administrator',
      testKey: diagnosticsTest.key
    }).unwrap();
    dispatch(notify('Radiology Details Saved Successfully'));
  };

  // handle save pathology details
  const handleSavePath = async () => {
    setOpen(false);
    await saveDiagnosticsTestPathology({
      ...diagnosticTestPathology,
      createdBy: 'Administrator',
      testKey: diagnosticsTest.key
    }).unwrap();
    dispatch(notify('Pathology Details Saved Successfully'));
  };

  useEffect(() => {
    setDiagnosticsTest({ ...diagnosticsTest, specialPopulationValues: diagnosticTestSpecialPopulation?.testKey })
  }, [diagnosticTestSpecialPopulation])
  useEffect(() => {
    if (diagnosticsTest?.id) {
      // Fetch existing special population values and set to state
      setDiagnosticTestSpecialPopulation({ testKey: diagnosticsTest?.specialPopulationValues || [] });
    }
  }, [diagnosticsTest?.id]);

  useEffect(() => {
    setDiagnosticsTest({ ...diagnosticsTest, ageGroupList: ageGroupList?.ageGroupList })
  }, [ageGroupList])


  useEffect(() => {
    if (diagnosticsTest?.id) {
      // Fetch existing age group values and set to state
      setAgeGroupList({ ageGroupList: diagnosticsTest?.ageGroupList || [] });
    }
  }, [diagnosticsTest?.id]);

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">

                <MyInput
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
                  width="100%"
                  fieldName="name"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
            </div>
            <br />
            <MyInput
              width="100%"
              fieldName="internalCode"
              record={diagnosticsTest}
              setRecord={setDiagnosticsTest}
            />
            <div className="container-of-two-fields-diagnostic">
              <div className="container-of-field-diagnostic">
                <MyInput
                  width="100%"
                  fieldName="price"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
              </div>
              <div className="container-of-field-diagnostic">

                <MyInput
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
              <div className="container-of-field-diagnostic">
                {diagnosticsTest.type== 'LABORATORY' && (
                <MyInput
                fieldLabel="Is Laboratory Profile"
                  width="100%"
                  fieldName="isProfile"
                  fieldType="checkbox"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />)}
              </div>
            </div>

          </Form>
        );
      case 1:
        return (
          handleShowComponent()
        );
    }
  };
  // Effects


  return (
    <MyModal
      actionButtonLabel={diagnosticsTest?.id ? 'Save' : 'Create'}
      actionButtonFunction={
        matchingItem.data?.object == 'Laboratory'
          ? handleSaveLab
          : matchingItem.data?.object == 'Radiology'
            ? handleSaveRad
            : matchingItem.data?.object == 'Pathology'
              ? handleSavePath
              : ''
      }
      open={open}
      setOpen={setOpen}
      position="right"
      title={diagnosticsTest?.id ? 'Edit Diagnostic Test' : 'New Diagnostic Test'}
      content={conjureFormContentOfMainModal}
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
