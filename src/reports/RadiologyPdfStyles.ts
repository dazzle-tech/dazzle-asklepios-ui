import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
    page: {
        paddingTop: 22,
        paddingHorizontal: 26,
        paddingBottom: 24,
        fontSize: 10,
        color: '#1f2937',
        fontFamily: 'Helvetica'
    },

    // Top Header
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        minHeight: 55
    },

    brandLeft: {
        width: '33.33%',
        justifyContent: 'center',
        alignItems: 'flex-start'
    },

    orgCenter: {
        width: '33.33%',
        alignItems: 'center',
        justifyContent: 'center'
    },


    orgTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#05213F',
        textAlign: 'center',
        width: '100%'
    },
    logo: {
        width: 85,
        height: 30,
        objectFit: 'contain',
        marginBottom: 3
    },

    brandSubText: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 2
    },
    divider: {
        borderBottomWidth: 1.5,
        borderBottomColor: '#334155',
        marginBottom: 14
    },

    // Main Title
    reportTitleWrap: {
        alignItems: 'center',
        marginBottom: 12
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 4,
        color: '#0b2f63'
    },
    reportTitleLine: {
        width: 34,
        borderBottomWidth: 1.5,
        borderBottomColor: '#0b2f63',
        marginTop: 6,
        marginBottom: 8
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 14
    },
    metaLabel: {
        fontSize: 8,
        color: '#475569',
        fontWeight: 'bold'
    },
    metaValue: {
        fontSize: 9,
        color: '#111827',
        fontWeight: 'bold'
    },

    // Info Grid
    grid: {
        marginTop: 4,
        marginBottom: 14
    },
    gridRow: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderColor: '#d8e0ea'
    },
    gridRowLast: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#d8e0ea'
    },
    cell: {
        flex: 1,
        paddingVertical: 7,
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: '#d8e0ea',
        minHeight: 38
    },
    cellLast: {
        flex: 1,
        paddingVertical: 7,
        paddingHorizontal: 8,
        minHeight: 38
    },
    fieldLabel: {
        fontSize: 7,
        color: '#94a3b8',
        marginBottom: 3,
        textTransform: 'uppercase'
    },
    fieldValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827'
    },

    // Section blocks
    section: {
        marginTop: 10,
        marginBottom: 10
    },
    sectionHeader: {
        backgroundColor: '#eef2f7',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#0b2f63',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    sectionBodyBox: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#d8e0ea',
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3
    },

    orderTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#d8e0ea'
    },
    orderTableRow: {
        flexDirection: 'row'
    },
    orderCellHeader: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 8
    },
    orderCell: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8
    },
    orderHeaderText: {
        fontSize: 7,
        color: '#64748b',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    orderValueText: {
        fontSize: 9,
        color: '#111827'
    },

    // Severity
    severityRow: {
        flexDirection: 'row',
        padding: 12
    },
    severityLabelBox: {
        width: 95,
        borderWidth: 1,
        borderColor: '#d8e0ea',
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
    },
    severityValueBox: {
        width: 95,
        borderWidth: 1,
        borderColor: '#2563eb',
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8
    },
    severityLabelText: {
        fontSize: 8,
        color: '#64748b',
        fontWeight: 'bold'
    },
    severityValueText: {
        fontSize: 8,
        color: '#2563eb',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },

    // Findings / Impression
    reportContent: {
        borderWidth: 1,
        borderColor: '#d8e0ea',
        borderRadius: 4,
        padding: 14,
        minHeight: 180
    },
    bodyPartTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 20
    },
    contentHeading: {
        fontSize: 11,
        color: '#334155',
        marginBottom: 10
    },
    contentParagraph: {
        fontSize: 10,
        color: '#111827',
        lineHeight: 1.6,
        marginBottom: 24
    },

    // Footer
    footerDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        marginTop: 18,
        marginBottom: 16
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    signatureBlock: {
        width: '35%'
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        marginBottom: 8,
        width: '100%'
    },
    footerLabel: {
        fontSize: 7,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    footerRight: {
        width: '35%',
        alignItems: 'flex-end'
    },
    footerRightSmall: {
        fontSize: 7,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 3
    },
    footerRightName: {
        fontSize: 9,
        color: '#111827',
        fontWeight: 'bold'
    },
    footerRightEmail: {
        fontSize: 8,
        color: '#334155'
    },

});