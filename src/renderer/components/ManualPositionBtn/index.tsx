import React from 'react';
import { Button } from '../Button';

interface Props {
  handleManualPosition: (x: number, y: number) => void;
  manualPositionRef: { x: number; y: number };
}

function ManualPositionBtn(props: Props) {
  const { handleManualPosition, manualPositionRef } = props;
  return (
    <section>
      <Button
        variant="contained"
        onclick={() =>
          handleManualPosition(manualPositionRef.x, manualPositionRef.y + 10)
        }
      >
        Avanti
      </Button>
      <Button
        variant="contained"
        onclick={() =>
          handleManualPosition(manualPositionRef.x, manualPositionRef.y - 10)
        }
      >
        Indietro
      </Button>
      <Button
        variant="contained"
        onclick={() =>
          handleManualPosition(manualPositionRef.x + 10, manualPositionRef.y)
        }
      >
        Destra
      </Button>
      <Button
        variant="contained"
        onclick={() =>
          handleManualPosition(manualPositionRef.x - 10, manualPositionRef.y)
        }
      >
        Sinistra
      </Button>
    </section>
  );
}

export default ManualPositionBtn;
