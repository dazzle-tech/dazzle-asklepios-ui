import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import { useLocation } from 'react-router-dom';

import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';

import { Country, CountryDistrict, DistrictCommunity } from '@/types/model-types-new';

import './geo-hierarchy.less';

import CountrySection from './CountrySection';
import DistrictSection from './DistrictSection';
import CommunitySection from './CommunitySection';
import AreaSection from './AreaSection';

const CountrySetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<CountryDistrict | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<DistrictCommunity | null>(null);

  useEffect(() => {
    const divContent = 'Country Setup';
    dispatch(setPageCode('Country_Setup'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  const handleSelectCountry = (c: Country | null) => {
    setSelectedCountry(c);
    setSelectedDistrict(null);
    setSelectedCommunity(null);
  };

  const handleSelectDistrict = (d: CountryDistrict | null) => {
    setSelectedDistrict(d);
    setSelectedCommunity(null);
  };

  const handleSelectCommunity = (c: DistrictCommunity | null) => {
    setSelectedCommunity(c);
  };

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel className="geo-hierarchy-container" dir={dir}>
      <div className="geo-columns">
        <CountrySection onSelect={handleSelectCountry} selectedCountry={selectedCountry} />

        {selectedCountry && (
          <DistrictSection
            countryId={Number(selectedCountry.id)}
            onSelect={handleSelectDistrict}
            selectedDistrict={selectedDistrict}
          />
        )}

        {selectedDistrict && (
          <CommunitySection
            districtId={Number(selectedDistrict.id)}
            onSelect={handleSelectCommunity}
            selectedCommunity={selectedCommunity}
          />
        )}

        {selectedCommunity && <AreaSection communityId={Number(selectedCommunity.id)} />}
      </div>
    </Panel>
  );
};

export default CountrySetup;