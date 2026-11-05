import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useGetProcedurePerformanceQuery,
  useGetProcedureStaffQuery,
  useSaveProcedurePerformanceMutation,
  useUpdateProcedureStaffMutation
} from '@/services/patients/patientProcedureService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetUsersBasicQuery } from '@/services/userService';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { Col, Form, Input, Row, Text } from 'rsuite';
import '../styles.less';

const ProcedurePerforming = ({ procedure, setActiveTab }) => {
  const dispatch = useAppDispatch();
  const [performing, setPerforming] = useState<any>({});
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
  const { data: usersResponse } = useGetUsersBasicQuery({ page: 0, size: 1000, sort: 'id,asc' });
  const users = usersResponse?.data ?? [];

  const [savePerforming] = useSaveProcedurePerformanceMutation();
  const [updateStaff] = useUpdateProcedureStaffMutation();

  const { data: savedPerformance } = useGetProcedurePerformanceQuery(procedure?.id, {
    skip: !procedure?.id
  });
  const { data: staffList = [] } = useGetProcedureStaffQuery(procedure?.id, {
    skip: !procedure?.id
  });

  useEffect(() => {
    if (!savedPerformance) return;
    const toDate = (value?: string | null) => (value ? new Date(value) : null);
    setPerforming({
      ...savedPerformance,
      actualStartTime: toDate(savedPerformance.actualStartTime),
      actualEndTime: toDate(savedPerformance.actualEndTime),
      anesthesiaStartTime: toDate(savedPerformance.anesthesiaStartTime),
      anesthesiaEndTime: toDate(savedPerformance.anesthesiaEndTime)
    });
    setInstruc(savedPerformance.homeInstructionNotes ?? null);
  }, [savedPerformance]);

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

  const toInstant = (time?: string | Date | null) =>
    time
      ? new Date(
          mergeDateAndTimeToMillis(procedure.scheduledDateTime ?? new Date(), new Date(time))
        ).toISOString()
      : null;

  const handleSave = async () => {
    try {
      await savePerforming({
        id: procedure.id,
        body: {
          ...performing,
          homeInstructionNotes: instr,
          actualStartTime: toInstant(performing.actualStartTime),
          actualEndTime: toInstant(performing.actualEndTime),
          anesthesiaStartTime: toInstant(performing.anesthesiaStartTime),
          anesthesiaEndTime: toInstant(performing.anesthesiaEndTime)
        }
      }).unwrap();
      dispatch(notify({ msg: ' Saved successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Saved failed', sev: 'error' }));
    }
  };

  const handleClear = () => {
    setPerforming({ anesthesiaUsed: false, timeOut: false });
    setInstruc(null);
    setInstructionList([]);
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
 disableByField='isValid'

                          selectDataValue="lovDisplayVale"
                          fieldName="procedureOutcome"
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
 disableByField='isValid'

                          selectDataValue="lovDisplayVale"
                          fieldName="complicationType"
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
 disableByField='isValid'

                          selectDataValue="lovDisplayVale"
                          fieldName="complicationSeverity"
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
 disableByField='isValid'

                            selectDataValue="lovDisplayVale"
                            fieldName="anesthesiaType"
                            record={performing}
                            setRecord={setPerforming}
                          />
                        </Col>
                        <Col md={12}>
                          <MyInput
                            width="100%"
                            fieldType="select"
                            fieldLabel="Administered By"
                            selectData={users}
                            selectDataLabel="login"
                            selectDataValue="id"
                            fieldName="anesthesiaAdministeredById"
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
                        {staffList.map(staff => (
                          <div key={staff.id}>
                            <MyInput
                              showLabel={false}
                              fieldLabel={users.find(user => user.id === staff.userId)?.login}
                              fieldType="check"
                              fieldName="isPresent"
                              record={staff}
                              setRecord={async ({ isPresent }) => {
                                try {
                                  await updateStaff({
                                    id: procedure.id,
                                    staffId: staff.id,
                                    body: {
                                      userId: staff.userId,
                                      responsibility: staff.responsibility,
                                      isPresent
                                    }
                                  }).unwrap();
                                } catch {
                                  dispatch(notify({ msg: 'Save failed', sev: 'error' }));
                                }
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
 disableByField='isValid'

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
                            onChange={value => setInstruc(value)}
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
          <MyButton disabled={!performing?.id}>Print</MyButton>
          <MyButton onClick={() => setActiveTab('4')}>Complete and Next</MyButton>
        </div>
      </div>
    </>
  );
};

export default ProcedurePerforming;
