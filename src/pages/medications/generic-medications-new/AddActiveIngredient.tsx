import MyButton from "@/components/MyButton/MyButton";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput";
import { newBrandMedicationActiveIngredient } from "@/types/model-types-constructor-new";
import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "rsuite";
import AddOutlineIcon from "@rsuite/icons/AddOutline";

import {
  useGetActiveIngredientsByBrandQuery,
  useCreateActiveIngredientMutation,
  useDeleteActiveIngredientMutation,
} from "@/services/setup/brandmedication/BrandMedicationActiveIngredientService";

import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { conjureValueBasedOnIDFromList, conjureValueBasedOnKeyFromList } from "@/utils";
import { MdDelete } from "react-icons/md";
import Translate from "@/components/Translate";

import {
  useGetActiveIngredientsQuery,
  useGetActiveIngredientsByNameQuery,
  useGetActiveIngredientsByIdsMutation,
} from "@/services/setup/activeIngredients/activeIngredientsService";

const AddActiveIngredient = ({ open, setOpen, brandMedication, onSaved }) => {
  const [BrandActive, setBrandActive] = useState({
    ...newBrandMedicationActiveIngredient,
  });

  const [page, setPage] = useState(0);
  const [activeIngredients, setActiveIngredients] = useState([]);
  const [activeIngredientSearch, setActiveIngredientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedActiveIngredient, setSelectedActiveIngredient] = useState<any>(null);
  const [activeIngredientMap, setActiveIngredientMap] = useState<Record<string, string>>({});

  const { data: BrandActiveIngrediant } = useGetActiveIngredientsByBrandQuery(
    brandMedication?.id,
    { skip: !brandMedication?.id }
  );

  const {
    data: activeIngredientList,
    isFetching: isFetchingActiveIngredients,
  } = useGetActiveIngredientsQuery(
    {
      page,
      size: 5,
      sort: "name,asc",
    },
    {
      skip: Boolean(debouncedSearch),
    }
  );

  const {
    data: searchedActiveIngredientList,
    isFetching: isFetchingSearchedActiveIngredients,
  } =
    useGetActiveIngredientsByNameQuery(
      {
        name: debouncedSearch,
        page,
        size: 5,
        sort: "name,asc",
      },
      {
        skip: !debouncedSearch,
      }
    );


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(activeIngredientSearch.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [activeIngredientSearch]);

  const handleActiveIngredientSearch = (value: string) => {
    setPage(0);
    setActiveIngredientSearch(value);

    if (value.trim()) {
      setActiveIngredients([]);
    }
  };

  const { data: unitLov } = useGetLovValuesByCodeQuery("VALUE_UNIT");

  const [createActive] = useCreateActiveIngredientMutation();
  const [deleteActive] = useDeleteActiveIngredientMutation();
  const [getActiveIngredientsByIds] =
    useGetActiveIngredientsByIdsMutation();
  const isSelected = (rowData) =>
    rowData?.id === BrandActive?.id ? "selected-row" : "";

  // Save (Create)
  const handleSave = async () => {
    try {
      await createActive({
        ...BrandActive,
        brandId: brandMedication?.id
      }).unwrap();

      await onSaved?.();
      setBrandActive({ ...newBrandMedicationActiveIngredient });

    } catch (error) {
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteActive(id).unwrap();
      setBrandActive({ ...newBrandMedicationActiveIngredient });

    } catch (error) {
    }
  };

  // Icons
  const iconsForActions = (rowData) => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        size={24}
        fill="var(--primary-pink)"
        title="Delete"
        onClick={() => handleDelete(rowData.id)}
      />
    </div>
  );

  // Table columns
  const tableActiveIngredientColumns = [
    {
      key: "activeIngredientId",
      title: "Active Ingredient",
      flexGrow: 3,
      render: (rowData) => {
        const id = String(rowData?.activeIngredientId ?? "");

        return (
          <span>
            {activeIngredientMap[id] ?? id}
          </span>
        );
      },
    },
    {
      key: "strength",
      title: <Translate>Strength</Translate>,
      flexGrow: 3,
      render: (rowData) => (
        <span>
          {rowData.strength}{" "}
          {conjureValueBasedOnKeyFromList(
            unitLov?.object ?? [],
            rowData.unit,
            "lovDisplayVale"
          )}
        </span>
      ),
    },
    {
      key: "icons",
      title: "",
      flexGrow: 1,
      render: (rowData) => iconsForActions(rowData),
    },
  ];

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    const response = debouncedSearch
      ? searchedActiveIngredientList
      : activeIngredientList;

    if (!response?.data) return;

    setActiveIngredients(prev => {
      const combined =
        page === 0
          ? response.data
          : [...prev, ...response.data];

      return Array.from(
        new Map(
          combined
            .filter(item => item?.id != null)
            .map(item => [String(item.id), item])
        ).values()
      );
    });

    setActiveIngredientMap(prev => {
      const next = { ...prev };

      response.data.forEach(item => {
        if (item?.id != null) {
          next[String(item.id)] = item.name;
        }
      });

      return next;
    });
  }, [
    activeIngredientList,
    searchedActiveIngredientList,
    debouncedSearch,
    page,
  ]);

  useEffect(() => {
    if (!BrandActive?.activeIngredientId) return;

    const selected = activeIngredients.find(
      item => String(item.id) === String(BrandActive.activeIngredientId)
    );

    if (!selected) return;

    setActiveIngredientMap(prev => ({
      ...prev,
      [String(selected.id)]: selected.name,
    }));
  }, [BrandActive?.activeIngredientId, activeIngredients]);

  useEffect(() => {
    if (!BrandActiveIngrediant?.length) return;

    const ids = Array.from(
      new Set(
        BrandActiveIngrediant
          .map(item => item?.activeIngredientId)
          .filter(id => id != null)
          .map(id => String(id))
      )
    );

    if (!ids.length) return;

    const loadActiveIngredientNames = async () => {
      try {
        const result = await getActiveIngredientsByIds(
          ids.map(id => Number(id))
        ).unwrap();

        setActiveIngredientMap(prev => {
          const next = { ...prev };

          result.forEach(item => {
            if (item?.id != null) {
              next[String(item.id)] = item.name;
            }
          });

          return next;
        });
      } catch (error) {
        console.error(
          "Failed to load active ingredient names:",
          error
        );
      }
    };

    loadActiveIngredientNames();
  }, [BrandActiveIngrediant, getActiveIngredientsByIds]);


  const handleFetchMore = () => {
    if (
      isFetchingActiveIngredients ||
      isFetchingSearchedActiveIngredients
    ) {
      return;
    }

    const response = debouncedSearch
      ? searchedActiveIngredientList
      : activeIngredientList;

    if (activeIngredients.length < (response?.totalCount ?? 0)) {
      setPage(prev => prev + 1);
    }
  };


  const isActiveIngredientLoading =
    isFetchingActiveIngredients ||
    isFetchingSearchedActiveIngredients;

  const activeIngredientTotalCount = debouncedSearch
    ? searchedActiveIngredientList?.totalCount ?? 0
    : activeIngredientList?.totalCount ?? 0;

  const activeIngredientSelectData = (() => {
    if (!selectedActiveIngredient?.id) {
      return activeIngredients;
    }

    const exists = activeIngredients.some(
      item => String(item?.id) === String(selectedActiveIngredient.id)
    );

    if (exists) {
      return activeIngredients;
    }

    return [selectedActiveIngredient, ...activeIngredients];
  })();

  return (
    <MyModal
      title={"Add Active Ingredient"}
      open={open}
      setOpen={setOpen}
      hideActionBtn={true}
      content={
        <div dir={dir}>
          <Form fluid>


            <Row>
              <Col md={8}>
                <MyInput
                  required
                  width="100%"
                  fieldType="selectPagination"
                  selectDataLabel="name"
                  selectDataValue="id"
                  selectData={activeIngredientSelectData}

                  searchKeyWard={activeIngredientSearch}
                  setSearchKeyWard={handleActiveIngredientSearch}

                  loading={isActiveIngredientLoading}

                  hasMore={
                    activeIngredients.length < activeIngredientTotalCount
                  }

                  onFetchMore={handleFetchMore}

                  onSelectItem={(item) => {
                    setSelectedActiveIngredient(item);
                  }}

                  fieldLabel="Active Ingredient ID"
                  fieldName="activeIngredientId"
                  record={BrandActive}
                  setRecord={setBrandActive}
                />
              </Col>

              <Col md={8}>
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Strength"
                  fieldName="strength"
                  fieldType="number"
                  record={BrandActive}
                  setRecord={setBrandActive}
                />
              </Col>

              <Col md={8}>
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Unit"
                  fieldName="unit"
                  fieldType="select"
                  selectData={unitLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  disableByField='isValid'

                  selectDataValue="key"
                  record={BrandActive}
                  setRecord={setBrandActive}
                />
              </Col>
            </Row>

            <div style={{ marginTop: "16px" }}>
              <MyButton
                color="var(--primary-green)"
                width="120px"
                onClick={handleSave}
              >
                Save
              </MyButton>
            </div>


            <MyTable
              height={450}
              data={BrandActiveIngrediant ?? []}
              columns={tableActiveIngredientColumns}
              rowClassName={isSelected}
              onRowClick={(rowData) => setBrandActive(rowData)}
            />
          </Form>
        </div>
      }
      size="70vh"
    />
  );
};

export default AddActiveIngredient;
