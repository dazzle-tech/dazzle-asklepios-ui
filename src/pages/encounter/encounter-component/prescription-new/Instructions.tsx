import MyInput from '@/components/MyInput';
import React, { useEffect, useMemo, useState } from 'react';
import { Col, Dropdown, Form, Row } from 'rsuite';
import './styles.less';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useEnumOptions } from '@/services/enumsApi';

const OPTION_CUSTOM = 'CUSTOM_INSTRUCTIONS';
const OPTION_PREDEFINED = 'PRE_DEFINED_INSTRUCTIONS';
const OPTION_MANUAL = 'MANUAL_INSTRUCTIONS';


/* ---------- helpers ---------- */
const toTitleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());


const buildInstructionTitle = (inst?: any) =>
  !inst
    ? 'Pre-defined Instructions'
    : [inst.dose, inst.unit, inst.rout, inst.frequency]
        .filter(Boolean)
        .join(', ');

/* ---------- component ---------- */
const Instructions = ({
  prescriptionMedication,
  selectedOption,
  customeinst,
  setCustomeinst,
  selectedGeneric,
  setInst
}: any) => {
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: frequencyLovQueryResponse } = useGetLovValuesByCodeQuery('MED_FREQUENCY');

  const { data: predefinedInstructionsListResponse } =
    useGetAllPrescriptionInstructionsQuery({
      page: 0,
      size: 1000,
      sort: 'id,asc'
    });

  const [selectedPreDefine, setSelectedPreDefine] = useState<any>(null);
  const [manual, setManual] = useState<string | null>(null);
   
  /* ---------- ROA options ---------- */
  const roaOptions= useEnumOptions("RouteOfAdministration");

  /* ---------- option change handling ---------- */
  useEffect(() => {
    if (selectedOption === OPTION_CUSTOM) {
      setSelectedPreDefine(null);
      setManual(null);
      return;
    }

    if (selectedOption === OPTION_PREDEFINED) {
      const found = predefinedInstructionsListResponse?.data?.find(
        (item: any) => item.id === Number(prescriptionMedication?.instructions)
      );
      setSelectedPreDefine(found ?? null);
      setManual(null);
      return;
    }

    if (selectedOption === OPTION_MANUAL) {
      setManual(prescriptionMedication?.instructions ?? null);
      setSelectedPreDefine(null);
    }
  }, [
    selectedOption,
    predefinedInstructionsListResponse?.data,
    prescriptionMedication?.instructions
  ]);

  /* ---------- push value to parent ---------- */
  useEffect(() => {
    if (selectedOption === OPTION_MANUAL) setInst(manual);
  }, [manual, selectedOption, setInst]);

  useEffect(() => {
    if (selectedOption === OPTION_PREDEFINED) setInst(selectedPreDefine?.id);
  }, [selectedPreDefine, selectedOption, setInst]);

// useEffect(() => {
//   if (selectedOption !== OPTION_CUSTOM) return;

//   if (!roaOptions.length) return;

//   setCustomeinst((prev: any) => {
//     const current = String(prev?.roa ?? '').trim();
//     const stillValid = current && roaOptions.some(o => o.value === current);
//     if (stillValid) return prev;

//     return { ...prev, roa: roaOptions };
//   });
// }, [selectedOption, roaOptions, setCustomeinst]);

      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      {/* -------- Custom Instruction -------- */}
      {selectedOption === OPTION_CUSTOM && (
        <Form fluid layout="inline">
          <Row gutter={16}>
            <Col md={6}>
              <MyInput
                width={95}
                fieldType="number"
                fieldName="dose"
                fieldLabel="Dose"
                record={customeinst}
                setRecord={setCustomeinst}
                required={true}
              />
            </Col>

            <Col md={6}>
              <MyInput
                width={95}
                fieldType="select"
                fieldLabel="Unit"
                selectData={unitLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="unit"
                record={customeinst}
                setRecord={setCustomeinst}
                required={true}
              />
            </Col>

            <Col md={6}>
              <MyInput
                width={95}
                fieldType="select"
                fieldLabel="Frequency"
                selectData={frequencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="frequency"
                record={customeinst}
                setRecord={setCustomeinst}
                required={true}
              />
            </Col>

            <Col md={6}>
              <MyInput
                width={95}
                fieldType="select"
                fieldLabel="ROA"
                selectData={roaOptions}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="roa"
                record={customeinst}
                setRecord={setCustomeinst}
                required={true}
              />
            </Col>
          </Row>
        </Form>
      )}

      {/* -------- Predefined Instruction -------- */}
      {selectedOption === OPTION_PREDEFINED && (
        <Form fluid layout="inline" className="fill-width-instructions">
          <div style={{ marginBottom: 6 }}>
            <span>
              Pre-defined Instructions <span style={{ color: 'red' }}>*</span>
            </span>
          </div>
          <Dropdown
            className="fill-width-instructions"
            title={buildInstructionTitle(selectedPreDefine)}
          >
            {predefinedInstructionsListResponse?.data?.map((item: any) => (
              <Dropdown.Item
                key={item.id}
                onClick={() => setSelectedPreDefine(item)}
              >
                {[item.dose, item.unit, item.rout, item.frequency]
                  .filter(Boolean)
                  .join(', ')}
              </Dropdown.Item>
            ))}
          </Dropdown>
        </Form>
      )}

      {/* -------- Manual Instruction -------- */}
      {selectedOption === OPTION_MANUAL && (
        <Form fluid layout="inline" className="fill-width-instructions">
          <MyInput
            fieldName="manual"
            fieldType="textarea"
            fieldLabel="Manual Instructions"
            record={{ manual }}
            setRecord={(newRecord: any) => setManual(newRecord.manual)}
            className="fill-width-instructions"
            width="100%"
            height={80}
            placeholder="Enter instructions..."
            required={true}
          />
        </Form>
      )}
    </div>
  );
};

export default Instructions;
