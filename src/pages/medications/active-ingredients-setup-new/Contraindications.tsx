import React, { useState, useMemo, useEffect } from "react";
import { Form, Text } from "rsuite";
import { MdDelete, MdSave } from "react-icons/md";
import { Plus } from "@rsuite/icons";

import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import Translate from "@/components/Translate";
import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import Icd10Search from "@/components/ICD10SearchComponent/IcdSearchable";

import {
  useGetContraindicationsByActiveIngredientIdQuery,
  useCreateContraindicationMutation,
  useUpdateContraindicationMutation,
  useDeleteContraindicationMutation
} from "@/services/setup/activeIngredients/activeIngredientContraindicationService";

import {
  newActiveIngredientContraindication
} from "@/types/model-types-constructor-new";

import { ActiveIngredientContraindication } from "@/types/model-types-new";

import "./styles.less";

const Contraindications = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();

  // ---------------------------------------------
  // STATE
  // ---------------------------------------------
  const [contraindication, setContraindication] = useState<ActiveIngredientContraindication>({
    ...newActiveIngredientContraindication
  });

  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    size: 5,
    sort: "id,asc"
  });

  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");

  // ---------------------------------------------
  // API
  // ---------------------------------------------
  const { data: list = [], isFetching, refetch } =
    useGetContraindicationsByActiveIngredientIdQuery(activeIngredients?.id);

  const [createContra] = useCreateContraindicationMutation();
  const [updateContra] = useUpdateContraindicationMutation();
  const [deleteContra] = useDeleteContraindicationMutation();

  const totalCount = list?.length ?? 0;

  // ---------------------------------------------
  // SELECTED ROW STYLE
  // ---------------------------------------------
  const isSelected = (row) =>
    row?.id === contraindication?.id ? "selected-row" : "";

  // ---------------------------------------------
  // TABLE COLUMNS
  // ---------------------------------------------
  const tableColumns = [
    {
      key: "icd10CodeId",
      title: <Translate>ICD Code</Translate>,
      render: row => <Text>{row.icd10CodeId}</Text>
    },
    {
      key: "icons",
      title: "",
      render: (row) => (
        <div className="container-of-icons">
          <MdDelete
            className="icons-style"
            size={24}
            fill="var(--primary-pink)"
            title="Delete"
            onClick={() => {
              setContraindication(row);
              setOpenDeleteModal(true);
            }}
          />
        </div>
      )
    }
  ];





  // ---------------------------------------------
  // SAVE (ADD + UPDATE)
  // ---------------------------------------------
    const save = () => {
      if (!contraindication.icd10CodeId) {
        return dispatch(notify({ msg: "Invalid ICD Code", sev: "error" }));
      }

      const payload = {
        ...contraindication,
        activeIngredientId: activeIngredients.id,
        icd10CodeId: contraindication.icd10CodeId
      };

      if (contraindication.id) {
        updateContra(payload)
          .unwrap()
          .then(() => {
            dispatch(notify({ msg: "Updated successfully", sev: "success" }));
            refetch();
            setContraindication({ ...newActiveIngredientContraindication });
          })
          .catch(() => {
            dispatch(notify({ msg: "Update failed", sev: "error" }));
          });
      } else {
        createContra(payload)
          .unwrap()
          .then(() => {
            dispatch(notify({ msg: "Added successfully", sev: "success" }));
            refetch();
            setContraindication({ ...newActiveIngredientContraindication });
          })
          .catch(() => {
            dispatch(notify({ msg: "Failed to save", sev: "error" }));
          });
      }
          };


  // ---------------------------------------------
  // DELETE
  // ---------------------------------------------
  const remove = () => {
    setOpenDeleteModal(false);

    if (!contraindication?.id) {
      return dispatch(notify({ msg: "Invalid Contraindication", sev: "error" }));
    }

    deleteContra(contraindication.id)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
        refetch();
        setContraindication({ ...newActiveIngredientContraindication });
      })
      .catch(() =>
        dispatch(notify({ msg: "Failed to delete", sev: "error" }))
      );
  };

  // ---------------------------------------------
  // PAGINATION CALCULATION
  // ---------------------------------------------
  const pageIndex = pagination.page;
  const rowsPerPage = pagination.size;

  const paginatedData = useMemo(() => {
    if (!list) return [];
    const start = pageIndex * rowsPerPage;
    return list.slice(start, start + rowsPerPage);
  }, [list, pageIndex, rowsPerPage]);

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------

  return (
    <Form fluid>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <Icd10Search
            object={contraindication}
            setOpject={setContraindication}
            fieldName="icd10CodeId"
            label="Contraindications (ICD-10)"
            mode="singleICD10"
          />
        </div>

        <div className="container-of-buttons-active">
          <MyButton
            prefixIcon={() => <MdSave />}
            title="Save"
            color="var(--deep-blue)"
            onClick={save}
          />
          <MyButton
            prefixIcon={() => <Plus />}
            title="New"
            color="var(--deep-blue)"
            onClick={() =>
              setContraindication({ ...newActiveIngredientContraindication })
            }
          />
        </div>
      </div>

      <MyTable
        height={450}
        data={paginatedData}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row) => setContraindication(row)}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, order) => {
          setSortColumn(col);
          setSortType(order);
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(e, newPage) =>
          setPagination((prev) => ({ ...prev, page: newPage }))
        }
        onRowsPerPageChange={(e) =>
          setPagination((prev) => ({
            ...prev,
            size: Number(e.target.value),
            page: 0
          }))
        }
      />

      <DeletionConfirmationModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        itemToDelete="Contraindication"
        actionType="Delete"
        actionButtonFunction={remove}
      />
    </Form>
  );
};

export default Contraindications;
