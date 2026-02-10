import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = {
  size?: number;
};

export function VenmoIcon({ size = 20 }: Props) {
  const dimension = size;
  return (
    <Svg width={dimension} height={dimension} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="#3D95CE" />
      <Path
        d="M9 8.5h2.1l1.1 4.2 1.7-4.2H17l-3.1 7H11L9 8.5Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

export function PayPalIcon({ size = 20 }: Props) {
  const dimension = size;
  return (
    <Svg width={dimension} height={dimension} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="#FFFFFF" />
      <Path
        d="M10 7.5h3c1.66 0 2.75 1.02 2.75 2.5 0 1.6-1.2 2.75-2.97 2.75H11.3L11 16.5H9L10 7.5Zm2.7 3.7c.68 0 1.13-.4 1.13-.95 0-.54-.37-.9-.98-.9h-1.1l-.27 1.85h1.22Z"
        fill="#000000"
      />
    </Svg>
  );
}

export function ZelleIcon({ size = 20 }: Props) {
  const dimension = size;
  return (
    <Svg width={dimension} height={dimension} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="#FFFFFF" />
      <Path
        d="M9 8.5h6v1.5l-3.5 4.1H15V16H9v-1.5l3.5-4.1H9V8.5Z"
        fill="#000000"
      />
    </Svg>
  );
}

