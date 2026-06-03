import { Card, Avatar, HStack } from 'rsuite';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faEllipsis } from '@fortawesome/free-solid-svg-icons';

import MyButton from '../MyButton/MyButton';
import './styles.less';
import { useSelector } from 'react-redux';
const MyCard = ({
  leftArrow = true,
  showArrow = false,
  showMore = false,
  arrowClick = () => { },
  moreClick = () => { },
  width = null,
  avatar = null,
  height = null,
  contant: contant = null,
  footerContant: footerContant = null,
  title: title = null,
  variant = 'basic',
  isSelected = false,

  ...props
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  return (
    <Card
      width={width}
      style={{
        minHeight: '45px', height: height, margin: props.margin ? props.margin : '0px',
        // for the one health theme (don`t remove the commented code)
        // backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : undefined,
         backgroundColor: isSelected ? 'rgba(0, 98, 100, 0.1)' : undefined,
        border: isSelected ? '1px solid var(--primary-blue)' : undefined,
        cursor: 'pointer'


      }}
      shaded

      className={`my-card ${mode === 'light' ? 'light' : 'dark'}`}
    >
      {(avatar || showMore) && (
        <Card.Header>
          <HStack>
            {avatar && <Avatar circle src={avatar} />}
            {showMore && (
              <MyButton
                style={{
                  marginLeft: 'auto'
                }}
                appearance="subtle"
                size="xsmall"
                color="var(--primary-gray)"
                onClick={moreClick}
                radius="8px"
                
              >
                <FontAwesomeIcon icon={faEllipsis} />
              </MyButton>
            )}
          </HStack>
        </Card.Header>
      )}
      {(title || contant) && (
        <Card.Body>
          {title && <div className="title-style">{title}</div>}

          <div className={`contant-text-${variant}`}>{contant}</div>
        </Card.Body>
      )}
      <Card.Footer
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div className={`footer-contant-text-${variant}`}>{footerContant}</div>
        {showArrow && (
          <>
            {leftArrow ? (
              <MyButton
                onClick={arrowClick}
                className="arrow-style"
                appearance="subtle"
                size="xsmall"
                color="var(--primary-gray)"
                radius="8px"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </MyButton>
            ) : (
              <MyButton
                onClick={arrowClick}
                className="arrow-style"
                appearance="subtle"
                size="xsmall"
                color="var(--primary-gray)"
                radius="8px"
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </MyButton>
            )}
          </>
        )}
      </Card.Footer>
    </Card>
  );
};
export default MyCard;
