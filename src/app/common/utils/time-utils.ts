import * as moment from "moment";

export const TIME_FORMAT = '*HH:mm';
export const TIME_ZONE = 'Europe/Amsterdam';

export function time(timeStr: string | null): moment.Moment {
  return moment(timeStr, TIME_FORMAT);
}

export function dateIsToday(date: moment.Moment): boolean {
  return date.isSame(new Date(), 'day');
}


export function timeAddDate(date: Date |null, timeStr: string|null): Date {
  const t = moment(timeStr, TIME_FORMAT);
  return moment(date?.toLocaleString())
    .tz(TIME_ZONE)
    .hours(t.hours())
    .minutes(t.minutes())
    .seconds(0)
    .millisecond(0)
    .toDate();
}

export function timeAsSeconds(timeStr: string): number {
  return moment.duration(timeStr).as('seconds');
}

export const DATE_FORMATS = {
  parse: {
    dateInput: ['l', 'LL'],
  },
  display: {
    dateInput: 'L',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

// export class Time {
//   private _duration: string | undefined;
//   from: string | undefined;
//   private _till: string | undefined;
//   private _durationMoment: moment.Moment;
//   private _fromMoment: moment.Moment;
//   private _tillMoment: moment.Moment;

//   constructor(duration?: string, from?: string, till?: string) {
//     this.recalc(duration, from, till);
//   }

//   get getFrom(): string | undefined {
//     return this.from;
//   }

//   get getTill(): string | undefined {
//     return this._till;
//   }

//   get getDuration(): string | undefined {
//     return this._duration;
//   }

//   get getFromMoment(): moment.Moment {
//     return this._fromMoment;
//   }

//   get getTillMoment(): moment.Moment {
//     return this._tillMoment;
//   }

//   get getDurationMoment(): moment.Moment {
//     return this._durationMoment;
//   }

//   set duration(value: string) {
//     this._duration = value;
//     this.recalc(value, this.from, this._till);
//   }

//   // set from(value: string) {
//   //   this.from = value;
//   //   this.recalc(this._duration, value, this._till);
//   // }

//   set till(value: string) {
//     this._till = value;
//     this.recalc(this._duration, this.from, value);
//   }

//   recalc(
//     duration: string | undefined,
//     from: string | undefined,
//     till: string | undefined
//   ) {
//     this._durationMoment =
//       from && till
//         ? moment(
//             moment(till, 'HH:mm')
//               .subtract(moment.duration(from))
//               .format('HH:mm'),
//             'HH:mm'
//           )
//         : moment(duration, 'HH:mm');
//     this._fromMoment =
//       till && duration
//         ? moment(
//             moment(till, 'HH:mm')
//               .subtract(moment.duration(duration))
//               .format('HH:mm'),
//             'HH:mm'
//           )
//         : moment(from, 'HH:mm');
//     this._tillMoment =
//       from && duration
//         ? moment(
//             moment(from, 'HH:mm').add(moment.duration('01:00')).format('HH:mm'),
//             'HH:mm'
//           )
//         : moment(till, 'HH:mm');
//     this._duration = this._durationMoment
//       ? this._durationMoment.format('HH:mm')
//       : duration;
//     this.from = this._fromMoment ? this._fromMoment.format('HH:mm') : from;
//     this._till = this._tillMoment ? this._tillMoment.format('HH:mm') : till;
//   }
// }

// export class Task extends Time {
//   private _name: string;
//   private _type: 'task' | 'break';
//   private _selectedOption: any = { name: '', type: '' };

//   get getName(): string {
//     return this._name;
//   }

//   get getSelectedOption(): 'task' | 'break' {
//     return this._selectedOption;
//   }

//   get getType(): 'task' | 'break' {
//     return this._type;
//   }

//   set name(value: string) {
//     this._name = value;
//   }

//   set type(value: 'task' | 'break') {
//     this._type = value;
//   }

//   set selectedOption(value: any) {
//     this._selectedOption = value;
//   }
// }
