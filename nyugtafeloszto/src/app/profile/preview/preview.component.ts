import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { User } from 'src/app/shared/models/User';
import { ImageService } from 'src/app/shared/services/image.service';
import { UserService } from 'src/app/shared/services/user.service';
import { PasswordChangeComponent } from '../password-change/password-change.component';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { AccountDeleteComponent } from '../account-delete/account-delete.component';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() uploadedImage: EventEmitter<string> = new EventEmitter();
  progressBar: boolean = false;
  user?: User;
  image?: string;
  userSubscription?: Subscription;
  imageUploadSubscription?: Subscription;
  imageSubscriptions: Subscription[] = [];
  dialogSubscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private imageService: ImageService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const localUser = localStorage.getItem('user');

    if (localUser) {
      this.progressBar = true;
      this.userSubscription = this.userService
        .getById(JSON.parse(localUser))
        .subscribe((user) => {
          this.user = user;
          const imageName = user?.hasProfilePicture ? user.id : 'default';
          this.fetchImage(`${imageName}.png`, false);
        });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.progressBar = false;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.imageUploadSubscription?.unsubscribe();

    this.imageSubscriptions.forEach((imageSubscription) => {
      imageSubscription.unsubscribe();
    });
    this.dialogSubscriptions.forEach((dialogSubscription) => {
      dialogSubscription.unsubscribe();
    });
  }

  fetchImage(imageName: string, uploaded: boolean): void {
    const image = localStorage.getItem('profilePicture');

    if (image && !uploaded) {
      this.image = image;
      return;
    }

    const imageSubscription = this.imageService
      .getImage(`/profile/${imageName}`)
      .subscribe((image) => {
        this.image = image;
        localStorage.setItem('profilePicture', image);

        if (uploaded) {
          this.uploadedImage.emit(this.image);
        }
      });

    this.imageSubscriptions.push(imageSubscription);
  }

  changePassword(): void {
    const dialogRef = this.dialog.open(PasswordChangeComponent, {
      disableClose: true,
    });

    const changePasswordSubscription =
      dialogRef.componentInstance.progressEvent.subscribe((progress) => {
        this.progressBar = progress;
      });
    this.dialogSubscriptions.push(changePasswordSubscription);
  }

  changePicture(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (!target.files || !target.files[0].type.includes('image/')) {
      this.dialog.open(DialogComponent, {
        data: {
          title: 'Sikertelen fájlfeltöltés!',
          button: 'Ok',
        },
      });
      return;
    }

    const dialogRef = this.dialog.open(ImageUploadComponent, {
      disableClose: true,
      data: {
        imageChangedEvent: event,
      },
    });

    this.imageUploadSubscription = dialogRef
      .afterClosed()
      .subscribe((image) => {
        if (!image) {
          return;
        }

        if (!this.user) {
          return;
        }

        this.progressBar = true;
        const imageName = `${this.user.id}.png`;

        this.imageService
          .uploadImage(`/profile/${imageName}`, image)
          .then(() => {
            this.fetchImage(imageName, true);
            this.progressBar = false;

            if (this.user && !this.user.hasProfilePicture) {
              this.user.hasProfilePicture = true;
              this.userService.update(this.user);
            }
          });
      });
  }

  deleteProfile(): void {
    const dialogRef = this.dialog.open(AccountDeleteComponent, {
      disableClose: true,
      data: {
        hasProfilePicture: this.user?.hasProfilePicture,
      },
    });

    const deleteDialogSubscription =
      dialogRef.componentInstance.progressEvent.subscribe((progress) => {
        this.progressBar = progress;
      });

    this.dialogSubscriptions.push(deleteDialogSubscription);
  }
}
