import React, { useEffect, useState } from 'react';
import {
  useGetDiagnosticsTestTypeQuery,
  useGetLovValuesByCodeQuery,
  useSaveDiagnosticsRadiologyTestMutation,
  useSaveDiagnosticsTestLaboratoryMutation,
  useSaveDiagnosticsTestMutation,
  useSaveDiagnosticsTestPathologyMutation,
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { GrTestDesktop } from 'react-icons/gr';
import { LuTestTubes } from 'react-icons/lu';
import Pathology from './Pathology';
import Radiology from './Radiology';
import MyButton from '@/components/MyButton/MyButton';
import {
  ApDiagnosticTestLaboratory,
  ApDiagnosticTestPathology,
  ApDiagnosticTestRadiology,
  ApDiagnosticTestSpecialPopulation
} from '@/types/model-types';
import {
  newApDiagnosticTestLaboratory,
  newApDiagnosticTestPathology,
  newApDiagnosticTestRadiology,
  newApDiagnosticTestSpecialPopulation
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import Laboratory from './Laboratory';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';
const AddEditDiagnosticTest = ({ open, setOpen, diagnosticsTest, setDiagnosticsTest, width ,handleSave}) => {
  const dispatch = useAppDispatch();
  const [diagnosticTestRadiology, setDiagnosticTestRadiology] = useState<ApDiagnosticTestRadiology>(
    { ...newApDiagnosticTestRadiology }
  );
  const [diagnosticTestPathology, setDiagnosticTestPathology] = useState<ApDiagnosticTestPathology>(
    { ...newApDiagnosticTestPathology }
  );
  const [diagnosticTestSpecialPopulation, setDiagnosticTestSpecialPopulation] = useState<ApDiagnosticTestSpecialPopulation>({ ...newApDiagnosticTestSpecialPopulation });
  const [diagnosticTestLaboratory, setDiagnosticTestLaboratory] = useState<ApDiagnosticTestLaboratory>({ ...newApDiagnosticTestLaboratory });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch diagnostics test type Lov response
  const { data: DiagnosticsTestTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_TEST-TYPES');
  const testType = useEnumOptions('TestType');
  // Fetch Currency Lov response
  const { data: CurrencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const Currency = useEnumOptions('Currency');
  // Fetch Gender Lov response
  const { data: GenderLovQueryResponse } = useGetLovValuesByCodeQuery('MEDICAL_GNDR');
  // Fetch Special Population Lov response
  const { data: SpecialPopulationLovQueryResponse } = useGetLovValuesByCodeQuery(
    'SPECIAL_POPULATION_GROUPS'
  );
  // Fetch Age Group Lov response
  const { data: AgeGroupLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_GROUPS');
  // save diagnostic test
  const [saveDiagnosticsTest, saveDiagnosticsTestMutation] = useSaveDiagnosticsTestMutation();
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

  // handle save basic information before navigate to details
  const handleSaveBasicInfo = async () => {
    try {
      const Response = await saveDiagnosticsTest({
        ...diagnosticsTest,
        createdBy: 'Administrator'
      }).unwrap();
      dispatch(notify('Saved Successfully'));
      setDiagnosticsTest({ ...Response });
    } catch (error) {
      console.error('Error saving diagnostics test:', error);
      dispatch(notify('Error saving diagnostics test'));
    }
    if (diagnosticsTest.testTypeLkey === null) {
      return null;
    }
  };

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
                  width="100%"
                  fieldName="currencyLkey"
                  fieldType="select"
                  selectData={CurrencyLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={diagnosticsTest}
                  setRecord={setDiagnosticsTest}
                />
                 <MyInput
                  width="%100%"
                  fieldLabel="Currency"
                  fieldType="select"
                  fieldName="currency"
                  selectData={Currency?? []}
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
                    width="100%"
                    fieldName="genderLkey"
                    fieldType="select"
                    selectData={GenderLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
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
                    selectData={AgeGroupLovQueryResponse?.object ?? []}
                    fieldType="checkPicker"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName=""
                    record=""
                    setRecord=""
                    menuMaxHeight={100}
                  />
                </div>
              )}
            </div>
            <br />
            <MyInput
              width="100%"
              fieldName="appointable"
              fieldType="checkbox"
              record={diagnosticsTest}
              setRecord={setDiagnosticsTest}
            />
          </Form>
        );
      case 1:
        return (
          handleShowComponent()
        );
    }
  };
  // Effects
  useEffect(() => {
    if (saveDiagnosticsTestMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDiagnosticsTestMutation.data]);

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
