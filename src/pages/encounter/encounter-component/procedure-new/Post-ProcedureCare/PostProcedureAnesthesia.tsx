import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useSortedLovQuery } from '../useSortedLovQuery';
import React, { useEffect } from 'react';
import { Col, Form, Row, Text } from 'rsuite';

type AnesthesiaProps = {
  record: any;
  setRecord: (record: any) => void;
};

const scoreOf = (response: any, value: string) =>
  response?.object?.find((item: any) => item.lovDisplayVale === value)?.score || 0;

const PostProcedureAnesthesia: React.FC<AnesthesiaProps> = ({ record, setRecord }) => {
  const { data: oxsatQueryResponse } = useSortedLovQuery('ALDRETE_OXSAT');
  const { data: conscLovQueryResponse } = useSortedLovQuery('ALDRETE_CONSC');
  const { data: circuLovQueryResponse } = useSortedLovQuery('ALDRETE_CIRCU');
  const { data: respirLovQueryResponse } = useSortedLovQuery('ALDRETE_RESPIR');
  const { data: activityLovQueryResponse } = useSortedLovQuery('ALDRETE_ACTIVITY');

  useEffect(() => {
    const aldreteScore =
      scoreOf(oxsatQueryResponse, record?.oxygenSaturationLevel) +
      scoreOf(conscLovQueryResponse, record?.consciousness) +
      scoreOf(circuLovQueryResponse, record?.circulation) +
      scoreOf(respirLovQueryResponse, record?.respiration) +
      scoreOf(activityLovQueryResponse, record?.activity);
    if (aldreteScore !== (record?.aldreteScore ?? 0)) {
      setRecord({ ...record, aldreteScore });
    }
  }, [
    record,
    setRecord,
    oxsatQueryResponse,
    conscLovQueryResponse,
    circuLovQueryResponse,
    respirLovQueryResponse,
    activityLovQueryResponse
  ]);

  return (
    <SectionContainer
      title={<Text>Post-Procedure Anesthesia</Text>}
      content={
        <Row gutter={15} className="r">
          <Form fluid>
            <Col md={12}>
              <MyInput
                width="100%"
                selectData={oxsatQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="lovDisplayVale"
                fieldType="select"
                fieldName="oxygenSaturationLevel"
                record={record}
                setRecord={setRecord}
                searchable={false}
              />
              <MyInput
                width="100%"
                selectData={conscLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="lovDisplayVale"
                fieldType="select"
                fieldName="consciousness"
                record={record}
                setRecord={setRecord}
                searchable={false}
              />

              <MyInput
                width="100%"
                selectData={circuLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="lovDisplayVale"
                fieldType="select"
                fieldName="circulation"
                record={record}
                setRecord={setRecord}
                searchable={false}
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                selectData={respirLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="lovDisplayVale"
                fieldType="select"
                fieldName="respiration"
                record={record}
                setRecord={setRecord}
                searchable={false}
              />

              <MyInput
                width="100%"
                selectData={activityLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="lovDisplayVale"
                fieldType="select"
                fieldName="activity"
                record={record}
                setRecord={setRecord}
                searchable={false}
              />
              <MyInput
                width="100%"
                fieldType="number"
                fieldName="aldreteScore"
                record={record}
                setRecord={setRecord}
              />
            </Col>
          </Form>
        </Row>
      }
    />
  );
};
export default PostProcedureAnesthesia;
