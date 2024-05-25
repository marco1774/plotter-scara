import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainContainer } from '../../components/MainContainer';
import { Button } from '../../components/Button';

export function HomePage() {
  const navigate = useNavigate();

  function handleIPC() {
    window.electron.ipcRenderer.sendMessage(
      'ipc-prova',
      'questa è una prova di ipc',
    );
  }
  return (
    <MainContainer>
      <section>
        <h1>Scara</h1>
        <Button
          variant="contained"
          onclick={() => {
            navigate('simulation2d');
          }}
        >
          prova
        </Button>
        <Button variant="contained" onclick={() => handleIPC()}>
          prova comunicazione
        </Button>
      </section>
    </MainContainer>
  );
}
