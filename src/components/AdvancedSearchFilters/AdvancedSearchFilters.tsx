import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faMagnifyingGlassPlus,
  faBroom
} from '@fortawesome/free-solid-svg-icons';
import MyButton from '../MyButton/MyButton';
import './styles.less';
const AdvancedSearchFilters = ({
  searchFilter = true,
  clearOnClick = () => {},
  searchOnClick = () => {},
  content = null,
  ...props
}) => {
  const [showAdvanced, setShowAdvanced] = useState(props.showAdvanced ?? false);

  return (
    <>
      <div className="bt-right-group">
        <MyButton appearance="ghost" onClick={() => {setShowAdvanced(!showAdvanced); if(props.setShowAdvanced) props.setShowAdvanced(!props.showAdvanced)}} prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlassPlus} />}>
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

        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} onClick={clearOnClick}>
          Clear
        </MyButton>
      </div>
      {showAdvanced && content}
    </>
  );
};

export default AdvancedSearchFilters;
