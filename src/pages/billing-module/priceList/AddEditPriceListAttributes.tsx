// AddEditPriceListAttributes.tsx
import MyButton from "@/components/MyButton/MyButton";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate";
import React, { useEffect, useMemo, useState } from "react";
import { Form, Row, Col, Tooltip, Whisper } from "rsuite";
import { MdDelete } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import {
    useGetPriceListAttributesByPriceListQuery,
    useCreatePriceListAttributeMutation,
    useUpdatePriceListAttributeMutation,
    useTogglePriceListAttributeActiveMutation,
} from "@/services/billing/PriceListAttributesService";

import { PriceList, PriceListAttribute } from "@/types/model-types-new";
import { newPriceListAttribute } from "@/types/model-types-constructor-new";
import { PaginationPerPage } from "@/utils/paginationPerPage";
import { formatEnumString } from "@/utils";
import { useEnumOptions } from "@/services/enumsApi";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { constants } from "crypto";
import { useGetFacilityByIdQuery } from "@/services/security/facilityService";

const AddEditPriceListAttributes = ({
    open,
    setOpen,
    priceList,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    priceList: PriceList | null;
}) => {
    const dispatch = useAppDispatch();
    const attributeTypes = useEnumOptions("PriceAttributes");
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [stateOfDeleteModal, setStateOfDeleteModal] = useState("deactivate");
    const encounterTypeOptions = useEnumOptions("EncounterType");
    const visitTypeOptions = useEnumOptions("VisitType");
    const patientClassOptions = useEnumOptions("PatientClass");
    const visitTimeOptions = useEnumOptions("VisitTime");
    const ageCategoryOptions = useEnumOptions("AgeCategory");
    const encounterPriorityOptions = useEnumOptions("EncounterPriority");
    const bedClassOptions = useEnumOptions("BedClass");

    const [attributeRec, setAttributeRec] = useState<PriceListAttribute>({
        ...newPriceListAttribute,
    });
    const { data: facilityData } = useGetFacilityByIdQuery(priceList?.facilityId, { skip: !priceList?.facilityId });

    const [paginationParams, setPaginationParams] = useState({
        page: 0,
        size: 5,
        sort: "id,asc",
        timestamp: Date.now(),
    });

    const { data: attrsPage } = useGetPriceListAttributesByPriceListQuery(
        {
            priceListId: priceList?.id as any,
            ...paginationParams,
        },
        { skip: !priceList?.id }
    );

    const attributesList = attrsPage?.data ?? [];
    const link = attrsPage?.links;
    const totalCount = attrsPage?.totalCount ?? 0;
    const pageIndex = paginationParams.page;
    const rowsPerPage = paginationParams.size;

    const [createAttr] = useCreatePriceListAttributeMutation();
    const [updateAttr] = useUpdatePriceListAttributeMutation();
    const [toggleActive] = useTogglePriceListAttributeActiveMutation(); // ✅

    useEffect(() => {
        if (priceList?.id) {
            setAttributeRec((prev) => ({
                ...prev,
                priceListId: priceList.id,
            }));
        }
    }, [priceList?.id]);

    const optionsByType = (type?: string) => {
        switch (type) {
            case "ENCOUNTERTYPE":
                return encounterTypeOptions ?? [];
            case "VISITTYPE":
                return visitTypeOptions ?? [];
            case "PATIENTCLASS":
                return patientClassOptions ?? [];
            case "VISITTIME":
                return visitTimeOptions ?? [];
            case "AGECATEGORY":
                return ageCategoryOptions ?? [];
            case "ENCOUNTERPRIORITY":
                return encounterPriorityOptions ?? [];
            case "BEDCLASS":
                return bedClassOptions ?? [];
            default:
                return [];
        }
    };

    const attributeOptions = useMemo(
        () => optionsByType(attributeRec.attributeType),
        [
            attributeRec.attributeType,
            encounterTypeOptions,
            visitTypeOptions,
            patientClassOptions,
            visitTimeOptions,
            ageCategoryOptions,
            encounterPriorityOptions,
            bedClassOptions,
        ]
    );

    const extractValidationMessages = (detail?: string) => {
        if (!detail) return [];

        const matches = [...detail.matchAll(/interpolatedMessage='([^']+)'/g)];
        const msgs = matches.map(m => m[1]);

        return Array.from(new Set(msgs)); // remove duplicates
    };

    const handleSave = async () => {
        if (!priceList?.id) return;
        try {
            const payload = {
                ...attributeRec,
                priceListId: priceList.id,
            } as any;

            if (attributeRec.id) {
                await updateAttr(payload).unwrap();
            } else {
                await createAttr(payload).unwrap();
            }
            dispatch
            setAttributeRec({
                ...newPriceListAttribute,
                priceListId: priceList.id,
            });
            dispatch(notify({ msg: "Saved Successfully", sev: "success" }))
            setPaginationParams((p) => ({ ...p, timestamp: Date.now() }));
        }
        catch (error: any) {
            console.error("❌ Error saving price list attribute:", error);
            console.log("feild message", error?.data?.fieldErrors)

            const fieldMessages =
                error?.data?.fieldErrors
                    ?.map((item) => item?.message)
                    ?.filter(Boolean) 
                    ?.join(" | ");  


            dispatch(
                notify({
                    msg: fieldMessages,
                    sev: "error",
                })
            );
        }


    }
    const handleDeactivateReactivate = () => {
        handleToggleActive(attributeRec.id);
        setOpenConfirmModal(false);
    };

    // ✅ بدل delete
    const handleToggleActive = async (id?: number | string) => {
        if (!id) return;
        try {
            await toggleActive({ id } as any).unwrap();
            setPaginationParams((p) => ({ ...p, timestamp: Date.now() }));
        } catch (e) {
            console.error("Error toggling active for price list attribute", e);
        }
    };

    const handlePageChange = (event, newPage) => {
        PaginationPerPage.handlePageChange(
            event,
            newPage,
            paginationParams,
            link,
            setPaginationParams
        );
    };

    const isSelected = (rowData: any) =>
        rowData?.id === attributeRec?.id ? "selected-row" : "";

    // ✅ أيقونات Toggle
    const iconsForActions = (rowData: any) => (
        <div className="container-of-icons">
            {rowData?.isActive ? (
                <Whisper
                    trigger="hover"
                    placement="top"
                    speaker={<Tooltip><Translate>Deactivate</Translate></Tooltip>}
                >
                    <MdDelete
                        title="Deactivate"
                        size={24}
                        fill="var(--primary-pink)"
                        className="icons-style"
                        onClick={() => {
                            setAttributeRec(rowData);
                            setStateOfDeleteModal("deactivate");
                            setOpenConfirmModal(true);
                        }}
                    />
                </Whisper>
            ) : (
                <Whisper
                    trigger="hover"
                    placement="top"
                    speaker={<Tooltip><Translate>Reactivate</Translate></Tooltip>}
                >
                    <FaUndo
                        title="Activate"
                        size={24}
                        fill="var(--primary-gray)"
                        className="icons-style"
                        onClick={() => {
                            setAttributeRec(rowData);
                            setStateOfDeleteModal("reactivate");
                            setOpenConfirmModal(true);
                        }}
                    />
                </Whisper>
            )}
        </div>
    );

    const tableColumns = [
        {
            key: "attributeType",
            title: <Translate>Type</Translate>,
            flexGrow: 2,
            render: (rowData: any) => (
                <span>{formatEnumString(rowData.attributeType)}</span>
            ),
        },
        {
            key: "attribute",
            title: <Translate>Attribute</Translate>,
            flexGrow: 3,
            render: (rowData: any) => (
                <span>{formatEnumString(rowData.attribute)}</span>
            ),
        },
        {
            key: "price",
            title: <Translate>Price</Translate>,
            flexGrow: 2,
        },
        {
            key: "isActive",
            title: <Translate>Status</Translate>,
            flexGrow: 1,
            render: (rowData: any) => (
                <span>{rowData?.isActive ? "Active" : "Inactive"}</span>
            ),
        },
        {
            key: "icons",
            title: "",
            flexGrow: 1,
            render: (rowData: any) => iconsForActions(rowData),
        },
    ];

    return (
        <MyModal
            title={"Price List Attributes"}
            open={open}
            setOpen={setOpen}
            hideActionBtn={true}
            size="80vh"
            content={
                <Form fluid>
                    <Row>
                        <Col md={6}>
                            <MyInput
                                required
                                width="100%"
                                fieldType="select"
                                fieldLabel="Attribute Type"
                                fieldName="attributeType"
                                selectData={attributeTypes ?? []}
                                selectDataLabel="label"
                                selectDataValue="value"
                                record={attributeRec}
                                setRecord={(u) => {
                                    setAttributeRec((prev) => ({
                                        ...prev,
                                        attributeType: u.attributeType,
                                        attribute: "",
                                    }));
                                }}
                            />
                        </Col>

                        <Col md={6}>
                            <MyInput
                                required
                                width="100%"
                                fieldType={attributeOptions.length > 0 ? "select" : "text"}
                                fieldLabel="Attribute"
                                fieldName="attribute"
                                selectData={attributeOptions}
                                selectDataLabel="label"
                                selectDataValue="value"
                                record={attributeRec}
                                setRecord={setAttributeRec}
                                placeholder={
                                    attributeOptions.length > 0
                                        ? "Select Attribute"
                                        : "Enter Attribute"
                                }
                            />
                        </Col>

                        <Col md={6}>
                            <MyInput
                                required
                                width="100%"
                                fieldLabel="Price"
                                fieldName="price"
                                fieldType="number"
                                record={attributeRec}
                                setRecord={setAttributeRec}
                            />
                        </Col>
                        <Col md={6}>
                            <MyInput
                                fieldName="defaultCurrency"
                                fieldLabel="Currency"
                                record={facilityData}
                                setRecord={() => { }}
                                disabled
                            />
                        </Col>
                    </Row>

                    <div style={{ marginTop: "16px", display: "flex", gap: 8 }}>
                        <MyButton
                            color="var(--primary-green)"
                            width="120px"
                            onClick={handleSave}
                        >
                            {attributeRec.id ? "Update" : "Save"}
                        </MyButton>

                        {attributeRec.id && (
                            <MyButton
                                color="var(--primary-gray)"
                                width="120px"
                                onClick={() =>
                                    setAttributeRec({
                                        ...newPriceListAttribute,
                                        priceListId: priceList?.id as any,
                                    })
                                }
                            >
                                Clear
                            </MyButton>
                        )}
                    </div>

                    <MyTable
                        height={450}
                        data={attributesList}
                        columns={tableColumns}
                        totalCount={totalCount}
                        rowClassName={isSelected}
                        onRowClick={(rowData) => setAttributeRec(rowData)}
                        page={pageIndex}
                        rowsPerPage={rowsPerPage}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={(e) => {
                            const newSize = Number(e.target.value);
                            setPaginationParams({
                                ...paginationParams,
                                size: newSize,
                                page: 0,
                                timestamp: Date.now(),
                            });
                        }}
                    />
                    <DeletionConfirmationModal
                        open={openConfirmModal}
                        setOpen={setOpenConfirmModal}
                        itemToDelete="Price List Attruibite"
                        actionButtonFunction={handleDeactivateReactivate}
                        actionType={stateOfDeleteModal}
                    />
                </Form>
            }

        />
    );
};

export default AddEditPriceListAttributes;
