/**
 *
 * Button
 *
 */
import * as React from 'react';
import styles from './styles.module.scss';

interface Props {
  children: React.ReactNode;
  variant: 'contained';
  onclick: any;
}

export function Button(props: Props) {
  const { children, variant, onclick } = props;
  return (
    // eslint-disable-next-line react/button-has-type
    <button onClick={onclick} className={`${styles.btn} ${styles[variant]}`}>
      {children}
    </button>
  );
}
