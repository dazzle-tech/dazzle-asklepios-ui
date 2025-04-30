import Translate from "@/components/Translate";
import { forwardRef, useImperativeHandle } from 'react';
import { useGetDiagnosticOrderTestResultQuery, useGetOrderTestResultNotesByResultIdQuery, useSaveDiagnosticOrderTestResultMutation, useSaveDiagnosticOrderTestResultsNotesMutation, useSaveLabResultLogMutation } from "@/services/labService";
import { useGetLovAllValuesQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsResult, newApDiagnosticOrderTestsResultNotes, newApLabResultLog } from "@/types/model-types-constructor";
import { initialListRequest, initialListRequestAllValues, ListRequest } from "@/types/types";
import React, { useState, useEffect } from "react";
import { HStack, Input, Panel, SelectPicker, Tooltip, Whisper } from "rsuite";
import { notify } from '@/utils/uiReducerActions';
import { useAppSelector, useAppDispatch } from "@/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import ConversionIcon from '@rsuite/icons/Conversion';
import ChatModal from "@/components/ChatModal";
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import MyTable from "@/components/MyTable";
import CancellationModal from "@/components/CancellationModal";
import SampleModal from "./SampleModal";
import { Log } from "@rsuite/icons";
import LogResult from "./LogResult";
type ResultProps = {
    test: any;
    setTest: any;
    saveTest: any;
    result: any;
    setResult: any;
    patient: any;
    labDetails: any;
    samplesList: any;
    fetchTest: () => void;
}
const Result = forwardRef<unknown, ResultProps>(({ test, setTest, saveTest, result, setResult, patient, labDetails, samplesList, fetchTest }, ref) => {
    const dispatch = useAppDispatch();
    const uiSlice = useAppSelector(state => state.auth);
    const [localUser, setLocalUser] = useState(uiSlice?.user);
    const [activeRowKey, setActiveRowKey] = useState(null);
    const [openSampleModal, setOpenSampleModal] = useState(false);
    const [openLogModal, setOpenLogModal] = useState(false);
    const [openRejectedResultModal, setOpenRejectedResultModal] = useState(false);
    const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
    const { data: lovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });
    const [saveResult] = useSaveDiagnosticOrderTestResultMutation();
    const [saveResultNote] = useSaveDiagnosticOrderTestResultsNotesMutation();
    const [saveResultLog, saveResultLogMutation] = useSaveLabResultLogMutation();
    const [listResultResponse, setListResultResponse] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: "order_test_key",
                operator: "match",
                value: test?.key || undefined,
            }


        ],
    });
    const [listPrevResultResponse, setListPrevResultResponse] = useState<ListRequest>({
        ...initialListRequest,
        sortBy: "createdAt",
        sortType: 'desc',
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key || undefined,
            },
            {
                fieldName: "medical_test_key",
                operator: "match",
                value: test?.testKey || undefined,
            }


        ],
    });
    const { data: messagesResultList, refetch: fecthResultNotes } = useGetOrderTestResultNotesByResultIdQuery(result?.key || undefined, { skip: result.key == null });
    const { data: resultsList, refetch: resultFetch, isLoading: resultLoding } = useGetDiagnosticOrderTestResultQuery({ ...listResultResponse });
    const { data: prevResultsList, refetch: prevResultFetch } = useGetDiagnosticOrderTestResultQuery({ ...listPrevResultResponse });
    const isResultSelected = rowData => {
        if (rowData && result && rowData.key === result.key) {
            return 'selected-row';
        } else return '';
    };

    useEffect(() => {
        setResult({ ...newApDiagnosticOrderTestsResult })
        // const cat = laboratoryList?.object?.find((item) => item.testKey === test.testKey);
        // setLabDetails(cat);
        // setCurrentStep(test.processingStatusLkey);
        const updatedFilters = [
            {
                fieldName: "order_test_key",
                operator: "match",
                value: test?.key || undefined,
            }


        ];
        setListResultResponse((prevRequest) => ({
            ...prevRequest,
            filters: updatedFilters,
        }));
        const updatedPrevFilters = [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key || undefined,
            },
            {
                fieldName: "medical_test_key",
                operator: "match",
                value: test?.testKey || undefined,
            }


        ];
        setListPrevResultResponse((prevRequest) => ({
            ...prevRequest,
            filters: updatedPrevFilters,
        }));

    }, [test]);

    const handleValueChange = async (value, rowData) => {

        const Response = await saveResult({ ...rowData, resultLkey: String(value) }).unwrap();


        const v = rowData.normalRange?.lovList.find((item) => item == value);
        const valueText = lovValues?.object?.find(lov => lov.key === value)?.lovDisplayVale
        if (v) {

            const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
            saveResult({ ...result, marker: "6731498382453316", statusLkey: '265123250697000', resultLkey: String(value) }).unwrap();
            saveResultLog({ ...newApLabResultLog, resultKey: result?.key, createdBy: localUser.fullName, resultValue: valueText }).unwrap();
            setTest({ ...newApDiagnosticOrderTests });

            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
            setTest({ ...Response });
            await fetchTest();
            await resultFetch();

        }
        else {

            const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
            saveResult({ ...result, marker: "6730122218786367", statusLkey: '265123250697000', resultLkey: String(value) }).unwrap();
            saveResultLog({ ...newApLabResultLog, resultKey: result?.key, createdBy: localUser.fullName, resultValue: valueText }).unwrap();
            setTest({ ...newApDiagnosticOrderTests });
            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
            setTest({ ...Response });
            await fetchTest();
            await resultFetch();
        }
        await resultFetch().then(() => {

        });
        setActiveRowKey(null)
    };
    const joinValuesFromArray = (keys) => {

        return keys
            .map(key => lovValues?.object?.find(lov => lov.key === key))
            .filter(obj => obj !== undefined)
            .map(obj => obj.lovDisplayVale)
            .join(', ');
    };
    const handleSendResultMessage = async (value) => {
        try {
            await saveResultNote({ ...newApDiagnosticOrderTestsResultNotes, notes: value, testKey: test.key, orderKey: test.orderKey, resultKey: result.key }).unwrap();
            dispatch(notify({ msg: 'Send Successfully', sev: 'success' }));

        }
        catch (error) {
            dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
        }
        await fecthResultNotes();

    };
    const tableColomns = [
        {
            key: "testName",
            title: <Translate>TEST NAME</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                if (rowData.isProfile) {
                    return test.profileList.find((item) => item.key == rowData.testProfileKey)?.testName;
                } else {
                    return test.test.testName;
                }
            },
        },
        {
            key: "testResultUnit",
            title: <Translate>TEST RESULT,UNIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData=>  {
                if (rowData.normalRangeKey) {
                  if (rowData.normalRange?.resultTypeLkey === "6209578532136054") {
                    const list = lovValues?.object.filter((item) => item.lovKey === rowData.normalRange?.resultLovKey);

                    return activeRowKey === rowData.key ? (
                      <SelectPicker
                        data={list ?? []}
                        value={rowData.orderTypeLkey}
                        valueKey="key"
                        labelKey="lovDisplayVale"
                        onChange={(value) => {

                          handleValueChange(value, rowData)
                        }}
                        style={{ width: 100 }}
                      />
                    ) : (
                      <span>
                        
                        <FontAwesomeIcon onClick={() => setActiveRowKey(rowData.key)} icon={faPenToSquare} style={{ fontSize: "1em", marginLeft: "5px", cursor: "pointer" }} />
                        {rowData.resultLvalue ? rowData.resultLvalue.lovDisplayVale : rowData?.resultLkey}
                      </span>
                    );
                  }
                  else if (rowData.normalRange?.resultTypeLkey == "6209569237704618") {
                    return activeRowKey === rowData.key ? (<Input
                      type='number'

                      onChange={(value) => {

                        setResult({ ...result, resultValueNumber: Number(value) });

                      }}
                      onPressEnter={async (event) => {
                        const Respons = await saveResult({ ...result }).unwrap();
                        setResult({ ...Respons });
                        saveResultLog({ ...newApLabResultLog, resultKey: result?.key, createdBy: localUser.fullName, resultValue: result.resultValueNumber })
                        setActiveRowKey(null)
                        if (rowData.normalRange?.normalRangeTypeLkey == "6221150241292558") {

                          if (result.resultValueNumber > rowData.normalRange?.rangeFrom && result.resultValueNumber < rowData.normalRange?.rangeTo) {

                            const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                            saveResult({ ...result, marker: "6731498382453316", statusLkey: '265123250697000' }).unwrap()
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          }
                          else if (result.resultValueNumber < rowData.normalRange?.rangeFrom) {

                            if (rowData.normalRange?.criticalValue) {
                              if (result.resultValueNumber < rowData.normalRange?.criticalValueLessThan) {

                                const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                                saveResult({ ...result, marker: "6730652890616978", statusLkey: '265123250697000' }).unwrap();
                                setTest({ ...newApDiagnosticOrderTests });
                                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                setTest({ ...Response });
                                await fetchTest();
                                await resultFetch();
                              }
                              else {

                                const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                                saveResult({ ...result, marker: "6730094497387122", statusLkey: '265123250697000' }).unwrap();
                                setTest({ ...newApDiagnosticOrderTests });
                                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                setTest({ ...Response });
                                await fetchTest();
                                await resultFetch();
                              }

                            }
                            else {

                              const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                              saveResult({ ...result, marker: "6730094497387122", statusLkey: '265123250697000' }).unwrap();
                              setTest({ ...newApDiagnosticOrderTests });
                              dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                              setTest({ ...Response });
                              await fetchTest();
                              await resultFetch();
                            }
                          }
                          else if (result.resultValueNumber > rowData.normalRange?.rangeTo) {
                             
                            if (rowData.normalRange?.criticalValue) {
                              if (result.resultValueNumber > rowData.normalRange?.criticalValueMoreThan) {

                                const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                                saveResult({ ...result, marker: "6730104027458969", statusLkey: '265123250697000' }).unwrap();
                                setTest({ ...newApDiagnosticOrderTests });
                                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                setTest({ ...Response });
                                await fetchTest();
                                await resultFetch();
                              }
                              else {

                                const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                                saveResult({ ...result, marker: "6730083474405013", statusLkey: '265123250697000' }).unwrap();
                                setTest({ ...newApDiagnosticOrderTests });
                                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                setTest({ ...Response });
                                await fetchTest();
                                await resultFetch();
                              }
                            }
                            else {

                              const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                              saveResult({ ...result, marker: "6730083474405013", statusLkey: '265123250697000' }).unwrap();
                              setTest({ ...newApDiagnosticOrderTests });
                              dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                              setTest({ ...Response });
                              await fetchTest();
                              await resultFetch();
                            }
                          }

                        }
                        else if (rowData.normalRange?.normalRangeTypeLkey == "6221162489019880") {

                          if (result.resultValueNumber > rowData.normalRange?.rangeFrom) {

                            if (rowData.normalRange?.criticalValue) {

                              if (result.resultValueNumber >= rowData.normalRange?.criticalValueMoreThan) {

                                const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                                saveResult({ ...result, marker: "6730104027458969", statusLkey: '265123250697000' }).unwrap();
                                setTest({ ...newApDiagnosticOrderTests });
                                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                setTest({ ...Response });
                                await fetchTest();
                                await resultFetch();

                              }
                              else {

                                const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                                saveResult({ ...result, marker: "6730083474405013", statusLkey: '265123250697000' }).unwrap();
                                setTest({ ...newApDiagnosticOrderTests });
                                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                setTest({ ...Response });
                                await fetchTest();
                                await resultFetch();
                              }
                            }
                            else {

                              const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                              saveResult({ ...result, marker: "6730083474405013", statusLkey: '265123250697000' }).unwrap();
                              setTest({ ...newApDiagnosticOrderTests });
                              dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                              setTest({ ...Response });
                              await fetchTest();
                              await resultFetch();
                            }
                          }
                          else {

                            const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                            saveResult({ ...result, marker: "6731498382453316", statusLkey: '265123250697000' }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();

                            await resultFetch();
                          }

                        }
                        else if (rowData.normalRange?.normalRangeTypeLkey == "6221175556193180") {
                          if (result.resultValueNumber < rowData.normalRange?.rangeTo) {
                            if (rowData.normalRange?.criticalValue) {
                              if (result.resultValueNumber < rowData.normalRange?.criticalValueLessThan) {
                                const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                                saveResult({ ...result, marker: "6730652890616978", statusLkey: '265123250697000' }).unwrap();
                                setTest({ ...newApDiagnosticOrderTests });
                                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                setTest({ ...Response });
                                await fetchTest();
                                await resultFetch();
                              }
                              else {
                                const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                                saveResult({ ...result, marker: "6730094497387122", statusLkey: '265123250697000' }).unwrap();
                                setTest({ ...newApDiagnosticOrderTests });
                                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                setTest({ ...Response });
                                await fetchTest();
                                await resultFetch();
                              }
                            }

                          }
                          else {
                            const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                            saveResult({ ...result, marker: "6731498382453316", statusLkey: '265123250697000' }).unwrap();
                            setTest({ ...newApDiagnosticOrderTests });
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response });
                            await fetchTest();
                            await resultFetch();
                          }

                        }
                      }}

                    ></Input>) : (
                      <span>
                        {rowData.resultValueNumber}
                        <FontAwesomeIcon onClick={() => setActiveRowKey(rowData.key)} icon={faPenToSquare} style={{ fontSize: "1em", marginLeft: "5px", cursor: "pointer" }} />
                      </span>)

                  }

                }
                else {
                  return activeRowKey === rowData.key ? (<Input


                    onChange={async (value) => {

                      // setResult({ ...result, resultText: value });
                      setResult({ ...result, resultText: value, statusLkey: '265123250697000' });
                      resultFetch();
                    }}
                    onPressEnter={async () => {


                      const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
                      saveResult({ ...result }).unwrap();
                      saveResultLog({ ...newApLabResultLog, resultKey: result?.key, createdBy: localUser.fullName, resultValue: result.resultText });
                      setTest({ ...newApDiagnosticOrderTests });
                      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                      setTest({ ...Response });

                      await fetchTest();
                      await resultFetch();
                      setActiveRowKey(null);

                    }}
                  ></Input>) : (
                    <span>
                      {rowData.resultText}
                      <FontAwesomeIcon onClick={() => setActiveRowKey(rowData.key)} icon={faPenToSquare} style={{ fontSize: "1em", marginLeft: "5px", cursor: "pointer" }} />
                    </span>
                  );
                }
              }

        },
        {
            key: "normalRange",
            title: <Translate>NORMAL RANGE</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                if (rowData.normalRangeKey) {
                    if (rowData.normalRange?.resultTypeLkey == "6209578532136054") {
                        return (
                            joinValuesFromArray(rowData.normalRange?.lovList) +
                            " " +
                            labDetails?.resultUnitLvalue?.lovDisplayVale || ""
                        );
                    }
                    else if (rowData.normalRange?.resultTypeLkey == "6209569237704618") {
                        if (rowData.normalRange?.normalRangeTypeLkey == "6221150241292558") {
                            return (
                                rowData.normalRange?.rangeFrom +
                                "_" +
                                rowData.normalRange?.rangeTo +
                                " " +
                                labDetails?.resultUnitLvalue?.lovDisplayVale
                            );
                        } else if (rowData.normalRange?.normalRangeTypeLkey == "6221162489019880") {
                            return (
                                "Less Than " +
                                rowData.normalRange?.rangeFrom +
                                " " +
                                labDetails?.resultUnitLvalue?.lovDisplayVale
                            );
                        } else if (rowData.normalRange?.normalRangeTypeLkey == "6221175556193180") {
                            return (
                                "More Than " +
                                rowData.normalRange?.rangeTo +
                                " " +
                                labDetails?.resultUnitLvalue?.lovDisplayVale
                            );
                        }
                    }
                } else {
                    return "Normal Range Not Defined";
                }
            },
        },
        {
            key: "marker",
            title: <Translate>MARKER</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                if (rowData.marker == "6730122218786367") {
                    return <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: "1em" }} />;
                } else if (rowData.marker == "6731498382453316") {
                    return "Normal";
                } else if (rowData.marker == "6730083474405013") {
                    return <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: "1em" }} />;
                } else if (rowData.marker == "6730094497387122") {
                    return <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: "1em" }} />;
                } else if (rowData.marker == "6730104027458969") {
                    return (
                        <HStack spacing={10}>
                            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "1em" }} />
                            <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: "1em" }} />
                        </HStack>
                    );
                } else if (rowData.marker == "6730652890616978") {
                    return (
                        <HStack spacing={10}>
                            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "1em" }} />
                            <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: "1em" }} />
                        </HStack>
                    );
                }
            },
        },
        {
            key: "comments",
            title: <Translate>COMMENTS</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return (
                    <HStack spacing={10}>
                        <FontAwesomeIcon
                            icon={faComment}
                            style={{ fontSize: "1em" }}
                            onClick={() => setOpenNoteResultModal(true)}
                        />
                    </HStack>
                );
            },
        },
        {
            key: "previousResult",
            title: <Translate>PREVIOUS RESULT</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                const key = prevResultsList?.object[1]?.normalRangeKey;

                return (
                    <>
                        {key === "6209578532136054" && (
                            <>
                                {
                                    prevResultsList?.object[1]?.reasonLvalue
                                        ? prevResultsList?.object[1]?.reasonLvalue?.lovDisplayVale
                                        : prevResultsList?.object[0]?.reasonLkey
                                }
                            </>
                        )}

                        {key === "6209569237704618" && (
                            <>
                                {prevResultsList?.object[1]?.resultValueNumber}
                            </>
                        )}

                        {!["6209578532136054", "6209569237704618"].includes(key) && (
                            <></> // optional placeholder; can be removed if nothing should render
                        )}
                    </>
                );
            }
        },
        {
            key: "resultDate",
            title: <Translate>PREVIOUS RESULT DATE</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                const createdAt = prevResultsList?.object[1]?.createdAt;
                if (createdAt) {
                    return new Date(createdAt).toLocaleString();
                }
                return "";
            },
        },
        {
            key: "compareWithAllPrevious",
            title: <Translate>COMPARE WITH ALL PREVIOUS</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return <HStack spacing={10}>

                    <FontAwesomeIcon icon={faDiagramPredecessor} style={{ fontSize: '1em' }} />

                </HStack>;

            },
        },
        // { key: "externelStatus",
        //     title: <Translate>EXTERNEL STATUS</Translate>,
        //     flexGrow: 1,
        //     fullText: true,
        //     render: (rowData: any) => {
        //         return null;

        //     },
        // },
        // { key: "externelLabName",
        //     title: <Translate>EXTERNEL LAB NAME</Translate>,
        //     flexGrow: 1,
        //     fullText: true,
        //     render: (rowData: any) => {
        //         return null;

        //     },
        // },
        // { key: "attachment",
        //     title: <Translate>ATTACHMENT</Translate>,
        //     flexGrow: 1,
        //     fullText: true,
        //     render: (rowData: any) => {
        //         return null;

        //     },
        // },
        {
            key: "resultStatus",
            title: <Translate>RESULT SATUTS</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return rowData.statusLvalue ? rowData.statusLvalue.lovDisplayVale : rowData.statusLkey

            },
        },
        {
            key: "action",
            title: <Translate>ACTION</Translate>,
            flexGrow: 3,
            fullText: true,
            render: (rowData: any) => {
                return (

                    <HStack spacing={5}>
                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Approve</Tooltip>}
                        >
                            <CheckRoundIcon style={{
                                fontSize: '1em',
                                marginRight: 5,
                                color: (rowData.statusLkey == "265089168359400") ? 'gray' : 'inherit',
                                cursor: (rowData.statusLkey == "265089168359400") ? 'not-allowed' : 'pointer',
                            }}
                                onClick={async () => {
                                    if (rowData.statusLkey !== "265089168359400") {
                                        try {
                                            function value(rowData) {
                                                if (rowData.normalRange?.resultTypeLkey === "6209578532136054") {
                                                    return joinValuesFromArray(rowData.normalRange?.lovList);
                                                } else if (rowData.normalRange?.resultTypeLkey === "6209569237704618") {
                                                    if (rowData.normalRange?.normalRangeTypeLkey === "6221150241292558") {
                                                        return rowData.normalRange?.rangeFrom + "_" + rowData.normalRange?.rangeTo;
                                                    } else if (rowData.normalRange?.normalRangeTypeLkey === "6221162489019880") {
                                                        return "Less Than " + rowData.normalRange?.rangeFrom + " " + labDetails?.resultUnitLvalue?.lovDisplayVale;
                                                    } else if (rowData.normalRange?.normalRangeTypeLkey === "6221175556193180") {
                                                        return "More Than " + rowData.normalRange?.rangeTo + " " + labDetails?.resultUnitLvalue?.lovDisplayVale;
                                                    }
                                                }
                                                return "Not Defined";
                                            }

                                            const resultValue = value(rowData);


                                            const response = await saveTest({
                                                ...test,
                                                processingStatusLkey: "265089168359400",
                                                approvedAt: Date.now()
                                            }).unwrap();

                                            await saveResult({
                                                ...result,
                                                statusLkey: "265089168359400",
                                                approvedAt: Date.now(),
                                                normalRangeValue: String(resultValue),
                                            }).unwrap();

                                            setTest({ ...newApDiagnosticOrderTests });
                                            dispatch(notify({ msg: "Saved successfully", sev: "success" }));
                                            setTest({ ...response });

                                            await fetchTest();
                                            await resultFetch();
                                        } catch (error) {
                                            dispatch(notify({ msg: "Save Failed", sev: "error" }));
                                        }
                                    }
                                }} />
                        </Whisper>
                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Reject</Tooltip>}
                        >
                            <WarningRoundIcon
                                style={{
                                    fontSize: '1em',
                                    marginRight: 5,
                                    color: (rowData.statusLkey == "265089168359400") ? 'gray' : 'inherit',
                                    cursor: (rowData.statusLkey == "265089168359400") ? 'not-allowed' : 'pointer',
                                }}
                                onClick={() => rowData.statusLkey !== "265089168359400" && setOpenRejectedResultModal(true)} />
                        </Whisper>
                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Repeat Test</Tooltip>}
                        >
                            <ConversionIcon
                                style={{
                                    fontSize: '1em',
                                    marginRight: 5,
                                    color: (rowData.statusLkey == "265089168359400") ? 'gray' : 'inherit',
                                    cursor: (rowData.statusLkey == "265089168359400") ? 'not-allowed' : 'pointer',
                                }}
                                onClick={async () => {
                                    if (rowData.statusLkey !== "265089168359400") {
                                        await setOpenSampleModal(true);
                                        saveResult({
                                            ...rowData,
                                            statusLkey: '6055029972709625'
                                        }).unwrap();
                                        await resultFetch()
                                    }
                                }} />

                        </Whisper>

                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Print</Tooltip>}
                        >
                            <FontAwesomeIcon icon={faPrint} style={{ fontSize: '1em', marginRight: '5px' }} />
                        </Whisper>
                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Review</Tooltip>}
                        >
                            <FontAwesomeIcon icon={faStar} style={{ fontSize: '1em', marginRight: '5px', color: rowData.reviewAt ? '#e0a500' : "#343434" }}
                                onClick={async () => {
                                    try {
                                        await saveResult({ ...result, reviewAt: Date.now() }).unwrap();
                                        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                        resultFetch();
                                    }
                                    catch (error) {
                                        dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
                                    }
                                }} />
                        </Whisper>
                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Log</Tooltip>}
                        >
                            <FontAwesomeIcon icon={faFileLines} style={{ fontSize: '1em', marginRight: '5px', color: "#343434" }}
                                onClick={() => setOpenLogModal(true)} />
                        </Whisper>

                    </HStack>


                );
            },
        },
    ];
    return (<Panel ref={ref} header="Test's Results Processing" collapsible defaultExpanded className="panel-border"  >
        <div style={{width:"1150px"}}>
        <MyTable
            columns={tableColomns}
            data={resultsList?.object || []}
            loading={resultLoding}
            onRowClick={rowData => {
                setResult(rowData);
            }}
            rowClassName={isResultSelected}
            height={250}
           
        ></MyTable>
        </div>
       
        <ChatModal open={openNoteResultModal} setOpen={setOpenNoteResultModal} handleSendMessage={handleSendResultMessage} title={"Comments"} list={messagesResultList?.object} fieldShowName={'notes'} />
        <CancellationModal open={openRejectedResultModal}
            setOpen={setOpenRejectedResultModal}
            fieldName='rejectedReason'
            handleCancle={async () => {
                {
                    try {
                        await saveResult({ ...result, statusLkey: '6488555526802885', rejectedAt: Date.now() }).unwrap();
                        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                        resultFetch();
                        setOpenRejectedResultModal(false)
                    }
                    catch (error) {
                        dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
                    }
                }
            }
            } object={test} setObject={setTest} fieldLabel={"Reject Reason"} title="Reject" />
        <SampleModal open={openSampleModal} setOpen={setOpenSampleModal} samplesList={samplesList} labDetails={labDetails} saveTest={saveTest} test={test} setTest={setTest} fetchTest={fetchTest} />
        <LogResult open={openLogModal} setOpen={setOpenLogModal} result={result} />
    </Panel>

    );
});
export default Result;