import { Component, OnDestroy, OnInit } from '@angular/core';
import { PreviewComponent } from './profile/preview/preview.component';
import { Subscription } from 'rxjs';

import { AuthService } from './shared/services/auth.service';
import { UserService } from './shared/services/user.service';
import { User } from './shared/models/User';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'nyugtafeloszto';

  firebaseUser?: firebase.default.User | null;
  user?: User;
  image?: string;
  componentRef?: any;

  authSubscription?: Subscription;
  userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService
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
  }

  setImage(componentRef: any): void {
    if (!(componentRef instanceof PreviewComponent)) {
      return;
    }

    componentRef.uploadedImage.subscribe((image) => {
      this.image = image;
    });
  }
}
