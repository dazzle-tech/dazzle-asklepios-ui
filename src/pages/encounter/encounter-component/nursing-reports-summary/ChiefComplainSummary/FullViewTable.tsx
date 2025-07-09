import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import { formatDateWithoutSeconds } from '@/utils';
import React from "react";
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const FullViewTable = ({ open, setOpen, list,isLoading, pageIndex, rowsPerPage, totalCount, handlePageChange, handleRowsPerPageChange}) => {
    // table columns
     const columns = [
         {
             key: 'chiefComplaint',
             title: 'Chief Complain',
 
         },
         {
             key: 'provocation',
             title: 'Provocation',
         },
         {
             key: 'palliation',
             title: 'Palliation',
         },
         {
             key: 'qualityLkey',
             title: 'Quality',
             render: (rowData: any) =>
                 rowData?.qualityLvalue
                     ? rowData.qualityLvalue.lovDisplayVale
                     : rowData.qualityLkey,
         },
         {
             key: 'regionLkey',
             title: 'Region',
             render: (rowData: any) =>
                 rowData?.regionLvalue
                     ? rowData.regionLvalue.lovDisplayVale
                     : rowData.regionLkey,
         },
         {
             key: 'severityLkey',
             title: 'Severity',
             render: (rowData: any) =>
                 rowData?.severityLvalue
                     ? rowData.severityLvalue.lovDisplayVale
                     : rowData.severityLkey,
         },
         {
             key: 'onsetDateTime',
             title: 'Onset',
             expandable: true,
             render: (row: any) =>
                 row?.onsetDateTime ? (
                     <>
                         <br />
                         <span className="date-table-style">{formatDateWithoutSeconds(row.onsetDateTime)}</span>
                     </>
                 ) : (
                     ' '
                 ),
         },
         {
             key: 'understanding',
             title: 'Understanding',
             dataKey: 'understanding',
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
            title="Chief Complain"
            steps={[{ title: "Chief Complain", icon: <FontAwesomeIcon icon={faCommentMedical} /> }]}
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