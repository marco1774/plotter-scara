import React from 'react';

interface SimulationOptionsProps {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SimulationOptions(_props: SimulationOptionsProps) {
  const [dataArduino, setDataArduino] = React.useState<string[]>([]);
  React.useEffect(() => {
    function handleSerialData(data) {
      setDataArduino((prev) => [...prev, data]);
    }
    const unsubscribe = window.electron.ipcRenderer.on(
      'arduino-serial-data',
      handleSerialData,
    );

    // Pulizia listener su component unmount
    return () => {
      unsubscribe();
    };
  }, []);
  return (
    <div>
      opzioni
      <pre style={{ width: '50%', height: '150px', overflowY: 'scroll' }}>
        {/* {gcodeContent} */}
      </pre>
      <pre style={{ width: '50%', height: '150px', overflowY: 'scroll' }}>
        {dataArduino.map((data) => (
          <p>{data}</p>
        ))}
      </pre>
    </div>
  );
}

export default SimulationOptions;
