import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { User } from 'src/app/shared/models/User';
import { ImageService } from 'src/app/shared/services/image.service';
import { UserService } from 'src/app/shared/services/user.service';
import { EditComponent } from '../edit/edit.component';
import { MatDialog } from '@angular/material/dialog';

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
  imageSubscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private imageService: ImageService,
    public edit: MatDialog
  ) {}

  ngOnInit(): void {
    const localUser = localStorage.getItem('user');

    if (localUser) {
      this.userSupscription = this.userService
        .getById(JSON.parse(localUser).uid)
        .subscribe((user) => {
          this.user = user;
          this.fetchImage(user?.profilePicture || '', false);
        });
    }
  }

  ngOnDestroy(): void {
    this.userSupscription?.unsubscribe();
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
    this.edit.open(EditComponent, {
      disableClose: true,
    });
  }

  changePicture(event: Event) {
    const target = event.target as HTMLInputElement;
    const uploadedImage = target?.files?.item(0);
    const type = uploadedImage?.name.split('.').at(-1);

    if (this.user && uploadedImage) {
      const imageName = `${this.user.id}.${type}`;

      this.imageService
        .uploadImage(`profile/${imageName}`, uploadedImage)
        .then(() => {
          this.fetchImage(imageName, true);

          if (this.user && this.user.profilePicture !== imageName) {
            this.imageService.deleteImage(
              `/profile/${this.user?.profilePicture}`
            );

            this.user.profilePicture = imageName;
            this.userService.update(this.user);
          }
        });
    }
  }

  deleteProfile() {
    console.log('delete');
  }
}
