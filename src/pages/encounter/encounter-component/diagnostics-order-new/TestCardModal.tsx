import React, { useMemo } from 'react';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';

import { useGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import { useGetLaboratoryByTestIdQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import { useGetRadiologyByTestIdQuery } from '@/services/setup/diagnosticTest/radiologyTestService';
import { useGetPathologyByTestIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestPathologyService';

import './styles.less';


const lovLabel = (lov?: any[], key?: any) =>
  lov?.find(i => String(i.key) === String(key))?.lovDisplayVale ?? '—';

const prettifyLov = (v?: string) =>
  v
    ?.replace(/^_/, '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());


const TestCardModal = ({ test }: any) => {
  const testId = test?.id;

  /* -------- Resolve test type -------- */
  const resolvedType = useMemo(() => {
    const raw =
      test?.type ??
      test?.testType ??
      test?.testTypeLvalue?.valueCode ??
      test?.testTypeLkey ??
      null;

    if (!raw) return null;
    if (raw === '862810597620632') return 'LABORATORY';
    if (raw === '862828331135792') return 'RADIOLOGY';
    if (raw === '862842242812880') return 'PATHOLOGY';
    return raw;
  }, [test]);

  /* ================= DATA ================= */

  const { data: fullTest } = useGetDiagnosticTestByIdQuery(testId, { skip: !testId });

  const { data: lab } = useGetLaboratoryByTestIdQuery(testId, {
    skip: resolvedType !== 'LABORATORY',
  });

  const { data: rad } = useGetRadiologyByTestIdQuery(testId, {
    skip: resolvedType !== 'RADIOLOGY',
  });

  const { data: path } = useGetPathologyByTestIdQuery(testId, {
    skip: resolvedType !== 'PATHOLOGY',
  });

  const { data: propertyLov } = useGetLovValuesByCodeQuery('LAB_PROPERTIES');
  const { data: systemLov } = useGetLovValuesByCodeQuery('LAB_SYSTEMS');
  const { data: scaleLov } = useGetLovValuesByCodeQuery('LAB_SCALES');
  const { data: methodLov } = useGetLovValuesByCodeQuery('LAB_METHODS');
  const { data: categoriesLov } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  const { data: reagentsLov } = useGetLovValuesByCodeQuery('LAB_REAGENTS');
  const { data: timeUnitLov } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: sampleContainerLov } = useGetLovValuesByCodeQuery('LAB_SAMPLE_CONTAINER');
  const { data: tubeColorLov } = useGetLovValuesByCodeQuery('LAB_TUBE_COLORS');
  const { data: tubeTypeLov } = useGetLovValuesByCodeQuery('LAB_TUBE_TYPES');
  const { data: radCategoriesLov } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');
  const { data: radReagentsLov } = useGetLovValuesByCodeQuery('RAD_REAGENTS');
  const { data: timeUnitsLov } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: pathologyCategoriesLov } =
    useGetLovValuesByCodeQuery('MED_CATEGORY');
  const { data: specimenTypeLov } =
    useGetLovValuesByCodeQuery('LAB_SPECIMENS');
  const { data: analysisProcedureLov } =
    useGetLovValuesByCodeQuery('PROCEDURE_CAT');

  const lovLabelSmart = (lov?: any[], value?: any) => {
    if (!lov || value == null) return '—';

    return (
      lov.find(i => String(i.key) === String(value))?.lovDisplayVale ??
      lov.find(i => String(i.valueCode) === String(value))?.lovDisplayVale ??
      value
    );
  };

  const labView = useMemo(() => {
    if (!lab) return {};

    return {
      ...lab,

      category: lovLabelSmart(categoriesLov?.object, lab.category),
      resultUnit: lovLabelSmart(valueUnitLov?.object, lab.resultUnit),
      reagents: lovLabelSmart(reagentsLov?.object, lab.reagents),
      sampleContainer: lovLabelSmart(sampleContainerLov?.object, lab.sampleContainer),
      sampleVolumeUnit: lovLabelSmart(valueUnitLov?.object, lab.sampleVolumeUnit),
      tubeColor: lovLabelSmart(tubeColorLov?.object, lab.tubeColor),
      tubeType: lovLabelSmart(tubeTypeLov?.object, lab.tubeType),
      timeUnit: lovLabelSmart(timeUnitLov?.object, lab.timeUnit),
      property: prettifyLov(lovLabelSmart(propertyLov?.object, lab.property)),
      system: prettifyLov(lovLabelSmart(systemLov?.object, lab.system)),
      scale: prettifyLov(lovLabelSmart(scaleLov?.object, lab.scale)),
      method: prettifyLov(lovLabelSmart(methodLov?.object, lab.method)),

      timing: prettifyLov(lab.timing),
    };
  }, [
    lab,
    categoriesLov,
    valueUnitLov,
    reagentsLov,
    sampleContainerLov,
    tubeColorLov,
    tubeTypeLov,
    timeUnitLov,
    propertyLov,
    systemLov,
    scaleLov,
    methodLov,
  ]);



  const radView = useMemo(() => {
    if (!rad) return {};

    return {
      ...rad,
      category: lovLabel(radCategoriesLov?.object, rad.category),
      turnaroundTimeUnit: lovLabel(timeUnitsLov?.object, rad.turnaroundTimeUnit),
      turnaroundTime: rad.turnaroundTime,
      imageDuration: rad.imageDuration,
    };
  }, [rad, radCategoriesLov, timeUnitsLov]);

  const pathView = useMemo(() => {
    if (!path) {
      return {
        category: '—',
        specimenType: '—',
        analysisProcedure: '—',
        timeUnit: '—',
      };
    }

    return {
      ...path,

      category: lovLabel(
        pathologyCategoriesLov?.object,
        path?.category
      ),

      specimenType: lovLabel(
        specimenTypeLov?.object,
        path?.specimenType
      ),

      analysisProcedure: path?.analysisProcedure
        ? lovLabel(
          analysisProcedureLov?.object,
          path.analysisProcedure
        )
        : '—',

      timeUnit: lovLabel(
        timeUnitsLov?.object,
        path?.timeUnit
      ),
    };
  }, [
    path,
    pathologyCategoriesLov,
    specimenTypeLov,
    analysisProcedureLov,
    timeUnitsLov,
  ]);

  return (
    <div className="test-card-container">
      {/* ===== HEADER ===== */}
      <div className="test-card-header">
        <h4>{fullTest?.data?.name ?? <Translate>Diagnostic Test</Translate>}</h4>
      </div>

      {resolvedType === 'LABORATORY' && (
        <Form fluid>
          <div className="test-card-main-container">
            <MyInput fieldLabel="Category" fieldName="category" record={labView} disabled />
            <MyInput fieldLabel="Result Unit" fieldName="resultUnit" record={labView} disabled />
            <MyInput fieldLabel="Property" fieldName="property" record={labView} disabled />
            <MyInput fieldLabel="Timing" fieldName="timing" record={labView} disabled />
            <MyInput fieldLabel="System" fieldName="system" record={labView} disabled />
            <MyInput fieldLabel="Scale" fieldName="scale" record={labView} disabled />
            <MyInput fieldLabel="Method" fieldName="method" record={labView} disabled />
            <MyInput fieldLabel="Reagents" fieldName="reagents" record={labView} disabled />
            <MyInput fieldLabel="Test Duration Time" fieldName="testDurationTime" record={labView} disabled />
            <MyInput fieldLabel="Time Unit" fieldName="timeUnit" record={labView} disabled />
            <MyInput fieldLabel="Sample Container" fieldName="sampleContainer" record={labView} disabled />
            <MyInput fieldLabel="Sample Volume" fieldName="sampleVolume" record={labView} disabled />
            <MyInput fieldLabel="Sample Volume Unit" fieldName="sampleVolumeUnit" record={labView} disabled />
            <MyInput fieldLabel="Tube Color" fieldName="tubeColor" record={labView} disabled />
            <MyInput fieldLabel="Tube Type" fieldName="tubeType" record={labView} disabled />
            <MyInput fieldLabel="Test Description" fieldName="testDescription" fieldType="textarea" record={labView} disabled />
            <MyInput fieldLabel="Sample Handling" fieldName="sampleHandling" fieldType="textarea" record={labView} disabled />
            <MyInput fieldLabel="Preparation Requirements" fieldName="preparationRequirements" fieldType="textarea" record={labView} disabled />
            <MyInput fieldLabel="Medical Indications" fieldName="medicalIndications" fieldType="textarea" record={labView} disabled />
            <MyInput fieldLabel="Associated Risks" fieldName="associatedRisks" fieldType="textarea" record={labView} disabled />
            <MyInput fieldLabel="Test Instructions" fieldName="testInstructions" fieldType="textarea" record={labView} disabled />
          </div>
        </Form>
      )}

      {resolvedType === 'RADIOLOGY' && (
        <Form fluid>
          <div className="test-card-main-container">
            <MyInput
              fieldLabel="Category"
              fieldName="category"
              record={radView}
              disabled
            />

            <MyInput
              fieldLabel="Image duration"
              fieldName="imageDuration"
              record={radView}
              disabled
            />

            <MyInput
              fieldLabel="Turnaround time"
              fieldName="turnaroundTime"
              record={radView}
              disabled
            />

            <MyInput
              fieldLabel="Time unit"
              fieldName="turnaroundTimeUnit"
              record={radView}
              disabled
            />

            <MyInput
              fieldLabel="Medical Indications"
              fieldName="medicalIndications"
              fieldType="textarea"
              record={radView}
              disabled
            />

            <MyInput
              fieldLabel="Associated Risks"
              fieldName="associatedRisks"
              fieldType="textarea"
              record={radView}
              disabled
            />

            <MyInput
              fieldLabel="Test Instructions"
              fieldName="testInstructions"
              fieldType="textarea"
              record={radView}
              disabled
            />
          </div>
        </Form>
      )}


      {resolvedType === 'PATHOLOGY' && (
        <Form fluid>
          <div className="test-card-main-container">

            <MyInput fieldLabel="Category" fieldName="category" record={pathView} disabled />
            <MyInput fieldLabel="Specimen Type" fieldName="specimenType" record={pathView} disabled />
            <MyInput fieldLabel="Analysis Procedure" fieldName="analysisProcedure" record={pathView} disabled />

            <MyInput fieldLabel="Turnaround Time" fieldName="turnaroundTime" record={pathView} disabled />
            <MyInput fieldLabel="Time Unit" fieldName="timeUnit" record={pathView} disabled />
          </div>

          <div className="test-card-main-container">
            <MyInput fieldLabel="Test Description" fieldName="testDescription" fieldType="textarea" record={pathView} disabled />
            <MyInput fieldLabel="Sample Handling" fieldName="sampleHandling" fieldType="textarea" record={pathView} disabled />
            <MyInput fieldLabel="Preparation Requirements" fieldName="preparationRequirements" fieldType="textarea" record={pathView} disabled />
            <MyInput fieldLabel="Medical Indications" fieldName="medicalIndications" fieldType="textarea" record={pathView} disabled />
            <MyInput fieldLabel="Associated Risks" fieldName="associatedRisks" fieldType="textarea" record={pathView} disabled />

          </div>
        </Form>
      )}

    </div>
  );
};

export default TestCardModal;
