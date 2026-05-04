import React, { useEffect, useMemo } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import clsx from 'clsx';
import { Department } from '@/types/model-types-new';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import './styles.less';

interface AddEditDepartmentInlineProps {
  width: number;
  department: Department;
  setDepartment: React.Dispatch<React.SetStateAction<Department>>;
  recordOfDepartmentCode: { departmentCode: string };
  setRecordOfDepartmentCode: (value: { departmentCode: string }) => void;
  depTypeOptions: any[];
  encTypesEnum: any[];
  onSave: () => void;
  onCancel: () => void;
}

const AddEditDepartmentInline: React.FC<AddEditDepartmentInlineProps> = ({
  width,
  department,
  setDepartment,
  recordOfDepartmentCode,
  setRecordOfDepartmentCode,
  depTypeOptions,
  encTypesEnum,
  onSave,
  onCancel,
}) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  const DayOfWeek = useEnumOptions('DayOfWeek');

  const workingDaysRecord = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!DayOfWeek || DayOfWeek.length === 0) return map;

    DayOfWeek.forEach(day => {
      map[day.value] = false;
    });

    (department.workingDays ?? []).forEach(day => {
      if (day?.dayOfWeek) {
        map[day.dayOfWeek] = day.isWorking !== false;
      }
    });

    return map;
  }, [department.workingDays, DayOfWeek]);

  const setWorkingDaysRecord = (nextRecord: Record<string, boolean>) => {
    if (!DayOfWeek || DayOfWeek.length === 0) return;

    const nextWorkingDays = DayOfWeek.map(day => ({
      dayOfWeek: day.value,
      isWorking: !!nextRecord[day.value],
    }));

    setDepartment(prev => ({
      ...prev,
      workingDays: nextWorkingDays,
    }));
  };

  useEffect(() => {
    if (!department?.appointable) {
      setDepartment(prev => ({
        ...prev,
        defaultDurationMinutes: undefined,
        defaultBufferAfterMinutes: 0,
        defaultBufferBeforeMinutes: 0,
        encounterType: '',
        requirePractitioner: false,
        requireBilling: false,
        requirePreAssessment: false,
        parallelCapacityEnabled: false,
        parallelCapacityValue: 1,
      }));
    }
  }, [department?.appointable, setDepartment]);

  useEffect(() => {
    if (!department?.parallelCapacityEnabled) {
      setDepartment(prev => ({
        ...prev,
        parallelCapacityValue: 1,
      }));
      return;
    }

    if (!department?.parallelCapacityValue) {
      setDepartment(prev => ({
        ...prev,
        parallelCapacityValue: 1,
      }));
    }
  }, [department?.parallelCapacityEnabled, department?.parallelCapacityValue, setDepartment]);

  return (
    <Form fluid layout="inline" className="add-edit-department-inline-form" dir={dir}>
      <MyInput
        column
        width={250}
        fieldLabel="Department Type"
        fieldName="departmentType"
        fieldType="select"
        selectData={depTypeOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={department}
        setRecord={setDepartment}
        required
        menuMaxHeight={200}
      />

      <MyInput
        column
        width={350}
        fieldLabel="Department Name"
        fieldName="name"
        record={department}
        setRecord={setDepartment}
        required
      />

      <MyInput
        column
        width={350}
        fieldLabel="Department Code"
        fieldName="departmentCode"
        record={recordOfDepartmentCode}
        setRecord={setRecordOfDepartmentCode}
        disabled
      />

      <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
        <MyInput
          column
          width={350}
          fieldLabel="Phone Number"
          fieldName="phoneNumber"
          record={department}
          setRecord={setDepartment}
        />

        <MyInput
          column
          width={350}
          fieldLabel="Email"
          fieldName="email"
          record={department}
          setRecord={setDepartment}
        />
      </div>

      <div className="appointable-section">
        <div className="appointable-fields-container">
          <MyInput
            column
            fieldLabel="Appointable"
            fieldType="checkbox"
            fieldName="appointable"
            record={department}
            setRecord={setDepartment}
          />



          {department?.appointable && (
            <>
              <MyInput
                column
                width={250}
                fieldLabel="Encounter Type"
                fieldName="encounterType"
                fieldType="select"
                selectData={encTypesEnum ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={department}
                setRecord={setDepartment}
                required
              />
              <MyInput
                column
                fieldType="checkbox"
                fieldName="parallelCapacityEnabled"
                record={department}
                setRecord={setDepartment}
              />

              {department?.parallelCapacityEnabled && (
                <MyInput
                  column
                  width={220}
                  fieldType="number"
                  fieldName="parallelCapacityValue"
                  record={department}
                  setRecord={setDepartment}
                  required
                />
              )}
              <MyInput
                column
                width={250}
                fieldType="number"
                fieldName="defaultDurationMinutes"
                record={department}
                setRecord={setDepartment}
                required
              />



              <MyInput
                column
                width={220}
                fieldType="number"
                fieldName="defaultBufferBeforeMinutes"
                record={department}
                setRecord={setDepartment}
                required
              />

              <MyInput
                column
                width={220}
                fieldType="number"
                fieldName="defaultBufferAfterMinutes"
                record={department}
                setRecord={setDepartment}
                required
              />

              <MyInput
                column
                fieldType="checkbox"
                fieldName="requirePractitioner"
                record={department}
                setRecord={setDepartment}
              />

              <MyInput
                column
                fieldType="checkbox"
                fieldName="requireBilling"
                record={department}
                setRecord={setDepartment}
              />

              <MyInput
                column
                fieldType="checkbox"
                fieldName="requirePreAssessment"
                record={department}
                setRecord={setDepartment}
              />
            </>
          )}
        </div>
      </div>

      <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
        <MyInput
          column
          fieldLabel="Has Medical Sheets"
          fieldType="checkbox"
          fieldName="hasMedicalSheets"
          record={department}
          setRecord={setDepartment}
        />

        <MyInput
          column
          fieldLabel="Has Nurse Medical Sheets"
          fieldType="checkbox"
          fieldName="hasNurseMedicalSheets"
          record={department}
          setRecord={setDepartment}
        />
      </div>

      <div className="working-days-section">
        <Translate>Working Days</Translate>

        <div className="facility-working-days">
          {DayOfWeek?.map(day => (
            <MyInput
              key={day.value}
              fieldType="check"
              fieldName={day.value}
              label={day.label}
              record={workingDaysRecord}
              setRecord={setWorkingDaysRecord}
              showLabel={false}
            />
          ))}
        </div>
      </div>

      <div className={clsx('department-actions', { rtl: isRTL })}>
        <MyButton onClick={onSave} appearance="primary">
          {department?.id ? 'Update' : 'Save'}
        </MyButton>

        <MyButton onClick={onCancel} appearance="subtle" className="department-cancel-button">
          Cancel
        </MyButton>
      </div>
    </Form>
  );
};

export default AddEditDepartmentInline;