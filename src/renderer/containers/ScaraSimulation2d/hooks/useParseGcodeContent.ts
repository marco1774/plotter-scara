import React from 'react';

export function useParseGcodeContent({
  gCodeLineByLine,
}: {
  gCodeLineByLine: string;
}) {
  const [gcodeParsed, setGcodeParsed] = React.useState<any>([]);
  // console.log('🚀 ~ gcodeParsed:', gcodeParsed);

  React.useEffect(() => {
    if (!gCodeLineByLine) return;
    /*    const parsedGcodeSplitToLines = gcodeContent.length
      ? gcodeContent.split(/\r?\n/)
      : []; */
    // let gcodecount = 0;

    function parseGcodeLine(line) {
      if (line.includes('E') && line.includes('X') && line.includes('Y')) {
        const analyzedLine = line.split(' ');
        setGcodeParsed((prev) => [
          // ...prev,
          [+analyzedLine[1].slice(1), +analyzedLine[2].slice(1), true],
        ]);
      } else if (
        line.includes('F') &&
        line.includes('X') &&
        line.includes('Y')
      ) {
        const analyzedLine = line.split(' ');
        setGcodeParsed((prev) => [
          // ...prev,
          [+analyzedLine[1].slice(1), +analyzedLine[2].slice(1), false],
        ]);
      } else {
        // setGcodeParsed((prev) => [...prev, line]);
      }
    }

    function startParseGcodeList() {
      // while (gcodecount < parsedGcodeSplitToLines.length) {
      const line = gCodeLineByLine;
      if (line.startsWith('G1') || line.startsWith('G01')) {
        parseGcodeLine(line);
      }
      //  else {
      //   setGcodeParsed((prev) => [...prev, line]);
      // }
      // // gcodecount += 1;
      // // }
    }

    startParseGcodeList();
  }, [gCodeLineByLine]);

  return { gcodeParsed };
}
