import Translate from '@/components/Translate';
import { forwardRef, useImperativeHandle } from 'react';
import {
  useGetDiagnosticOrderTestResultQuery,
  useGetOrderTestResultNotesByResultIdQuery,
  useSaveDiagnosticOrderTestResultMutation,
  useSaveDiagnosticOrderTestResultsNotesMutation,
  useSaveLabResultLogMutation
} from '@/services/labService';
import { useGetLovAllValuesQuery } from '@/services/setupService';
import {
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsResult,
  newApDiagnosticOrderTestsResultNotes,
  newApLabResultLog
} from '@/types/model-types-constructor';
import { initialListRequest, initialListRequestAllValues, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Form, HStack, Input, Panel, SelectPicker, Tooltip, Whisper } from 'rsuite';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatDateWithoutSeconds } from '@/utils';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faComment,
  faDiagramPredecessor,
  faFileLines,
  faPenToSquare,
  faPrint,
  faStar,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import ConversionIcon from '@rsuite/icons/Conversion';
import ChatModal from '@/components/ChatModal';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import MyTable from '@/components/MyTable';
import CancellationModal from '@/components/CancellationModal';
import SampleModal from './SampleModal';
import LogResult from './LogResult';
import MyInput from '@/components/MyInput';
import LaboratoryResultComparison from '../encounter/encounter-component/diagnostics-result/LaboratoryResultComparison';
import MyModal from '@/components/MyModal/MyModal';
type ResultProps = {
  test: any;
  setTest: any;
  saveTest: any;
  result: any;
  setResult: any;
  patient: any;
  labDetails: any;
  samplesList: any;
  fecthSample: () => void;
  fetchTest: () => void;
  refetchTest: () => void;
  listResultResponse: any;
  setListResultResponse: any;
};

const Result = forwardRef<unknown, ResultProps>(
  (
    {
      test,
      setTest,
      saveTest,
      result,
      setResult,
      patient,
      labDetails,
      samplesList,
      fetchTest,
      refetchTest,
      fecthSample,
      listResultResponse,
      setListResultResponse,
      fetchAllTests
    },

    ref
  ) => {
    useImperativeHandle(ref, () => ({
      resultFetch
    }));
    const dispatch = useAppDispatch();
    const uiSlice = useAppSelector(state => state.auth);
    const [localUser, setLocalUser] = useState(uiSlice?.user);
    const [activeRowKey, setActiveRowKey] = useState(null);
    const [openSampleModal, setOpenSampleModal] = useState(false);
    const [openLogModal, setOpenLogModal] = useState(false);
    const [openCopmarisonModal, setOpenComparisonModal] = useState(false);
    const [openRejectedResultModal, setOpenRejectedResultModal] = useState(false);
    const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
    const { data: lovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });
    const [saveResult, saveResultMutation] = useSaveDiagnosticOrderTestResultMutation();
    const [saveResultNote] = useSaveDiagnosticOrderTestResultsNotesMutation();
    const [saveResultLog, saveResultLogMutation] = useSaveLabResultLogMutation();
    const [dateFilter, setDateFilter] = useState({
      fromDate: new Date(),
      toDate: new Date()
    });
    const [listPrevResultResponse, setListPrevResultResponse] = useState<ListRequest>({
      ...initialListRequest,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key || undefined
        },
        {
          fieldName: 'medical_test_key',
          operator: 'match',
          value: test?.testKey || undefined
        }
      ]
    });
    const { data: messagesResultList, refetch: fecthResultNotes } =
      useGetOrderTestResultNotesByResultIdQuery(result?.key || undefined, {
        skip: result.key == null
      });
    const {
      data: resultsList,
      refetch: resultFetch,
      isLoading: resultLoding,
      isFetching: featchingTest
    } = useGetDiagnosticOrderTestResultQuery({ ...listResultResponse });
    const { data: prevResultsList, refetch: prevResultFetch } =
      useGetDiagnosticOrderTestResultQuery({ ...listPrevResultResponse });
    const isResultSelected = rowData => {
      if (rowData && result && rowData.key === result.key) {
        return 'selected-row';
      } else return '';
    };

    useEffect(() => {
      const shouldShowLoader = saveResultMutation.isLoading || featchingTest;
      if (shouldShowLoader) {
        dispatch(showSystemLoader());
      } else {
        dispatch(hideSystemLoader());
      }

      return () => {
        dispatch(hideSystemLoader());
      };
    }, [saveResultMutation.isLoading, featchingTest, dispatch]);

    useEffect(() => {
      resultFetch();
      const updatedFilters = [
        {
          fieldName: 'order_test_key',
          operator: 'match',
          value: test?.key || undefined
        }
      ];
      setListResultResponse(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));

      const updatedPrevFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key || undefined
        },
        {
          fieldName: 'medical_test_key',
          operator: 'match',
          value: test?.testKey || undefined
        }
      ];
      setListPrevResultResponse(prevRequest => ({
        ...prevRequest,
        filters: updatedPrevFilters
      }));
    }, [test]);

    useEffect(() => {
      const updatedFilters = [
        {
          fieldName: 'order_test_key',
          operator: 'match',
          value: test?.key || undefined
        }
      ];
      setListResultResponse(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
      const updatedPrevFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key || undefined
        },
        {
          fieldName: 'medical_test_key',
          operator: 'match',
          value: test?.testKey || undefined
        }
      ];
      setListPrevResultResponse(prevRequest => ({
        ...prevRequest,
        filters: updatedPrevFilters
      }));
    }, [resultFetch]);

    useEffect(() => {
      resultFetch();
    }, [saveResultMutation.isSuccess]);
    //if can normal range type lov
    const handleValueChange = async (value, rowData) => {
      const Response = await saveResult({ ...rowData, resultLkey: String(value) }).unwrap();

      const v = rowData.normalRange?.lovList.find(item => item == value);
      const valueText = lovValues?.object?.find(lov => lov.key === value)?.lovDisplayVale;
      if (v) {
        const Response = await saveTest({
          ...test,
          processingStatusLkey: '265123250697000',
          readyAt: Date.now()
        }).unwrap();
        saveResult({
          ...result,
          marker: '6731498382453316',
          statusLkey: '265123250697000',
          resultLkey: String(value)
        }).unwrap();
        saveResultLog({
          ...newApLabResultLog,
          resultKey: result?.key,
          createdBy: localUser.fullName,
          resultValue: valueText
        }).unwrap();
        setTest({ ...newApDiagnosticOrderTests });

        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
        setTest({ ...Response });
        await fetchTest();
        await resultFetch();
      } else {
        const Response = await saveTest({
          ...test,
          processingStatusLkey: '265123250697000',
          readyAt: Date.now()
        }).unwrap();
        saveResult({
          ...result,
          marker: '6730122218786367',
          statusLkey: '265123250697000',
          resultLkey: String(value)
        }).unwrap();
        saveResultLog({
          ...newApLabResultLog,
          resultKey: result?.key,
          createdBy: localUser.fullName,
          resultValue: valueText
        }).unwrap();
        setTest({ ...newApDiagnosticOrderTests });
        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
        setTest({ ...Response });
        await fetchTest();
        await resultFetch();
      }
      await resultFetch().then(() => { });
      setActiveRowKey(null);
    };

    const joinValuesFromArray = keys => {
      return keys.map(key => lovValues?.object?.find(lov => lov.key === key))
        .filter(obj => obj !== undefined)
        .map(obj => obj.lovDisplayVale)
        .join(', ');
    };
    const handleSendResultMessage = async value => {
      try {
        await saveResultNote({
          ...newApDiagnosticOrderTestsResultNotes,
          notes: value,
          testKey: test.key,
          orderKey: test.orderKey,
          resultKey: result.key
        }).unwrap();
        dispatch(notify({ msg: 'Send Successfully', sev: 'success' }));
      } catch (error) {
        dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
      }
      await fecthResultNotes();
    };
    const tableColomns = [
      {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        flexGrow: 2,
        fullText: true,
        render: (rowData: any) => {
          if (rowData.isProfile) {
            return test.profileList.find(item => item.key == rowData?.testProfileKey)?.testName;
          } else {
            return test?.test?.testName;
          }
        }
      },
      {
        key: 'testResultUnit',
        title: <Translate>TEST RESULT,UNIT</Translate>,
        flexGrow: 2,
        fullText: true,
        render: rowData => {
          if (rowData.normalRangeKey) {
            if (rowData.normalRange?.resultTypeLkey === '6209578532136054') {
              const list = lovValues?.object.filter(
                item => item.lovKey === rowData.normalRange?.resultLovKey
              );

              return activeRowKey === rowData.key ? (
                <SelectPicker
                  data={list ?? []}
                  value={rowData.orderTypeLkey}
                  valueKey="key"
                  labelKey="lovDisplayVale"
                  onChange={value => {
                    handleValueChange(value, rowData);
                  }}
                  style={{ width: 100 }}
                />
              ) : (
                <span>
                  <FontAwesomeIcon
                    onClick={() => setActiveRowKey(rowData.key)}
                    icon={faPenToSquare}
                    style={{ fontSize: '1em', marginLeft: '5px', cursor: 'pointer' }}
                  />
                  {rowData.resultLvalue ? rowData.resultLvalue.lovDisplayVale : rowData?.resultLkey}
                </span>
              );
            } else if (rowData.normalRange?.resultTypeLkey == '6209569237704618') {
              return activeRowKey === rowData.key ? (
                <Input
                  type="number"
                  onChange={value => {
                    setResult({ ...result, resultValueNumber: Number(value) });
                  }}
                  onPressEnter={async event => {
                    const Respons = await saveResult({ ...result }).unwrap();
                    setResult({ ...Respons });
                    saveResultLog({
                      ...newApLabResultLog,
                      resultKey: result?.key,
                      createdBy: localUser.fullName,
                      resultValue: result.resultValueNumber
                    });
                    setActiveRowKey(null);
                    if (rowData.normalRange?.normalRangeTypeLkey == '6221150241292558') {
                      if (
                        result.resultValueNumber > rowData.normalRange?.rangeFrom &&
                        result.resultValueNumber < rowData.normalRange?.rangeTo
                      ) {
                        const Response = await saveTest({
                          ...test,
                          processingStatusLkey: '265123250697000',
                          readyAt: Date.now()
                        }).unwrap();
                        saveResult({
                          ...result,
                          marker: '6731498382453316',
                          statusLkey: '265123250697000'
                        }).unwrap();
                        setTest({ ...newApDiagnosticOrderTests });
                        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                        setTest({ ...Response });
                        await fetchTest();
                        await resultFetch();
                      } else if (result.resultValueNumber < rowData.normalRange?.rangeFrom) {
                        if (rowData.normalRange?.criticalValue) {
                          if (
                            result.resultValueNumber < rowData.normalRange?.criticalValueLessThan
                          ) {
                            const Response = await saveTest({
                              ...test,
                              processingStatusLkey: '265123250697000',
                              readyAt: Date.now()
                            }).unwrap();
                            saveResult({
                              ...result,
                              marker: '6730652890616978',
                              statusLkey: '265123250697000'
                            }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          } else {
                            const Response = await saveTest({
                              ...test,
                              processingStatusLkey: '265123250697000',
                              readyAt: Date.now()
                            }).unwrap();
                            saveResult({
                              ...result,
                              marker: '6730094497387122',
                              statusLkey: '265123250697000'
                            }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          }
                        } else {
                          const Response = await saveTest({
                            ...test,
                            processingStatusLkey: '265123250697000',
                            readyAt: Date.now()
                          }).unwrap();
                          saveResult({
                            ...result,
                            marker: '6730094497387122',
                            statusLkey: '265123250697000'
                          }).unwrap();
                          setTest({ ...newApDiagnosticOrderTests });
                          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                          setTest({ ...Response });
                          await fetchTest();
                          await resultFetch();
                        }
                      } else if (result.resultValueNumber > rowData.normalRange?.rangeTo) {
                        if (rowData.normalRange?.criticalValue) {
                          if (
                            result.resultValueNumber > rowData.normalRange?.criticalValueMoreThan
                          ) {
                            const Response = await saveTest({
                              ...test,
                              processingStatusLkey: '265123250697000',
                              readyAt: Date.now()
                            }).unwrap();
                            saveResult({
                              ...result,
                              marker: '6730104027458969',
                              statusLkey: '265123250697000'
                            }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          } else {
                            const Response = await saveTest({
                              ...test,
                              processingStatusLkey: '265123250697000',
                              readyAt: Date.now()
                            }).unwrap();
                            saveResult({
                              ...result,
                              marker: '6730083474405013',
                              statusLkey: '265123250697000'
                            }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          }
                        } else {
                          const Response = await saveTest({
                            ...test,
                            processingStatusLkey: '265123250697000',
                            readyAt: Date.now()
                          }).unwrap();
                          saveResult({
                            ...result,
                            marker: '6730083474405013',
                            statusLkey: '265123250697000'
                          }).unwrap();
                          setTest({ ...newApDiagnosticOrderTests });
                          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                          setTest({ ...Response });
                          await fetchTest();
                          await resultFetch();
                        }
                      }
                    } else if (rowData.normalRange?.normalRangeTypeLkey == '6221162489019880') {
                      if (result.resultValueNumber > rowData.normalRange?.rangeFrom) {
                        if (rowData.normalRange?.criticalValue) {
                          if (
                            result.resultValueNumber >= rowData.normalRange?.criticalValueMoreThan
                          ) {
                            const Response = await saveTest({
                              ...test,
                              processingStatusLkey: '265123250697000',
                              readyAt: Date.now()
                            }).unwrap();
                            saveResult({
                              ...result,
                              marker: '6730104027458969',
                              statusLkey: '265123250697000'
                            }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          } else {
                            const Response = await saveTest({
                              ...test,
                              processingStatusLkey: '265123250697000',
                              readyAt: Date.now()
                            }).unwrap();
                            saveResult({
                              ...result,
                              marker: '6730083474405013',
                              statusLkey: '265123250697000'
                            }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          }
                        } else {
                          const Response = await saveTest({
                            ...test,
                            processingStatusLkey: '265123250697000',
                            readyAt: Date.now()
                          }).unwrap();
                          saveResult({
                            ...result,
                            marker: '6730083474405013',
                            statusLkey: '265123250697000'
                          }).unwrap();
                          setTest({ ...newApDiagnosticOrderTests });
                          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                          setTest({ ...Response });
                          await fetchTest();
                          await resultFetch();
                        }
                      } else {
                        const Response = await saveTest({
                          ...test,
                          processingStatusLkey: '265123250697000',
                          readyAt: Date.now()
                        }).unwrap();
                        saveResult({
                          ...result,
                          marker: '6731498382453316',
                          statusLkey: '265123250697000'
                        }).unwrap();
                        setTest({ ...newApDiagnosticOrderTests });
                        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                        setTest({ ...Response });
                        await fetchTest();

                        await resultFetch();
                      }
                    } else if (rowData.normalRange?.normalRangeTypeLkey == '6221175556193180') {
                      if (result.resultValueNumber < rowData.normalRange?.rangeTo) {
                        if (rowData.normalRange?.criticalValue) {
                          if (
                            result.resultValueNumber < rowData.normalRange?.criticalValueLessThan
                          ) {
                            const Response = await saveTest({
                              ...test,
                              processingStatusLkey: '265123250697000',
                              readyAt: Date.now()
                            }).unwrap();
                            saveResult({
                              ...result,
                              marker: '6730652890616978',
                              statusLkey: '265123250697000'
                            }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          } else {
                            const Response = await saveTest({
                              ...test,
                              processingStatusLkey: '265123250697000',
                              readyAt: Date.now()
                            }).unwrap();
                            saveResult({
                              ...result,
                              marker: '6730094497387122',
                              statusLkey: '265123250697000'
                            }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          }
                        }
                      } else {
                        const Response = await saveTest({
                          ...test,
                          processingStatusLkey: '265123250697000',
                          readyAt: Date.now()
                        }).unwrap();
                        saveResult({
                          ...result,
                          marker: '6731498382453316',
                          statusLkey: '265123250697000'
                        }).unwrap();
                        setTest({ ...newApDiagnosticOrderTests });
                        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                        setTest({ ...Response });
                        await fetchTest();
                        await resultFetch();
                      }
                    }
                  }}
                ></Input>
              ) : (
                <span>
                  <FontAwesomeIcon
                    onClick={() => setActiveRowKey(rowData.key)}
                    icon={faPenToSquare}
                    style={{ fontSize: '1em', marginLeft: '5px', cursor: 'pointer' }}
                  />
                  {rowData.resultValueNumber}
                </span>
              );
            }
          } else {
            return activeRowKey === rowData.key ? (
              <Input
                onChange={async value => {
                  // setResult({ ...result, resultText: value });
                  setResult({ ...result, resultText: value, statusLkey: '265123250697000' });
                }}
                onPressEnter={async () => {
                  const Response = await saveTest({
                    ...test,
                    processingStatusLkey: '265123250697000',
                    readyAt: Date.now()
                  }).unwrap();
                  saveResult({ ...result }).unwrap();
                  saveResultLog({
                    ...newApLabResultLog,
                    resultKey: result?.key,
                    createdBy: localUser.fullName,
                    resultValue: result.resultText
                  });
                  setTest({ ...newApDiagnosticOrderTests });
                  dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                  setTest({ ...Response });

                  await fetchTest();
                  await resultFetch();
                  setActiveRowKey(null);
                }}
              ></Input>
            ) : (
              <span>
                {rowData.resultText}
                <FontAwesomeIcon
                  onClick={() => setActiveRowKey(rowData.key)}
                  icon={faPenToSquare}
                  style={{ fontSize: '1em', marginLeft: '5px', cursor: 'pointer' }}
                />
              </span>
            );
          }
        }
      },
    {
  key: 'normalRange',
  title: <Translate>NORMAL RANGE</Translate>,
  flexGrow: 2,
  fullText: true,
  render: (rowData: any) => {
    const unit = labDetails?.resultUnitLvalue?.lovDisplayVale ?? '';

    if (rowData.normalRangeKey) {
      if (rowData.normalRange?.resultTypeLkey === '6209578532136054') {
        return `${joinValuesFromArray(rowData.normalRange?.lovList)} ${unit}`.trim();
      }

      if (rowData.normalRange?.resultTypeLkey === '6209569237704618') {
        if (rowData.normalRange?.normalRangeTypeLkey === '6221150241292558') {
          return `${rowData.normalRange?.rangeFrom}_${rowData.normalRange?.rangeTo} ${unit}`.trim();
        }

        if (rowData.normalRange?.normalRangeTypeLkey === '6221162489019880') {
          return `Less Than ${rowData.normalRange?.rangeFrom} ${unit}`.trim();
        }

        if (rowData.normalRange?.normalRangeTypeLkey === '6221175556193180') {
          return `More Than ${rowData.normalRange?.rangeTo} ${unit}`.trim();
        }
      }
    }

    return 'Normal Range Not Defined';
  }
}
,
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
                style={{ fontSize: '1em' }}
                onClick={() => setOpenNoteResultModal(true)}
              />
            </HStack>
          );
        }
      },
      {
        key: 'previousResult',
        title: <Translate>PREVIOUS RESULT</Translate>,
        flexGrow: 1,
        fullText: true,
        render: (rowData: any) => {
          const key = prevResultsList?.object[1]?.normalRangeKey;

          return (
            <>
              {key === '6209578532136054' && (
                <>
                  {prevResultsList?.object[1]?.reasonLvalue
                    ? prevResultsList?.object[1]?.reasonLvalue?.lovDisplayVale
                    : prevResultsList?.object[0]?.reasonLkey}
                </>
              )}

              {key === '6209569237704618' && <>{prevResultsList?.object[1]?.resultValueNumber}</>}

              {!['6209578532136054', '6209569237704618'].includes(key) && (
                <></> // optional placeholder; can be removed if nothing should render
              )}
            </>
          );
        }
      },
      {
        key: 'resultDate',
        title: <Translate>PREVIOUS RESULT DATE</Translate>,
        flexGrow: 1,
        fullText: true,
        render: (rowData: any) => {
          return formatDateWithoutSeconds(prevResultsList?.object[1]?.createdAt);
        }
      },
      {
        key: 'compareWithAllPrevious',
        title: <Translate>COMPARE WITH ALL PREVIOUS</Translate>,
        flexGrow: 1,
        fullText: true,
        render: (rowData: any) => {
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                icon={faDiagramPredecessor}
                style={{ fontSize: '1em' }}
                onClick={() => setOpenComparisonModal(true)}
              />
            </HStack>
          );
        }
      },
      {
        key: 'resultStatus',
        title: <Translate>RESULT SATUTS</Translate>,
        flexGrow: 1,
        fullText: true,
        render: (rowData: any) => {
          return rowData.statusLvalue ? rowData.statusLvalue.lovDisplayVale : rowData.statusLkey;
        }
      },
      {
        key: 'action',
        title: <Translate>ACTION</Translate>,
        flexGrow: 3,
        fullText: true,
        render: (rowData: any) => {
          return (
            <HStack spacing={5}>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Approve</Tooltip>}>
                <CheckRoundIcon
                  style={{
                    fontSize: '1em',
                    marginRight: 5,
                    color: rowData.statusLkey == '265089168359400' ? 'gray' : 'inherit',
                    cursor: rowData.statusLkey == '265089168359400' ? 'not-allowed' : 'pointer'
                  }}
                  onClick={async () => {
                    setResult(rowData);
                    if (rowData.statusLkey !== '265089168359400') {
                      try {
                        const resultValue =
                          rowData.resultValueNumber ??
                          rowData.resultText ??
                          rowData.resultLvalue?.lovDisplayVale ??
                          '';

                        const response = await saveTest({
                          ...test,
                          processingStatusLkey: '265089168359400',
                          approvedAt: Date.now()
                        }).unwrap();

                        await saveResult({
                          ...rowData,
                          orderKey: test?.orderKey,
                          testKey: test?.testKey,
                          patientKey: test?.patientKey,
                          normalRangeValue: String(resultValue),
                          statusLkey: '265089168359400',
                          approvedAt: Date.now()
                        }).unwrap();

                        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                        setTest({ ...response });

                        await resultFetch();
                        await fetchTest();
                        await new Promise(resolve => setTimeout(resolve, 300));
                        await refetchTest();
                      } catch (error) {
                        console.error('❌ Save error:', error);
                        dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
                      }
                    }
                  }}


                />
              </Whisper>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Reject</Tooltip>}>
                <WarningRoundIcon
                  style={{
                    fontSize: '1em',
                    marginRight: 5,
                    color: rowData.statusLkey == '265089168359400' ? 'gray' : 'inherit',
                    cursor: rowData.statusLkey == '265089168359400' ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => {
                    if (rowData.statusLkey !== '265089168359400') {
                      setOpenRejectedResultModal(true);
                      setResult({ ...rowData });
                    }
                  }}
                />
              </Whisper>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Repeat Test</Tooltip>}>
                <ConversionIcon
                  style={{
                    fontSize: '1em',
                    marginRight: 5,
                    color: rowData.statusLkey == '265089168359400' ? 'gray' : 'inherit',
                    cursor: rowData.statusLkey == '265089168359400' ? 'not-allowed' : 'pointer'
                  }}
                  onClick={async () => {
                    if (rowData.statusLkey !== '265089168359400') {
                      await setOpenSampleModal(true);
                      const object = rowData;
                      await saveTest({ ...test, processingStatusLkey: '6055029972709625' });
                      saveResult({
                        ...object,
                        statusLkey: '6055029972709625'
                      }).unwrap();
                      await resultFetch();
                    }
                  }}
                />
              </Whisper>

              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Print</Tooltip>}>
                <FontAwesomeIcon icon={faPrint} style={{ fontSize: '1em', marginRight: '5px' }} />
              </Whisper>

              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Log</Tooltip>}>
                <FontAwesomeIcon
                  icon={faFileLines}
                  style={{ fontSize: '1em', marginRight: '5px', color: '#343434' }}
                  onClick={() => setOpenLogModal(true)}
                />
              </Whisper>
            </HStack>
          );
        }
      },
      {
        key: 'rejectedAt',
        dataKey: 'rejectedAt',
        title: <Translate>REJECTED AT/BY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) => {
          return (
            <>
              <span>{rowData.rejectedBy}</span>
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(rowData.rejectedAt)}
              </span>
            </>
          );
        }
      },

      {
        key: 'approvedAt',
        dataKey: 'approvedAt',
        title: <Translate>Approved AT/BY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) => {
          return (
            <>
              <span>{rowData.approvedBy}</span>
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(rowData.approvedAt)}
              </span>
            </>
          );
        }
      }
    ];
    const pageIndex = listResultResponse.pageNumber - 1;

    // how many rows per page:
    const rowsPerPage = listResultResponse.pageSize;

    // total number of items in the backend:
    const totalCount = listResultResponse?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
      // MUI gives you a zero-based page, so add 1 for your API

      setListResultResponse({ ...listResultResponse, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setListResultResponse({
        ...listResultResponse,
        pageSize: parseInt(event.target.value, 10),
        pageNumber: 1 // reset to first page
      });
    };
    const filters = () => {
      return (
        <Form layout="inline" fluid className="date-filter-form">
          <MyInput
            column
            width={180}
            fieldType="date"
            fieldLabel="From Date"
            fieldName="fromDate"
            record={dateFilter}
            setRecord={setDateFilter}
          />
          <MyInput
            width={180}
            column
            fieldType="date"
            fieldLabel="To Date"
            fieldName="toDate"
            record={dateFilter}
            setRecord={setDateFilter}
          />
          <div className="search-btn"></div>
        </Form>
      );
    };
    return (
      <Panel ref={ref} header="Test's Results Processing" defaultExpanded>
        <MyTable
          columns={tableColomns}
          data={resultsList?.object || []}
          loading={featchingTest}
          onRowClick={rowData => {
            setResult(rowData);
          }}
          rowClassName={isResultSelected}
          height={250}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        ></MyTable>
        <ChatModal
          open={openNoteResultModal}
          setOpen={setOpenNoteResultModal}
          handleSendMessage={handleSendResultMessage}
          title={'Comments'}
          list={messagesResultList?.object}
          fieldShowName={'notes'}
        />
        <CancellationModal
          open={openRejectedResultModal}
          setOpen={setOpenRejectedResultModal}
          fieldName="rejectedReason"
          handleCancle={async () => {
            try {
              const object = result;

              await saveResult({
                ...object,
                statusLkey: '6488555526802885', // Rejected status
                rejectedAt: Date.now()
              }).unwrap();

              dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));

              await resultFetch();
              await fetchTest();
              await new Promise(resolve => setTimeout(resolve, 300));
              await refetchTest();

              setOpenRejectedResultModal(false);
            } catch (error) {
              dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
            }
          }}
          object={test}
          setObject={setTest}
          fieldLabel={'Reject Reason'}
          title="Reject"
        />
        <SampleModal
          open={openSampleModal}
          setOpen={setOpenSampleModal}
          samplesList={samplesList}
          labDetails={labDetails}
          saveTest={saveTest}
          test={test}
          setTest={setTest}
          fetchTest={fetchTest}
          fecthSample={fecthSample}
        />
        <LogResult open={openLogModal} setOpen={setOpenLogModal} result={result} />
        <MyModal
          open={openCopmarisonModal}
          setOpen={setOpenComparisonModal}
          size="60vw"
          bodyheight="50vh"
          title="Patient Prev Results"
          steps={[{ title: 'Comparison', icon: <FontAwesomeIcon icon={faDiagramPredecessor} /> }]}
          content={
            <LaboratoryResultComparison patient={patient} testKey={result?.medicalTestKey} />
          }
        />
      </Panel>
    );
  }
);
export default Result;
