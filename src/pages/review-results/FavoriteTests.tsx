import Translate from '@/components/Translate';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faFlask, faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Button, HStack, Panel, Tooltip, Whisper } from 'rsuite';

import {
  useAddFavoriteDiagnosticTestMutation,
  useDeleteFavoriteDiagnosticTestMutation,
  useGetFavoriteDiagnosticTestsByUserQuery
} from '@/services/diagnosic-order/favoriteDiagnosticTestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';

import { DiagnosticTest } from '@/types/model-types-new';

import './styles.less';

interface FavoriteTestsProps {
  user: number;
}

const FavoriteTests: React.FC<FavoriteTestsProps> = ({ user }) => {
  const [favoriteTestIds, setFavoriteTestIds] = useState<number[]>([]);

  const [paginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const { data: diagnodticsTestList, isFetching } = useGetAllDiagnosticTestsQuery(paginationParams);
  const { data: favorites } = useGetFavoriteDiagnosticTestsByUserQuery({ userId: user });
  const [addFavorite] = useAddFavoriteDiagnosticTestMutation();
  const [deleteFavorite] = useDeleteFavoriteDiagnosticTestMutation();
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const allTests: DiagnosticTest[] = diagnodticsTestList?.data ?? [];

  useEffect(() => {
    if (favorites) {
      setFavoriteTestIds(favorites.map(f => f.testId));
    }
  }, [favorites]);

  const toggleFavorite = async (testId: number) => {
    const isFavorite = favoriteTestIds.includes(testId);

    try {
      if (isFavorite) {
        await deleteFavorite({ userId: user, testId }).unwrap();
        setFavoriteTestIds(prev => prev.filter(id => id !== testId));
      } else {
        await addFavorite({ userId: user, testId }).unwrap();
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

  const filteredTests =
    typeFilter === 'ALL'
      ? allTests
      : allTests.filter(t => t.type === typeFilter);


// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
  <div dir={dir}>
    <div className="favorite-tests">

      <HStack spacing={10} style={{ marginBottom: 20 }}>
        <Button
          appearance={typeFilter === 'ALL' ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('ALL')}
        >
          All
        </Button>

        <Button
          appearance={typeFilter === 'LABORATORY' ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('LABORATORY')}
        >
          Laboratory
        </Button>

        <Button
          appearance={typeFilter === 'RADIOLOGY' ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('RADIOLOGY')}
        >
          Radiology
        </Button>
      </HStack>


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