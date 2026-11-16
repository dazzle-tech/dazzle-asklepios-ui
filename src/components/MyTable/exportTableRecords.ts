import React, { type ReactNode } from 'react';
import type { ColumnConfig } from './MyTable';

export type TableExportFormat = 'pdf' | 'xlsx' | 'docx';

const ACTION_COLUMN_KEYS = new Set(['action', 'actions', 'icon', 'icons']);

const cleanText = (value: string) =>
  value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[ \t]+\n/g, '\n').trim();

export const nodeToText = (node: ReactNode): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) {
    return cleanText(node.map(nodeToText).filter(Boolean).join(' '));
  }
  if (!React.isValidElement(node)) return '';

  const props = node.props as {
    children?: ReactNode;
    title?: unknown;
    label?: unknown;
  };
  const elementType = typeof node.type === 'string' ? node.type.toLowerCase() : '';
  if (elementType === 'br') return '\n';

  const childText = nodeToText(props?.children);
  if (childText) return childText;
  if (typeof props?.title === 'string') return props.title.trim();
  if (typeof props?.label === 'string') return props.label.trim();
  return '';
};

const valueToText = (value: unknown): string => {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number') return cleanText(String(value));
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return cleanText(value.toLocaleString());
  if (Array.isArray(value) || React.isValidElement(value)) return nodeToText(value as ReactNode);
  return '';
};

const columnTitle = (column: ColumnConfig) =>
  cleanText(column.exportTitle ?? nodeToText(column.title));

const exportableColumns = (columns: ColumnConfig[]) =>
  columns.filter(column => {
    if (column.exportable === false) return false;
    if (ACTION_COLUMN_KEYS.has(column.key.toLowerCase())) return false;
    return Boolean(columnTitle(column));
  });

const cellText = (column: ColumnConfig, row: any, index: number) => {
  try {
    if (column.exportValue) return valueToText(column.exportValue(row, index));
    if (column.render) return nodeToText(column.render(row, index));
    return valueToText(row?.[column.dataKey || column.key]);
  } catch {
    return valueToText(row?.[column.dataKey || column.key]);
  }
};

export const buildExportTable = (columns: ColumnConfig[], data: any[]) => {
  const exportColumns = exportableColumns(columns);
  const headers = exportColumns.map(columnTitle);
  const rows = (data ?? []).map((row, index) =>
    exportColumns.map(column => cellText(column, row, index))
  );

  return { headers, rows };
};

const safeFileName = (fileName?: string) => {
  const cleaned = (fileName || 'table-export').replace(/[\\/:*?"<>|[\]]+/g, ' ').trim();
  return cleaned || 'table-export';
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const callableExport = (module: any) => {
  if (typeof module?.default === 'function') return module.default;
  if (typeof module?.default?.default === 'function') return module.default.default;
  if (typeof module === 'function') return module;
  return module?.default ?? module;
};

const exportPdf = async (headers: string[], rows: string[][], fileName: string) => {
  const [jsPdfModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const jsPDF = callableExport(jsPdfModule);
  const autoTable = callableExport(autoTableModule);
  const wide = headers.length > 6;
  const doc = new jsPDF({
    orientation: wide ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  doc.setFontSize(12);
  doc.text(fileName, 40, 32);

  autoTable(doc, {
    startY: 46,
    head: [headers],
    body: rows,
    styles: {
      fontSize: wide ? 7 : 9,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [70, 79, 96],
      textColor: 255,
      fontStyle: 'bold'
    },
    margin: { top: 40, right: 24, bottom: 24, left: 24 }
  });

  doc.save(`${fileName}.pdf`);
};

const exportXlsx = async (headers: string[], rows: string[][], fileName: string) => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = headers.map((header, index) => {
    const longest = rows.reduce(
      (max, row) => Math.max(max, String(row[index] ?? '').length),
      header.length
    );
    return { wch: Math.min(Math.max(longest + 2, 12), 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, fileName.slice(0, 31) || 'Export');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

const exportDocx = async (headers: string[], rows: string[][], fileName: string) => {
  const docxModule = await import('docx');
  const docx = docxModule.Document ? docxModule : (docxModule as { default?: typeof docxModule }).default;
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, ShadingType } =
    docx ?? docxModule;

  const columnWidth = Math.max(Math.floor(9360 / Math.max(headers.length, 1)), 600);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      header =>
        new TableCell({
          width: { size: columnWidth, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: '464F60' },
          children: [
            new Paragraph({
              children: [new TextRun({ text: header, bold: true, color: 'FFFFFF', size: 18 })]
            })
          ]
        })
    )
  });

  const bodyRows = rows.map(
    row =>
      new TableRow({
        children: row.map(
          value =>
            new TableCell({
              width: { size: columnWidth, type: WidthType.DXA },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value || '', size: 18 })]
                })
              ]
            })
        )
      })
  );

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: fileName, bold: true, size: 28 })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: headers.map(() => columnWidth),
            rows: [headerRow, ...bodyRows]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, `${fileName}.docx`);
};

export const exportTableRecords = async (
  format: TableExportFormat,
  columns: ColumnConfig[],
  data: any[],
  fileName?: string
) => {
  const { headers, rows } = buildExportTable(columns, data);
  if (!headers.length || !rows.length) {
    throw new Error('There are no records to export.');
  }

  const downloadName = safeFileName(fileName);
  if (format === 'pdf') return exportPdf(headers, rows, downloadName);
  if (format === 'xlsx') return exportXlsx(headers, rows, downloadName);
  return exportDocx(headers, rows, downloadName);
};
