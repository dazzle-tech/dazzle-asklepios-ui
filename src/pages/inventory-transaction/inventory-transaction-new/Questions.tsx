import React, { useState } from 'react';
import { Panel, Button, ButtonToolbar, Loader, Modal, IconButton } from 'rsuite';
import MoreIcon from '@rsuite/icons/legacy/More';
import 'rsuite/dist/rsuite.min.css';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

const QuestionsInventory = ({

    open,
    setOpen
}) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);


    
       const questions = [
        { text: '📦 How many products are in this warehouse? ', api: '/api/warehouse/count' },
        { text: '🚚 When was the last move to the warehouse?', api: '/api/warehouse/last-move' },
        { text: '📊 What is the total cost of the warehouse?', api: '/api/warehouse/total-cost' },
         { text: '🚚 Warehouse Details', api: '/api/warehouse/last-move' },
      ];
    
       const handleQuestion = async (q) => {
        // أضف السؤال للمحادثة
        setMessages((prev) => [...prev, { type: 'question', text: q.text }]);
    
        setLoading(true);
    
        try {
          const res = await fetch(q.api);
          const data = await res.json();
    
          setMessages((prev) => [
            ...prev,
            { type: 'question', text: q.text },
            { type: 'answer', text: data.answer || 'There is no data' }
          ]);
        } catch (err) {
          setMessages((prev) => [
            ...prev,
            { type: 'answer', text: 'Error in get answer' }
          ]);
        }
    
        setLoading(false);
      };

      const content = () => {
        return(
   <Panel   bordered
                            style={{ marginBottom: 20, backgroundColor: "white", padding: 20, borderRadius: 6 }}>
                        <div
                          style={{
                            height: 300,
                            overflowY: 'auto',
                            border: '1px solid #eee',
                            padding: 10,
                            borderRadius: 6,
                            marginBottom: 10
                          }}
                        >
                          {messages.map((msg, i) => (
                            <div
                              key={i}
                              style={{
                                textAlign: msg.type === 'question' ? 'right' : 'left',
                                margin: '5px 0'
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '8px 12px',
                                  borderRadius: 12,
                                  background: msg.type === 'question' ? '#007bff' : '#f0f0f0',
                                  color: msg.type === 'question' ? '#fff' : '#000'
                                }}
                              >
                                {msg.text}
                              </span>
                            </div>
                          ))}
                          {loading && <Loader center content="..." />}
                        </div>
                  
                        <ButtonToolbar>
                          {questions.map((q, i) => (
                            <Button
                              key={i}
                              appearance="ghost"
                              size="sm"
                              onClick={() => handleQuestion(q)}
                            >
                              {q.text}
                            </Button>
                          ))}
                        </ButtonToolbar>
                      </Panel>
        );
      }

    return (
            <MyModal
                open={open}
                setOpen={setOpen}
                title="Warehouse Questions"
                actionButtonFunction={() => { setOpen(false) }}
                actionButtonLabel='Ok'
                size='35vw'
                steps={[{
                    title: "Ask question",
                    icon: <FontAwesomeIcon icon={faQuestion} />
                },]}
                content={content}
            ></MyModal>
    );
}

export default QuestionsInventory;
