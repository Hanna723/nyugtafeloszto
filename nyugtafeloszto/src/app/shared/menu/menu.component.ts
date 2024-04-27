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
  @Input() localUser?: string | null;
  routerSubscription?: Subscription;
  imageSubscription?: Subscription;
  userSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      this.localUser = JSON.parse(localUser);
    }
    const image = localStorage.getItem('profilePicture');

    if (image && this.localUser) {
      this.image = image;
    } else if (this.localUser) {
      this.userSubscription = this.userService
        .getById(this.localUser)
        .subscribe((user) => {
          const imageName = user?.hasProfilePicture
            ? this.localUser
            : 'default';
          this.imageSubscription = this.imageService
            .getImage(`profile/${imageName}.png`)
            .subscribe((image) => {
              this.image = image;
              localStorage.setItem('profilePicture', image);
            });
        });
    }

    this.routerSubscription = this.router.events.subscribe((event) => {
      this.sidenav?.close();
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }

  logOut(): void {
    this.authService.logOut();
    this.localUser = undefined;
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    this.router.navigateByUrl('/auth/login');
  }
}
