import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import { formatDateWithoutSeconds } from '@/utils';
import React from "react";
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const FullViewTable = ({ open, setOpen, list, isLoading, pageIndex, rowsPerPage, totalCount, handlePageChange, handleRowsPerPageChange }) => {
    // Table Column 
    const columns = [
        {
            key: 'positionStatusLkey',
            title: 'Position Status',
            render: (rowData: any) =>
                rowData?.positionStatusLvalue
                    ? rowData.positionStatusLvalue.lovDisplayVale
                    : rowData.positionStatusLkey,

        },
        {
            key: 'bodyMovementsLkey',
            title: 'Body Movements',
            render: (rowData: any) =>
                rowData?.bodyMovementsLvalue
                    ? rowData.bodyMovementsLvalue.lovDisplayVale
                    : rowData.bodyMovementsLkey,
        },
        {
            key: 'levelOfConsciousnessLkey',
            title: 'Level of Consciousness',
            render: (rowData: any) =>
                rowData?.levelOfConsciousnessLvalue
                    ? rowData.levelOfConsciousnessLvalue.lovDisplayVale
                    : rowData.levelOfConsciousnessLkey,
        },
        {
            key: 'facialExpressionLkey',
            title: 'Facial Expression',
            render: (rowData: any) =>
                rowData?.facialExpressionLvalue
                    ? rowData.facialExpressionLvalue.lovDisplayVale
                    : rowData.facialExpressionLkey,
        },
        {
            key: 'speechLkey',
            title: 'Speech',
            render: (rowData: any) =>
                rowData?.speechLvalue
                    ? rowData.speechLvalue.lovDisplayVale
                    : rowData.speechLkey,
        },
        {
            key: 'moodBehaviorLkey',
            title: 'Mood/Behavior',
            render: (rowData: any) =>
                rowData?.moodBehaviorLvalue
                    ? rowData.moodBehaviorLvalue.lovDisplayVale
                    : rowData.moodBehaviorLkey,
        },
        {
            key: 'memoryRecent',
            title: 'Memory – Recent',
            render: (rowData: any) => rowData?.memoryRecent ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'memoryRemote',
            title: 'Memory – Remote',
            render: (rowData: any) => rowData?.memoryRemote ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'signsOfAgitation',
            title: 'Signs of Agitation',
            render: (rowData: any) => rowData?.signsOfAgitation ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'signsOfDepression',
            title: 'Signs of Depression',
            render: (rowData: any) => rowData?.signsOfDepression ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'signsOfSuicidalIdeation',
            title: 'Signs of Suicidal Ideation',
            render: (rowData: any) => rowData?.signsOfSuicidalIdeation ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'signsOfSubstanceUse',
            title: 'Signs of Substance Use',
            render: (rowData: any) => rowData?.signsOfSubstanceUse ? "YES" : "NO",
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
            title="General Assessment"
            steps={[{ title: "General Assessment", icon: <FontAwesomeIcon icon={faClipboardList} /> }]}
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