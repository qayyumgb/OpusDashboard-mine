import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
export interface DialogData {
  nestedTable: any;
}
@Component({
  selector: 'app-grid-modal',
  templateUrl: './grid-modal.component.html',
  styleUrls: ['./grid-modal.component.scss']
})

export class GridModalComponent {
  columnsHeadersToDisplayNested: string[] = [
    'time',
    'rowNumber',
    'trolleyNumber',
    'varietyName',
    'netPerformance',
    'perfRatio',
    'amountPicked',
    'red-dot'
  ];
  NesteTableData:any
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {debugger
    this.NesteTableData = data.nestedTable.nested
    console.log('data is ',data)
  }

  workerAttributesReadableMap: Map<string, string> = new Map([
    ['time', 'Time'],
    ['rowNumber', 'Row'],
    ['trolleyNumber', 'Trolley'],
    ['varietyName', 'Variety'],
    ['netPerformance', 'Performance'],
    ['perfRatio', 'perfRatio'],
    ['amountPicked', 'Amount'],
    ['red-dot', 'Red dot'],
  ]);
}
