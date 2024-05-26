import React from 'react';

interface SimulationOptionsProps {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SimulationOptions(_props: SimulationOptionsProps) {
  return (
    <div>
      opzioni
      <pre style={{ width: '50%', height: '150px', overflowY: 'scroll' }}>
        {/* {gcodeContent} */}
      </pre>
      <pre style={{ width: '50%', height: '150px', overflowY: 'scroll' }}>
        {/* {gcode} */}
      </pre>
    </div>
  );
}

export default SimulationOptions;
