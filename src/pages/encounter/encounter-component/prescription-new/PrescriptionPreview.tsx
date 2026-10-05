import React from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import { Form, Input, Text } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetBrandMedicationByIdQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useEnumOptions } from '@/services/enumsApi';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch';
import ActiveIngrediantList from './ActiveIngredient';

const PrescriptionPreview = ({ orderMedication }) => {
  const record = orderMedication ?? {};
  const noop = () => {};

  // FETCH ALL LOV HERE (same as DetailsModal)
  const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
  const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
  const { data: administrationInstructionsLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: frequencyLovQueryResponse } = useGetLovValuesByCodeQuery('MED_FREQUENCY');

  // Fetch medication data
  const medId = record?.medicationsId ?? record?.genericMedicationsId;
  const { data: medicationData } = useGetBrandMedicationByIdQuery(medId, {
    skip: !medId
  });

  // Fetch custom instructions
  const { data: customeInstructions } = useGetCustomeInstructionsQuery({
    ...({} as any)
  });

  // Fetch predefined instructions
  const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const instructionTypeOptions = useEnumOptions('PrescriptionInstructionsType');

  const getLov = (lovRes, key) => {
    const item = lovRes?.object?.find(x => x.key === key);
    return item?.lovDisplayVale ?? '';
  };

  // Get instruction type display
  const getInstructionTypeDisplay = () => {
    if (!record?.instructionsType) return '';
    const option = instructionTypeOptions?.find(opt => opt.value === record.instructionsType);
    return (
      option?.label ??
      record.instructionsTypeLvalue?.lovDisplayVale ??
      record.instructionsType ??
      ''
    );
  };

  // Get instructions display based on type
  const getInstructionsDisplay = () => {
    if (!record?.instructionsType) return '';

    const OPTION_CUSTOM = 'CUSTOM_INSTRUCTIONS';
    const OPTION_PREDEFINED = 'PRE_DEFINED_INSTRUCTIONS';
    const OPTION_MANUAL = 'MANUAL_INSTRUCTIONS';

    if (record.instructionsType === OPTION_PREDEFINED) {
      const predefined = predefinedInstructionsListResponse?.data?.find(
        (item: any) => item.id === Number(record.instructions)
      );
      if (predefined) {
        return [
          predefined.dose,
          predefined.unitLvalue?.lovDisplayVale,
          predefined.routLvalue?.lovDisplayVale,
          predefined.frequencyLvalue?.lovDisplayVale
        ]
          .filter(Boolean)
          .join(', ');
      }
      return record.instructions || '';
    }

    if (record.instructionsType === OPTION_MANUAL) {
      return record.instructions || '';
    }

    if (record.instructionsType === OPTION_CUSTOM) {
      const custom = customeInstructions?.object?.find(
        (item: any) => item.prescriptionMedicationsKey === record.key
      );
      if (custom) {
        return [
          custom.dose,
          conjureValueBasedOnKeyFromList(
            unitLovQueryResponse?.object ?? [],
            custom.unitLkey,
            'lovDisplayVale'
          ),
          conjureValueBasedOnKeyFromList(
            frequencyLovQueryResponse?.object ?? [],
            custom.frequencyLkey,
            'lovDisplayVale'
          ),
          custom.roaLvalue?.lovDisplayVale
        ]
          .filter(Boolean)
          .join(', ');
      }
      // Fallback to record fields
      return [
        record.dose,
        conjureValueBasedOnKeyFromList(
          unitLovQueryResponse?.object ?? [],
          record.doesUnit,
          'lovDisplayVale'
        ),
        conjureValueBasedOnKeyFromList(
          frequencyLovQueryResponse?.object ?? [],
          record.frequency,
          'lovDisplayVale'
        ),
        record.rout
      ]
        .filter(Boolean)
        .join(', ');
    }

    return '';
  };

  // Get administration instructions display - handle multiple values
  const getAdministrationInstructionsDisplay = () => {
    if (!record?.administrationInstructions) return '';

    // Handle array of values
    if (Array.isArray(record.administrationInstructions)) {
      return record.administrationInstructions
        .map(key => {
          const display = conjureValueBasedOnKeyFromList(
            administrationInstructionsLovQueryResponse?.object ?? [],
            key,
            'lovDisplayVale'
          );
          return display || String(key);
        })
        .filter(Boolean)
        .join('\n');
    }

    // Handle comma-separated string
    if (typeof record.administrationInstructions === 'string') {
      const keys = record.administrationInstructions
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return keys
        .map(key => {
          const display = conjureValueBasedOnKeyFromList(
            administrationInstructionsLovQueryResponse?.object ?? [],
            key,
            'lovDisplayVale'
          );
          return display || key;
        })
        .filter(Boolean)
        .join('\n');
    }

    // Handle single value
    const display = conjureValueBasedOnKeyFromList(
      administrationInstructionsLovQueryResponse?.object ?? [],
      record.administrationInstructions,
      'lovDisplayVale'
    );

    if (display) return display;

    // Fallback: try administrationInstructionsLvalue if it exists
    if (record?.administrationInstructionsLvalue?.lovDisplayVale) {
      return record.administrationInstructionsLvalue.lovDisplayVale;
    }

    return '';
  };
  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="prescription-preview-container" dir={dir}>
      <SectionContainer
        title={<Text className="font-style">Active Ingredients</Text>}
        content={<ActiveIngrediantList selectedGeneric={medId ?  medId : null} activeIngredientId={orderMedication.activeIngredientId} />}
      />

      <SectionContainer
        title={<Text className="font-style">Prescription Details</Text>}
        content={
          <Form fluid>
            {/* Medication Name */}
            <div className="prescription-full-block">
              <MyInput
                disabled
                width="100%"
                fieldType="text"
                fieldLabel="Medication"
                record={{ medicationName: medicationData?.name || '' }}
                fieldName="medicationName"
                setRecord={noop}
              />
            </div>

            {/* Instruction Type */}
            <div className="prescription-full-block">
              <MyInput
                disabled
                width="100%"
                fieldType="text"
                fieldLabel="Instruction Type"
                record={{ instructionTypeText: getInstructionTypeDisplay() }}
                fieldName="instructionTypeText"
                setRecord={noop}
              />
            </div>

            {/* Instructions */}
            <div className="prescription-full-block">
              <MyInput
                disabled
                width="100%"
                fieldType="textarea"
                height={60}
                fieldLabel="Instructions"
                record={{ instructionsText: getInstructionsDisplay() }}
                fieldName="instructionsText"
                setRecord={noop}
              />
            </div>

            <div className="prescription-medication-form-row">
              <div className="prescription-full-block">
                <div className="prescription-inputs-inline">
                  <MyInput
                    disabled
                    width={120}
                    fieldType="number"
                    fieldLabel="Duration"
                    fieldName="duration"
                    record={record}
                    setRecord={noop}
                  />

                  <MyInput
                    disabled
                    width={142}
                    fieldType="text"
                    fieldLabel="Duration Type"
                    record={{
                      durationTypeText: getLov(DurationTypeLovQueryResponse, record.durationType)
                    }}
                    fieldName="durationTypeText"
                    setRecord={noop}
                  />

                  <MyInput
                    disabled
                    width={120}
                    fieldType="checkbox"
                    fieldLabel="Chronic Medication"
                    fieldName="chronicMedication"
                    record={record}
                    setRecord={noop}
                  />
                </div>
              </div>

              {/* BLOCK 2 */}
              <div className="prescription-full-block">
                <div className="prescription-inputs-inline">
                  <MyInput
                    disabled
                    width={120}
                    fieldType="number"
                    fieldLabel="Maximum Dose"
                    fieldName="maximumDose"
                    record={record}
                    setRecord={noop}
                  />

                  <div style={{ marginBottom: '1.5vw' }}>
                    <MyInput
                      disabled
                      width={160}
                      fieldType="checkbox"
                      fieldLabel="Brand Substitute Allowed"
                      fieldName="genericSubstitute"
                      record={record}
                      setRecord={noop}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Form>
        }
      />

      <SectionContainer
        title={<Text className="font-style">Indication Details</Text>}
        content={
          <Form fluid>
            <div className="prescription-indication-blocks">
              {/* ICD-10 Section - Full Width at Top */}
              <div className="indication-icd-section">
                <div className="indication-icd-label-wrapper">
                  <Text className="indication-icd-label">
                    ICD-10
                    <span className="required-asterisk">*</span>
                  </Text>
                </div>
                <Icd10DiagnosisSearch
                  diagnosisId={(record.indicationIcd as any) ?? null}
                  setDiagnosisId={noop}
                  label=""
                  disabled={true}
                />
              </div>

              {/* Other Fields Section - Two Columns Below */}
              <div className="indication-other-fields-row">
                {/* Indication Use */}
                <div className="indication-field">
                  <MyInput
                    disabled
                    width="16vw"
                    fieldType="text"
                    showLabel={true}
                    fieldLabel="Indication Use"
                    record={{
                      indicationUseText:
                        getLov(indicationLovQueryResponse, record.indicationUse) ||
                        record.indicationUseLvalue?.lovDisplayVale ||
                        ''
                    }}
                    fieldName="indicationUseText"
                    setRecord={noop}
                  />
                  {/* Manual Indication - Free Text Field (under Indication Use) */}
                  <Input
                    as="textarea"
                    rows={4}
                    readOnly
                    value={record?.indicationManually || ''}
                    className="indication-manual-textarea"
                    placeholder="Indication"
                  />
                </div>

                {/* Administration Instructions */}
                <div className="indication-field indication-field-admin">
                  <MyInput
                    disabled
                    width="16vw"
                    fieldType="text"
                    fieldLabel="Administration Instructions"
                    record={{
                      administrationInstructionsText: getAdministrationInstructionsDisplay()
                    }}
                    fieldName="administrationInstructionsText"
                    setRecord={noop}
                  />
                  <Input
                    as="textarea"
                    rows={4}
                    readOnly
                    value={getAdministrationInstructionsDisplay()}
                    className="indication-display-field"
                    placeholder="No selection"
                  />
                </div>
              </div>
            </div>
          </Form>
        }
      />

      {/* ---------------- Refills ---------------- */}
      <SectionContainer
        title={<Text className="font-style">Refills and Parameters to Monitor</Text>}
        content={
          <Form fluid>
            <MyTagInput tags={record.parametersToMonitor?.split(',') ?? []} setTags={noop} disabled/>

          
          </Form>
        }
      />

      {/* ---------------- Notes ---------------- */}
      <SectionContainer
        title={<Text className="font-style">Notes</Text>}
        content={
          <Form fluid>
            <div className="prescription-full-block">
              <MyInput
                disabled
                width="100%"
                fieldType="textarea"
                height={60}
                fieldLabel="Notes"
                record={{ notesPreview: record.notes || '' }}
                fieldName="notesPreview"
                setRecord={noop}
              />
            </div>

            <div className="prescription-full-block">
              <MyInput
                disabled
                width="100%"
                fieldType="textarea"
                height={60}
                fieldLabel="Extra Documentation"
                record={{ extraDocumentationPreview: record.extraDocumentation || '' }}
                fieldName="extraDocumentationPreview"
                setRecord={noop}
              />
            </div>
          </Form>
        }
      />
    </div>
  );
};

export default PrescriptionPreview;
