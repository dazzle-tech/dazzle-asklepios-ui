import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

type ReportValue = string | number | null | undefined;

type ReportSection = {
  title: string;
  value?: ReportValue;
};

type MedicalReportProps = {
  organizationName: string;
  patientName: ReportValue;
  mrn: ReportValue;
  dob: ReportValue;
  age: ReportValue;
  visitId: ReportValue;
  visitDate: ReportValue;
  visitType?: ReportValue;
  priority?: ReportValue;
  origin?: ReportValue;
  reason?: ReportValue;
  generatedAt: ReportValue;
  sections: ReportSection[];
};

const BORDER = "#D9DEE7";
const MUTED = "#6B7280";
const TITLE = "#1F2937";
const SECTION_BG = "#F5F7FA";

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingHorizontal: 28,
    paddingBottom: 44,
    fontSize: 10,
    color: TITLE,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },

  header: {
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 2,
  },
  orgName: {
    fontSize: 10,
    color: MUTED,
  },

  infoBlock: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoRowLast: {
    flexDirection: "row",
  },
  infoCell: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  infoCellLast: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 600,
    lineHeight: 1.35,
  },

  sectionCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  sectionHeader: {
    backgroundColor: SECTION_BG,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    fontSize: 10,
    fontWeight: 700,
  },
  sectionBody: {
    paddingVertical: 10,
    paddingHorizontal: 9,
    minHeight: 34,
  },
  sectionText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: TITLE,
  },
  emptyText: {
    fontSize: 9.5,
    color: MUTED,
  },

  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 16,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
  },
});

const formatValue = (value?: ReportValue): string => {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text === "" ? "-" : text;
};

const hasContent = (value?: ReportValue): boolean => {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
};

const Field = ({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value?: ReportValue;
  isLast?: boolean;
}) => {
  return (
    <View style={isLast ? styles.infoCellLast : styles.infoCell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{formatValue(value)}</Text>
    </View>
  );
};

const MedicalReport: React.FC<MedicalReportProps> = ({
  organizationName,
  patientName,
  mrn,
  dob,
  age,
  visitId,
  visitDate,
  visitType,
  priority,
  origin,
  reason,
  generatedAt,
  sections,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.reportTitle}>Nurse Observation Report</Text>
          <Text style={styles.orgName}>{organizationName}</Text>
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Field label="Patient" value={patientName} />
            <Field label="MRN" value={mrn} isLast />
          </View>

          <View style={styles.infoRow}>
            <Field label="DOB" value={dob} />
            <Field label="Age" value={age} isLast />
          </View>

          <View style={styles.infoRow}>
            <Field label="Visit ID" value={visitId} />
            <Field label="Visit Date" value={visitDate} isLast />
          </View>

          <View style={styles.infoRow}>
            <Field label="Visit Type" value={visitType} />
            <Field label="Priority" value={priority} isLast />
          </View>

          <View style={styles.infoRowLast}>
            <Field label="Origin" value={origin} />
            <Field label="Reason" value={reason} isLast />
          </View>
        </View>

        {sections?.map((section, index) => (
          <View
            key={`${section.title}-${index}`}
            style={styles.sectionCard}
            wrap={false}
          >
            <Text style={styles.sectionHeader}>
              {index + 1}. {section.title}
            </Text>

            <View style={styles.sectionBody}>
              {hasContent(section.value) ? (
                <Text style={styles.sectionText}>
                  {String(section.value)}
                </Text>
              ) : (
                <Text style={styles.emptyText}>No records found.</Text>
              )}
            </View>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>
            Confidential medical record - {formatValue(organizationName)}
          </Text>
          <Text>Report Generated: {formatValue(generatedAt)}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default MedicalReport;