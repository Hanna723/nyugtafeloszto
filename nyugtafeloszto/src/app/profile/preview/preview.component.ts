import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { User } from 'src/app/shared/models/User';
import { ImageService } from 'src/app/shared/services/image.service';
import { UserService } from 'src/app/shared/services/user.service';
import { PasswordChangeComponent } from '../password-change/password-change.component';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { AccountDeleteComponent } from '../account-delete/account-delete.component';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, OnDestroy {
  @Output() uploadedImage: EventEmitter<string> = new EventEmitter();
  user?: User;
  image?: string;
  userSupscription?: Subscription;
  imageUploadSubscription?: Subscription;
  imageSubscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private imageService: ImageService,
    public passwordChange: MatDialog,
    public imageUpload: MatDialog,
    public deleteProfileDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const localUser = localStorage.getItem('user');

    if (localUser) {
      this.userSupscription = this.userService
        .getById(JSON.parse(localUser).uid)
        .subscribe((user) => {
          this.user = user;
          const imageName = user?.hasProfilePicture ? user.id : 'default';
          this.fetchImage(`${imageName}.png`, false);
        });
    }
  }

  ngOnDestroy(): void {
    this.userSupscription?.unsubscribe();
    this.imageUploadSubscription?.unsubscribe();
    this.imageSubscriptions.forEach((imageSubscription) => {
      imageSubscription.unsubscribe();
    });
  }

  fetchImage(imageName: string, uploaded: boolean) {
    const imageSubscription = this.imageService
      .getImage(`/profile/${imageName}`)
      .subscribe((image) => {
        this.image = image;

        if (uploaded) {
          this.uploadedImage.emit(this.image);
        }
      });

    this.imageSubscriptions.push(imageSubscription);
  }

  changePassword() {
    this.passwordChange.open(PasswordChangeComponent, {
      disableClose: true,
    });
  }

  changePicture(event: Event) {
    const dialogRef = this.imageUpload.open(ImageUploadComponent, {
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

        if (this.user) {
          const imageName = `${this.user.id}.png`;

          this.imageService
            .uploadImage(`/profile/${imageName}`, image)
            .then(() => {
              this.fetchImage(imageName, true);

              if (this.user && !this.user.hasProfilePicture) {
                this.user.hasProfilePicture = true;
                this.userService.update(this.user);
              }
            });
        }
      });
  }

  deleteProfile() {
    this.deleteProfileDialog.open(AccountDeleteComponent, {
      disableClose: true,
      data: {
        hasProfilePicture: this.user?.hasProfilePicture
      },
    });
  }
}
