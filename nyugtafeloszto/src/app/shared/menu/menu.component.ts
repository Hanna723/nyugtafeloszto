import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ImageService } from '../services/image.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav?: MatSidenav;
  @Input() image?: string;
  user?: firebase.default.User | null;
  authSubscription?: Subscription;
  userSubscription?: Subscription;
  imageSubscription?: Subscription;
  routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.isLoggedIn().subscribe((user) => {
      this.user = user;
      if (user) {
        localStorage.setItem('user', JSON.stringify(this.user));

        this.userSubscription = this.userService
          .getById(user?.uid)
          .subscribe((loggedInUser) => {
            const imageName = loggedInUser?.hasProfilePicture
              ? loggedInUser.id
              : 'default';
            this.imageSubscription = this.imageService
              .getImage(`profile/${imageName}.png`)
              .subscribe((image) => {
                this.image = image;
              });
          });
      }
    });

    this.routerSubscription = this.router.events.subscribe((event) => {
      this.sidenav?.close();
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  logOut(): void {
    this.authService.logOut();
    localStorage.removeItem('user');
    this.router.navigateByUrl('/auth/login');
  }
}
