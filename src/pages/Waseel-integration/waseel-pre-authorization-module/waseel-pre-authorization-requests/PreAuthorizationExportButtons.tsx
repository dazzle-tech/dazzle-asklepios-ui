import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import MyButton from '@/components/MyButton/MyButton';
import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';
import { calculateAgeFormat, formatDateWithoutSeconds } from '@/utils';

type Props = {
  data: PreAuthorizationTrackingResponse[];
  patientMap: Map<string, any>;
  encounterMap: Map<number, any>;
};

const PreAuthorizationExportButtons: React.FC<Props> = ({
  data,
  patientMap,
  encounterMap
}) => {
  const buildExportRows = () =>
    data.map(row => {
      const patient = patientMap.get(String(row.patientId));
      const encounter = encounterMap.get(row.encounterId);

      const patientName =
        [
          patient?.firstName,
          patient?.secondName,
          patient?.thirdName,
          patient?.lastName
        ]
          .filter(Boolean)
          .join(' ') || '-';

      return {
        'Pre-Auth Ref No': row.preAuthRefNo ?? '-',
        'Approval Request ID': row.approvalRequestId ?? '-',
        'Approval Response ID': row.approvalResponseId ?? '-',

        Patient: patientName,
        MRN: patient?.medicalRecordNumber ?? '-',
        Gender: patient?.sexAtBirth ?? '-',
        Age: patient?.dateOfBirth ? calculateAgeFormat(patient.dateOfBirth) : '-',
        Mobile:
          patient?.mobileNumber ??
          patient?.contactNumber ??
          patient?.phoneNumber ??
          '-',

        'Visit Number': encounter?.encounterNumber ?? '-',
        'Visit Date': encounter?.createdDate
          ? formatDateWithoutSeconds(encounter.createdDate)
          : '-',

        'Item Code': (row.items ?? []).map(i => i.itemCode).filter(Boolean).join(', ') || '-',
        'Item Name':
          (row.items ?? [])
            .map(i => i.itemDescription ?? i.nonStandardDesc)
            .filter(Boolean)
            .join(', ') || '-',
        'Item Type': (row.items ?? []).map(i => i.itemType).filter(Boolean).join(', ') || '-',
        'Item Decision':
          (row.items ?? []).map(i => i.itemDecision).filter(Boolean).join(', ') || '-',
        'Item Net': (row.items ?? []).map(i => i.net).filter(v => v != null).join(', ') || '-',
        'Waseel Item ID':
          (row.items ?? []).map(i => i.waseelItemId).filter(Boolean).join(', ') || '-',

        'Insurance ID': row.patientInsuranceId ?? '-',
        'Eligibility Response ID': row.eligibilityResponseId ?? '-',
        'Date Ordered': row.dateOrdered ?? '-',
        Type: row.preauthType ?? '-',
        'Sub Type': row.preauthSubType ?? '-',
        'Total Net': row.totalNet ?? '-',
        Status: row.status ?? '-',
        Outcome: row.outcome ?? '-',
        Message: row.message ?? row.disposition ?? '-',
        Cancelled: row.isCancelled ? 'Yes' : 'No',
        'Cancel Status': row.cancelStatus ?? '-',
        'Created Date': row.createdDate
          ? formatDateWithoutSeconds(row.createdDate)
          : '-'
      };
    });

  const handleExportExcel = () => {
    const exportRows = buildExportRows();

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pre Authorizations');
    XLSX.writeFile(workbook, 'pre-authorizations.xlsx');
  };

  const handleExportPdf = () => {
    const exportRows = buildExportRows();

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    doc.text('Pre-Authorization Requests', 40, 30);

    autoTable(doc, {
      startY: 45,
      head: [Object.keys(exportRows[0] ?? {})],
      body: exportRows.map(row => Object.values(row)),
      styles: {
        fontSize: 7,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fontSize: 7
      }
    });

    doc.save('pre-authorizations.pdf');
  };

  return (
    <div className="container-of-add-new-button pre-auth-export-buttons">
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faFileExcel} />}
        color="var(--deep-blue)"
        onClick={handleExportExcel}
        width="130px"
        disabled={!data.length}
      >
        Export Excel
      </MyButton>

      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faFilePdf} />}
        appearance="ghost"
        onClick={handleExportPdf}
        width="120px"
        disabled={!data.length}
      >
        Export PDF
      </MyButton>
    </div>
  );
};

export default PreAuthorizationExportButtons;