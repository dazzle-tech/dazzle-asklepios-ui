import React, { useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';

import {
  useLazyGetClaimSettlementsQuery,
  useGenerateSettlementPdfMutation,
  useGenerateSettlementPdfWithoutPatientAndClaimMutation
} from '@/services/billing/claimSettlementService';

import { notify } from '@/utils/uiReducerActions';
import { useDispatch } from 'react-redux';

type AppliedFilters = {
  payerNphiesId: string;
  encounterType: string | null;
  fromDate: string;
  toDate: string;
  settlementNo: string | null;
};

type Props = {
  appliedFilters: AppliedFilters | null;
  insuranceCompanyName: string;
  groupBySettlement?: boolean;
  buttonLabel?: string;
};

const SettlementReportButton = ({
  appliedFilters,
  insuranceCompanyName,
  groupBySettlement = false,
  buttonLabel = 'Print Report'
}: Props) => {

  const dispatch = useDispatch();

  const [openLangModal, setOpenLangModal] = useState(false);

  const [selectedLang, setSelectedLang] = useState({
    lang: 'en'
  });

  const [loadAllRows] =
    useLazyGetClaimSettlementsQuery();

  const [generateSettlementPdf] =
    useGenerateSettlementPdfMutation();
  const [generateSettlementPdfWithoutPatientAndClaim] =
    useGenerateSettlementPdfWithoutPatientAndClaimMutation();

  const [loading, setLoading] =
    useState(false);

  const langOptions = [
    {
      label: 'English',
      value: 'en'
    },
    {
      label: 'Arabic',
      value: 'ar'
    }
  ];

  const handleGenerateReport = async () => {

    if (!appliedFilters) {
      return;
    }

    try {

      setLoading(true);

      const timezone =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone;

      const allRowsResponse =
        await loadAllRows({
          payerNphiesId:
            appliedFilters.payerNphiesId,

          encounterType:
            appliedFilters.encounterType,

          fromDate:
            appliedFilters.fromDate,

          toDate:
            appliedFilters.toDate,

          settlementNo:
            appliedFilters.settlementNo,

          page: 0,

          size: 100000,

          sort: 'id,desc'
        }).unwrap();

      const reportRequest = {
        timezone,
        lang: selectedLang.lang,
        body: {

            criteria: {

              insuranceCompanyId: null,

              insuranceCompanyName,

              settlementDateFrom:
                appliedFilters.fromDate.substring(
                  0,
                  10
                ),

              settlementDateTo:
                appliedFilters.toDate.substring(
                  0,
                  10
                ),

              encounterType:
                appliedFilters.encounterType
            },

            rows: groupBySettlement
              ? groupRowsBySettlement(allRowsResponse.content)
              : allRowsResponse.content.map(
                  row => ({

                  patientName:
                    row.patientName || '',

                  patientId:
                    row.medicalRecordNumber ||
                    (row.patientId != null
                      ? String(row.patientId)
                      : ''),

                  invoiceNumber:
                    row.invoiceNumber || '',

                  settlementNumber:
                    row.settlementNo || '',

                  settlementDate:
                    row.settlementDate
                      ? row.settlementDate.substring(
                          0,
                          10
                        )
                      : null,

                  insuranceCompany:
                    row.insuranceCompany || '',

                  claimNumber:
                    row.claimNo || '',

                  claimDate:
                    row.claimDate
                      ? row.claimDate.substring(
                          0,
                          10
                        )
                      : null,

                  billedAmount:
                    row.billedAmount,

                  approvedAmount:
                    row.approvedAmount,

                  rejectedAmount:
                    row.rejectedAmount,

                  patientShare:
                    row.patientShare,

                  insuranceAmount:
                    row.insuranceAmount,

                  paidAmount:
                    row.paidAmount,

                  outstandingAmount:
                    row.outstandingAmount,

                  settlementStatus:
                    row.settlementStatus

                  })
                )
        }
      };

      const pdfBlob = await (groupBySettlement
        ? generateSettlementPdfWithoutPatientAndClaim(reportRequest)
        : generateSettlementPdf(reportRequest)
      ).unwrap();

      const fileURL =
        window.URL.createObjectURL(pdfBlob);

      const win =
        window.open(fileURL, '_blank');

      if (win) {

        win.focus();

        setOpenLangModal(false);

      } else {

        dispatch(
          notify({
            msg: 'Popup blocked. Please allow popups for this site.',
            sev: 'warning'
          })
        );
      }

    } catch (error: any) {

      dispatch(
        notify({
          msg:
            error?.data?.message ||
            'Failed to generate report',
          sev: 'error'
        })
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <>
      <MyButton
        appearance="primary"
        loading={loading}
        disabled={!appliedFilters}
        onClick={() => setOpenLangModal(true)}
        prefixIcon={() => (
          <FontAwesomeIcon icon={faPrint} style={{ marginRight: 8 }} />
        )}
      >
        <Translate>{buttonLabel}</Translate>
      </MyButton>

      <MyModal
        open={openLangModal}
        setOpen={setOpenLangModal}
        title="Select Language"
        size="xs"
        bodyheight="25vh"
        actionButtonFunction={handleGenerateReport}
        content={
          <Form>
            <MyInput
              fieldType="select"
              fieldLabel="Language"
              fieldName="lang"
              selectData={langOptions}
              record={selectedLang}
              setRecord={setSelectedLang}
              width="100%"
            />
          </Form>
        }
      />
    </>
  );
};

const groupRowsBySettlement = (rows: any[]) => {
  const groups = new Map<
    string,
    { row: Record<string, any>; statuses: Set<string> }
  >();

  rows.forEach((sourceRow, index) => {
    const settlementNumber = sourceRow.settlementNo || '';
    const groupKey = settlementNumber || `unassigned-${index}`;
    let group = groups.get(groupKey);

    if (!group) {
      group = {
        row: {
          patientName: '',
          patientId: '',
          invoiceNumber: '',
          settlementNumber,
          settlementDate: sourceRow.settlementDate
            ? sourceRow.settlementDate.substring(0, 10)
            : null,
          insuranceCompany: sourceRow.insuranceCompany || '',
          claimNumber: '',
          claimDate: null,
          billedAmount: 0,
          approvedAmount: 0,
          rejectedAmount: 0,
          patientShare: 0,
          insuranceAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          settlementStatus: ''
        },
        statuses: new Set<string>()
      };
      groups.set(groupKey, group);
    }

    [
      'billedAmount',
      'approvedAmount',
      'rejectedAmount',
      'patientShare',
      'insuranceAmount',
      'paidAmount',
      'outstandingAmount'
    ].forEach(field => {
      group!.row[field] += Number(sourceRow[field]) || 0;
    });

    if (sourceRow.settlementStatus) {
      group.statuses.add(sourceRow.settlementStatus);
    }
  });

  return Array.from(groups.values(), ({ row, statuses }) => ({
    ...row,
    settlementStatus:
      statuses.size === 1 ? Array.from(statuses)[0] : statuses.size ? 'MIXED' : ''
  }));
};

export default SettlementReportButton;