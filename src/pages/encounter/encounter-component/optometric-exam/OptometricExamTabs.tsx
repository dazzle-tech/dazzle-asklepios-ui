import React from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { MdModeEdit } from 'react-icons/md';
import { Tabs } from 'rsuite';
import { formatDateWithoutSeconds } from '@/utils';
const OptometricExamTabs = ({
    isLoading,
    optometricExamResponse,
    setOpen,
    optometricExam,
    setOptometricExam,
    optometricExamListRequest,
    setOptometricExamListRequest,
    setSelectedIcd10,
    setSecondSelectedicd10,
    setTime
}) => {

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && optometricExam && optometricExam.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setOptometricExamListRequest({ ...optometricExamListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOptometricExamListRequest({
            ...optometricExamListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Format Time From Seconds To Formal Time
    const formatTime = totalSeconds => {
        if (!totalSeconds) return '-';
        const hours = Math.floor(totalSeconds / 3600)
            .toString()
            .padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60)
            .toString()
            .padStart(2, '0');

        return `${hours}:${minutes}`;
    };
    // Pagination values
    const pageIndex = optometricExamListRequest.pageNumber - 1;
    const rowsPerPage = optometricExamListRequest.pageSize;
    const totalCount = optometricExamResponse?.extraNumeric ?? 0;
    // Table Visual Acuity Columns
    const visualAcuityColumns = [
        {
            key: 'testReason',
            title: 'REASON',
            dataKey: 'testReason',
        },
        {
            key: 'medicalHistory',
            title: 'MEDICAL HISTORY',
            render: (row: any) =>
                row?.medicalHistoryLvalue
                    ? row.medicalHistoryLvalue.lovDisplayVale
                    : row.medicalHistoryLkey
        },
        {
            key: 'performedWith',
            title: 'TEST PERFORMED WITH',
            render: (row: any) =>
                row?.performedWithLvalue
                    ? row.performedWithLvalue.lovDisplayVale
                    : row.performedWithLkey
        },
        {
            key: 'pinholeTestResult',
            title: 'PINHOLE TEST RESULT',
            expandable: true,
            render: (row: any) =>
                row?.pinholeTestResultLvalue
                    ? row.pinholeTestResultLvalue.lovDisplayVale
                    : row.pinholeTestResultLkey
        },
        {
            key: 'distanceAcuity',
            title: 'DISTANCE ACUITY',
            render: (row: any) => row?.distanceAcuity ? `${row?.distanceAcuity ?? ''} m` : ' '
        },
        {
            key: 'rightEyeOd',
            title: 'RIGHT EYE',
            render: (row: any) => row?.rightEyeOd ? `20/ ${row?.rightEyeOd} ` : ' '
        },
        {
            key: 'leftEyeOd',
            title: 'LEFT EYE',
            render: (row: any) => row?.leftEyeOd ? `20/ ${row?.leftEyeOd}` : ' '
        },
        {
            key: 'nearAcuity',
            title: 'BONE CONDUCTION THRESHOLDS',
            render: (row: any) => row?.nearAcuity ? `${row?.nearAcuity ?? ''} m` : ' '
        },
        {
            key: 'rightEyeOs',
            title: 'RIGHT EYE ',
            render: (row: any) => row?.rightEyeOs ? `J ${row?.rightEyeOs}` : ' ',
            expandable: true,
        },
        {
            key: 'leftEyeOs',
            title: 'LEFT EYE ',
            render: (row: any) => row?.leftEyeOs ? `J ${row?.leftEyeOs}` : ' ',
            expandable: true,
        },
        {
            key: "details",
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (
                    <MdModeEdit
                        title="Edit"
                        size={24}
                        fill="var(--primary-gray)"
                        onClick={() => {
                            setOptometricExam(rowData);
                            setOpen(true);
                        }}
                    />
                );
            }
        },
        {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) => row?.createdAt ? <>{row?.createByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            expandable: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updateByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) => row?.deletedAt ? <>{row?.deleteByUser?.fullName}  <br /><span className='date-table-style'>{formatDateWithoutSeconds(row.deletedAt)}</span></> : ' '
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ];
    // Table Ishihara Color Blindness Tes Columns
    const ishiharaColorBlindnessColumns = [
        {
            key: 'numberOfPlatesTested',
            title: 'NUMBER OF PLATES TESTED',
            dataKey: 'numberOfPlatesTested',
            render: (row: any) => row?.numberOfPlatesTested ? row?.numberOfPlatesTested : " "
        },
        {
            key: 'correctAnswersCount',
            title: 'CORRECT ANSWERS COUNT',
            dataKey: 'correctAnswersCount',
            render: (row: any) => row?.correctAnswersCount ? row?.correctAnswersCount : " "

        },
        {
            key: 'deficiencyType',
            title: 'DEFICIENCY TYPE',
            render: (row: any) =>
                row?.deficiencyTypeLvalue
                    ? row.deficiencyTypeLvalue.lovDisplayVale
                    : row.deficiencyTypeLkey
        },
        {
            key: "details",
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (
                    <MdModeEdit
                        title="Edit"
                        size={24}
                        fill="var(--primary-gray)"
                        onClick={() => {
                            setOptometricExam(rowData);
                            setOpen(true);
                        }}

                    />
                );
            }
        },
         {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) => row?.createdAt ? <>{row?.createByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            expandable: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updateByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) => row?.deletedAt ? <>{row?.deleteByUser?.fullName}  <br /><span className='date-table-style'>{formatDateWithoutSeconds(row.deletedAt)}</span></> : ' '
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ];
    // Table Ishihara Color Blindness Tes Columns
    const refractionTestResultsColumns = [
        {
            key: 'rightEyeSphere',
            title: 'RIGHT SPHERE',
            dataKey: 'rightEyeSphere',
            render: (row: any) => row?.rightEyeSphere ? row?.rightEyeSphere : " "
        },
        {
            key: 'rightCylinder',
            title: 'RIGHT CYLINDER',
            dataKey: 'rightCylinder',
            render: (row: any) => row?.rightCylinder ? row?.rightCylinder : " "

        },
        {
            key: 'rightAxis',
            title: 'RIGHT AXIS',
            dataKey: 'rightAxis',
            render: (row: any) => row?.rightAxis ? row?.rightAxis : " "

        },
        {
            key: 'leftEyeSphere',
            title: 'LEFT SPHERE',
            dataKey: 'leftEyeSphere',
            render: (row: any) => row?.leftEyeSphere ? row?.leftEyeSphere : " "
        },
        {
            key: 'leftCylinder',
            title: 'LEFT CYLINDER',
            dataKey: 'leftCylinder',
            render: (row: any) => row?.leftCylinder ? row?.leftCylinder : " "
        },
        {
            key: 'leftAxis',
            title: 'LEFT AXIS',
            dataKey: 'leftAxis',
            render: (row: any) => row?.leftAxis ? row?.leftAxis : " "
        },
        {
            key: "details",
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (
                    <MdModeEdit
                        title="Edit"
                        size={24}
                        fill="var(--primary-gray)"
                        onClick={() => {
                            setOptometricExam(rowData);
                            setOpen(true);
                        }}
                    />
                );
            }
        },
         {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) => row?.createdAt ? <>{row?.createByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            expandable: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updateByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) => row?.deletedAt ? <>{row?.deleteByUser?.fullName}  <br /><span className='date-table-style'>{formatDateWithoutSeconds(row.deletedAt)}</span></> : ' '
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ];
    // Intraocular Pressure (IOP) Columns
    const IOPColumns = [
        {
            key: 'rightEye',
            title: 'RIGHT EYE',
            dataKey: 'rightEye',
            render: (row: any) => row?.rightEye ? `${row?.rightEye} mmHg` : " "
        },
        {
            key: 'leftEye',
            title: 'LEFT EYE',
            dataKey: 'leftEye',
            render: (row: any) => row?.leftEye ? `${row?.leftEye} mmHg` : " "
        },
        {
            key: 'measurementMethod',
            title: 'MEASUREMENT METHOD',
            dataKey: 'measurementMethod',
            render: (row: any) => row?.measurementMethod ? row?.measurementMethod : " "
        },
        {
            key: 'timeOfMeasurement',
            title: 'TIME OF MEASUREMENT',
            expandable: true,
            render: (row: any) => {
                if (!row?.timeOfMeasurement) return ' ';
                const totalSeconds = row.timeOfMeasurement;
                const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
                const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
                return `${hours}:${minutes}`;
            }
        },
        {
            key: 'cornealThickness',
            title: 'CORNEAL THICKNESS',
            dataKey: 'cornealThickness',
            render: (row: any) => row?.cornealThickness ? `${row?.cornealThickness} microns` : " "
        },
        {
            key: 'glaucomaRiskAssessmentLkey',
            title: 'GLAUCOMA RISK ASSESSMENT',
            dataKey: 'glaucomaRiskAssessmentLkey',
            render: (row: any) =>
                row?.glaucomaRiskAssessmentLvalue
                    ? row.glaucomaRiskAssessmentLvalue.lovDisplayVale
                    : row.glaucomaRiskAssessmentLkey
        },
        {
            key: 'fundoscopySlitlampDone',
            title: 'FUNDOSCOPY & SLIT LAMP EXAM DONE?',
            dataKey: 'fundoscopySlitlampDone',
            render: (row: any) => row?.fundoscopySlitlampDone ? "YES" : "NO"
        },
        {
            key: 'examFindings',
            title: 'CLINICAL OBSERVATIONS',
            dataKey: 'examFindings',
            render: (row: any) => row?.examFindings ? row?.examFindings : " ",
            expandable: true,
        },
        {
            key: "details",
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (<MdModeEdit title="Edit" size={24} fill="var(--primary-gray)" onClick={() => { setOptometricExam(rowData); setOpen(true) }} />
                );
            }
        },
         {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) => row?.createdAt ? <>{row?.createByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            expandable: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updateByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) => row?.deletedAt ? <>{row?.deleteByUser?.fullName}  <br /><span className='date-table-style'>{formatDateWithoutSeconds(row.deletedAt)}</span></> : ' '
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ];
    // Interpretation & Diagnosis Columns
    const interpretationDiagnosisColumns = [
        {
            key: 'icdCode.description',
            title: 'VISION DIAGNOSIS',
            dataKey: 'icdCode.description',
            render: (row: any) => row?.icdCode?.description ? row?.icdCode?.description : " "
        },
        {
            key: 'icdCode2.description',
            title: 'VISION DIAGNOSIS',
            dataKey: 'icdCode2.description',
            render: (row: any) => row?.icdCode2?.description ? row?.icdCode2?.description : " "
        },
        {
            key: 'followUpRequired',
            title: 'REQUIRE FOLLOW-UP',
            dataKey: 'followUpRequired',
            render: (row: any) => row?.followUpRequired ? "YES" : "NO"
        },
        {
            key: 'followUpDate',
            title: 'FOLLOW-UP Date',
            dataKey: 'followUpDate',
            render: (row: any) => row?.followUpDate ? new Date(row.followUpDate).toLocaleDateString('en-GB') : " "
        },
        {
            key: 'recommendations',
            title: 'RECOMMENDATIONS',
            dataKey: 'recommendations',
            render: (row: any) => row?.recommendations ? row?.recommendations : " "
        },
        {
            key: 'additionalNotes',
            title: 'ADDITIONAL NOTES',
            dataKey: 'additionalNotes',
            render: (row: any) => row?.additionalNotes ? row?.additionalNotes : " ",
            expandable: true,
        },
        {
            key: "details",
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (<MdModeEdit title="Edit" size={24} fill="var(--primary-gray)" onClick={() => { setOptometricExam(rowData); setOpen(true) }} />
                );
            }
        },
         {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) => row?.createdAt ? <>{row?.createByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            expandable: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updateByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) => row?.deletedAt ? <>{row?.deleteByUser?.fullName}  <br /><span className='date-table-style'>{formatDateWithoutSeconds(row.deletedAt)}</span></> : ' '
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ];
    return (
        <Tabs defaultActiveKey="1" appearance="subtle" >
            <Tabs.Tab eventKey="1" title="Visual Acuity Test">
                <MyTable
                    data={optometricExamResponse?.object ?? []}
                    columns={visualAcuityColumns}
                    height={420}
                    loading={isLoading}
                    onRowClick={rowData => {
                        setOptometricExam({ ...rowData, });
                        rowData?.icdCode?.icdCode && rowData?.icdCode?.description ? setSelectedIcd10({ text: `${rowData.icdCode.icdCode} - ${rowData.icdCode.description}` }) : null;
                        rowData?.icdCode2?.icdCode && rowData?.icdCode2?.description ? setSecondSelectedicd10({ text: `${rowData.icdCode2.icdCode} - ${rowData.icdCode2.description}` }) : null;
                        setTime({ time: formatTime(rowData?.timeOfMeasurement) });
                    }}
                    rowClassName={isSelected}
                    page={pageIndex}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Ishihara Color Blindness Test">
                <MyTable
                    data={optometricExamResponse?.object ?? []}
                    columns={ishiharaColorBlindnessColumns}
                    height={420}
                    loading={isLoading}
                    onRowClick={rowData => {
                        setOptometricExam({ ...rowData, });
                        rowData?.icdCode?.icdCode && rowData?.icdCode?.description ? setSelectedIcd10({ text: `${rowData.icdCode.icdCode} - ${rowData.icdCode.description}` }) : null;
                        rowData?.icdCode2?.icdCode && rowData?.icdCode2?.description ? setSecondSelectedicd10({ text: `${rowData.icdCode2.icdCode} - ${rowData.icdCode2.description}` }) : null;
                        setTime({ time: formatTime(rowData?.timeOfMeasurement) });
                    }}
                    rowClassName={isSelected}
                    page={pageIndex}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Tabs.Tab>
            <Tabs.Tab eventKey="3" title="Refraction Test Results">
                <MyTable
                    data={optometricExamResponse?.object ?? []}
                    columns={refractionTestResultsColumns}
                    height={420}
                    loading={isLoading}
                    onRowClick={rowData => {
                        setOptometricExam({ ...rowData, });
                        rowData?.icdCode?.icdCode && rowData?.icdCode?.description ? setSelectedIcd10({ text: `${rowData.icdCode.icdCode} - ${rowData.icdCode.description}` }) : null;
                        rowData?.icdCode2?.icdCode && rowData?.icdCode2?.description ? setSecondSelectedicd10({ text: `${rowData.icdCode2.icdCode} - ${rowData.icdCode2.description}` }) : null;
                        setTime({ time: formatTime(rowData?.timeOfMeasurement) });
                    }}
                    rowClassName={isSelected}
                    page={pageIndex}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Tabs.Tab>
            <Tabs.Tab eventKey="4" title="Intraocular Pressure (IOP)">
                <MyTable
                    data={optometricExamResponse?.object ?? []}
                    columns={IOPColumns}
                    height={420}
                    loading={isLoading}
                    onRowClick={rowData => {
                        setOptometricExam({ ...rowData, });
                        rowData?.icdCode?.icdCode && rowData?.icdCode?.description ? setSelectedIcd10({ text: `${rowData.icdCode.icdCode} - ${rowData.icdCode.description}` }) : null;
                        rowData?.icdCode2?.icdCode && rowData?.icdCode2?.description ? setSecondSelectedicd10({ text: `${rowData.icdCode2.icdCode} - ${rowData.icdCode2.description}` }) : null;
                        setTime({ time: formatTime(rowData?.timeOfMeasurement) });
                    }}
                    rowClassName={isSelected}
                    page={pageIndex}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Tabs.Tab>
            <Tabs.Tab eventKey="5" title="Interpretation & Diagnosis">
                <MyTable
                    data={optometricExamResponse?.object ?? []}
                    columns={interpretationDiagnosisColumns}
                    height={420}
                    loading={isLoading}
                    onRowClick={rowData => {
                        setOptometricExam({ ...rowData, });
                        rowData?.icdCode?.icdCode && rowData?.icdCode?.description ? setSelectedIcd10({ text: `${rowData.icdCode.icdCode} - ${rowData.icdCode.description}` }) : null;
                        rowData?.icdCode2?.icdCode && rowData?.icdCode2?.description ? setSecondSelectedicd10({ text: `${rowData.icdCode2.icdCode} - ${rowData.icdCode2.description}` }) : null;
                        setTime({ time: formatTime(rowData?.timeOfMeasurement) });
                    }}
                    rowClassName={isSelected}
                    page={pageIndex}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Tabs.Tab>
        </Tabs>
    );
};
export default OptometricExamTabs;
