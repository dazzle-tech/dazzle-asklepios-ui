import MyInput from '@/components/MyInput';
import { useGetPrescriptionInstructionQuery } from '@/services/medicationsSetupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Col, Dropdown, Form, Row } from 'rsuite';
import './styles.less';


const Instructions = ({
  prescriptionMedication,
  selectedOption,
  customeinst,
  setCustomeinst,
  selectedGeneric,
  setInst
}) => {
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: FrequencyLovQueryResponse } = useGetLovValuesByCodeQuery('MED_FREQUENCY');
  const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({
    ...initialListRequest
  });
  const [filteredList, setFilteredList] = useState([]);
  const [selectedPreDefine, setSelectedPreDefine] = useState(null);
  const [munial, setMunial] = useState(null);

  useEffect(() => {
    const newList = roaLovQueryResponse?.object?.filter(item =>
      selectedGeneric?.roaList?.includes(item.key)
    );
    setFilteredList(newList);
  }, [selectedGeneric]);
  useEffect(() => {
    if (selectedOption === '3010606785535008') {
      //Custome  Instruction
    } else if (selectedOption === '3010591042600262') {
      // Pre defined Instruction
      const t = predefinedInstructionsListResponse?.object?.find(
        item => item.key === prescriptionMedication.instructions
      );

      setSelectedPreDefine(t);
    } else if (selectedOption === '3010573499898196') {
      //Mnuil  Instruction
      setMunial(prescriptionMedication.instructions);
    }
  }, [selectedOption]);
  useEffect(() => {
    setInst(munial);
  }, [munial]);
  useEffect(() => {
    setInst(selectedPreDefine?.key);
  }, [selectedPreDefine]);
  return (
    <>
      {selectedOption === '3010606785535008' && (
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
              />
            </Col>
            <Col md={6}>
              <MyInput
                width={95}
                fieldType="select"
                fieldLabel="Frequency"
                selectData={FrequencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="frequency"
                record={customeinst}
                setRecord={setCustomeinst}
              />
            </Col>
            <Col md={6}>
              <MyInput
                width={95}
                fieldType="select"
                fieldLabel="ROA"
                selectData={filteredList ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="roa"
                record={customeinst}
                setRecord={setCustomeinst}
              />
            </Col>
          </Row>
        </Form>
      )}
      {selectedOption === '3010591042600262' && (
        <Form fluid layout="inline" className="fill-width-instructions">
          <Dropdown
            className="fill-width-instructions"
            title={
              !selectedPreDefine
                ? 'Pre-defined Instructions'
                : [
                    selectedPreDefine.dose,

                    selectedPreDefine.unitLvalue?.lovDisplayVale,
                    selectedPreDefine.routLvalue?.lovDisplayVale,
                    selectedPreDefine.frequencyLvalue?.lovDisplayVale
                  ]
                    .filter(Boolean)
                    .join(', ')
            }
          >
            {predefinedInstructionsListResponse &&
              predefinedInstructionsListResponse?.object?.map((item, index) => (
                <Dropdown.Item key={index} onClick={() => setSelectedPreDefine(item)}>
                  {[
                    item.dose,

                    item.unitLvalue?.lovDisplayVale,
                    item.routLvalue?.lovDisplayVale,
                    item.frequencyLvalue?.lovDisplayVale
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Dropdown.Item>
              ))}
          </Dropdown>
        </Form>
      )}
      {selectedOption === '3010573499898196' && (
        <Form fluid layout="inline" className="fill-width-instructions">
          <MyInput
            fieldName="munial"
            fieldType="textarea"
            record={{ munial }}
            setRecord={newRecord => setMunial(newRecord.munial)}
            showLabel={false}
            className='fill-width-instructions'
            width="100%"
            height={80}
            placeholder="Enter instructions..."
          />

        </Form>
      )}
    </>
  );
};
export default Instructions;
