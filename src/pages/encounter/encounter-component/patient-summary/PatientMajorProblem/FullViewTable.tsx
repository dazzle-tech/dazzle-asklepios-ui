import React from 'react';
import { faLungsVirus } from '@fortawesome/free-solid-svg-icons';
import '../styles.less'
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
const FullViewTable = ({ open, setOpen, data }) => {

    const majorDiagnosesColumns = [
        {
            key: 'icdCode',
            title: 'Problem code',
            render: (rowData: any) => rowData.diagnosisObject?.icdCode || ''
        },
        {
            key: 'description',
            title: 'Description',
            render: (rowData: any) => rowData.diagnosisObject?.description || ''
        },
        {
            key: 'diagnoseType',
            title: 'Type',
            render: (rowData: any) =>
                rowData.diagnoseTypeLvalue?.lovDisplayVale || rowData.diagnoseTypeLkey || ''
        },
        {
            key: 'diagnosisDate',
            title: 'Diagnosis Date',
            render: (rowData: any) =>
                rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''
        }
    ];

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Patient Major Diagnoses"
            content={<MyTable
                data={data ?? []}
                columns={majorDiagnosesColumns}
                height={300}
            />}
            hideCanel={false}
            bodyheight={400}
            hideBack={true}
            steps={[{ title: "Major Diagnoses", icon: faLungsVirus }]}
            hideActionBtn={true}
        />
    );
};
export default FullViewTable;