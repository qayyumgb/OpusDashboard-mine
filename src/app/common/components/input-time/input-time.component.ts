import { Component, Input, OnInit, forwardRef, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'app-input-time',
  templateUrl: './input-time.component.html',
  styleUrls: ['./input-time.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputTimeComponent),
      multi: true,
    }
  ]
})
export class InputTimeComponent implements ControlValueAccessor, OnInit {
  @Input() label: string = 'label';
  @Input() isDisabled: boolean = false;
  @Input() hint: string = '';
  @Output() updatedTime: EventEmitter<string> = new EventEmitter();

  timeValue: string = '';
  timeValueBefore: string = '';

  group = new FormGroup({
    hours: new FormControl<string>('00'),
    minutes: new FormControl<string>('00'),
  });

  hourPrevious = '';
  minutesNew = '';

  constructor() {
    this.group.valueChanges.subscribe(() => {
      let minutesNew = parseInt((this.group.controls.minutes.value + '').slice(-2));
      let hoursNew = parseInt((this.group.controls.hours.value + '').slice(-2));

      minutesNew = minutesNew > 59 ? 59 : minutesNew;
      minutesNew = minutesNew < 0 ? 0 : minutesNew;

      hoursNew = hoursNew > 23 ? 23 : hoursNew;
      hoursNew = hoursNew < 0 ? 0 : hoursNew;

      if (this.minutesNew !== this.group.controls.minutes.value) {
        this.minutesNew = ('0' + minutesNew).slice(-2)
        this.group.controls.minutes.setValue(this.minutesNew);
      }

      if (this.hourPrevious !== this.group.controls.hours.value) {
        this.hourPrevious = ('0' + hoursNew).slice(-2)
        this.group.controls.hours.setValue(this.hourPrevious);
      }

      const hours = moment('00', 'HH')
        .add(
          parseInt((this.group.controls.hours.value + '').slice(-2)),
          'hours'
        )
        .format('HH');
      const minutes = moment(this.group.controls.minutes.value, 'mm').format(
        'mm'
      );
      this.timeValue = hours + ':' + minutes;
    });
  }

  ngOnInit(): void { }

  get value() {
    // console.log('get value');
    return this.timeValue;
  }

  set value(value) {
    // console.log('set value');
    this.timeValue = value;
    this.notifyValueChange();
  }

  ngOnChanges(changes: SimpleChanges) {
    //console.log('changes');
  }

  onChange: ((value: string) => {});

  onTouched: (() => {});

  notifyValueChange() {
    if (this.onChange) {
      // console.log('notifyValueChange');
      this.onChange(this.timeValue);
      this.updatedTime.emit(this.timeValue)
    }
  }

  writeValue(str: string): void {
    // console.log('writeValue');
    this.timeValue = str;
    if (this.value != null) {
      this.setValuesOnInput();
    }
  }

  registerOnChange(fn: any): void {
    // console.log('registerOnChange');
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    // console.log('registerOnTouched');
    this.onTouched = fn;
  }

  setValuesOnInput() {
    const time = this.timeValue;
    this.group.controls.hours.setValue(time.substring(0, 2));
    this.group.controls.minutes.setValue(time.substring(3, 5));
  }

  addHours(value: number) {
    this.group.controls.hours.setValue(
      moment(this.group.controls.hours.value, 'HH')
        .add(value, 'hours')
        .format('HH')
    );
    this.value = this.timeValue;
  }

  addMinutes(value: number) {
    this.group.controls.minutes.setValue(
      moment(this.group.controls.minutes.value, 'mm')
        .add(value, 'minutes')
        .format('mm')
    );
    this.value = this.timeValue;
  }
}
