import { Card, Text, Avatar, HStack,VStack } from 'rsuite';
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRight,
    faArrowLeft,
    faEllipsis
} from '@fortawesome/free-solid-svg-icons';

import MyButton from '../MyButton/MyButton';
import './styles.less';
const MyCard = ({ 
    leftArrow=true,
    more=false,
    arrowClick=()=>{}, 
    moreClick=()=>{}, 
    width = null,
    avatar=null,
    size='medium',
    disabled=false,
    contant:contant=null,
    footerContant:footerContant=null,
    title:title=null,
    ...props 
}) => {
  return (
    <Card width={width} style={{minHeight:'45px'}} shaded>
    {(avatar || more) && (  <Card.Header >
        <HStack  >
     
       { avatar&& <Avatar circle src={avatar} />} 
       {more&& <MyButton 
        style={{
            marginLeft:'auto'}}
        appearance="subtle" size='xsmall' color='var(--primary-gray)' onClick={moreClick} radius='8px'><FontAwesomeIcon icon={faEllipsis}   /></MyButton>} 
        </HStack>
      </Card.Header>)}
      {title &&   <Card.Body >
        <div className='title-style'>{title}</div>
        
        <div className='contant-text'>{ contant}</div>
      </Card.Body>}
      <Card.Footer style={{ display:'flex' ,justifyContent:'space-between' ,alignItems:'center'}}>
      <div className='footer-contant-text'>{ footerContant}</div>
       {!leftArrow&& 
       <MyButton 
       onClick={arrowClick} 
       className='arrow-style'
        appearance="subtle" size='xsmall' color='var(--primary-gray)' radius='8px' ><FontAwesomeIcon icon={faArrowLeft} /></MyButton>}
       {leftArrow&&
        <MyButton 
        onClick={arrowClick}
        className='arrow-style'
        appearance="subtle" size='xsmall' color='var(--primary-gray)' radius='8px'><FontAwesomeIcon icon={faArrowRight} /></MyButton>}
      </Card.Footer>
    </Card>
  );
};
export default MyCard;