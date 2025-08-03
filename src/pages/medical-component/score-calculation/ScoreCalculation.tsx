import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';

type ScoreFieldConfig = {
  fieldName: string;
  lovCode: string;
  label?: string;
};

type ScoreCalculationProps = {
  record: any;
  setRecord: React.Dispatch<React.SetStateAction<any>>;
  fields: ScoreFieldConfig[];
  scoreFieldName?: string;
};

const ScoreCalculation: React.FC<ScoreCalculationProps> = ({ record, setRecord, fields ,scoreFieldName}) => {
  const [lovMap, setLovMap] = useState<Record<string, any[]>>({});
  // This component calculates a score based on selected fields and their corresponding values from a list of values (lov)
// Define the fields to be used in the score calculation
  // Each field has a name, a code for the list of values (lovCode), and an optional label
  // This allows for dynamic configuration of the score calculation fields
  const lovHooks = fields.map(field => ({
    code: field.lovCode,
    hook: useGetLovValuesByCodeQuery(field.lovCode),
  }));


  // Create a map of list of values (lov) for each field code
  // This map will be used to look up the values for each field when calculating the score
  // The map is updated whenever the data for any of the lov codes changes

  useEffect(() => {
    const map: Record<string, any[]> = {};
    lovHooks.forEach(({ code, hook }) => {
      if (hook.data?.object) {
        map[code] = hook.data.object;
      }
    });
    setLovMap(map);
  }, [lovHooks.map(h => h.hook.data?.object).join('|')]);

  // Calculate the score based on the selected values for each field
  // The score is the sum of the scores of the selected values for each field
  useEffect(() => {
    let score = 0;
    fields.forEach(field => {
      const list = lovMap[field.lovCode];
      if (list) {
        const item = list.find(x => x.key === record?.[field.fieldName]);
        if (item?.score) score += item.score;
      }
    });
    setRecord(prev => ({ ...prev, [scoreFieldName]: score }));
  }, [fields.map(f => record?.[f.fieldName]).join('|'), JSON.stringify(lovMap)]);

  return (
    <Row gutter={15} className="rows-gap">
      <Form fluid>
        {fields.map((field, idx) => (
          <Col md={12} key={idx}>
            <MyInput
              width="100%"
              fieldType="select"
              fieldName={field.fieldName}
              fieldLabel={field.label}
              selectData={lovMap[field.lovCode] ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={record}
              setRecord={setRecord}
            />
          </Col>
        ))}
        <Col md={12}>
          <MyInput
            width="100%"
            fieldType="number"
            fieldName={scoreFieldName ?? 'aldreteScore'}
            record={record}
            setRecord={setRecord}
          />
        </Col>
      </Form>
    </Row>
  );
};

export default ScoreCalculation;
