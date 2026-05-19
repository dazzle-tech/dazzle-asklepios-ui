import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import React, { useMemo } from 'react';
import { Form } from 'rsuite';

import { useGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { formatEnumString } from '@/utils';

import { useGetPathologyByTestIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestPathologyService';
import { useGetLaboratoryByTestIdQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import { useGetRadiologyByTestIdQuery } from '@/services/setup/diagnosticTest/radiologyTestService';

import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';


const lovLabel = (lov?: any[], key?: any) =>
  lov?.find(i => String(i.key) === String(key))?.lovDisplayVale;

const prettifyLov = (v?: string) =>
  v
    ?.replace(/^_/, '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());


const TestCardModal = ({ test }: any) => {
  const testId = test?.id;


  const raw = test?.type;



  /* ================= DATA ================= */

  const { data: fullTest } = useGetDiagnosticTestByIdQuery(testId, { skip: !testId });

  const { data: lab } = useGetLaboratoryByTestIdQuery(testId, {
    skip: !testId || raw !== 'LABORATORY',
  });

  const { data: rad } = useGetRadiologyByTestIdQuery(testId, {
    skip: raw !== 'RADIOLOGY',
  });

  const { data: path } = useGetPathologyByTestIdQuery(testId, {
    skip: raw !== 'PATHOLOGY',
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

  const lovLabelSmart = (lov?: any[], value?: any) => {
    if (!lov || value == null) return ' ';

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
      sampleContainer: lovLabelSmart(
        sampleContainerLov?.object,
        lab.sampleContainer
      ),
      sampleVolumeUnit: lovLabelSmart(
        valueUnitLov?.object,
        lab.sampleVolumeUnit
      ),
      tubeColor: lovLabelSmart(tubeColorLov?.object, lab.tubeColor),
      tubeType: lovLabelSmart(tubeTypeLov?.object, lab.tubeType),

      timeUnit: lovLabelSmart(timeUnitLov?.object, lab.timeUnit),

      turnaroundTimeUnit: lovLabelSmart(
        timeUnitLov?.object,
        lab.turnaroundTimeUnit
      ),

      property: prettifyLov(
        lovLabelSmart(propertyLov?.object, lab.property)
      ),
      system: prettifyLov(
        lovLabelSmart(systemLov?.object, lab.system)
      ),
      scale: prettifyLov(
        lovLabelSmart(scaleLov?.object, lab.scale)
      ),
      method: prettifyLov(
        lovLabelSmart(methodLov?.object, lab.method)
      ),

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
        category: ' ',
        specimenType: ' ',
        analysisProcedure: ' ',
        timeUnit: ' ',
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

      analysisProcedure: path?.analysisProcedure ? formatEnumString(path.analysisProcedure) : "",

      timeUnit: lovLabel(
        timeUnitsLov?.object,
        path?.timeUnit
      ),
    };
  }, [
    path,
    pathologyCategoriesLov,
    specimenTypeLov,
    timeUnitsLov,
  ]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <div className="test-card-container">
        {raw === 'LABORATORY' && (
          <Form fluid>
            <SectionContainer title={<h4>{fullTest?.data?.name ?? <Translate>Diagnostic Test</Translate>}</h4>}
              content={
                <div className="test-card-main-container">
                  <MyInput fieldLabel="Category" fieldName="category" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Result Unit" fieldName="resultUnit" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Property" fieldName="property" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Timing" fieldName="timing" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="System" fieldName="system" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Scale" fieldName="scale" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Method" fieldName="method" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Reagents" fieldName="reagents" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Test Duration Time" fieldName="testDurationTime" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Time Unit" fieldName="timeUnit" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Turnaround Time" fieldName="turnaroundTime" record={labView} width={"11vw"} disabled/>
                  <MyInput fieldLabel="Turnaround Time Unit" fieldName="turnaroundTimeUnit" record={labView} width={"11vw"} disabled/>
                  <MyInput fieldLabel="Sample Container" fieldName="sampleContainer" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Sample Volume" fieldName="sampleVolume" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Sample Volume Unit" fieldName="sampleVolumeUnit" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Tube Color" fieldName="tubeColor" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Tube Type" fieldName="tubeType" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Test Description" fieldName="testDescription" fieldType="textarea" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Sample Handling" fieldName="sampleHandling" fieldType="textarea" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Preparation Requirements" fieldName="preparationRequirements" fieldType="textarea" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Medical Indications" fieldName="medicalIndications" fieldType="textarea" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Associated Risks" fieldName="associatedRisks" fieldType="textarea" record={labView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Test Instructions" fieldName="testInstructions" fieldType="textarea" record={labView} width={"11vw"} disabled />
                </div>}
            />
          </Form>
        )}

        {raw === 'RADIOLOGY' && (
          <Form fluid>
            <SectionContainer title={<h4>{fullTest?.data?.name ?? <Translate>Diagnostic Test</Translate>}</h4>}
              content={
                <div className="test-card-main-container">
                  <MyInput
                    fieldLabel="Category"
                    fieldName="category"
                    record={radView}
                    width={"11vw"}
                    disabled
                  />

                  <MyInput
                    fieldLabel="Image duration"
                    fieldName="imageDuration"
                    record={radView}
                    width={"11vw"}
                    disabled
                  />

                  <MyInput
                    fieldLabel="Turnaround time"
                    fieldName="turnaroundTime"
                    record={radView}
                    width={"11vw"}
                    disabled
                  />

                  <MyInput
                    fieldLabel="Time unit"
                    fieldName="turnaroundTimeUnit"
                    record={radView}
                    width={"11vw"}
                    disabled
                  />

                  <MyInput
                    fieldLabel="Medical Indications"
                    fieldName="medicalIndications"
                    fieldType="textarea"
                    record={radView}
                    width={"11vw"}
                    disabled
                  />

                  <MyInput
                    fieldLabel="Associated Risks"
                    fieldName="associatedRisks"
                    fieldType="textarea"
                    record={radView}
                    width={"11vw"}
                    disabled
                  />

                  <MyInput
                    fieldLabel="Test Instructions"
                    fieldName="testInstructions"
                    fieldType="textarea"
                    record={radView}
                    width={"11vw"}
                    disabled
                  />
                </div>}
            />
          </Form>
        )}


        {raw === 'PATHOLOGY' && (
          <Form fluid>
            <SectionContainer title={<h4>{fullTest?.data?.name ?? <Translate>Diagnostic Test</Translate>}</h4>}
              content={<>
                <div className="test-card-main-container">

                  <MyInput fieldLabel="Category" fieldName="category" record={pathView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Specimen Type" fieldName="specimenType" record={pathView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Analysis Procedure" fieldName="analysisProcedure" record={pathView} width={"11vw"} disabled />

                  <MyInput fieldLabel="Turnaround Time" fieldName="turnaroundTime" record={pathView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Time Unit" fieldName="timeUnit" record={pathView} width={"11vw"} disabled />
                </div>

                <div className="test-card-main-container">
                  <MyInput fieldLabel="Test Description" fieldName="testDescription" fieldType="textarea" record={pathView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Sample Handling" fieldName="sampleHandling" fieldType="textarea" record={pathView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Preparation Requirements" fieldName="preparationRequirements" fieldType="textarea" record={pathView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Medical Indications" fieldName="medicalIndications" fieldType="textarea" record={pathView} width={"11vw"} disabled />
                  <MyInput fieldLabel="Associated Risks" fieldName="associatedRisks" fieldType="textarea" record={pathView} width={"11vw"} disabled />

                </div>
              </>}
            />
          </Form>
        )}

      </div>
    </div>
  );
};

export default TestCardModal;
