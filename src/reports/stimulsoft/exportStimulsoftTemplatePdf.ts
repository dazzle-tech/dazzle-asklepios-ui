import { createPreparedStimulsoftReport } from './prepareStimulsoftReport';
import { setActiveStimulsoftReport } from './stimulsoftApiProxy';

const toPdfBlob = (data: unknown): Blob => {
  if (data instanceof Blob) {
    return data.type.includes('pdf')
      ? data
      : new Blob([data], { type: 'application/pdf' });
  }
  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: 'application/pdf' });
  }
  if (data instanceof Uint8Array) {
    return new Blob([data], { type: 'application/pdf' });
  }
  if (Array.isArray(data)) {
    return new Blob([new Uint8Array(data)], { type: 'application/pdf' });
  }
  if (typeof data === 'string') {
    if (data.startsWith('%PDF')) {
      return new Blob([data], { type: 'application/pdf' });
    }
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'application/pdf' });
  }
  throw new Error('Stimulsoft did not return a PDF.');
};

const renderReport = async (report: any) => {
  if (typeof report.renderAsync2 === 'function') {
    await report.renderAsync2();
    return;
  }
  if (typeof report.renderAsync === 'function') {
    await new Promise<void>((resolve, reject) => {
      try {
        const result = report.renderAsync(() => resolve());
        if (result && typeof result.then === 'function') {
          result.then(() => resolve()).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
    return;
  }
  report.render();
};

const exportPdfData = async (Stimulsoft: any, report: any) => {
  const format = Stimulsoft.Report.StiExportFormat.Pdf;
  if (typeof report.exportDocumentAsync2 === 'function') {
    return report.exportDocumentAsync2(format);
  }
  if (typeof report.exportDocumentAsync === 'function') {
    return new Promise((resolve, reject) => {
      try {
        const result = report.exportDocumentAsync((data: unknown) => resolve(data), format);
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  return report.exportDocument(format);
};

export const exportStimulsoftTemplatePdf = async (
  templateJson: string,
  params: Record<string, string> = {}
): Promise<Blob> => {
  const { Stimulsoft, report } = await createPreparedStimulsoftReport(
    templateJson,
    params
  );

  try {
    await renderReport(report);
    const data = await exportPdfData(Stimulsoft, report);
    return toPdfBlob(data);
  } finally {
    setActiveStimulsoftReport(null);
  }
};
