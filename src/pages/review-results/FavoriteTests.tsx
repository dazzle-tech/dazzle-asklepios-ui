import React, { useEffect, useState } from 'react';
import { Grid, Row, Col, Panel, HStack, Tooltip, Whisper, Button, Divider } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid, faFlask, faMicroscope } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import Translate from '@/components/Translate';

import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
  useAddFavoriteDiagnosticTestMutation,
  useDeleteFavoriteDiagnosticTestMutation,
  useGetFavoriteDiagnosticTestsByUserQuery
} from '@/services/favoriteDiagnosticTestService';

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

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #5a78d6 100%)',
    'linear-gradient(135deg, #4facfe 0%, #5a9dd6 100%)',
    'linear-gradient(135deg, #5f9df7 0%, #4a7ac2 100%)',
    'linear-gradient(135deg, #6ba3d8 0%, #5686c2 100%)',
    'linear-gradient(135deg, #7ba5dd 0%, #6490d1 100%)',
    'linear-gradient(135deg, #5e94d6 0%, #4d7fc2 100%)'
  ];

  return (
    <div className="favorite-tests">
      <Grid fluid>
        <Row gutter={20}>
          {allTests.map((test, index) => {
            const isFavorite = test.id !== undefined && favoriteTestIds.includes(test.id);
            const gradient = gradients[index % gradients.length];

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={test.id}>
                <Panel bordered className="test-card" style={{ marginBottom: 20 }}>
                  <div className="card-gradient-bg" style={{ background: gradient }} />

                  <div className="card-icon">
                    <FontAwesomeIcon icon={index % 2 === 0 ? faFlask : faMicroscope} />
                  </div>

                  <Whisper
                    speaker={
                      <Tooltip>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</Tooltip>
                    }
                  >
                    <div
                      className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                      onClick={() => test.id && toggleFavorite(test.id)}
                    >
                      <FontAwesomeIcon
                        icon={isFavorite ? faStarSolid : faStarRegular}
                        color={isFavorite ? 'white' : '#b0b0b0'}
                        style={{ fontSize: 15 }}
                      />
                    </div>
                  </Whisper>

                  <div className="card-content">
                    <div className="test-name">{test.name}</div>

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
              </Col>
            );
          })}

          {!isFetching && allTests.length === 0 && (
            <Col xs={24}>
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
            </Col>
          )}
        </Row>
      </Grid>
    </div>
  );
};

export default FavoriteTests;