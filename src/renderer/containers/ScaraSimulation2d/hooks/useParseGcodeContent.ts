/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

export function useParseGcodeContent({ gcodeContentString }) {
  const [gcodeParsed, setGcodeParsed] = React.useState<any>([]);

  React.useEffect(() => {
    setGcodeParsed([]);
    if (!gcodeContentString) return;
    const parsedGcodeSplitToLines = gcodeContentString.split(/\r?\n/);

    let gCodeIndex = 0;

    function parseGcodeLine(line) {
      if (line.includes('E') && line.includes('X') && line.includes('Y')) {
        const analyzedLine = line.split(' ');
        setGcodeParsed((prev) => [
          ...prev,
          [+analyzedLine[1].slice(1), +analyzedLine[2].slice(1), true],
        ]);
      } else if (
        line.includes('F') &&
        line.includes('X') &&
        line.includes('Y')
      ) {
        const analyzedLine = line.split(' ');
        setGcodeParsed((prev) => [
          ...prev,
          [+analyzedLine[1].slice(1), +analyzedLine[2].slice(1), false],
        ]);
      } else {
        // setGcodeParsed((prev) => [...prev, line]);
      }
    }

    function startParseGcodeList() {
      while (gCodeIndex < parsedGcodeSplitToLines.length) {
        const line = parsedGcodeSplitToLines[gCodeIndex];
        if (line.startsWith('G1') || line.startsWith('G01')) {
          parseGcodeLine(line);
        } else {
          setGcodeParsed((prev) => [...prev, line]);
        }
        gCodeIndex += 1;
      }
    }

    startParseGcodeList();
  }, [gcodeContentString]);

  return { gcodeParsed, setGcodeParsed };
}
