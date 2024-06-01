import React from 'react';

export function useParseGcodeContent({ gcodeContent }) {
  const [gcodeParsed, setGcodeParsed] = React.useState<any>([]);

  console.log('🚀 ~ useParseGcodeContent ~ gcodeParsed:', gcodeParsed);
  React.useEffect(() => {
    if (!gcodeContent) return;
    const parsedGcodeSplitToLines = gcodeContent.length
      ? gcodeContent.split(/\r?\n/)
      : [];
    let gcodecount = 0;

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
      while (gcodecount < parsedGcodeSplitToLines.length) {
        const line = parsedGcodeSplitToLines[gcodecount];
        if (line.startsWith('G1') || line.startsWith('G01')) {
          parseGcodeLine(line);
        } else {
          setGcodeParsed((prev) => [...prev, line]);
        }
        gcodecount += 1;
      }
    }

    startParseGcodeList();
  }, [gcodeContent]);

  return { gcodeParsed };
}
