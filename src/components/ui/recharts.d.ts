
// recharts.d.ts
declare module 'recharts' {
  export * from 'recharts/es6/index';
  import { PropsWithChildren } from 'react';

  // Manually define Legend because it's not correctly typed
  // You might need to adjust the props based on your usage
  export class Legend<P = any> extends React.Component<PropsWithChildren<P>> {}
  
  // Manually define Tooltip because it's not correctly typed
  export class Tooltip<TValue extends string | number | (string | number)[], TName extends string | number> extends React.Component<any> {}
  
  // Manually define PieChart, Pie, Cell for donut chart
  export class PieChart<P = any> extends React.Component<PropsWithChildren<P>> {}
  export class Pie<P = any> extends React.Component<PropsWithChildren<P>> {}
  export class Cell<P = any> extends React.Component<PropsWithChildren<P>> {}
}
