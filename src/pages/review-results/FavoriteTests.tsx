import Translate from '@/components/Translate';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faFlask, faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';

import {
  useAddFavoriteDiagnosticTestMutation,
  useDeleteFavoriteDiagnosticTestMutation,
  useGetFavoriteDiagnosticTestsByUserQuery
} from '@/services/diagnosic-order/favoriteDiagnosticTestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';

import { DiagnosticTest } from '@/types/model-types-new';

import './styles.less';
import { useAppSelector } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import MyInput from '@/components/MyInput';

const FavoriteTests: React.FC = () => {
  const [favoriteTestIds, setFavoriteTestIds] = useState<number[]>([]);
  const mode = useAppSelector((state) => state.ui.mode);
  const dispatch = useDispatch();

    const PAGE_SIZE = 60;

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: PAGE_SIZE,
    sort: 'id,asc',
    timestamp: Date.now()
  });

const authSlice=useAppSelector((state) => state.auth);
const user = authSlice?.user;
  const { data: diagnodticsTestList, isFetching } = useGetAllDiagnosticTestsQuery(paginationParams);
  const { data: favorites } = useGetFavoriteDiagnosticTestsByUserQuery({ userId: user?.id });
  const [addFavorite] = useAddFavoriteDiagnosticTestMutation();
  const [deleteFavorite] = useDeleteFavoriteDiagnosticTestMutation();
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const [searchTerm, setSearchTerm] = useState('');

  const [allTests, setAllTests] = useState<DiagnosticTest[]>([]);

  useEffect(() => {
    if (favorites) {
      setFavoriteTestIds(favorites.map(f => f.testId));
    }
  }, [favorites]);

  const toggleFavorite = async (testId: number) => {
    const isFavorite = favoriteTestIds.includes(testId);

    try {
      if (isFavorite) {
        await deleteFavorite({ userId: user.id, testId }).unwrap();
        setFavoriteTestIds(prev => prev.filter(id => id !== testId));
      } else {
        await addFavorite({ userId: user.id, testId }).unwrap();
        setFavoriteTestIds(prev => [...prev, testId]);
      }
    } catch (error) {
      console.error('Toggle favorite failed', error);
    }
  };

  const getGradientByType = (type?: string) => {
    if (type === 'LABORATORY') {
      return 'linear-gradient(135deg, #4facfe 0%, #2b6cb0 100%)';
    }

    if (type === 'RADIOLOGY') {
      return 'linear-gradient(135deg, #9f7aea 0%, #6b46c1 100%)';
    }

    return 'linear-gradient(135deg, #718096 0%, #4a5568 100%)';
  };

  const filteredTests = allTests.filter(test => {

      const matchesType =
          typeFilter === 'ALL'
          || test.type === typeFilter;

      const matchesName =
          !searchTerm
          || test.name?.toLowerCase().includes(
              searchTerm.toLowerCase()
          );

      return matchesType && matchesName;

  });

useEffect(() => {

    const newTests =
        diagnodticsTestList?.data ?? [];

    if (paginationParams.page === 0) {

        setAllTests(newTests);

    }
    else {

        setAllTests(prev => [

            ...prev,

            ...newTests

        ]);

    }

}, [diagnodticsTestList]);


const hasMore =
    (diagnodticsTestList?.data?.length ?? 0)
    === PAGE_SIZE;



    const handleLoadMore = () => {

    setPaginationParams(prev => ({

        ...prev,

        page: prev.page + 1,

        timestamp: Date.now()

    }));

};


  useEffect(() => {
    dispatch(setPageCode('REVIEW_RESULTS'));
    dispatch(setDivContent('Favorite Test'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);



// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
  <div dir={dir}>
    <div className={`favorite-tests ${mode}`}>

      <div className="date-filter-form" style={{ marginBottom: 20 }}>
        <MyButton
          appearance={typeFilter === 'ALL' ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('ALL')}
        >
          All
        </MyButton>

        <MyButton
          appearance={typeFilter === 'LABORATORY' ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('LABORATORY')}
        >
          Laboratory
        </MyButton>

        <MyButton
          appearance={typeFilter === 'RADIOLOGY' ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('RADIOLOGY')}
        >
          Radiology
        </MyButton>
      <Form>
        <MyInput
            fieldName="search"
            fieldType="text"
            placeholder="Search by Test Name..."
            record={{ search: searchTerm }}
            setRecord={(r:any)=>setSearchTerm(r.search)}
            showLabel={false}
            width="15vw"
        />
      </Form>
      </div>


      <div className="favorite-test-review-result-boxes-container">
        {filteredTests.map((test) => {
          const isFavorite =
            test.id !== undefined && favoriteTestIds.includes(test.id);

          const gradient = getGradientByType(test.type);

          return (
            <Panel bordered className="test-card" style={{ marginBottom: 20 }}>
              <div
                className="card-gradient-bg"
                style={{ background: gradient }}
              />

              <Whisper
                speaker={
                  <Tooltip>
                    {isFavorite
                      ? 'Remove from favorites'
                      : 'Add to favorites'}
                  </Tooltip>
                }
              >
                <div
                  className={`favorite-btn ${isFavorite ? 'active' : ''
                    }`}
                  onClick={() =>
                    test.id && toggleFavorite(test.id)
                  }
                >
                  <FontAwesomeIcon
                    icon={
                      isFavorite ? faStarSolid : faStarRegular
                    }
                    color={isFavorite ? 'white' : '#b0b0b0'}
                    style={{ fontSize: 15 }}
                  />
                </div>
              </Whisper>

              <div className="card-content">
                <div className="test-name">
                  {test.name}
                </div>

                <div className="test-info">
                  <div className="test-type">
                    <Translate>Type</Translate>: {test.type}
                  </div>

                  {test.internalCode && (
                    <div className="test-code">
                      <Translate>Code</Translate>: {test.internalCode}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <MyButton
            appearance="ghost"
            onClick={handleLoadMore}
            disabled={isFetching}
          >
            Load More
          </MyButton>
        </div>
      )}


      {!isFetching && allTests.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <FontAwesomeIcon icon={faFlask} />
          </div>
          <h3>
            <Translate>No tests found</Translate>
          </h3>
          <p>
            <Translate>Try adjusting your filters</Translate>
          </p>
        </div>
      )}

    </div>
  </div>
  );
};

export default FavoriteTests;
