import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faMagnifyingGlassPlus,
  faBroom
} from '@fortawesome/free-solid-svg-icons';
import MyButton from '../MyButton/MyButton';
import './styles.less';

<<<<<<< HEAD
const AdvancedSearchFilters = ({
  searchFilter = true,
  clearOnClick = () => {},
  searchOnClick = () => {},
  content = {}
}) => {
=======
const AdvancedSearchFilters = ({ searchFilter = true, content = {} }) => {
>>>>>>> 48d877d35abea82203db966ead9b936fa2c1b79c
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bt-right-group">
      <MyButton appearance="ghost" onClick={() => setShowAdvanced(!showAdvanced)}>
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

      <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} onClick={clearOnClick}>
        Clear
      </MyButton>

      {showAdvanced && content}
    </div>
  );
};

export default AdvancedSearchFilters;
