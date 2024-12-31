/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

/**
 * Custom hook per analizzare il contenuto G-code.
 * @param gcodeContentString - Stringa contentente il contenuto G-code da analizzare.
 * @returns Oggetto contenente lo stato dell'analisi G-code e la funzione per modificarlo.
 */
export function useParseGcodeContent({ gcodeContentString }) {
  // Stato iniziale per l'analisi G-code, inizialmente un array vuoto.
  const [gcodeParsed, setGcodeParsed] = React.useState<any>([]);

  // Effetto collaterale eseguito quando `gcodeContentString` cambia o al momento del montaggio e desmontaggio del componente.
  React.useEffect(() => {
    // Reimposta l'analisi G-code a un array vuoto.
    setGcodeParsed([]);

    // Se non c'è contenuto G-code, esce dalla funzione.
    if (!gcodeContentString) return;

    // Divide la stringa G-code in righe basate su newline (sia `\r\n` che `\n`).
    const parsedGcodeSplitToLines = gcodeContentString.split(/\r?\n/);

    // Indice per scorrere le righe di G-code.
    let gCodeIndex = 0;

    /**
     * Funzione per analizzare una singola riga di G-code.
     * @param line - Riga di G-code da analizzare.
     */
    function parseGcodeLine(line) {
      // Se la riga include 'E', 'X' e 'Y'.
      if (line.includes('E') && line.includes('X') && line.includes('Y')) {
        const analyzedLine = line.split(' ');
        setGcodeParsed((prev) => [
          ...prev,
          [+analyzedLine[1].slice(1), +analyzedLine[2].slice(1), 1],
        ]);
      }
      // Se la riga include 'F', 'X' e 'Y'.
      else if (line.includes('F') && line.includes('X') && line.includes('Y')) {
        const analyzedLine = line.split(' ');
        setGcodeParsed((prev) => [
          ...prev,
          [+analyzedLine[1].slice(1), +analyzedLine[2].slice(1), 0],
        ]);
      }
      // Se la riga non include né 'E', né 'F', né 'X', né 'Y'.
      else {
        // Non fa nulla per ora.
        // setGcodeParsed((prev) => [...prev, line]);
      }
    }

    /**
     * Funzione per avviare l'analisi della lista di G-code.
     */
    function startParseGcodeList() {
      while (gCodeIndex < parsedGcodeSplitToLines.length) {
        const line = parsedGcodeSplitToLines[gCodeIndex];
        // Se la riga inizia con 'G1' o 'G01'.
        if (line.startsWith('G1') || line.startsWith('G01')) {
          parseGcodeLine(line);
        }
        // Se la riga non inizia con 'G1' o 'G01'.
        else {
          // Non fa nulla per ora.
          // setGcodeParsed((prev) => [...prev, line]);
        }
        gCodeIndex += 1;
      }
    }

    // Avvia l'analisi della lista di G-code.
    startParseGcodeList();
  }, [gcodeContentString]);

  // Restituisce lo stato dell'analisi G-code e la funzione per modificarlo.
  return { gcodeParsed, setGcodeParsed };
}
