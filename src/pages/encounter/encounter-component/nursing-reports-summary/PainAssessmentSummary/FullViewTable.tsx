import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import { formatDateWithoutSeconds } from '@/utils';
import React from "react";
import { faFaceFrownOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const FullViewTable = ({ open, setOpen, list,isLoading, pageIndex, rowsPerPage, totalCount, handlePageChange, handleRowsPerPageChange}) => {
    // Table Column 
    const columns = [
        {
            key: 'assessmentDateTime',
            title: 'Assessment Date Time',
            render: (row: any) =>
                row?.createdAt ? (
                    <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                ) : (
                    ' '
                ),
        },
        {
            key: 'painDegreeLkey',
            title: 'Pain Degree',
            render: (rowData: any) =>
                rowData?.painDegreeLvalue
                    ? rowData.painDegreeLvalue.lovDisplayVale
                    : rowData.painDegreeLkey,
        },
        {
            key: 'painLocationLkey',
            title: 'Pain Location',
            render: (rowData: any) =>
                rowData?.painLocationLvalue
                    ? rowData.painLocationLvalue.lovDisplayVale
                    : rowData.painLocationLkey,
        },
        {
            key: 'painPatternLkey',
            title: 'Pain Pattern',
            render: (rowData: any) =>
                rowData?.painPatternLvalue
                    ? rowData.painPatternLvalue.lovDisplayVale
                    : rowData.painPatternLkey,
        },
        {
            key: 'onsetLkey',
            title: 'Onset',
            render: (rowData: any) =>
                rowData?.onsetLvalue ? rowData.onsetLvalue.lovDisplayVale : rowData.onsetLkey,
        },
        {
            key: 'painScoreLkey',
            title: 'Pain Score',
            render: (rowData: any) =>
                rowData?.painScoreLvalue
                    ? rowData.painScoreLvalue.lovDisplayVale
                    : rowData.painScoreLkey,
        },
        {
            key: 'duration',
            title: 'Duration',
            render: (rowData: any) => (
                <>
                    {rowData?.duration}{' '}
                    {rowData?.durationUnitLvalue
                        ? rowData.durationUnitLvalue.lovDisplayVale
                        : rowData.durationUnitLkey}
                </>
            ),
        },
        {
            key: 'aggravatingFactors',
            title: 'Aggravating Factors',
            dataKey: 'aggravatingFactors',
            expandable: true,
        },
        {
            key: 'relievingFactors',
            title: 'Relieving Factors',
            dataKey: 'relievingFactors',
            expandable: true,
        },
        {
            key: 'associatedSymptoms',
            title: 'Associated Symptoms',
            dataKey: 'associatedSymptoms',
            expandable: true,
        },
        {
            key: 'impactOnFunction',
            title: 'Impact on Function / Sleep',
            render: (rowData: any) => (rowData?.impactOnFunction ? 'YES' : 'NO'),
            expandable: true,
        },
        {
            key: 'painManagementGiven',
            title: 'Pain Management Given',
            dataKey: 'painManagementGiven',
            expandable: true,
        },
        {
            key: 'painReassessmentRequired',
            title: 'Pain Reassessment Required',
            render: (rowData: any) => (rowData?.painReassessmentRequired ? 'YES' : 'NO'),
            expandable: true,
        },
        {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) =>
                row?.createdAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                    </>
                ) : (
                    ' '
                ),
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) =>
                row?.deletedAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
                    </>
                ) : (
                    ' '
                ),
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        },
    ];

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            bodyheight="70vh"
            size="80vw"
            hideBack
            hideActionBtn
            title="Pain Assessment"
            steps={[{ title: "Pain Assessment", icon: <FontAwesomeIcon icon={faFaceFrownOpen} /> }]}
            content={<>
                 <MyTable
                        data={list ?? []}
                        columns={columns}
                        height={600}
                        loading={isLoading}
                        page={pageIndex}
                        rowsPerPage={rowsPerPage}
                        totalCount={totalCount}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    /></>}
        />)
}
export default FullViewTable