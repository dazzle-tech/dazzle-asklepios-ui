import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import './Style.less';

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
  disabledAldrete?: boolean;
  totalposition?: 'center' | 'start' | 'end';
  name?: string;
  fieldsPerRow?: number; 
};

const ScoreCalculation: React.FC<ScoreCalculationProps> = ({
  record,
  setRecord,
  fields,
  scoreFieldName = 'aldreteScore',
  disabledAldrete = false,
  totalposition = 'start',
  name = 'Total Score',
  fieldsPerRow = 2 
}) => {
  
  const [lovMap, setLovMap] = useState<Record<string, any[]>>({});

  const lovHooks = fields.map(field => ({
    code: field.lovCode,
    hook: useGetLovValuesByCodeQuery(field.lovCode)
  }));
  const colRef = useRef<HTMLDivElement>(null); 
  const [colWidthPx, setColWidthPx] = useState<number>(0);

  // Update LOV map when hooks change
  useEffect(() => {
    const map: Record<string, any[]> = {};
    lovHooks.forEach(({ code, hook }) => {
      if (hook.data?.object) {
        map[code] = hook.data.object;
      }
    });
    setLovMap(map);
  }, [lovHooks.map(h => h.hook.data?.object)]); // stable dependencies

  // Calculate score
  useEffect(() => {
    let score = 0;
    fields.forEach(field => {
      const list = lovMap[field.lovCode];
      if (list) {
        const item = list.find(x => x.key === record?.[field.fieldName]);
        if (item?.score) score += Number(item.score);
      }
    });
    setRecord(prev => ({ ...prev, [scoreFieldName]: score }));
  }, [fields.map(f => record?.[f.fieldName]).join('|'), lovMap]);

    useEffect(() => {
    if (colRef.current) {
      setColWidthPx(colRef.current.getBoundingClientRect().width);
    }
  }, []);

  return (
    <Form fluid >

      {Array.from({ length: Math.ceil(fields.length / fieldsPerRow) }).map((_, rowIndex) => (
    <Row gutter={15} key={rowIndex} style={{ marginBottom: 10 }} >
      {fields
        .slice(rowIndex * fieldsPerRow, rowIndex * fieldsPerRow + fieldsPerRow)
        .map((field, idx) => (
          <Col
            ref={rowIndex === 0 && idx === 0 ? colRef : undefined}
            md={Math.floor(24 / fieldsPerRow)}
            key={field.fieldName}
          >
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
    </Row>
  ))}
    
      <div
        className={
          totalposition === 'center'
            ? 'input-center'
            : totalposition === 'end'
            ? 'input-end'
            : 'input-start'
        }
      >
      <Col md={Math.floor(24 / fieldsPerRow)}>
      <MyInput
       
          width="100%"
          fieldType="number"
          fieldName={scoreFieldName}
          fieldLabel={name}
          record={record}
          setRecord={setRecord}
          disabled={disabledAldrete}
        />
      </Col>
        
      </div>
    </Form>
  );
};

export default ScoreCalculation;
