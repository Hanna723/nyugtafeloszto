import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ImageService } from '../services/image.service';
import { User } from '../models/User';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav?: MatSidenav;
  @Input() image?: string;
  @Input() user?: User;
  localUser?: string | null;
  routerSubscription?: Subscription;
  imageSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.localUser = localStorage.getItem('user');
    const image = localStorage.getItem('profilePicture');

    if (image) {
      this.image = image;
    } else {
      const imageName = this.user?.hasProfilePicture ? this.user.id : 'default';
      this.imageSubscription = this.imageService
        .getImage(`profile/${imageName}.png`)
        .subscribe((image) => {
          this.image = image;
          localStorage.setItem('profilePicture', image);
        });
    }

    this.routerSubscription = this.router.events.subscribe((event) => {
      this.sidenav?.close();
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
  }

  logOut(): void {
    this.authService.logOut();
    this.user = undefined;
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    this.router.navigateByUrl('/auth/login');
  }
}
