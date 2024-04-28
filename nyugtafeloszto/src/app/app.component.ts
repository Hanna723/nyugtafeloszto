import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PreviewComponent } from './profile/preview/preview.component';
import { Subscription } from 'rxjs';

import { AuthService } from './shared/services/auth.service';
import { UserService } from './shared/services/user.service';
import { User } from './shared/models/User';
import { HomeComponent } from './home/home.component';
import { MenuComponent } from './shared/menu/menu.component';
import { LoginComponent } from './auth/login/login.component';
import { ImageService } from './shared/services/image.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('menu') menu!: MenuComponent;
  title = 'nyugtafeloszto';

  firebaseUser?: firebase.default.User | null;
  user?: User | null;
  localUser?: string | null;
  image?: string;
  componentRef?: any;

  authSubscription?: Subscription;
  userSubscription?: Subscription;
  imageSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService
      .isLoggedIn()
      .subscribe((firebaseUser) => {
        this.firebaseUser = firebaseUser;
        if (firebaseUser && firebaseUser.emailVerified) {
          this.userSubscription = this.userService
            .getById(firebaseUser?.uid)
            .subscribe((user) => {
              this.user = user;
              localStorage.setItem('user', JSON.stringify(this.user?.id));
            });
        } else {
          localStorage.removeItem('user');
        }
      });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
  }

  onComponentChange(componentRef: any): void {
    if (
      componentRef instanceof HomeComponent ||
      componentRef instanceof LoginComponent
    ) {
      const localUser = localStorage.getItem('user');

      if (localUser) {
        this.menu.localUser = JSON.parse(localUser);

        this.userSubscription = this.userService
          .getById(JSON.parse(localUser))
          .subscribe((user) => {
            this.user = user;
            const imageName = this.user?.hasProfilePicture
              ? JSON.parse(localUser)
              : 'default';

            this.imageSubscription = this.imageService
              .getImage(`profile/${imageName}.png`)
              .subscribe((image) => {
                this.menu.image = image;
                localStorage.setItem('profilePicture', image);
              });
          });
      } else {
        this.menu.localUser = null;
        this.menu.image = null;
      }
    }

    if (!(componentRef instanceof PreviewComponent)) {
      return;
    }

    componentRef.uploadedImage.subscribe((image) => {
      this.image = image;
    });
  }
}
