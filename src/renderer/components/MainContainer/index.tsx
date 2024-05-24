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
  return <div className={styles.mainContainer}>{props.children}</div>;
}
