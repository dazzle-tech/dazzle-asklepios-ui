import React, { useState } from 'react';
import { Form } from 'rsuite';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { ExternalLabResultEntry, ExternalRadiologyReportEntry } from '@/types/model-types-new';
import { newExternalLabResultEntry } from '@/types/model-types-constructor-new';

// Same values as our TestResultMarker enum
const MARKER_OPTIONS = [
  { value: 'NORMAL_MARKER', label: 'Normal' },
  { value: 'UPPER_LIMIT', label: 'Upper Limit' },
  { value: 'LOWER_LIMIT', label: 'Lower Limit' },
  { value: 'CRITICAL_UPPER', label: 'Critical Upper' },
  { value: 'CRITICAL_LOWER', label: 'Critical Lower' },
  { value: 'ABNORMAL_MARKER', label: 'Abnormal' },
  { value: 'UNKNOWN', label: 'Unknown' }
];

export const isCriticalMarker = (marker?: string | null) =>
  marker === 'CRITICAL_UPPER' || marker === 'CRITICAL_LOWER';

/* ===================== Lab ===================== */

type LabProps = {
  rows: ExternalLabResultEntry[];
  onChange: (rows: ExternalLabResultEntry[]) => void;
};

export const ExternalLabResultsEditor = ({ rows, onChange }: LabProps) => {
  const updateRow = (index: number, next: ExternalLabResultEntry) =>
    onChange(rows.map((row, i) => (i === index ? next : row)));

  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const cell = (fieldName: keyof ExternalLabResultEntry, extra: Record<string, any> = {}) =>
    function Cell(row: ExternalLabResultEntry, index?: number) {
      return (
        <Form fluid>
          <MyInput
            showLabel={false}
            width="100%"
            fieldName={fieldName}
            record={row}
            setRecord={(next: ExternalLabResultEntry) => updateRow(index ?? 0, next)}
            {...extra}
          />
        </Form>
      );
    };

  const columns = [
    { key: 'testName', title: <Translate>Test Name</Translate>, width: 170, render: cell('testName') },
    { key: 'resultDate', title: <Translate>Result Date</Translate>, width: 150, render: cell('resultDate', { fieldType: 'date' }) },
    { key: 'resultValue', title: <Translate>Result</Translate>, width: 100, render: cell('resultValue') },
    { key: 'unit', title: <Translate>Unit</Translate>, width: 90, render: cell('unit') },
    { key: 'normalRangeValue', title: <Translate>Normal Range</Translate>, width: 120, render: cell('normalRangeValue') },
    {
      key: 'marker',
      title: <Translate>Marker</Translate>,
      width: 150,
      render: cell('marker', {
        fieldType: 'select',
        selectData: MARKER_OPTIONS,
        selectDataLabel: 'label',
        selectDataValue: 'value'
      })
    },
    { key: 'physicianName', title: <Translate>Physician Name</Translate>, width: 160, render: cell('physicianName') },
    {
      key: 'actions',
      title: '',
      width: 50,
      render: (_row: ExternalLabResultEntry, index?: number) => (
        <FaTrash
          className="external-result__delete"
          title="Remove row"
          onClick={() => removeRow(index ?? 0)}
        />
      )
    }
  ];

  return (
    <div className="external-result__editor">
      <MyTable
        data={rows}
        columns={columns}
        height={360}
        dontTranslateData
        rowClassName={row => (isCriticalMarker(row?.marker) ? 'external-result__critical-row' : '')}
      />
      <div>
        <MyButton appearance="ghost" prefixIcon={FaPlus} onClick={() => onChange([...rows, { ...newExternalLabResultEntry }])}>
          Add Row
        </MyButton>
      </div>
    </div>
  );
};

/* ===================== Radiology ===================== */

const htmlToEditorState = (html?: string | null) => {
  if (!html) return EditorState.createEmpty();
  const { contentBlocks, entityMap } = htmlToDraft(html);
  return EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocks, entityMap));
};

// Same editor as the radiologist report screen, so the saved HTML opens the same way there
const ReportEditor = ({ value, onChange }: { value?: string | null; onChange: (html: string) => void }) => {
  const [editorState, setEditorState] = useState(() => htmlToEditorState(value));

  return (
    <Editor
      editorState={editorState}
      onEditorStateChange={state => {
        setEditorState(state);
        onChange(draftToHtml(convertToRaw(state.getCurrentContent())));
      }}
      editorStyle={{
        minHeight: '220px',
        overflow: 'auto',
        border: '1px solid var(--rs-border-primary)',
        padding: '8px'
      }}
    />
  );
};

type RadiologyProps = {
  reports: ExternalRadiologyReportEntry[];
  onChange: (reports: ExternalRadiologyReportEntry[]) => void;
};

export const ExternalRadiologyReportsEditor = ({ reports, onChange }: RadiologyProps) => {
  const severityOptions = useEnumOptions('Severity');

  const updateReport = (index: number, next: ExternalRadiologyReportEntry) =>
    onChange(reports.map((report, i) => (i === index ? next : report)));

  return (
    <div className="external-result__editor">
      {reports.map((report, index) => {
        const setRecord = (next: ExternalRadiologyReportEntry) => updateReport(index, next);
        return (
          // Length in the key remounts the editors after a removal, so each one reloads its own HTML
          <div key={`${index}-${reports.length}`} className="external-result__report">
            {reports.length > 1 && (
              <div className="external-result__report-head">
                <span>
                  <Translate>Report</Translate> {index + 1}
                </span>
                <FaTrash
                  className="external-result__delete"
                  title="Remove report"
                  onClick={() => onChange(reports.filter((_, i) => i !== index))}
                />
              </div>
            )}
            <Form fluid>
              <div className="external-result__grid">
                <MyInput width="100%" fieldName="testName" fieldLabel="Test Name" record={report} setRecord={setRecord} />
                <MyInput
                  width="100%"
                  fieldName="reportDate"
                  fieldLabel="Report Date"
                  fieldType="date"
                  record={report}
                  setRecord={setRecord}
                />
                <MyInput
                  width="100%"
                  fieldName="severity"
                  fieldLabel="Severity"
                  fieldType="select"
                  selectData={severityOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={report}
                  setRecord={setRecord}
                />
                <MyInput
                  width="100%"
                  fieldName="physicianName"
                  fieldLabel="Physician Name"
                  record={report}
                  setRecord={setRecord}
                />
              </div>
              <MyInput
                width="100%"
                fieldName="radiologistInformation"
                fieldLabel="Radiologist Information"
                record={report}
                setRecord={setRecord}
              />
            </Form>

            <label>
              <Translate>Report</Translate>
            </label>
            <ReportEditor value={report.report} onChange={html => setRecord({ ...report, report: html })} />

            <Form fluid>
              <MyInput
                width="100%"
                fieldName="criticalFindings"
                fieldLabel="Critical Findings"
                fieldType="textarea"
                record={report}
                setRecord={setRecord}
              />
              <MyInput
                width="100%"
                fieldName="radiologistComments"
                fieldLabel="Radiologist Comments"
                fieldType="textarea"
                record={report}
                setRecord={setRecord}
              />
            </Form>
          </div>
        );
      })}
    </div>
  );
};
