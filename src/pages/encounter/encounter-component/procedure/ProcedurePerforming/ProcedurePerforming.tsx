import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useGetProcedurePerformanceQuery,
  useGetProceduresStaffQuery,
  useSaveProcedurePerformanceMutation,
  useSaveProceduresStaffMutation
} from '@/services/procedureService';
import { useGetLovValuesByCodeQuery, useGetUsersQuery } from '@/services/setupService';
import { newApProcedurePerformance } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { Col, Form, Input, Row, Text } from 'rsuite';
import '../styles.less';

const ProcedurePerforming = ({ procedure, setActiveTab, user }) => {
  const dispatch = useAppDispatch();
  const [performing, setPerforming] = useState({ ...newApProcedurePerformance });
  const [Duration, setDuration] = useState({ duration: null });
  const [instructionList, setInstructionList] = useState([]);
  const [instr, setInstruc] = useState(null);
  const [slectInst, setSelectInt] = useState({ inst: null });

  // lovs
  const { data: TypeofAnesthesiaLovQueryResponse } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: ProcedureOutcomeLovQueryResponse } = useGetLovValuesByCodeQuery('PROC_OUTCOMES');
  const { data: ComplicationsLovQueryResponse } = useGetLovValuesByCodeQuery('PROC_COMPLIC');
  const { data: ComplicationSeverityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
  const { data: HomeinstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('POST_PROC_INSTR');
  const { data: userList } = useGetUsersQuery({ ...initialListRequest });

  const [savePerforming] = useSaveProcedurePerformanceMutation();
  const [saveStaff] = useSaveProceduresStaffMutation();

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'procedure_key',
        operator: 'match',
        value: procedure?.key
      }
    ]
  });

  const { data: performingList } = useGetProcedurePerformanceQuery(listRequest, {
    skip: !procedure?.key
  });

  const [listSRequest, setListSRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'procedure_key',
        operator: 'match',
        value: procedure?.key
      }
    ]
  });

  const { data: staffList, refetch } = useGetProceduresStaffQuery(listSRequest, {
    skip: !procedure?.key
  });

  useEffect(() => {
    if (performing.actualStartTime && performing.actualEndTime) {
      const start = new Date(performing.actualStartTime);
      const end = new Date(performing.actualEndTime);

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();

      const diffInMinutes = endMinutes - startMinutes;

      setDuration({ duration: diffInMinutes });
    } else {
      setDuration({ duration: null });
    }
  }, [performing.actualStartTime, performing.actualEndTime]);

  useEffect(() => {
    setInstruc(joinValuesFromArray(instructionList));
  }, [instructionList]);

  useEffect(() => {
    if (slectInst?.inst != null) {
      const foundItem = HomeinstructionsLovQueryResponse?.object?.find(
        item => item.key === slectInst?.inst
      );

      const value = foundItem?.lovDisplayVale;

      if (value) {
        setInstructionList(prev => [...prev, foundItem?.lovDisplayVale]);
      } else {
        console.warn('⚠️ Could not find display value for key:', slectInst.inst);
      }
    }
  }, [slectInst?.inst]);

  const joinValuesFromArray = values => {
    return values?.filter(Boolean)?.join(', ');
  };

  const mergeDateAndTimeToMillis = (
    dateSource: string | Date,
    timeSource: string | Date
  ): number => {
    const date = new Date(dateSource);
    const time = new Date(timeSource);

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    const merged = new Date(year, month, day, hours, minutes, seconds);

    return merged.getTime();
  };

  const handleSave = async () => {
    try {
      await savePerforming({
        ...performing,
        homeInstructionNotes: instr,
        actualStartTime: mergeDateAndTimeToMillis(
          procedure.scheduledDateTime,
          new Date(performing.actualStartTime)
        ),
        actualEndTime: mergeDateAndTimeToMillis(
          procedure.scheduledDateTime,
          new Date(performing.actualEndTime)
        ),
        anesthesiaStartTime: mergeDateAndTimeToMillis(
          procedure.scheduledDateTime,
          new Date(performing.anesthesiaStartTime)
        ),
        anesthesiaEndTime: mergeDateAndTimeToMillis(
          procedure.scheduledDateTime,
          new Date(performing.anesthesiaEndTime)
        )
      }).unwrap();
      dispatch(notify({ msg: ' Saved successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Saved failed', sev: 'error' }));
    }
  };

  const handleClear = () => {
    setPerforming({
      ...newApProcedurePerformance,
      anesthesiaTypeLkey: null,
      procedureOutcomeLkey: null,
      complicationTypeLkey: null,
      complicationSeverityLkey: null,
      homeInstructionLkey: null,
      anesthesiaUsed: false,
      timeOut: false
    });
  };

  return (
    <>
      <Row gutter={15} className="d">
        <Form fluid>
          <Col md={12}>
            <Row>
              <SectionContainer
                title={<Text>Procedure Period</Text>}
                content={
                  <Row>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="time"
                        fieldName="actualStartTime"
                        record={performing}
                        setRecord={setPerforming}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="time"
                        fieldName="actualEndTime"
                        record={performing}
                        setRecord={setPerforming}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="number"
                        rightAddon={'Min'}
                        fieldName="duration"
                        record={Duration}
                        setRecord={setDuration}
                      />
                    </Col>
                  </Row>
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title={<Text>Outcome</Text>}
                content={
                  <>
                    <Row>
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldType="select"
                          selectData={ProcedureOutcomeLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="procedureOutcomeLkey"
                          record={performing}
                          setRecord={setPerforming}
                          searchable={false}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="observations"
                          record={performing}
                          setRecord={setPerforming}
                        />
                      </Col>
                    </Row>
                  </>
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title={<Text>Complications</Text>}
                content={
                  <>
                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="select"
                          selectData={ComplicationsLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="complicationTypeLkey"
                          record={performing}
                          setRecord={setPerforming}
                        />
                      </Col>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="select"
                          selectData={ComplicationSeverityLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="complicationSeverityLkey"
                          record={performing}
                          setRecord={setPerforming}
                          searchable={false}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="actionsTaken"
                          record={performing}
                          setRecord={setPerforming}
                        />
                      </Col>
                    </Row>
                  </>
                }
              />
            </Row>
          </Col>

          <Col md={12}>
            <Row>
              <SectionContainer
                title={''}
                content={
                  <>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="anesthesiaUsed"
                      label="Anesthesia Used"
                      record={performing}
                      setRecord={setPerforming}
                    />
                    {performing?.anesthesiaUsed && (
                      <Row>
                        <Col md={12}>
                          <MyInput
                            width="100%"
                            fieldType="time"
                            fieldName="anesthesiaStartTime"
                            record={performing}
                            setRecord={setPerforming}
                          />
                        </Col>
                        <Col md={12}>
                          <MyInput
                            width="100%"
                            fieldType="time"
                            fieldName="anesthesiaEndTime"
                            record={performing}
                            setRecord={setPerforming}
                          />
                        </Col>
                      </Row>
                    )}
                    {performing?.anesthesiaUsed && (
                      <Row>
                        <Col md={12}>
                          <MyInput
                            width="100%"
                            fieldType="select"
                            selectData={TypeofAnesthesiaLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName="anesthesiaTypeLkey"
                            record={performing}
                            setRecord={setPerforming}
                          />
                        </Col>
                        <Col md={12}>
                          <MyInput
                            width="100%"
                            fieldType="select"
                            fieldLabel="Administered By"
                            selectData={userList?.object ?? []}
                            selectDataLabel="username"
                            selectDataValue="key"
                            fieldName="anesthesiaAdministeredKey"
                            record={performing}
                            setRecord={setPerforming}
                            menuMaxHeight="13vh"
                          />
                        </Col>
                      </Row>
                    )}
                  </>
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title={''}
                content={
                  <>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="timeOut"
                      record={performing}
                      setRecord={setPerforming}
                    />
                    {performing?.timeOut && (
                      <>
                        {staffList?.object?.map((staff, index) => (
                          <div key={staff.key}>
                            <MyInput
                              showLabel={false}
                              fieldLabel={staff?.user?.username}
                              fieldType="check"
                              fieldName="isPresent"
                              record={staff}
                              setRecord={async staffWithNewValue => {
                                const { isPresent, ...rest } = staffWithNewValue;

                                try {
                                  await saveStaff({ ...rest, isPresent }).unwrap();
                                  refetch();
                                } catch (err) {}
                              }}
                            />
                          </div>
                        ))}
                      </>
                    )}
                  </>
                }
              />
            </Row>

            <SectionContainer
              title="Notes"
              content={
                <>
                  <Row>
                    <Col md={24}>
                      <Row>
                        <Col md={24}>
                          <MyInput
                            width="100%"
                            fieldType="select"
                            fieldLabel="Home Instructions"
                            selectData={HomeinstructionsLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName="inst"
                            record={slectInst}
                            setRecord={setSelectInt}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col md={24}>
                          <Input
                            as="textarea"
                            onChange={e => setInstruc(e.target.value)}
                            value={instr}
                            style={{ width: '100%' }}
                            rows={3}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        height="15vh"
                        width="100%"
                        fieldType="textarea"
                        fieldName="additionalNotes"
                        record={performing}
                        setRecord={setPerforming}
                      />
                    </Col>
                  </Row>
                </>
              }
            />
          </Col>
        </Form>
      </Row>

      <div className="bt-div">
        <div className="bt-right">
          <MyButton onClick={handleClear}>Clear</MyButton>
          <MyButton onClick={handleSave}>Save</MyButton>
          <MyButton disabled={!performing?.key}>Print</MyButton>
          <MyButton onClick={() => setActiveTab('4')}>Complete and Next</MyButton>
        </div>
      </div>
    </>
  );
};

export default ProcedurePerforming;
