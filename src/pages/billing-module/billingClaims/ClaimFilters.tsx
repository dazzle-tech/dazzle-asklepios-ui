import React from 'react';
import { Form } from 'rsuite';

import MyInput from '@/components/MyInput';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';

import { filterOptions, type FilterOption, type Filters } from './types';

type ClaimFiltersProps = {
  filtersKey: number;
  filters: Filters;
  selectedFilter: string | null;
  onFiltersChange: React.Dispatch<React.SetStateAction<Filters>>;
  onSelectedFilterChange: (value: string | null) => void;
  onSearch: () => void;
  onReset: () => void;
};

const ClaimFilters: React.FC<ClaimFiltersProps> = ({
  filtersKey,
  filters,
  selectedFilter,
  onFiltersChange,
  onSelectedFilterChange,
  onSearch,
  onReset
}) => {
  const selectedFilterConfig = filterOptions.find(item => item.value === selectedFilter);

  return (
    <Form fluid className="claims-filters-form" key={filtersKey}>
      <div className="claims-filters-row">
        <MyInput
          fieldLabel="Filter By"
          fieldName="selectedFilter"
          fieldType="select"
          selectData={filterOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable={false}
          record={{ selectedFilter }}
          setRecord={(value: { selectedFilter: string | null }) =>
            onSelectedFilterChange(value.selectedFilter)
          }
          width="250px"
        />

        {selectedFilterConfig?.type === 'text' && (
          <MyInput
            fieldName={selectedFilter as keyof Filters}
            fieldLabel={selectedFilterConfig.label}
            fieldType="text"
            record={filters}
            setRecord={onFiltersChange}
            width="250px"
          />
        )}

        {selectedFilterConfig?.type === 'select' && (
          <MyInput
            fieldName={selectedFilter as keyof Filters}
            fieldLabel={selectedFilterConfig.label}
            fieldType="select"
            record={filters}
            setRecord={onFiltersChange}
            selectData={(selectedFilterConfig as FilterOption).data ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            searchable
            cleanable
            width="250px"
          />
        )}

        <AdvancedSearchFilters
          showAdvancedButton={false}
          searchOnClick={onSearch}
          clearOnClick={onReset}
        />
      </div>
    </Form>
  );
};

export default ClaimFilters;
