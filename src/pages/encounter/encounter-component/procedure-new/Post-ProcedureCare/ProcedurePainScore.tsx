import FacesSlider from '@/components/FacesSlider';
import MyInput from '@/components/MyInput';
import NumericSlider from '@/components/NumericSlider';
import { getPainTrackColor } from '@/components/NumericSlider/getPainTrackColor';
import SectionContainer from '@/components/SectionsoContainer';
import { useEnumOptions } from '@/services/enumsApi';
import React from 'react';
import { Form, Text } from 'rsuite';

const MIN_LEVEL = 0;
const MAX_LEVEL = 10;
// FLACC keeps its own record per encounter, so it does not apply here
const EXCLUDED_TYPES = ['FLACC'];

type ProcedurePainScoreProps = {
  record: any;
  setRecord: (record: any) => void;
};

/** The sliders of the encounter pain assessment, stored on the procedure's post care. */
const ProcedurePainScore: React.FC<ProcedurePainScoreProps> = ({ record, setRecord }) => {
  const painAssessmentTypes = useEnumOptions('PainAssessmentTypes', { exclude: EXCLUDED_TYPES });

  const painLevel = Number(record?.painScore) || MIN_LEVEL;
  const setPainLevel = (value: number) => setRecord({ ...record, painScore: String(value) });

  return (
    <SectionContainer
      title={<Text>Pain Assessment</Text>}
      content={
        <Form fluid>
          <MyInput
            width="100%"
            fieldType="select"
            fieldLabel="Pain Assessment Type"
            selectData={painAssessmentTypes ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            fieldName="painAssessmentType"
            record={record}
            setRecord={setRecord}
            searchable={false}
          />
          {record?.painAssessmentType === 'NUMERIC' && (
            <NumericSlider
              label="Pain Level"
              value={painLevel}
              min={MIN_LEVEL}
              max={MAX_LEVEL}
              getTrackColor={getPainTrackColor}
              onChange={setPainLevel}
            />
          )}
          {record?.painAssessmentType === 'FACES' && (
            <FacesSlider
              title={`Pain Level (${painLevel}-${MAX_LEVEL})`}
              value={painLevel}
              getTrackColor={getPainTrackColor}
              onChange={setPainLevel}
            />
          )}
          <MyInput
            width="100%"
            fieldType="textarea"
            fieldName="painDescription"
            record={record}
            setRecord={setRecord}
          />
        </Form>
      }
    />
  );
};

export default ProcedurePainScore;
