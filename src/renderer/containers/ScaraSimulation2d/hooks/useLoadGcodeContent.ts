import React from 'react';

export function useLoadGcodeContent() {
  const [gcodeContentString, setGcodeContentString] = React.useState('');

  React.useEffect(() => {
    const handleGcodeLoad = (gcodeTxt: any) => {
      console.log('passato gcode');
      setGcodeContentString(gcodeTxt);
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
  }, []);

  return { gcodeContentString, setGcodeContentString };
}
