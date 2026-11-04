import React from 'react';

import PatientIssuedDocumentsTab from './accounting/components/PatientIssuedDocumentsTab';

type ReceiptProps = {
  patient?: any;
};

const Receipt: React.FC<ReceiptProps> = ({ patient }) => (
  <PatientIssuedDocumentsTab patient={patient} />
);

export default Receipt;
