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
  // eslint-disable-next-line react/require-default-props
  disabled?: boolean;
}

export function Button(props: Props) {
  const { children, variant, onclick, disabled } = props;
  return (
    // eslint-disable-next-line react/button-has-type
    <button
      onClick={onclick}
      className={`${styles.btn} ${styles[variant]}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
