import React from "react";
import { notify } from '@/utils/uiReducerActions';
import MyTable
    from "@/components/MyTable";
import { conjureValueBasedOnKeyFromList } from '@/utils';
import Translate from "@/components/Translate";
import { useGetLinkedBrandQuery } from "@/services/medicationsSetupService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import MyModal from "@/components/MyModal/MyModal";
import { faRightLeft } from "@fortawesome/free-solid-svg-icons";
const Substitues = ({ open, setOpen, selectedGeneric }) => {
    const { data: lisOfLinkedBrand } = useGetLinkedBrandQuery(selectedGeneric?.key, { skip: selectedGeneric?.key == null });
    const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const tableColumns = [
        {
            key: "code",
            dataKey: "code",
            title: <Translate>Code</Translate>,
            flexGrow: 1,
            fillText: true,
            render: (rowData: any) => {
                return rowData.code;
            },
        },
        {
            key: "brandName",
            dataKey: "brandName",
            title: <Translate>Brand Name</Translate>,
            flexGrow: 1,
            fillText: true,
            render: (rowData: any) => {
                return rowData.brandName;
            },
        },
        {
            key: "manufacturerLkey",
            dataKey: "manufacturerLkey",
            title: <Translate>Manufacturer</Translate>,
            flexGrow: 2,
            fillText: true,
            render: (rowData: any) => {
                return rowData.manufacturerLvalue
                    ? rowData.manufacturerLvalue.lovDisplayVale
                    : rowData.manufacturerLkey;
            },
        },
        {
            key: "dosageFormLkey",
            dataKey: "dosageFormLkey",
            title: <Translate>Dosage Form</Translate>,
            flexGrow: 2,
            fillText: true,
            render: (rowData: any) => {
                return rowData.dosageFormLvalue
                    ? rowData.dosageFormLvalue.lovDisplayVale
                    : rowData.dosageFormLkey;
            },
        },
        {
            key: "usageInstructions",
            dataKey: "usageInstructions",
            title: <Translate>Usage Instructions</Translate>,
            flexGrow: 2,
            fillText: true,
            render: (rowData: any) => {
                return rowData.usageInstructions;
            },
        },
        {
            key: "rout",
            dataKey: "rout",
            title: <Translate>Rout</Translate>,
            flexGrow:2,
            fillText: true,
            render: (rowData: any) => {
                return rowData.roaList?.map((item, index) => {
                    const value = conjureValueBasedOnKeyFromList(
                        medRoutLovQueryResponse?.object ?? [],
                        item,
                        'lovDisplayVale'
                    );
                    return (
                        <span key={index}>
                            {value}
                            {index < rowData.roaList.length - 1 && ', '}
                        </span>
                    );
                });
            },
        },
        {
            key: "expiresAfterOpening",
            dataKey: "expiresAfterOpening",
            title: <Translate>Expires After Opening</Translate>,
            flexGrow: 1,
            fillText: true,
            render: (rowData: any) => {
                return rowData.expiresAfterOpening ? 'Yes' : 'No';
            },
        },
        {
            key: "singlePatientUse",
            dataKey: "singlePatientUse",
            title: <Translate>Single Patient Use</Translate>,
            flexGrow: 1,
            fillText: true,
            render: (rowData: any) => {
                return rowData.singlePatientUse ? 'Yes' : 'No';
            },
        },
        {
            key: "deletedAt",
            dataKey: "deletedAt",
            title: <Translate>Status</Translate>,
            flexGrow: 1,
            fillText: true,
            render: (rowData: any) => {
                return rowData.deletedAt === null ? 'Active' : 'Inactive';
            },
        },
    ];
    return (<>
    <MyModal
        open={open}
        setOpen={setOpen}
        size="md"
        bodyheight={550}
        title={<Translate>Substitutes</Translate>}
        steps={[{ title: "Substitutes", icon:faRightLeft }]}
        position="right"
        content={<>
        <MyTable
        data={lisOfLinkedBrand?.object ?? []}
        columns={tableColumns}

        /></>}

    ></MyModal>

    
        </>);
}
export default Substitues;