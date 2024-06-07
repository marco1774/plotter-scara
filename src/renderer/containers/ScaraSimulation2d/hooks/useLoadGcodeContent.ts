import React from 'react';

export function useLoadGcodeContent(gcodeCount) {
  const [gcodeContentString, setGcodeContentString] = React.useState('');
  React.useEffect(() => {
    const handleGcodeLoad = (gcodeTxt: any) => {
      setGcodeContentString(gcodeTxt);
      gcodeCount.current = 0;
    };

    // Subscribe al canale 'gcode:load'
    const unsubscribe = window.electron.ipcRenderer.on(
      'gcode:load',
      handleGcodeLoad,
    );

    // Pulizia listener su component unmount
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gcodeContentString, setGcodeContentString };
}
