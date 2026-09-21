import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { Divider, Input } from 'rsuite';
import { MdEdit } from 'react-icons/md';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newDiagnosticTestNormalRange } from '@/types/model-types-constructor-new';
import { DiagnosticTestNormalRange, DiagnosticTestProfile } from '@/types/model-types-new';
import { initialListRequest } from '@/types/types';
import DiagnosticTestNormalRangeTable from './DiagnosticTestNormalRangeTable';

interface NormalRangeSectionProps {
  profile: DiagnosticTestProfile;
  testId?: number;
  normalRange: DiagnosticTestNormalRange;
  setNormalRange: React.Dispatch<React.SetStateAction<DiagnosticTestNormalRange>>;
  formKey: number;
  onSave: () => void;
  onDelete: () => void;
  deleteModalOpen: boolean;
  setDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NormalRangeSection = ({
  profile,
  testId,
  normalRange,
  setNormalRange,
  formKey,
  onSave,
  onDelete,
  deleteModalOpen,
  setDeleteModalOpen
}: NormalRangeSectionProps) => {
  const [lovCode, setLovCode] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const gender = useEnumOptions('Gender');
  const condition = useEnumOptions('Condition');
  const ageUnit = useEnumOptions('AgeUnit');
  const resultTypes = useEnumOptions('TestResultType');
  const rangeTypes = useEnumOptions('NormalRangeType');
  const { data: valueUnitResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: lovListResponse } = useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });
  const { data: lovValuesResponse } = useGetLovValuesByCodeQuery(lovCode);
  const resultType = profile.resultType?.toUpperCase();

  useEffect(() => {
    const selectedLov = lovListResponse?.object?.find(
      value => String(value.key) === String(profile.listOfValueId)
    );
    setLovCode(selectedLov?.lovCode ?? '');
  }, [lovListResponse, profile.listOfValueId]);

  useEffect(() => {
    if (Array.isArray(normalRange.lovKeys) || normalRange.lovKeys == null) return;
    setNormalRange(previous => ({
      ...previous,
      lovKeys: String(previous.lovKeys)
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
    }));
  }, [normalRange.lovKeys, setNormalRange]);

  useEffect(() => {
    setEditorKey(previous => previous + 1);
    setNormalRange(createRangeState());
  }, [profile.id, profile.resultType, testId]);

  const createRangeState = (range?: DiagnosticTestNormalRange) => ({
    ...newDiagnosticTestNormalRange,
    ...range,
    testId: testId ?? range?.testId ?? 0,
    profileTestId: profile.id,
    resultType: profile.resultType ?? range?.resultType ?? '',
    ageFrom: range?.ageFrom,
    ageTo: range?.ageTo,
    rangeFrom: range?.rangeFrom,
    rangeTo: range?.rangeTo,
    criticalValueLessThan: range?.criticalValueLessThan,
    criticalValueMoreThan: range?.criticalValueMoreThan,
    lovKeys: Array.isArray(range?.lovKeys) ? [...range.lovKeys] : []
  });

  const startNewRange = () => {
    setEditorKey(previous => previous + 1);
    setNormalRange(createRangeState());
  };

  const selectRange = (range: DiagnosticTestNormalRange) => {
    setEditorKey(previous => previous + 1);
    setNormalRange({
      ...createRangeState(range)
    });
  };

  const selectedLov = lovValuesResponse?.object?.find(
    value => String(value.lovCode) === String(lovCode)
  );

  return (
    <section className="diagnostic-section normal-range-section">
      <Divider>
        <Translate>Normal Ranges</Translate>
      </Divider>
      <DiagnosticTestNormalRangeTable
        profileId={profile.id}
        testId={testId}
        resultType={profile.resultType}
        onAdd={startNewRange}
        onEdit={selectRange}
        onDelete={range => {
          selectRange(range);
          setDeleteModalOpen(true);
        }}
      />
      <Divider>
        <Translate>{normalRange.id ? 'Edit Normal Range' : 'Add Normal Range'}</Translate>
      </Divider>

      <div className="normal-range-fields" key={`${formKey}-${editorKey}`}>
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
            <MyInput fieldLabel="Gender" fieldType="select" fieldName="gender" selectData={gender ?? []} selectDataLabel="label" selectDataValue="value" record={normalRange} setRecord={setNormalRange} width="100%" />
          </div>
          <div className="container-of-field-diagnostic">
            <MyInput fieldLabel="Condition" fieldType="select" fieldName="condition" selectData={condition ?? []} selectDataLabel="label" selectDataValue="value" record={normalRange} setRecord={setNormalRange} width="100%" menuMaxHeight={200} />
          </div>
        </div>
        <br />
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
            <MyInput fieldName="ageFrom" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" />
          </div>
          <div className="container-of-field-diagnostic">
            <MyInput fieldName="ageFromUnit" fieldType="select" selectData={ageUnit ?? []} selectDataLabel="label" selectDataValue="value" record={normalRange} setRecord={setNormalRange} width="100%" />
          </div>
        </div>
        <br />
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
            <MyInput fieldName="ageTo" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" />
          </div>
          <div className="container-of-field-diagnostic">
            <MyInput fieldName="ageToUnit" fieldType="select" selectData={ageUnit ?? []} selectDataLabel="label" selectDataValue="value" record={normalRange} setRecord={setNormalRange} width="100%" />
          </div>
        </div>
        <br />
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
            <MyInput fieldName="resultUnit" fieldType="select" selectData={valueUnitResponse?.object ?? []} selectDataLabel="lovDisplayVale" selectDataValue="key" record={profile} setRecord={() => undefined} width="100%" disabled disableByField="isValid" />
          </div>
          <div className="container-of-field-diagnostic">
            <MyInput fieldName="resultType" fieldType="select" selectData={resultTypes ?? []} selectDataLabel="label" selectDataValue="value" record={profile} setRecord={() => undefined} width="100%" disabled />
          </div>
        </div>
        <br />
        {resultType === 'NUMBER' && (
          <MyInput fieldName="normalRangeType" fieldType="select" selectData={rangeTypes ?? []} selectDataLabel="label" selectDataValue="value" record={normalRange} setRecord={setNormalRange} width="100%" menuMaxHeight={100} />
        )}
        {resultType === 'NUMBER' && normalRange.normalRangeType === 'RANGE' && (
          <div className="range-from-to-diagnostic">
            <div className="range-diagnostic"><MyInput fieldName="rangeFrom" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" /></div>
            <label>-</label>
            <div className="range-diagnostic"><MyInput fieldName="rangeTo" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" /></div>
          </div>
        )}
        {resultType === 'NUMBER' && normalRange.normalRangeType === 'LESS_THAN' && (
          <MyInput fieldLabel="Less Than" fieldName="rangeTo" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" />
        )}
        {resultType === 'NUMBER' && normalRange.normalRangeType === 'MORE_THAN' && (
          <MyInput fieldLabel="More Than" fieldName="rangeFrom" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" />
        )}
        {resultType === 'LOV' && (
          <>
            <Input className="search-result-diagnostic" disabled value={selectedLov ? `${selectedLov.lovCode}, ${selectedLov.lovName}` : ''} />
            <br />
            <MyInput fieldLabel="LOVS" fieldName="lovKeys" fieldType="multyPicker" selectData={lovValuesResponse?.object ?? []} selectDataLabel="lovDisplayVale" selectDataValue="key" record={normalRange} setRecord={setNormalRange} width="100%" menuMaxHeight={120} disableByField="isValid" />
          </>
        )}
        {resultType === 'NUMBER' && (
          <MyInput fieldName="criticalValue" fieldType="checkbox" record={normalRange} setRecord={setNormalRange} width="100%" />
        )}
        {normalRange.criticalValue && normalRange.normalRangeType === 'LESS_THAN' && (
          <MyInput fieldLabel="More Than" fieldName="criticalValueMoreThan" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" />
        )}
        {normalRange.criticalValue && normalRange.normalRangeType === 'MORE_THAN' && (
          <MyInput fieldLabel="Less Than" fieldName="criticalValueLessThan" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" />
        )}
        {normalRange.criticalValue && normalRange.normalRangeType === 'RANGE' && (
          <div className="container-of-two-fields-diagnostic">
            <div className="container-of-field-diagnostic"><MyInput fieldLabel="Less Than" fieldName="criticalValueLessThan" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" /></div>
            <div className="container-of-field-diagnostic"><MyInput fieldLabel="More Than" fieldName="criticalValueMoreThan" fieldType="number" record={normalRange} setRecord={setNormalRange} width="100%" /></div>
          </div>
        )}
      </div>

      <div className="profile-actions">
        <MyButton prefixIcon={() => (normalRange.id ? <MdEdit size={18} /> : <AddOutlineIcon />)} color={normalRange.id ? 'var(--primary-green)' : 'var(--deep-blue)'} onClick={onSave}>
          Save
        </MyButton>
      </div>
      <DeletionConfirmationModal open={deleteModalOpen} setOpen={setDeleteModalOpen} itemToDelete="Normal Range" actionButtonFunction={onDelete} actionType="Delete" />
    </section>
  );
};

export default NormalRangeSection;
