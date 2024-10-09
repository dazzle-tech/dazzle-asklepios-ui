import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Carousel, Pagination, Panel, Table, Container, Row, Col, Button, ButtonToolbar, IconButton, Accordion } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useSaveActiveIngredientMutation,
  useGetActiveIngredientQuery,
  useGetActiveIngredientIndicationQuery,
} from '@/services/medicationsSetupService';
import {
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApActiveIngredient } from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import NewActiveIngredients from './NewActiveIngredients';

const ActiveIngredientsSetup = () => {
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
  const [popupOpen, setPopupOpen] = useState(false);

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  


  const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);

  const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
  const { data: MedicationCategorLovQueryResponse } = useGetLovValuesByCodeQuery('MED_CATEGORY');
  const { data: MedicationClassLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ClASS');
  const { data: MedicationTypesLovQueryResponse } = useGetLovValuesByCodeQuery('MED_TYPES');
  const { data: indicationListResponseData } = useGetActiveIngredientIndicationQuery(listRequest);


  const handleNew = () => {
    setActiveIngredient({...newApActiveIngredient});
    setCarouselActiveIndex(1);
  };


  const handleSave = () => {
    setPopupOpen(false);
    saveActiveIngredient(activeIngredient).unwrap();
  };


  useEffect(() => {
    if (saveActiveIngredientMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveActiveIngredientMutation.data]);

  const isSelected = rowData => {
    if (rowData && activeIngredient && rowData.key === activeIngredient.key) {
      return 'selected-row';
    } else return '';
  };

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  return (
    <Carousel
    style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
    autoplay={false}
    activeIndex={carouselActiveIndex}
  >
    <Panel
      header={
        <h3 className="title">
          <Translate>Active Ingredients</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!activeIngredient.key}
          appearance="primary"
          onClick={() => setCarouselActiveIndex(1)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !activeIngredient.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Active/Deactive
        </IconButton>
      </ButtonToolbar>
      <hr />
      <Table
        height={400}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortColumn={(sortBy, sortType) => {
          if (sortBy)
            setListRequest({
              ...listRequest,
              sortBy,
              sortType
            });
        }}
        headerHeight={80}
        rowHeight={60}
        bordered
        cellBordered
        data={activeIngredientListResponse?.object ?? []}
        onRowClick={rowData => {
          setActiveIngredient(rowData);
        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('code', e)} />
            <Translate>Code</Translate>
          </HeaderCell>
          <Cell dataKey="code" />
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('name', e)} />
            <Translate>Active Ingredients Name</Translate>
          </HeaderCell>
          <Cell dataKey="name" />
        </Column> 
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('medicalCategoryLkey', e)} />
            <Translate>Medical Category</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.medicalCategoryLvalue ? rowData.medicalCategoryLvalue.lovDisplayVale : rowData.medicalCategoryLkey
            }
          </Cell>
        </Column>
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('drugClassLkey', e)} />
            <Translate>Drug Class</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.drugClassLvalue ? rowData.drugClassLvalue.lovDisplayVale : rowData.drugClassLkey
            }
          </Cell>
        </Column> 
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('drugTypeLkey', e)} />
            <Translate>Drug Type</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.drugTypeLvalue ? rowData.drugTypeLvalue.lovDisplayVale : rowData.drugTypeLkey
            }
          </Cell>
        </Column> 
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('drugTypeLkey', e)} />
            <Translate>Status</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.isValid ? 'Active' : 'InActive'
            }
          </Cell>
        </Column> 
      </Table>
      <div style={{ padding: 20 }}>
        <Pagination
          prev
          next
          first
          last
          ellipsis
          boundaryLinks
          maxButtons={5}
          size="xs"
          layout={['limit', '|', 'pager']}
          limitOptions={[5, 15, 30]}
          limit={listRequest.pageSize}
          activePage={listRequest.pageNumber}
          onChangePage={pageNumber => {
            setListRequest({ ...listRequest, pageNumber });
          }}
          onChangeLimit={pageSize => {
            setListRequest({ ...listRequest, pageSize });
          }}
          total={activeIngredientListResponse?.extraNumeric ?? 0}
        />
      </div>

    </Panel>
    {/* <Panel>
    <Container>
            <Row>
                <Col xs={24} md={12}>
                <Panel>
                <Accordion bordered>
                  <Accordion.Panel header="Indications" >
                    <Indications/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Contraindications" >
                 <Contraindications />
                  </Accordion.Panel>
                  <Accordion.Panel header="Drug-Drug Interactions " >
                    <DrugDrugInteractions />
                  </Accordion.Panel>
                  <Accordion.Panel header="Drug-Food Interactions " >
                    <DrugFoodInteractions />
                  </Accordion.Panel>
                  <Accordion.Panel header="Advers Effects " >
                    <AdversEffects />
                  </Accordion.Panel>
                  <Accordion.Panel header="Recommended Dosage " >
                    <RecommendedDosage />
                  </Accordion.Panel>
                </Accordion>
        </Panel>
                </Col>
                <Col xs={24} md={12}>
                <Panel>
                <Accordion bordered>
                  <Accordion.Panel header="MOA"  >
                    <MOA />
                  </Accordion.Panel>
                  <Accordion.Panel header="Toxicity" >
                    <Toxicity />
                  </Accordion.Panel>
                  <Accordion.Panel header="Pregnancy & Lactation" >
                    <PregnancyLactation />
                  </Accordion.Panel>
                  <Accordion.Panel header="Special Population" >
                    <SpecialPopulation />
                  </Accordion.Panel>
                  <Accordion.Panel header="Dose Adjustment" >
                    <DoseAdjustment />
                  </Accordion.Panel>
                  <Accordion.Panel header="Pharmacokinetics"  >
                    <Pharmacokinetics/>
                  </Accordion.Panel>
                </Accordion>
        </Panel>
                </Col>
            </Row>
        </Container>
        </Panel> */}
    <NewActiveIngredients
        selectedactiveIngredient={activeIngredient}
        goBack={() => {
          setCarouselActiveIndex(0);
        }}
      />
    </Carousel>
  );
};

export default ActiveIngredientsSetup;
