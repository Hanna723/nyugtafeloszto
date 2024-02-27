import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { User } from 'src/app/shared/models/User';
import { ImageService } from 'src/app/shared/services/image.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, OnDestroy {
  user?: User;
  image?: string;
  userSupscription?: Subscription;
  imageSubscription?: Subscription;

  constructor(
    private userService: UserService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    const localUser = localStorage.getItem('user');

    if (localUser) {
      this.userSupscription = this.userService
        .getById(JSON.parse(localUser).uid)
        .subscribe((user) => {
          this.user = user;

          this.imageSubscription = this.imageService
            .getImage(`/profile/${user?.profilePicture}`)
            .subscribe((image) => {
              this.image = image;
            });
        });
    }
  }

  ngOnDestroy(): void {
    this.userSupscription?.unsubscribe();
  }
}
