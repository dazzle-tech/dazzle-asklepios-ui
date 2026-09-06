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
  useGenerateSettlementPdfMutation
} from '@/services/billing/claimSettlementService';

import { notify } from '@/utils/uiReducerActions';
import { useDispatch } from 'react-redux';

type AppliedFilters = {
  payerNphiesId: string;
  encounterType: string | null;
  fromDate: string;
  toDate: string;
};

type Props = {
  appliedFilters: AppliedFilters | null;
  insuranceCompanyName: string;
};

const SettlementReportButton = ({
  appliedFilters,
  insuranceCompanyName
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

          page: 0,

          size: 100000,

          sort: 'id,desc'
        }).unwrap();

      const pdfBlob =
        await generateSettlementPdf({

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

            rows:
              allRowsResponse.content.map(
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
        }).unwrap();

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
          <FontAwesomeIcon
            icon={faPrint}
            style={{ marginRight: 8 }}
          />
        )}
      >
        <Translate>Print Report</Translate>
      </MyButton>

      <MyModal
        open={openLangModal}
        setOpen={setOpenLangModal}
        title="Select Language"
        size="xs"
        bodyheight="25vh"
        actionButtonFunction={
          handleGenerateReport
        }
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

export default SettlementReportButton;