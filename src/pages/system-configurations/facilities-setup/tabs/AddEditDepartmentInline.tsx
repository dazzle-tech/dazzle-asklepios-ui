import { PhoneNumberInput } from '@/components';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { MedicalSheets } from '@/config/modules-config';
import { useEnumOptions } from '@/services/enumsApi';
import { Department } from '@/types/model-types-new';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Popover, Whisper } from 'rsuite';
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
  addDefaultMedicalSheets: boolean;
  setAddDefaultMedicalSheets: (val: boolean) => void;
  addDefaultNurseMedicalSheets: boolean;
  setAddDefaultNurseMedicalSheets: (val: boolean) => void;
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
  addDefaultMedicalSheets,
  setAddDefaultMedicalSheets,
  addDefaultNurseMedicalSheets,
  setAddDefaultNurseMedicalSheets
}) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  const DayOfWeek = useEnumOptions('DayOfWeek');
  const [showMedicalSheetsInfo, setShowMedicalSheetsInfo] = useState(false);
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
      }));
    }
  }, [department?.appointable]);

  useEffect(() => {
    if (!department?.hasMedicalSheets) {
      setAddDefaultMedicalSheets(false);
    }
  }, [department?.hasMedicalSheets]);

const defaultMedicalSheetsInfo = (
  <Popover title="Default Medical Sheets">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {MedicalSheets?.filter(sheet => sheet.isDefaultMedicalSheet)?.length ? (
        MedicalSheets
          .filter(sheet => sheet.isDefaultMedicalSheet)
          .map(sheet => (
            <span >{sheet.name}</span>
          ))
      ) : (
        <span>No default medical sheets.</span>
      )}
    </div>
  </Popover>
);

const defaultNurseMedicalSheetsInfo = (
  <Popover title="Default Nurse Medical Sheets">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {MedicalSheets?.filter(sheet => sheet.isDefaultNurseMedicalSheet)?.length ? (
        MedicalSheets
          .filter(sheet => sheet.isDefaultNurseMedicalSheet)
          .map(sheet => (
            <span >{sheet.name}</span>
          ))
      ) : (
        <span>No default nurse medical sheets.</span>
      )}
    </div>
  </Popover>
);
  return (
    <Form
      fluid
      layout="inline"
      style={{
        marginBottom: '20px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}
      dir={dir}
    >
      <MyInput
        column
        width={350}
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
        <PhoneNumberInput
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

      <div className={clsx('', { 'container-of-two-fields-departments': width > 600 })}>
        <MyInput
          column
          fieldLabel="Appointable"
          fieldType="checkbox"
          fieldName="appointable"
          record={department}
          setRecord={setDepartment}
        />

        <MyInput
          column
          fieldLabel="Has Medical Sheets"
          fieldType="checkbox"
          fieldName="hasMedicalSheets"
          record={department}
          setRecord={setDepartment}
        />
      
        {department?.hasMedicalSheets && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MyInput
              column
              showLabel={false}
              fieldLabel="Add Default Medical Sheets"
              fieldType="check"
              fieldName="addDefaultMedicalSheets"
              record={{ addDefaultMedicalSheets }}
              setRecord={value =>
                setAddDefaultMedicalSheets(Boolean(value?.addDefaultMedicalSheets))
              }
            />

            <Whisper
              placement="top"
              trigger="click"
              speaker={defaultMedicalSheetsInfo}
            >
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: 14,
                  marginTop: 6
                }}
              />
            </Whisper>
          </div>
        )}

        <MyInput
          column
          fieldLabel="Has Nurse Medical Sheets"
          fieldType="checkbox"
          fieldName="hasNurseMedicalSheets"
          record={department}
          setRecord={setDepartment}
        />

        {department?.hasNurseMedicalSheets && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MyInput
              column
              showLabel={false}
              fieldLabel="Add Default Nurse Medical Sheets"
              fieldType="check"
              fieldName="addDefaultNurseMedicalSheets"
              record={{ addDefaultNurseMedicalSheets }}
              setRecord={value =>
                setAddDefaultNurseMedicalSheets(Boolean(value?.addDefaultNurseMedicalSheets))
              }
            />

            <Whisper
              placement="top"
              trigger="click"
              speaker={defaultNurseMedicalSheetsInfo}
            >
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: 14,
                  marginTop: 6
                }}
              />
            </Whisper>
          </div>
        )}
      </div>

      {department?.appointable && (
        <MyInput
          column
          width={"100%"}
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
      )}

      {department?.appointable && (
        <>
          <MyInput
            column
            fieldType="number"
            fieldName="defaultDurationMinutes"
            record={department}
            setRecord={setDepartment}
            width="100%"
            required
            showZero
          />

          <MyInput
            column
            fieldType="number"
            fieldName="defaultBufferBeforeMinutes"
            record={department}
            setRecord={setDepartment}
            width="100%"
            required
            showZero
          />

          <MyInput
            column
            fieldType="number"
            fieldName="defaultBufferAfterMinutes"
            record={department}
            setRecord={setDepartment}
            width="100%"
            required
            showZero
          />



        </>
      )}

      {department?.appointable && (
        <>
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

          <MyInput
            column
            fieldType="number"
            fieldName="parallelCapacityValue"
            record={department}
            setRecord={setDepartment}
            width="100%"
            required
            showZero
          />

          <MyInput
            column
            fieldType="checkbox"
            fieldName="parallelCapacityEnabled"
            record={department}
            setRecord={setDepartment}
          />

        </>
      )}

      <div style={{ width: '100%', marginTop: '12px' }}>
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

      <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: '10px', marginTop: '20px' }}>
        <MyButton onClick={onSave} appearance="primary">
          {department?.id ? 'Update' : 'Save'}
        </MyButton>

        <MyButton onClick={onCancel} appearance="subtle" style={{ marginLeft: '10px' }}>
          Cancel
        </MyButton>
      </div>
    </Form>
  );
};

export default AddEditDepartmentInline;