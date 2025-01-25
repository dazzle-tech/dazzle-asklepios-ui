import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import React, { useEffect, useState } from 'react';
import {
    FlexboxGrid,
    IconButton,
    Input,
    Panel,
    Table,
    Grid,
    Row,
    Col,
    ButtonToolbar,
    Text,
    InputGroup,
    SelectPicker,
    DatePicker,
    Dropdown,
    Form
} from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import 'react-tabs/style/react-tabs.css';
const { Column, HeaderCell, Cell } = Table;
import { notify } from '@/utils/uiReducerActions';
import {
    useGetGenericMedicationQuery,
    useGetGenericMedicationWithActiveIngredientQuery,
    useSaveLinkedBrandMedicationMutation,
    useGetLinkedBrandQuery
} from '@/services/medicationsSetupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { ApBrandMedicationSubstitutes } from '@/types/model-types';
import { newApBrandMedicationSubstitutes } from '@/types/model-types-constructor';
const Substitutes = ({ genericMedication }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [linkedBrand, setLinkedBrand] = useState<ApBrandMedicationSubstitutes>({ ...newApBrandMedicationSubstitutes })
    const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const{data:lisOfLinkedBrand}=useGetLinkedBrandQuery(genericMedication.key);
    const dispatch = useAppDispatch();
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
    const [listGenericRequest, setListGenericRequest] = useState<ListRequest>({ ...initialListRequest });

    const [saveLinkBrandMedication, saveLinkedBrandMedicationMutation] = useSaveLinkedBrandMedicationMutation();
    useEffect(() => {
        if (searchKeyword.trim() !== "") {
            setListGenericRequest({
                ...listGenericRequest,
                filters: [
                    {
                        fieldName: "generic_name",
                        operator: "containsIgnoreCase",
                        value: searchKeyword,
                    },
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined
                    }
                ],
            });
        }
    }, [searchKeyword]);
    const handleItemClick = (Generic) => {
        setSelectedGeneric(Generic);

        setSearchKeyword("")

    };
    useEffect(() => {
        console.log(selectedGeneric);
        try {
            saveLinkBrandMedication({ ...linkedBrand, brandKey: genericMedication.key, alternativeBrandKey: selectedGeneric.key }).unwrap();
            dispatch(notify('Saved  successfully'));
        }
        catch (error) { }
    }, [selectedGeneric])
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            //     setListRequest(
            //       addFilterToListRequest(
            //         fromCamelCaseToDBName(fieldName),
            //         'containsIgnoreCase',
            //         value,
            //         listRequest
            //       )
            //     );
            //   } else {
            //     setListRequest({ ...listRequest, filters: [] });
            //   }
        };
    }
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    return (<>
        <div className='top-container-p'>
            <div className='form-search-container-p '>
                <Form >
                    <Text>Medication Name</Text>
                    <InputGroup inside className='input-search-p'>
                        <Input

                            placeholder={'Search'}
                            value={searchKeyword}
                            onChange={handleSearch}
                        />
                        <InputGroup.Button>
                            <SearchIcon />
                        </InputGroup.Button>
                    </InputGroup>
                    {searchKeyword && (
                        <Dropdown.Menu className="dropdown-menuresult">
                            {genericMedicationListResponse && genericMedicationListResponse?.object?.map(Generic => (
                                <Dropdown.Item
                                    key={Generic.key}
                                    eventKey={Generic.key}
                                    onClick={() => handleItemClick(Generic)}

                                >
                                    <span style={{ marginRight: "15px" }}>
                                        {[Generic.genericName,
                                        Generic.dosageFormLvalue?.lovDisplayVale,
                                        Generic.manufacturerLvalue?.lovDisplayVale,
                                        Generic.roaLvalue?.lovDisplayVale]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </span>
                                    {Generic.activeIngredients}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    )}



                </Form>

            </div>
            {selectedGeneric && <span style={{ marginTop: "25px", fontWeight: "bold" }}>
                {[selectedGeneric.genericName,
                selectedGeneric.dosageFormLvalue?.lovDisplayVale,
                selectedGeneric.manufacturerLvalue?.lovDisplayVale,
                selectedGeneric.roaLvalue?.lovDisplayVale]
                    .filter(Boolean)
                    .join(', ')}
            </span>}

        </div>
        <Table
            height={400}

            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            data={lisOfLinkedBrand?.object ?? []}
        //   onRowClick={rowData => {
        //     setGenericMedication(rowData);
        //   }}
        //   rowClassName={isSelected}
        >
            <Column sortable flexGrow={2}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('code', e)} />
                    <Translate>Code </Translate>
                </HeaderCell>
                <Cell dataKey="code" />
            </Column>
            <Column sortable flexGrow={2}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('genericName', e)} />
                    <Translate>Brand Name </Translate>
                </HeaderCell>
                <Cell dataKey="genericName" />
            </Column>
            <Column sortable flexGrow={2}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('manufacturerLkey', e)} />
                    <Translate>Manufacturer</Translate>
                </HeaderCell>
                <Cell dataKey="manufacturerLkey">
                    {rowData =>
                        rowData.manufacturerLvalue ? rowData.manufacturerLvalue.lovDisplayVale : rowData.manufacturerLkey
                    }
                </Cell>
            </Column>
            <Column sortable flexGrow={2} fullText>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('dosageFormLkey', e)} />
                    <Translate>Dosage Form</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.dosageFormLvalue ? rowData.dosageFormLvalue.lovDisplayVale : rowData.dosageFormLkey
                    }
                </Cell>
            </Column>

            <Column sortable flexGrow={3} fullText>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('usageInstructions', e)} />
                    <Translate>Usage Instructions</Translate>
                </HeaderCell>
                <Cell dataKey="usageInstructions" />
            </Column>
            <Column sortable flexGrow={2} fixed fullText>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('roaList', e)} />
                    <Translate>Rout</Translate>
                </HeaderCell>
                <Cell>
                    {rowData => rowData.roaList?.map((item, index) => {
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
                    })}
                </Cell>
            </Column>
            <Column sortable flexGrow={2}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('expiresAfterOpening', e)} />
                    <Translate>Expires After Opening</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.expiresAfterOpening ? 'Yes' : 'No'
                    }
                </Cell>
            </Column>
            <Column sortable flexGrow={3}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('singlePatientUse', e)} />
                    <Translate>Single Patient Use</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.singlePatientUse ? 'Yes' : 'No'
                    }
                </Cell>
            </Column>
            <Column sortable flexGrow={1}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('deleted_at', e)} />
                    <Translate>Status</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.deletedAt === null ? 'Active' : 'InActive'
                    }
                </Cell>
            </Column>
        </Table>
    </>)
}
export default Substitutes; 