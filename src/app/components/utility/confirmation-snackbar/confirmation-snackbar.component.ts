import {Component, Inject, OnInit, ViewEncapsulation} from '@angular/core';
import {MAT_SNACK_BAR_DATA, MatSnackBarConfig, MatSnackBarRef} from "@angular/material/snack-bar";
import {AddAnnotationComponent} from "../../dev-training/add-annotation/add-annotation.component";

@Component({
  selector: 'app-confirmation-snackbar',
  templateUrl: './confirmation-snackbar.component.html',
  styleUrls: ['./confirmation-snackbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmationSnackbarComponent implements OnInit {

  configSuccess: MatSnackBarConfig = {
    panelClass: 'style-success',
    duration: 10000,
    horizontalPosition: 'left',
    verticalPosition: 'bottom'
  };

  constructor(
    public snackBarRef: MatSnackBarRef<AddAnnotationComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any) { }

  ngOnInit(): void {
  }

}
