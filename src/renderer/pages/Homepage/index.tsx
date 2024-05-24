import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainContainer } from '../../components/MainContainer';
import { Button } from '../../components/Button';

export function HomePage() {
  const navigate = useNavigate();

  function handleIPC() {}
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
        <Button variant="contained" onclick={() => handleIPC}>
          prova comunicazione
        </Button>
      </section>
    </MainContainer>
  );
}
