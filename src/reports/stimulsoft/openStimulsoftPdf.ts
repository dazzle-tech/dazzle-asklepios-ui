export const openPdfBlob = (blob: Blob) => {
  const pdfBlob = blob.type ? blob : new Blob([blob], { type: 'application/pdf' });
  const fileURL = window.URL.createObjectURL(pdfBlob);
  const win = window.open(fileURL, '_blank');
  if (!win) {
    window.URL.revokeObjectURL(fileURL);
    throw new Error('Popup blocked. Please allow popups for this site.');
  }
  win.focus();
};
