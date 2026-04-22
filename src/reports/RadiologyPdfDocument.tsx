import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './RadiologyPdfStyles';
import { Image } from '@react-pdf/renderer';
import logo from '@/images/Logo_BLUE_New.png';

<Image
  src={logo}
  style={styles.logo}
/>
type Props = {
  data: {
    facilityName: string;
    departmentName: string;
    patientFullName: string;
    mrn: string;
    dateOfBirth: string;
    age: string;
    gender: string;
    primaryMobileNumber: string;
    encounterNumber: string;
    orderingPhysician: string;
    fromDepartment: string;
    testName: string;
    report: string;
    severity: string | null;
    approvedBy: string;
    reviewedBy: string;
  };
};

const stripHtml = (html?: string) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const splitReportSections = (report?: string) => {
  const text = stripHtml(report);

  if (!text) {
    return {
      findings: '-',
      impression: '-'
    };
  }

  const findingsMatch = text.match(/findings\s*:?\s*([\s\S]*?)(impression\s*:|$)/i);
  const impressionMatch = text.match(/impression\s*:?\s*([\s\S]*)/i);

  return {
    findings: findingsMatch?.[1]?.trim() || text,
    impression: impressionMatch?.[1]?.trim() || '-'
  };
};

const Field = ({
  label,
  value,
  isLast = false
}: {
  label: string;
  value?: string | null;
  isLast?: boolean;
}) => (
  <View style={isLast ? styles.cellLast : styles.cell}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '-'}</Text>
  </View>
);

const RadiologyPdfDocument: React.FC<Props> = ({ data }) => {
  const { findings } = splitReportSections(data.report);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          {/* LEFT */}
          <View style={styles.brandLeft}>
            <Image
              src={logo}
              style={styles.logo}
            />
            <Text style={styles.brandSubText}>
              {data.departmentName || ' '}
            </Text>
          </View>

          {/* CENTER */}
          <View style={styles.orgCenter}>
            <Text style={styles.orgTitle}>
              {data.facilityName || ' '}
            </Text>
          </View>

          {/* RIGHT (EMPTY) */}
          <View style={{ width: '33.33%' }} />
        </View>
        <View style={styles.divider} />

        {/* Title */}
        <View style={styles.reportTitleWrap}>
          <Text style={styles.reportTitle}>RADIOLOGY REPORT</Text>
          <View style={styles.reportTitleLine} />
        </View>

        {/* Patient / Encounter Info */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <Field label="FULL NAME" value={data.patientFullName} />
            <Field label="GENDER" value={data.gender} />
            <Field label="MRN NUMBER" value={data.mrn} />
            <Field label="PRIMARY MOBILE" value={data.primaryMobileNumber} />
            <Field
              label="D.O.B / AGE"
              value={`${data.dateOfBirth?.slice(0, 10) || '-'}${data.age ? ` (${data.age})` : ''}`}
              isLast
            />
          </View>

        </View>

        {/* Order */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Order</Text>

          <View style={styles.sectionBodyBox}>
            <View style={styles.orderTableHeader}>
              <View style={styles.orderCellHeader}>
                <Text style={styles.orderHeaderText}>Encounter ID</Text>
              </View>
              <View style={styles.orderCellHeader}>
                <Text style={styles.orderHeaderText}>TEST NAME</Text>
              </View>
              <View style={styles.orderCellHeader}>
                <Text style={styles.orderHeaderText}>ORDERING PHYSICIAN</Text>
              </View>

              <View style={styles.orderCellHeader}>
                <Text style={styles.orderHeaderText}>FROM DEPARTMENT</Text>
              </View>
            </View>

            <View style={styles.orderTableRow}>
              <View style={styles.orderCell}>
                <Text style={styles.orderValueText}>{data.encounterNumber || '-'}</Text>
              </View>
              <View style={styles.orderCell}>
                <Text style={styles.orderValueText}>{data.testName || '-'}</Text>
              </View>
              <View style={styles.orderCell}>
                <Text style={styles.orderValueText}>{data.orderingPhysician || '-'}</Text>
              </View>
              <View style={styles.orderCell}>
                <Text style={styles.orderValueText}>{data.fromDepartment || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Report severity */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Report</Text>

          <View style={styles.sectionBodyBox}>
            <View style={styles.severityRow}>
              <View style={styles.severityLabelBox}>
                <Text style={styles.severityLabelText}>SEVERITY LEVEL</Text>
              </View>

              <View style={styles.severityValueBox}>
                <Text style={styles.severityValueText}>
                  {data.severity ?? "-"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Findings / Impression */}
        <View style={styles.reportContent}>

          <Text style={styles.contentHeading}>Findings</Text>
          <Text style={styles.contentParagraph}>{findings || '-'}</Text>

        </View>

        {/* Footer */}
        <View style={styles.footerDivider} />

        <View style={styles.footer}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.footerLabel}>{data.reviewedBy || '-'}</Text>

          </View>

          <View style={styles.footerRight}>
            <Text style={styles.footerRightSmall}>Digitally Authenticated By</Text>
            <Text style={styles.footerRightName}>{data.approvedBy || '-'}</Text>

          </View>
        </View>
      </Page>
    </Document>
  );
};

export default RadiologyPdfDocument;