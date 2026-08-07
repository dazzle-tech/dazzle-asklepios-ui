import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';
import { MdVisibility, MdModeEdit, MdDownload } from 'react-icons/md';
import { useGetFormEntriesByPatientQuery } from '@/services/setup/formEntriesService';
import UserDateCell from '@/components/UserDateCell';
import jsPDF from 'jspdf';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
type Props = {
  patient: any;
};

const ClinicalFormsTable: React.FC<Props> = ({ patient }) => {
    const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
const dispatch = useDispatch();
const authSlice = useAppSelector((s) => s.auth);

const encounter = null;
const encounterId = null;

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);


    const humanizeKey = (key: string): string =>
      key
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const flattenAnswers = (value: any, prefix = ''): Array<{ key: string; value: string }> => {
      if (value === null || value === undefined) return [{ key: prefix || 'Value', value: '-' }];
      if (typeof value !== 'object') return [{ key: prefix || 'Value', value: String(value) }];

      if (Array.isArray(value)) {
        if (!value.length) return [{ key: prefix || 'Value', value: '-' }];
        if (value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
          return [{ key: prefix || 'Value', value: value.map((v) => String(v)).join(', ') }];
        }
        return value.flatMap((item, idx) => flattenAnswers(item, `${prefix || 'Item'} ${idx + 1}`));
      }

      const entries = Object.entries(value);
      if (!entries.length) return [{ key: prefix || 'Value', value: '-' }];

      return entries.flatMap(([childKey, childVal]) =>
        flattenAnswers(childVal, prefix ? `${prefix} - ${humanizeKey(childKey)}` : humanizeKey(childKey))
      );
    };

    const getPatientDisplayName = (patient: any): string => {
      if (!patient) return '-';
      const fullName = patient.fullName || patient.patientName || patient.name;
      if (fullName) return String(fullName);
      const nameFromParts = [patient.firstName, patient.middleName, patient.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      return nameFromParts || '-';
    };

    const formatEncounterNumber = (value: any): string => {
      if (value === null || value === undefined || value === '') return '-';
      const raw = String(value).trim();
      if (/^E\d+$/i.test(raw)) return raw.toUpperCase();
      if (/^\d+$/.test(raw)) return `E${raw.padStart(5, '0')}`;
      return raw;
    };


  const patientId = patient?.id || patient?.key;

const { data, isFetching } = useGetFormEntriesByPatientQuery(
  {
    patientId,
    page,
    size: rowsPerPage,
    sort: 'id,desc'
  },
  {
    skip: !patientId
  }
);

  const handleDownloadPdf = (entryRow: any) => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 12;
      const contentWidth = pageWidth - marginX * 2;

      const templateName = selectedTemplate?.name || 'Form Name';
      const generatedAt = formatDateWithoutSeconds(new Date().toISOString());
      const patientName = getPatientDisplayName(patient);
      const authAny = authSlice as any;
      const facilityName =
        authSlice?.selectedDepartment?.facilityName ||
        authSlice?.selectedDepartment?.facility?.name ||
        authAny?.tenant?.selectedFacility?.name ||
        authAny?.tenant?.selectedFacility?.facilityName ||
        authAny?.selectedFacility?.name ||
        authAny?.selectedFacility?.facilityName ||
        authAny?.facility?.name ||
        '-';
      const departmentName =
        authSlice?.selectedDepartment?.name ||
        authSlice?.selectedDepartment?.departmentName ||
        'Department';
      const headerTitle = facilityName;
      const headerSubTitle = departmentName;
      const encounterNumber = formatEncounterNumber(
        encounter?.encounterNumber ?? encounter?.encounterNo ?? encounter?.number ?? encounterId
      );

      let parsedData: any = {};
      try {
        parsedData = entryRow?.dataJson ? JSON.parse(entryRow.dataJson) : {};
      } catch {
        parsedData = { RawData: entryRow?.dataJson ?? '' };
      }

      const answers = flattenAnswers(parsedData);

      let y = 0;

      doc.setFillColor(236, 243, 255);
      doc.rect(0, 0, pageWidth, 24, 'F');
      doc.setDrawColor(33, 79, 171);
      doc.setLineWidth(0.8);
      doc.line(0, 24, pageWidth, 24);
      doc.setTextColor(33, 79, 171);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(headerTitle, pageWidth / 2, 13.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(93, 112, 138);
      doc.text(headerSubTitle, pageWidth / 2, 18.5, { align: 'center' });

      // Real form-paper style compact boxed header row
      const boxTop = 28;
      const boxHeight = 13;
      const boxGap = 2;
      const boxW = (contentWidth - boxGap * 2) / 3;

      const boxX1 = marginX;
      const boxX2 = boxX1 + boxW + boxGap;
      const boxX3 = boxX2 + boxW + boxGap;

      const drawHeaderField = (
        label: string,
        value: string,
        x: number,
        top: number,
        width: number,
        height: number
      ) => {
        doc.setDrawColor(210, 219, 232);
        doc.roundedRect(x, top, width, height, 1.2, 1.2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(93, 112, 138);
        doc.text(label, x + 1.8, top + 3.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.4);
        doc.setTextColor(30, 41, 59);
        const lines = doc.splitTextToSize(value || '-', width - 3.6).slice(0, 2);
        const valueStartY = top + 7.8;
        const maxY = top + height - 1.4;
        lines.forEach((line, idx) => {
          const lineY = valueStartY + idx * 3.6;
          if (lineY <= maxY) {
            doc.text(line, x + 1.8, lineY);
          }
        });
      };

      // Order requested: Patient Name, Date, Encounter Number, Form Name, Form Title, Created By
      drawHeaderField('Patient Name', patientName, boxX1, boxTop, boxW, boxHeight);
      drawHeaderField('Date', generatedAt || '-', boxX2, boxTop, boxW, boxHeight);
      drawHeaderField('Encounter Number', encounterNumber, boxX3, boxTop, boxW, boxHeight);

      const row2Top = boxTop + boxHeight + 3;
      const row2H = 13;
      drawHeaderField('Form Name', templateName || '-', boxX1, row2Top, boxW, row2H);
      drawHeaderField('Form Title', entryRow?.title || '-', boxX2, row2Top, boxW, row2H);
      drawHeaderField('Created By', entryRow?.createdBy || '-', boxX3, row2Top, boxW, row2H);

      y = row2Top + row2H + 6;

      answers.forEach((answer, idx) => {
        const questionLines = doc.splitTextToSize(answer.key, 72);
        const valueLines = doc.splitTextToSize(answer.value || '-', contentWidth - 84);
        const rowHeight = Math.max(questionLines.length, valueLines.length) * 4.5 + 4;

        if (y + rowHeight > pageHeight - 12) {
          doc.addPage();
          y = 14;
        }

        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 253);
          doc.rect(marginX, y - 3, contentWidth, rowHeight, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(62, 81, 101);
        doc.text(questionLines, marginX + 2, y + 1);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(38, 38, 38);
        doc.text(valueLines, marginX + 78, y + 1);
        y += rowHeight;
      });

      const pdfUrl = doc.output('bloburl');
      const popup = window.open(pdfUrl, '_blank');
      if (!popup) {
        dispatch(notify({ msg: 'Popup blocked. Please allow popups to preview PDF.', sev: 'warning' }));
      }
    } catch {
      dispatch(notify({ msg: 'Failed to generate PDF', sev: 'error' }));
    }
  };

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      title: <Translate>Title</Translate>,
      dataKey: 'title'
    },
    {
      key: 'created',
      title: <Translate>Created By / At</Translate>,
      render: (row: any) => (
        <UserDateCell
          login={row.createdBy}
          date={row.createdDate}
        />
      )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      width: 140,
      render: (row: any) => (
        <div style={{ display: 'flex', gap: 10 }}>
          <MdVisibility
            size={20}
            style={{ cursor: 'pointer', color: 'var(--primary-gray)' }}
          />

          <MdModeEdit
            size={20}
            style={{ cursor: 'pointer', color: 'var(--primary-gray)' }}
          />

            <MdDownload
              size={20}
              style={{ cursor: 'pointer', color: 'var(--deep-blue)' }}
              onClick={() => {handleDownloadPdf(row);}}
            />
        </div>
      )
    }
  ];

  return (
    <MyTable
      data={data?.data ?? []}
      columns={columns}
      loading={isFetching}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={data?.totalCount ?? 0}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default ClinicalFormsTable;