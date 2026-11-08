import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useGetProcedurePerformanceQuery,
  useGetProcedureStaffQuery,
  useSaveProcedurePerformanceMutation,
  useUpdateProcedureStaffMutation
} from '@/services/patients/patientProcedureService';
import { useSortedLovQuery } from '../useSortedLovQuery';
import { useGetUsersBasicQuery } from '@/services/userService';
import { notify } from '@/utils/uiReducerActions';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Form, Text } from 'rsuite';
import { combineDateAndTime, minutesBetween, toTimeValue } from '../procedureHelpers';
import '../styles.less';
import { ProcedureStepHandle, useStepForm } from '../useStepForm';
import ProcedureComplications from './ProcedureComplications';
import ProcedureVitalMonitoring from './ProcedureVitalMonitoring';

const lovSelect = {
  width: '100%',
  fieldType: 'select',
  selectDataLabel: 'lovDisplayVale',
  selectDataValue: 'lovDisplayVale',
  disableByField: 'isValid'
} as const;

const ProcedurePerforming = forwardRef<ProcedureStepHandle, any>(
  ({ procedure, onDirtyChange }, ref) => {
    const dispatch = useAppDispatch();
    const complicationsRef = useRef<ProcedureStepHandle | null>(null);
    const [complicationsDirty, setComplicationsDirty] = useState(false);
    const { data: anesthesiaTypes } = useSortedLovQuery('ANESTH_TYPES');
    const { data: outcomes } = useSortedLovQuery('PROC_OUTCOMES');
    const { data: homeInstructions } = useSortedLovQuery('POST_PROC_INSTR');
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

    const anesthesiologists = users.filter(
      user =>
        user.jobRole === 'ANESTHESIOLOGIST' && staffList.some(staff => staff.userId === user.id)
    );

    const loaded = useMemo(
      () =>
        savedPerformance && {
          ...savedPerformance,
          actualStartTime: toTimeValue(savedPerformance.actualStartTime),
          actualEndTime: toTimeValue(savedPerformance.actualEndTime),
          anesthesiaStartTime: toTimeValue(savedPerformance.anesthesiaStartTime),
          anesthesiaEndTime: toTimeValue(savedPerformance.anesthesiaEndTime)
        },
      [savedPerformance]
    );
    const { form, setForm, isDirty, markSaved } = useStepForm(loaded);

    useEffect(() => {
      onDirtyChange?.(isDirty || complicationsDirty);
    }, [isDirty, complicationsDirty, onDirtyChange]);

    const addHomeInstruction = ({ instruction }: { instruction?: string }) => {
      if (!instruction) return;
      setForm({
        ...form,
        homeInstructionNotes: [form.homeInstructionNotes, instruction].filter(Boolean).join(', ')
      });
    };

    useImperativeHandle(ref, () => ({
      save: async () => {
        try {
          if (isDirty || !savedPerformance?.id) {
            const day = procedure.scheduledDateTime ?? new Date();
            const actualStartTime = combineDateAndTime(day, form.actualStartTime);
            const anesthesiaStartTime = combineDateAndTime(day, form.anesthesiaStartTime);
            await savePerforming({
              id: procedure.id,
              body: {
                ...form,
                actualStartTime,
                actualEndTime: combineDateAndTime(day, form.actualEndTime, actualStartTime),
                anesthesiaStartTime,
                anesthesiaEndTime: combineDateAndTime(
                  day,
                  form.anesthesiaEndTime,
                  anesthesiaStartTime
                )
              }
            }).unwrap();
            markSaved();
          }
          const complicationsSaved = await complicationsRef.current?.save();
          if (complicationsSaved === false) return false;
          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
          return true;
        } catch {
          dispatch(notify({ msg: 'Save failed', sev: 'error' }));
          return false;
        }
      }
    }));

    const handlePresence = async (staff: any, isPresent: boolean) => {
      try {
        await updateStaff({
          id: procedure.id,
          staffId: staff.id,
          body: { userId: staff.userId, responsibility: staff.responsibility, isPresent }
        }).unwrap();
      } catch {
        dispatch(notify({ msg: 'Save failed', sev: 'error' }));
      }
    };

    return (
      <div className="perform-step-body">
        <div className="perform-columns is-three">
          <SectionContainer
            title={<Text>Procedure Period</Text>}
            content={
              <Form fluid>
                <div className="procedure-field-grid is-compact">
                  <MyInput
                    width="100%"
                    fieldType="time"
                    fieldName="actualStartTime"
                    record={form}
                    setRecord={setForm}
                  />
                  <MyInput
                    width="100%"
                    fieldType="time"
                    fieldName="actualEndTime"
                    record={form}
                    setRecord={setForm}
                  />
                  <MyInput
                    width="100%"
                    fieldType="number"
                    rightAddon="Min"
                    fieldName="duration"
                    record={{
                      duration: minutesBetween(form.actualStartTime, form.actualEndTime)
                    }}
                    disabled
                  />
                </div>
              </Form>
            }
          />
          <SectionContainer
            title={<Text>Anesthesia</Text>}
            content={
              <Form fluid>
                <MyInput
                  width="100%"
                  fieldType="checkbox"
                  fieldName="anesthesiaUsed"
                  label="Anesthesia Used"
                  record={form}
                  setRecord={setForm}
                />
                {form?.anesthesiaUsed && (
                  <div className="procedure-field-grid">
                    <MyInput
                      width="100%"
                      fieldType="time"
                      fieldName="anesthesiaStartTime"
                      record={form}
                      setRecord={setForm}
                    />
                    <MyInput
                      width="100%"
                      fieldType="time"
                      fieldName="anesthesiaEndTime"
                      record={form}
                      setRecord={setForm}
                    />
                    <MyInput
                      {...lovSelect}
                      selectData={anesthesiaTypes?.object ?? []}
                      fieldName="anesthesiaType"
                      record={form}
                      setRecord={setForm}
                    />
                    <MyInput
                      width="100%"
                      fieldType="select"
                      fieldLabel="Administered By"
                      selectData={anesthesiologists}
                      selectDataLabel="login"
                      selectDataValue="id"
                      fieldName="anesthesiaAdministeredById"
                      record={form}
                      setRecord={setForm}
                      menuMaxHeight="13vh"
                    />
                  </div>
                )}
              </Form>
            }
          />
          <SectionContainer
            title={<Text>Team Time-Out</Text>}
            content={
              <Form fluid>
                <MyInput
                  width="100%"
                  fieldType="checkbox"
                  fieldName="timeOut"
                  record={form}
                  setRecord={setForm}
                />
                {form?.timeOut &&
                  (staffList.length ? (
                    <div className="procedure-field-grid">
                      {staffList.map(staff => (
                        <MyInput
                          key={staff.id}
                          showLabel={false}
                          fieldLabel={users.find(user => user.id === staff.userId)?.login}
                          fieldType="check"
                          fieldName="isPresent"
                          record={staff}
                          setRecord={({ isPresent }) => handlePresence(staff, isPresent)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="procedure-hint">
                      Add the procedure staff in the Registration step to record who is present.
                    </div>
                  ))}
              </Form>
            }
          />
        </div>

        <ProcedureVitalMonitoring procedure={procedure} />

        <div className="perform-columns">
          <div className="perform-step-body">
            <SectionContainer
              title={<Text>Outcome</Text>}
              content={
                <Form fluid>
                  <MyInput
                    {...lovSelect}
                    selectData={outcomes?.object ?? []}
                    fieldName="procedureOutcome"
                    record={form}
                    setRecord={setForm}
                    searchable={false}
                  />
                  <MyInput
                    width="100%"
                    fieldType="textarea"
                    fieldName="observations"
                    record={form}
                    setRecord={setForm}
                  />
                </Form>
              }
            />
            <ProcedureComplications
              ref={complicationsRef}
              procedureId={procedure?.id}
              onDirtyChange={setComplicationsDirty}
            />
          </div>
          <div className="perform-step-body">
            <SectionContainer
              title={<Text>Notes</Text>}
              content={
                <Form fluid>
                  <MyInput
                    {...lovSelect}
                    fieldLabel="Add Home Instruction"
                    selectData={homeInstructions?.object ?? []}
                    fieldName="instruction"
                    record={{}}
                    setRecord={addHomeInstruction}
                  />
                  <MyInput
                    width="100%"
                    fieldType="textarea"
                    fieldName="homeInstructionNotes"
                    fieldLabel="Home Instructions"
                    record={form}
                    setRecord={setForm}
                  />
                  <MyInput
                    width="100%"
                    fieldType="textarea"
                    fieldName="additionalNotes"
                    record={form}
                    setRecord={setForm}
                  />
                </Form>
              }
            />
          </div>
        </div>
      </div>
    );
  }
);

export default ProcedurePerforming;
