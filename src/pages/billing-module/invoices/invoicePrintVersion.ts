export type InvoicePrintVersion = 'ORIGINAL' | 'COPY';

const STORAGE_KEY = 'asklepios-printed-invoices';

const readPrintedInvoices = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

const writePrintedInvoices = (printed: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...printed]));
};

export const getInvoicePrintVersion = (invoiceNumber: string): InvoicePrintVersion =>
  readPrintedInvoices().has(invoiceNumber) ? 'COPY' : 'ORIGINAL';

export const markInvoiceAsPrinted = (invoiceNumber: string) => {
  const printed = readPrintedInvoices();
  printed.add(invoiceNumber);
  writePrintedInvoices(printed);
};

export const invoicePrintVersionLabel = (version: InvoicePrintVersion) =>
  version === 'ORIGINAL' ? 'Original' : 'Copy';
