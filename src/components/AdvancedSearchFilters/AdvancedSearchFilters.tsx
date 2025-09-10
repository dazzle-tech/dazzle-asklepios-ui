import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faMagnifyingGlassPlus, faBroom } from '@fortawesome/free-solid-svg-icons';
import MyButton from '../MyButton/MyButton';
import './styles.less';

const AdvancedSearchFilters = ({
  searchFilter = true,
  advancedOnClick = () => {},
  clearOnClick = () => {},
  searchOnClick = () => {}
}) => {
  return (
    <div className="bt-right-group">
      <MyButton appearance="ghost" onClick={advancedOnClick}>
        <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
        Advance
      </MyButton>

      {searchFilter && (
        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}
          onClick={searchOnClick}
        >
          Search
        </MyButton>
      )}

      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
        onClick={clearOnClick}
      >
        Clear
      </MyButton>
    </div>
  );
};


export default AdvancedSearchFilters;
