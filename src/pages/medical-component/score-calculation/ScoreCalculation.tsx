import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
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
  width?: string | number;
  name?: string;
};

const ScoreCalculation: React.FC<ScoreCalculationProps> = ({
  record,
  setRecord,
  fields,
  scoreFieldName = 'aldreteScore',
  disabledAldrete = false,
  totalposition = 'start',
  width = '100%',
  name = 'Total Score'
}) => {
  const [lovMap, setLovMap] = useState<Record<string, any[]>>({});

  const lovHooks = fields.map(field => ({
    code: field.lovCode,
    hook: useGetLovValuesByCodeQuery(field.lovCode)
  }));

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

  return (
    <Form fluid layout="inline">
      {fields.map((field, idx) => (
        <MyInput
          key={idx}
          column
          width={width}
          fieldType="select"
          fieldName={field.fieldName}
          fieldLabel={field.label}
          selectData={lovMap[field.lovCode] ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />
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
        <MyInput
          column
          width={width}
          fieldType="number"
          fieldName={scoreFieldName}
          fieldLabel={name}
          record={record}
          setRecord={setRecord}
          disabled={disabledAldrete}
        />
      </div>
    </Form>
  );
};

export default ScoreCalculation;
