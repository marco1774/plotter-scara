import React from 'react';

export function useLoadGcodeContent() {
  const [gcodeContent, setGcodeContent] = React.useState('');

  React.useEffect(() => {
    const handleGcodeLoad = (gcodeTxt: any) => {
      console.log('passato gcode');
      setGcodeContent(gcodeTxt);
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

  return { gcodeContent };
}
