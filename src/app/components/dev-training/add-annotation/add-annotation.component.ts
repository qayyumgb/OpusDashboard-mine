import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Input,
  ViewChild,
} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {MatListOption, MatSelectionList} from '@angular/material/list';
import {MatSnackBar} from '@angular/material/snack-bar';
import {YouTubePlayer} from '@angular/youtube-player';
import {ActivatedRoute, Router} from "@angular/router";
import {FirestoreService} from "../../../services/firestore.service";
import {ConfirmationSnackbarComponent} from "../../utility/confirmation-snackbar/confirmation-snackbar.component";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";
import {Subscription} from "rxjs";
import {AuthService} from "../../../services/auth.service";


interface AnnotationItem {
  added: Date;
  videoTime: number;
  videoTimestampAbsolute: Date;
  videoTimestampRelative: Date;
  label: string;
  id: string;
}

export enum KEY_CODE {
  UP_ARROW = 38,
  DOWN_ARROW = 40,
  RIGHT_ARROW = 39,
  LEFT_ARROW = 37
}


@Component({
  selector: 'app-add-annotation',
  templateUrl: './add-annotation.component.html',
  styleUrls: ['./add-annotation.component.scss']
})
export class AddAnnotationComponent implements AfterViewInit, OnInit, OnDestroy {
  private apiLoaded = false;
  isEditLabel = false;
  trainingId: string;
  trainingDocData: any;
  // startTime: Date;
  startTimeDisabled = false;
  time: UntypedFormGroup;
  isRelativeTime = false;
  videoStartTimeInRealTime: Date;
  trainingStartTimestamp: Date;

  videoWidth: number | undefined;
  videoHeight: number | undefined;
  playBackRate = 1;

  setIntervalInstance: any = null;

  highLightClosestAnnotationWithId: number;

  annotationButtons: any;

  @Input() videoId: string;
  notes: string;
  description: string;

  @ViewChild('player') youTubePlayer: YouTubePlayer;
  @ViewChild('youTubePlayerContainer') YouTubePlayerContainer;
  @ViewChild('annotations') selectionList: MatSelectionList;

  annotationList: AnnotationItem[] = [];
  loggedInUserFromAuthServiceSubscription: Subscription;
  trainingSubscription: Subscription;
  annotationListSubscription: Subscription;
  loggedInUserDocData: any;

  constructor(
    private snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    public route: ActivatedRoute,
    private firestoreService: FirestoreService,
    private authService: AuthService
  ) {
    this.route.paramMap.subscribe((params) => {
      this.trainingId = params.get('training_id');
      this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(userDocData => {
        this.loggedInUserDocData = userDocData;
        if (!this.loggedInUserDocData.annotationButtons) {
          //If logged-in user does not have annotation buttons setup then set default annotation buttons for user
          this.firestoreService.updateUserById(this.loggedInUserDocData.id, {
            annotationButtons: {
              keyboard_arrow_up: 'PickingA',
              keyboard_arrow_down: 'PickingB',
              keyboard_arrow_left: 'PickingC',
              keyboard_arrow_right: 'PickingD'
            }
          });
        } else {
          this.annotationButtons = this.loggedInUserDocData.annotationButtons;
        }
      });
      this.trainingSubscription = this.firestoreService.getTrainingById(this.trainingId).subscribe((trainingDoc) => {
        this.trainingDocData = trainingDoc;
        this.videoId = trainingDoc.videoId;
        this.description = trainingDoc.description;
        this.startTimeDisabled = trainingDoc.hasOwnProperty('startTimeDisabled') ? trainingDoc.startTimeDisabled : false;
        this.videoStartTimeInRealTime = trainingDoc.videoStartTimeInRealTime ? trainingDoc.videoStartTimeInRealTime.toDate() : new Date(0);
        this.trainingStartTimestamp = trainingDoc.trainingStartTimestamp ? trainingDoc.trainingStartTimestamp.toDate() : null;
        this.notes = trainingDoc?.notes;
        this.trainingDocData.updatedAt = this.trainingDocData.updatedAt ? this.trainingDocData.updatedAt.toDate() : null;
        this.annotationListSubscription = this.firestoreService.getAllAnnotationsForTrainingId(this.trainingId).subscribe(annotationList => {
          this.annotationList = annotationList.map(annotation => {
            return {
              ...annotation,
              videoTimestampAbsolute: annotation?.videoTimestampAbsolute?.toDate(),
              videoTimestampRelative: annotation?.videoTimestampRelative?.toDate(),
            }
          });
        });
      });
    });
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    const prevPlayerStatus =  this.youTubePlayer.getPlayerState();
    if (![2].includes(this.youTubePlayer.getPlayerState())) { //2=paused, -1=unstarted, 5=cued(also acting as unstarted), 0=ended
      return;
    }

    const selectedOptions = this.selectionList.selectedOptions.selected;

    if (event.key === 'ArrowDown') {
      if (selectedOptions.length === 0) {
        this.selectionList.options.first.selected = true;
        this.selectionList.options.first.focus();
        this.setCurrentTime(this.selectionList.options.first.value.videoTime);
        return;
      }

      if (selectedOptions.length === 1) {
        let selectedIndex = 0;
        this.selectionList.options.forEach((option, index) => {
          if (option.value.videoTime === selectedOptions[0].value.videoTime) {
            selectedIndex = index;
            if ((selectedIndex + 1) < this.selectionList.options.length) {
              option.selected = false;
              this.selectionList.options.get(selectedIndex + 1).selected = true;
              this.selectionList.options.get(selectedIndex + 1).focus();
              this.setCurrentTime(this.selectionList.options.get(selectedIndex + 1).value.videoTime);
            } else {
              option.selected = false;
              this.selectionList.options.first.selected = true;
              this.selectionList.options.first.focus();
              this.setCurrentTime(this.selectionList.options.first.value.videoTime);
            }
          }
        });
        return;
      }
    }

    if (event.key === 'ArrowUp') {
      if (selectedOptions.length === 0) {
        this.selectionList.options.last.selected = true;
        this.selectionList.options.last.focus();
        this.setCurrentTime(this.selectionList.options.last.value.videoTime);
        return;
      }

      if (selectedOptions.length === 1) {
        let selectedIndex = 0;
        this.selectionList.options.forEach((option, index) => {
          if (option.value.videoTime === selectedOptions[0].value.videoTime) {
            selectedIndex = index;
            if (selectedIndex > 0) {
              option.selected = false;
              this.selectionList.options.get(selectedIndex - 1).selected = true;
              this.selectionList.options.get(selectedIndex - 1).focus();
              this.setCurrentTime(this.selectionList.options.get(selectedIndex - 1).value.videoTime);
            } else {
              option.selected = false;
              this.selectionList.options.last.selected = true;
              this.selectionList.options.last.focus();
              this.setCurrentTime(this.selectionList.options.last.value.videoTime);
            }
          }
        });
        return;
      }
    }
  }


  ngOnInit(): void {
    if (!this.apiLoaded) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.apiLoaded = true;
    }
    document.onkeydown = this.checkKey;
  }

  ngAfterViewInit(): void {
    this.onResize();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    this.trainingSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.annotationListSubscription?.unsubscribe();
    window.removeEventListener('resize', this.onResize);
    if (this.setIntervalInstance) {
      this.savePageState();
      clearInterval(this.setIntervalInstance);
      this.setIntervalInstance = null;
    }
  }

  onResize = (): void => {
    const ratio = 0.6;
    const maxWidth = 1200;
    const clientWidth = this.YouTubePlayerContainer.nativeElement.clientWidth - 40;
    const clientHeight = this.YouTubePlayerContainer.nativeElement.clientHeight - 40;
    this.videoWidth = Math.min(clientHeight / ratio, clientWidth, maxWidth);
    this.videoHeight = this.videoWidth * ratio;
    this.changeDetectorRef.detectChanges();
  };

  startTimeLabel() {
    this.annotate(null, 'Start time', false);
    this.startTimeDisabled = true;
    this.videoStartTimeInRealTime = new Date(
      this.trainingStartTimestamp.getTime() - this.youTubePlayer.getCurrentTime() * 1000
    );
    this.reCalcRelativeTime();
    this.savePageState();
  }

  async annotate($event, label: string, save: boolean) {
    $event?.stopPropagation();
    $event?.preventDefault();
    this.firestoreService.saveAnnotationForTraining(this.trainingId, {
      added: new Date(),
      videoTime: this.youTubePlayer.getCurrentTime(),
      videoTimestampAbsolute: new Date(
        this.youTubePlayer.getCurrentTime() * 1000
      ),
      videoTimestampRelative: new Date(
        this.youTubePlayer.getCurrentTime() * 1000 + this.videoStartTimeInRealTime.getTime()
      ),
      label,
      id: new Date().getTime()
    }).then(() => {
      this.openSnackBar('New annotation saved', 'success', 3000);
    });
  }

  deleteAnnotationList() {
    const snackBarRef = this.snackBar.openFromComponent(ConfirmationSnackbarComponent, {
      data: {message: 'Confirm to delete all annotations'},
      panelClass: SNACKBAR_CLASSES.themeBlack,
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });

    snackBarRef.onAction().subscribe(() => {
      this.startTimeDisabled = false;
      this.snackBar.dismiss();
      this.firestoreService.deleteAnnotationsForTrainingId(this.trainingId, this.annotationList.map(annotation => annotation.id))
    });
  }

  deleteSelectedNAboveAnnotationItems() {
    const selectedOption = this.selectionList.selectedOptions.selected;
    if (selectedOption.length === 0) {
      return;
    }
    const topSelectedoptionValue = selectedOption[0].value.videoTime;
    this.selectionList.options.forEach(option => {
      option.selected = option.value.videoTime >= topSelectedoptionValue
    });
    //.filter(item => item.id < 66666666);
    /*.map(item => item.name);*/// (this.selectionList.options.filter(option => option.value));
    const snackBarRef = this.snackBar.openFromComponent(ConfirmationSnackbarComponent, {
      data: {message: 'Please check and confirm to delete all selected notations'},
      panelClass: SNACKBAR_CLASSES.themeBlack,
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    })

    snackBarRef.onAction().subscribe(() => {
      const selectedIds = this.selectionList.selectedOptions.selected.map(
        (item) => item.value.id
      );

      const startTimeId = this.selectionList.selectedOptions.selected.filter(
        (item) => item.value.label === 'Start time'
      );

      if (startTimeId.length > 0) {
        this.startTimeDisabled = false;
      }

      this.firestoreService.deleteAnnotationsForTrainingId(this.trainingId, selectedIds);
      this.snackBar.dismiss();
      this.savePageState();
    });
  }

  reCalcRelativeTime() {
    this.annotationList.map((annotation: AnnotationItem) => {
      const s = this.trainingStartTimestamp;
      const d = new Date(annotation.videoTimestampAbsolute.getTime() + this.videoStartTimeInRealTime.getTime());
      d.setFullYear(s.getFullYear(), s.getMonth(), s.getDate());
      annotation.videoTimestampRelative = d;
    });
  }

  async deleteSelectedAnnotationItems() {
    const selectedIds = this.selectionList.selectedOptions.selected.map(
      (item: MatListOption) => item.value.id
    );

    await this.firestoreService.deleteAnnotationsForTrainingId(this.trainingId, selectedIds);

    if (this.annotationList.filter((item: AnnotationItem) => item.label === 'Start time').length === 0) {
      this.startTimeDisabled = false;
    }

    this.savePageState();
  }

  // leading zero for hh/mm/ss notation
  padLeft(text: string, padChar: string, size: number): string {
    return (String(padChar).repeat(size) + text).substr(size * -1, size);
  }

  setCurrentTime(time: number) {
    this.youTubePlayer.seekTo(time, true);
  }

  setPlayBackRate() {
    this.youTubePlayer.setPlaybackRate(this.playBackRate);
    this.snackBar.open(`Playback rate set on ${this.playBackRate}`, null, {
      duration: 2500,
    });
  }

  checkKey = (e) => {
    e = e || window.event;

    if (e.keyCode === 80) {
      if (this.youTubePlayer.getPlayerState() === 1) {
        this.youTubePlayer.pauseVideo();
      } else {
        this.youTubePlayer.playVideo();
      }
    }

    if (this.youTubePlayer.getPlayerState() === 1) {
      let label;
      switch (e.keyCode) {
        case 83: // start
          if (!this.startTimeDisabled) {
            this.startTimeLabel();
          }
          break;
        case 38: // up
          label = this.annotationButtons.keyboard_arrow_up;
          break;
        case 40: // down
          label = this.annotationButtons.keyboard_arrow_down;
          break;
        case 37: // left
          label = this.annotationButtons.keyboard_arrow_left;
          break;
        case 39: // right
          label = this.annotationButtons.keyboard_arrow_right;
          break;
      }
      if (label) {
        this.annotate(null, label, true);
      }
    }
  };

  goBack() {
    this.router.navigate(['trainings']);
  }

  async savePageState(source?: string) {
    // save annotation labels to training fs-document in map field trainingLabel
    if (source && source === 'videoId') {
      if (this.trainingDocData.videoId === this.videoId) {
        return;
      }
    }

    if (source && source === 'notes') {
      if (this.trainingDocData.notes === this.notes) {
        return;
      }
    }

    if (source && source === 'description') {
      if (this.trainingDocData.description === this.description) {
        return;
      }
    }

    await this.firestoreService.partiallyUpdateTraining({
      id: this.trainingId,
      notes: this.notes ?? null,
      videoId: this.videoId ?? null,
      description: this.description ?? null,
      updatedAt: new Date(),
      //trainingLabel: this.annotationList ?? null,
      startTimeDisabled: this.startTimeDisabled,
      videoStartTimeInRealTime: this.videoStartTimeInRealTime
    });
    //this.generateLabeledData(); -- this will be done in backend
    this.openSnackBar('Changes saved', 'success', 3000);
  }

  async duplicateVideoAnnotation() {
    this.firestoreService.duplicateTraining(this.trainingId).subscribe({
      next: async (apiResponse) => {
        if (apiResponse.success) {
          this.openSnackBar('Training duplicated successfully. Annotations are being duplicated...', 'success', 5000);
          await this.router.navigate([`/annotations/${apiResponse.trainingId}`])
        } else if (apiResponse.success === false) {
          this.openSnackBar('Error in training duplication:' + apiResponse.error, 'error');
        }
      },
      error: (error) => {
        this.openSnackBar('Error in saving changes:' + error.message, 'error');
        console.log(error.message);
      }
    });
  }

  async downloadJSON(type: 'LABELS' | 'TRAINING_DATA' | 'LABELED_TRAINING_DATA') {
    let csvData = null;
    switch (type) {
      case 'LABELS':
        this.snackBar.open('Preparing JSON file...', null, {duration: 5000});
        csvData = JSON.stringify(this.annotationList, null, 2);
        const a: any = document.createElement('a');
        a.setAttribute('style', 'display:none;');
        document.body.appendChild(a);
        const blob = new Blob([csvData], {type: 'text/json'});
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = `${type}.json`;
        a.click();
        this.snackBar.open('JSON file downloaded', null, {duration: 5000});
        break;
      case 'TRAINING_DATA':
        await this.firestoreService.createCSVRequestForTrainingId(this.loggedInUserDocData, this.trainingId, 'TRAINING_DATA');
        this.openSnackBar('Your request for training data has been successfully placed', 'success');
        await this.routeToPastRequests();
        break;
      case 'LABELED_TRAINING_DATA':
        await this.firestoreService.createCSVRequestForTrainingId(this.loggedInUserDocData, this.trainingId, 'LABELED_TRAINING_DATA');
        this.openSnackBar('Your request for labeled training data has been successfully placed', 'success');
        await this.routeToPastRequests();
        break;
    }
  }

  async routeToPastRequests() {
    await this.router.navigate([`/annotations/${this.trainingId}/download_requests`]);
  }

  async saveAnnotationButtonLabel($event, buttonName) {
    $event?.stopPropagation();
    $event?.preventDefault();

    const updateObject = {};
    updateObject["annotationButtons." + buttonName] = this.annotationButtons[buttonName]
    await this.firestoreService.updateUserById(this.loggedInUserDocData.id, updateObject);
    this.openSnackBar('changes saved', 'success', 3000);
  }

  openSnackBar(message, type, duration?) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: duration ? duration : 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
