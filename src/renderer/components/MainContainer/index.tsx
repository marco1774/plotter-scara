/**
 *
 * MainContainer
 *
 */
import * as React from 'react';
import styles from './styles.module.scss';

interface Props {
  children: React.ReactNode;
}

export function MainContainer(props: Props) {
  const { children } = props;
  return <div className={styles.mainContainer}>{children}</div>;
}
