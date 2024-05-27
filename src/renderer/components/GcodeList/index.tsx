import React from 'react';
import styles from './styles.module.scss';

interface GcodeOriginalListProps {
  originalGcodeList: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GcodeList(props: GcodeOriginalListProps) {
  const { originalGcodeList } = props;
  console.log('originalGcodeList', originalGcodeList);
  return (
    <div className={styles.box_gcode_list}>
      <pre>{originalGcodeList}</pre>
    </div>
  );
}

export default GcodeList;
