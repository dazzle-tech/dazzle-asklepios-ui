import ChatModal from '@/components/ChatModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetDiagnosticOrderTestResultQuery,
  useGetOrderTestResultNotesByResultIdQuery,
  useSaveDiagnosticOrderTestResultsNotesMutation
} from '@/services/labService';
import { useGenerateLabResultsPdfMutation } from '@/services/setup/resultReportApi';
import {
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetLovAllValuesQuery
} from '@/services/setupService';
import {
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsResult,
  newApDiagnosticOrderTestsResultNotes,
  newApDiagnosticTestLaboratory
} from '@/types/model-types-constructor';
import { initialListRequest, initialListRequestAllValues, ListRequest } from '@/types/types';
import { addFilterToListRequest, formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faComment,
  faPrint,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import './styles.less';
import { Checkbox, Form, HStack, Tooltip, Whisper, Message, useToaster } from 'rsuite';

interface ResultProps {
  patient: any;
  user: any;
}

const Result: React.FC<ResultProps> = ({ patient, user }) => {
  const dispatch = useAppDispatch();
  const toaster = useToaster();
  const [result, setResult] = useState<any>({ ...newApDiagnosticOrderTestsResult });
  const [record, setRecord] = useState({});
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [labDetails, setLabDetails] = useState<any>({ ...newApDiagnosticTestLaboratory });
  const [dateOrderFilter, setDateOrderFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });
  const [showAbnormal, setShowAbnormal] = useState(false);
  const [listResultResponse, setListResultResponse] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'review_at',
        operator: 'notMatch',
        value: 0
      }
    ]
  });

  const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
  const [saveResultNote] = useSaveDiagnosticOrderTestResultsNotesMutation();
  const [generateLabResultsPdf, { isLoading: isGeneratingPdf }] = useGenerateLabResultsPdfMutation();

  const {
    data: resultsList,
    refetch: resultFetch,
    isLoading: resultLoding,
    isFetching: featchingTest
  } = useGetDiagnosticOrderTestResultQuery({ ...listResultResponse });

  const { data: lovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });
  const { data: messagesResultList, refetch: fecthResultNotes } =
    useGetOrderTestResultNotesByResultIdQuery(result?.key || undefined, {
      skip: result.key == null
    });
  const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
    ...initialListRequest
  });

  const isResultSelected = (rowData: any) => {
    if (rowData && result && rowData.key === result.key) {
      return 'selected-row';
    } else return '';
  };

  useEffect(() => {
    const cat = laboratoryList?.object?.find((item: any) => item.testKey === test.testKey);
    setLabDetails(cat);
  }, [test, laboratoryList]);

  useEffect(() => {
    setTest({ ...result?.test });
  }, [result]);

  useEffect(() => {
    setListResultResponse(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'review_at',
          operator: 'notMatch',
          value: 0
        }
      ]
    }));
  }, [dateOrderFilter?.fromDate, dateOrderFilter?.toDate, patient?.key]);

  useEffect(() => {
    if (!resultLoding && resultsList?.object?.length) {
      const fromDate = dateOrderFilter.fromDate ? new Date(dateOrderFilter.fromDate) : null;
      const toDate = dateOrderFilter.toDate ? new Date(dateOrderFilter.toDate) : null;

      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(23, 59, 59, 999);

      const filtered = resultsList.object.filter((item: any) => {
        const createdAt = new Date(item.test?.order?.createdAt);
        return (!fromDate || createdAt >= fromDate) && (!toDate || createdAt <= toDate);
      });

      const value = filtered.map((order: any) => `(${order.key})`).join(' ') || '("")';

      setListResultResponse(prev => addFilterToListRequest('key', 'in', value, prev));
    }
  }, [dateOrderFilter, resultLoding, resultsList]);

  useEffect(() => {
    if (!showAbnormal) {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'review_at',
          operator: 'notMatch',
          value: 0
        }
      ];
      setListResultResponse(prev => ({
        ...prev,
        filters: updatedFilters
      }));
    }

    setListResultResponse(prev => {
      let updatedFilters = prev.filters.filter((f: any) => f.fieldName !== 'marker');

      if (showAbnormal) {
        updatedFilters.push({
          fieldName: 'marker',
          operator: 'notMatch',
          value: '6731498382453316'
        });
      }

      return {
        ...prev,
        filters: updatedFilters
      };
    });

    resultFetch();
  }, [showAbnormal, patient?.key, resultFetch]);

  useEffect(() => {
    resultFetch();
  }, [listResultResponse.filters, resultFetch]);

  const joinValuesFromArray = (keys: string[]) => {
    return keys
      .map((key: string) => lovValues?.object?.find((lov: any) => lov.key === key))
      .filter((obj: any) => obj !== undefined)
      .map((obj: any) => obj.lovDisplayVale)
      .join(', ');
  };

  const handleSendResultMessage = async (value: string) => {
    try {
      await saveResultNote({
        ...newApDiagnosticOrderTestsResultNotes,
        notes: value,
        testKey: test.key,
        orderKey: test.orderKey,
        resultKey: result.key,
        createdBy: user
      }).unwrap();
      dispatch(notify({ msg: 'Send Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Send Failed', sev: 'error' }));
    }
    await fecthResultNotes();
  };

  // Function to calculate age from date of birth
  const calculateAgeFormat = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Function to prepare data for PDF generation
  const prepareResultsData = () => {
    const results = resultsList?.object?.map((rowData: any) => {
      let testName = '';
      if (rowData.isProfile) {
        testName = rowData.test?.profileList?.find((item: any) => item.key == rowData?.testProfileKey)?.testName || 'N/A';
      } else {
        testName = rowData.test?.test?.testName || 'N/A';
      }

      let resultValue = '';
      let unit = '';
      let normalRange = '';

      if (rowData.normalRangeKey) {
        if (rowData.normalRange?.resultTypeLkey === '6209578532136054') {
          resultValue = rowData.resultLvalue ? rowData.resultLvalue.lovDisplayVale : rowData?.resultLkey;
          unit = labDetails?.resultUnitLvalue?.lovDisplayVale || '';
          normalRange = joinValuesFromArray(rowData.normalRange?.lovList) + ' ' + unit;
        } else if (rowData.normalRange?.resultTypeLkey == '6209569237704618') {
          resultValue = String(rowData.resultValueNumber);
          unit = labDetails?.resultUnitLvalue?.lovDisplayVale || '';

          if (rowData.normalRange?.normalRangeTypeLkey == '6221150241292558') {
            normalRange = rowData.normalRange?.rangeFrom + '-' + rowData.normalRange?.rangeTo + ' ' + unit;
          } else if (rowData.normalRange?.normalRangeTypeLkey == '6221162489019880') {
            normalRange = 'Less Than ' + rowData.normalRange?.rangeFrom + ' ' + unit;
          } else if (rowData.normalRange?.normalRangeTypeLkey == '6221175556193180') {
            normalRange = 'More Than ' + rowData.normalRange?.rangeTo + ' ' + unit;
          }
        }
      } else {
        resultValue = rowData.resultText || 'N/A';
        normalRange = 'Not Defined';
      }

      return {
        orderId: rowData.test?.orderId || 'N/A',
        approvedAt: rowData.approvedAt,
        testName: testName,
        resultValue: resultValue,
        unit: unit,
        normalRange: normalRange,
        marker: rowData.marker,
        reviewDate: rowData.reviewAt ? formatDateWithoutSeconds(rowData.reviewAt) : 'N/A',
        reviewBy: rowData.reviewByUser?.fullName || 'N/A'
      };
    }) || [];

    return {
      patientInfo: {
        name: patient?.fullName || 'N/A',
        mrn: patient?.patientMrn || 'N/A',
        dob: patient?.dob || 'N/A',
        age: patient?.dob ? calculateAgeFormat(patient.dob) + ' years' : 'N/A',
        gender: patient?.genderLvalue?.lovDisplayVale || 'Not specified'
      },
      results: results
    };
  };

  // Function to generate and download PDF
  const handleGeneratePdf = async () => {
    try {
      console.log('Starting Results PDF generation...');

      const data = prepareResultsData();
      console.log('Prepared data:', data);

      const result = await generateLabResultsPdf(data).unwrap();

      // Create blob URL and trigger download
      const blob = new Blob([result], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lab_Results_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      toaster.push(
        <Message showIcon type="success" closable>
          Laboratory Results Report generated successfully!
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );

      console.log('Results PDF generated and downloaded successfully');
    } catch (error) {
      console.error('Error generating Results PDF:', error);

      // Show error message
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to generate Laboratory Results Report. Please try again.
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );
    }
  };

  const tableColomns = [
    {
      key: 'orderId',
      title: <Translate>ORDER ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.test?.orderId;
      }
    },
    {
      key: 'approvedAt',
      title: <Translate>Result Date</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData.approvedAt);
      }
    },
    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) => {
        if (rowData.isProfile) {
          return rowData.test?.profileList?.find((item: any) => item.key == rowData?.testProfileKey)
            ?.testName;
        } else {
          return rowData.test?.test?.testName;
        }
      }
    },
    {
      key: 'testResultUnit',
      title: <Translate>TEST RESULT,UNIT</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) => {
        if (rowData.normalRangeKey) {
          if (rowData.normalRange?.resultTypeLkey === '6209578532136054') {
            return (
              <span>
                {rowData.resultLvalue ? rowData.resultLvalue.lovDisplayVale : rowData?.resultLkey}
              </span>
            );
          } else if (rowData.normalRange?.resultTypeLkey == '6209569237704618') {
            return <span>{rowData.resultValueNumber}</span>;
          }
        } else {
          return <span>{rowData.resultText}</span>;
        }
      }
    },
    {
      key: 'normalRange',
      title: <Translate>NORMAL RANGE</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) => {
        if (rowData.normalRangeKey) {
          if (rowData.normalRange?.resultTypeLkey == '6209578532136054') {
            return (
              joinValuesFromArray(rowData.normalRange?.lovList) +
              ' ' +
              labDetails?.resultUnitLvalue?.lovDisplayVale || ''
            );
          } else if (rowData.normalRange?.resultTypeLkey == '6209569237704618') {
            if (rowData.normalRange?.normalRangeTypeLkey == '6221150241292558') {
              return (
                rowData.normalRange?.rangeFrom +
                '_' +
                rowData.normalRange?.rangeTo +
                ' ' +
                labDetails?.resultUnitLvalue?.lovDisplayVale
              );
            } else if (rowData.normalRange?.normalRangeTypeLkey == '6221162489019880') {
              return (
                'Less Than ' +
                rowData.normalRange?.rangeFrom +
                ' ' +
                labDetails?.resultUnitLvalue?.lovDisplayVale
              );
            } else if (rowData.normalRange?.normalRangeTypeLkey == '6221175556193180') {
              return (
                'More Than ' +
                rowData.normalRange?.rangeTo +
                ' ' +
                labDetails?.resultUnitLvalue?.lovDisplayVale
              );
            }
          }
        } else {
          return 'Normal Range Not Defined';
        }
      }
    },
    {
      key: 'marker',
      title: <Translate>MARKER</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) => {
        if (rowData.marker == '6730122218786367') {
          return <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: '1em' }} />;
        } else if (rowData.marker == '6731498382453316') {
          return 'Normal';
        } else if (rowData.marker == '6730083474405013') {
          return <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: '1em' }} />;
        } else if (rowData.marker == '6730094497387122') {
          return <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: '1em' }} />;
        } else if (rowData.marker == '6730104027458969') {
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '1em' }} />
              <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: '1em' }} />
            </HStack>
          );
        } else if (rowData.marker == '6730652890616978') {
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '1em' }} />
              <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: '1em' }} />
            </HStack>
          );
        }
      }
    },
    {
      key: 'comments',
      title: <Translate>COMMENTS</Translate>,
      flexGrow: 1,
      fullText: true,
      render: (rowData: any) => {
        return (
          <HStack spacing={10}>
            <FontAwesomeIcon
              icon={faComment}
              style={{
                fontSize: '1em',
                color: rowData.hasComments ? '#007bff' : 'gray',
                cursor: 'pointer'
              }}
              onClick={() => {
                setResult(rowData);
                setOpenNoteResultModal(true);
              }}
            />
          </HStack>
        );
      }
    },
    {
      key: 'reviewAt',
      title: <Translate>Review At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.reviewByUser?.fullName}</span>
            <br />
            <span className="date-table-style">
              {rowData.reviewAt ? new Date(rowData.reviewAt).toLocaleString() : ''}
            </span>
          </>
        );
      }
    }
  ];

  const pageIndex = listResultResponse.pageNumber - 1;
  const rowsPerPage = listResultResponse.pageSize;
  const totalCount = resultsList?.extraNumeric ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setListResultResponse({ ...listResultResponse, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListResultResponse({
      ...listResultResponse,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  const filters = () => {
    return (
      <Form
        layout="inline"
        fluid
        className="date-filter-form"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "8px 16px"
        }}
      >
        <MyInput
          column
          width={160}
          fieldType="date"
          fieldLabel="Order From Date"
          fieldName="fromDate"
          record={dateOrderFilter}
          setRecord={setDateOrderFilter}
        />
        <MyInput
          width={160}
          column
          fieldType="date"
          fieldLabel="Order To Date"
          fieldName="toDate"
          record={dateOrderFilter}
          setRecord={setDateOrderFilter}
        />
        <MyInput
          width={160}
          column
          fieldLabel="Test Name"
          fieldType="text"
          fieldName="testName"
          record={record}
          setRecord={setRecord}
        />
        <Checkbox
          className="result-checkbox-show-abnormal-result"
          checked={showAbnormal}
          onChange={() => {
            if (showAbnormal) {
              const updatedFilters = listResultResponse.filters.filter(
                (f: any) => f.fieldName !== "marker"
              );
              setListResultResponse({
                ...listResultResponse,
                filters: updatedFilters
              });
            }
            setShowAbnormal(!showAbnormal);
          }}
        >
          Show Abnormal Result
        </Checkbox>

        <MyButton
          onClick={handleGeneratePdf}
          loading={isGeneratingPdf}
          disabled={isGeneratingPdf || !resultsList?.object?.length}
          prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
          color="var(--deep-blue)"
          className="generate-report-btn"
          style={{
            marginLeft: "auto"
          }}
        >
          {isGeneratingPdf ? "Generating Report..." : "Generate Complete Report"}
        </MyButton>
      </Form>
    );
  };


  return (
    <>
      <div className="results-actions-header">


        {resultsList?.object?.length > 0 && (
          <div className="results-count-badge">
            <FontAwesomeIcon icon={faCircleExclamation} style={{ marginRight: '5px' }} />
            <span>{resultsList.object.length} Results Available</span>
          </div>
        )}
      </div>

      <MyTable
        filters={filters()}
        columns={tableColomns}
        data={resultsList?.object || []}
        loading={resultLoding || isGeneratingPdf}
        onRowClick={(rowData: any) => {
          setResult(rowData);
        }}
        rowClassName={isResultSelected}
        height={250}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <ChatModal
        open={openNoteResultModal}
        setOpen={setOpenNoteResultModal}
        handleSendMessage={handleSendResultMessage}
        title={'Comments'}
        list={messagesResultList?.object}
        fieldShowName={'notes'}
      />
    </>
  );
};

export default Result;