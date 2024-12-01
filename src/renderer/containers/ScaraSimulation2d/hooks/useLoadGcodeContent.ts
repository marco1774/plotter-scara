import React from 'react';

/**
 * Custom hook per caricare il contenuto G-code.
 * @param gcodeCount - Oggetto con una proprietà `current` usata come contatore di G-code.
 * @returns Oggetto contenente lo stato del contenuto G-code e la funzione per impostarlo.
 */
export function useLoadGcodeContent(gcodeCount) {
  // Stato iniziale per il contenuto G-code, inizialmente una stringa vuota.
  const [gcodeContentString, setGcodeContentString] = React.useState('');

  // Effetto collaterale eseguito al momento del montaggio e desmontaggio del componente.
  React.useEffect(() => {
    /**
     * Gestore degli eventi per il caricamento del contenuto G-code.
     * @param gcodeTxt - Contenuto G-code ricevuto dall'evento.
     */
    const handleGcodeLoad = (gcodeTxt: any) => {
      // Aggiorna lo stato con il nuovo contenuto G-code.
      setGcodeContentString(gcodeTxt);
      // Reimposta il contatore G-code.
      gcodeCount.current = 0;
    };

    // Sottoscrizione all'evento IPC Renderer 'gcode:load'.
    const unsubscribe = window.electron.ipcRenderer.on(
      'gcode:load',
      handleGcodeLoad,
    );

    // Pulizia del listener quando il componente viene smontato.
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Nessuna dipendenza, l'effetto esegue solo una volta.

  // Restituisce lo stato e la funzione per modificare il contenuto G-code.
  return { gcodeContentString, setGcodeContentString };
}
