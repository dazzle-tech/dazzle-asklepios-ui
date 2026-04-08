import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faMagnifyingGlassPlus,
  faBroom,
} from '@fortawesome/free-solid-svg-icons';
import MyButton from '../MyButton/MyButton';
import './styles.less';
import Translate from '../Translate';

const AdvancedSearchFilters = ({
  searchFilter = true,
  extraActions = null,
  clearOnClick = () => {},
  searchOnClick = () => {},
  content = null,
  showAdvancedButton = true,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <>
      <div className="bt-right-group">
        {showAdvancedButton && (
          <MyButton
            appearance="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlassPlus} />}
          >
           <Translate>Advanced</Translate>
          </MyButton>
        )}

        {extraActions}

        {searchFilter && (
          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}
            onClick={searchOnClick}
          >
            <Translate>Search</Translate>
          </MyButton>
        )}

        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
          onClick={clearOnClick}
        >
          <Translate>Clear</Translate>
        </MyButton>
      </div>

      {showAdvanced && content}
    </>
  );
};

export default AdvancedSearchFilters;