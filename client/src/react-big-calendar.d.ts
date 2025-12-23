declare module 'react-big-calendar' {
  import { Component, CSSProperties } from 'react';

  export interface Event {
    id?: number;
    title?: string;
    start?: Date;
    end?: Date;
    allDay?: boolean;
    resource?: any;
    [key: string]: any;
  }

  export interface CalendarProps {
    localizer: any;
    events: any[];
    startAccessor?: string | ((event: any) => Date);
    endAccessor?: string | ((event: any) => Date);
    onSelectEvent?: (event: any) => void;
    eventPropGetter?: (event: any) => { style?: CSSProperties };
    views?: string[];
    view?: string;
    onView?: (view: string) => void;
    defaultView?: string;
    date?: Date;
    onNavigate?: (date: Date) => void;
    popup?: boolean;
    style?: CSSProperties;
  }

  export class Calendar extends Component<CalendarProps> {}

  export function momentLocalizer(moment: any): any;
}
