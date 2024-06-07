import React from 'react';
import styles from './styles.module.scss';

interface GcodeOriginalListProps {
  originalGcodeList: string;
  gcodeCount: any;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GcodeList(props: GcodeOriginalListProps) {
  const { originalGcodeList, gcodeCount } = props;
  // console.log('originalGcodeList', originalGcodeList);

  React.useEffect(() => {
    let requestAnimationId: number;

    function tic() {
      console.log('gcodeCount', gcodeCount);
      requestAnimationId = requestAnimationFrame(tic);
    }
    tic();
    return () => {
      // eslint-disable-next-line no-console
      console.log('pulizia GcodeList');
      if (requestAnimationId) {
        cancelAnimationFrame(requestAnimationId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={styles.box_gcode_list}>
      <pre>{originalGcodeList}</pre>
    </div>
  );
}

export default GcodeList;
