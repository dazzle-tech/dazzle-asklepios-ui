import React from 'react';
import MyButton from '../MyButton/MyButton';
import {
  Modal,
} from 'rsuite';
import './styles.less'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
const DeletionConfirmationModal = ({
  open,
  setOpen,
  itemToDelete = "",
  actionButtonFunction = null,
}) => {
 
  return (
    <>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="450px"
        className='delete-modal'
      >
        <Modal.Header>
          <div className="delete-circle-wrapper">
            <div className="delete-circle-inner">
              <FontAwesomeIcon icon={faTrash} />
            </div>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div  className='body-delete-modal'>
            <span>{`Are you sure you want to delete this ${itemToDelete} ?`}</span>
          </div>
        </Modal.Body>
        <Modal.Footer className='footer-delete-modal'>
          <MyButton appearance={'subtle'} color="var(--dark-blue-gray)" onClick={() => setOpen(false)}>Cancel</MyButton>
          <MyButton backgroundColor="var(--primary-pink)" onClick={actionButtonFunction}>Delete</MyButton>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeletionConfirmationModal;
