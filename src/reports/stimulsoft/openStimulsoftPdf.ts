const sanitizeFileName = (name?: string) =>
  String(name || 'report')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'report';

export const downloadPdfBlob = async (blob: Blob, fileName = 'report.pdf') => {
  const type = (blob.type || '').toLowerCase();
  if (type.includes('json') || type.includes('text')) {
    const text = await blob.text();
    let message = text?.trim() || 'Report PDF failed';
    try {
      const parsed = JSON.parse(text);
      message =
        parsed?.message || parsed?.detail || parsed?.error || parsed?.title || message;
    } catch {
      /* keep text */
    }
    throw new Error(message);
  }

  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const fileURL = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  const downloadName = fileName.toLowerCase().endsWith('.pdf')
    ? fileName
    : `${sanitizeFileName(fileName)}.pdf`;
  link.href = fileURL;
  link.download = downloadName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(fileURL), 30_000);
};

export const openPdfBlob = downloadPdfBlob;
