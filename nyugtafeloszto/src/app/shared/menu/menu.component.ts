import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav?: MatSidenav;
  user?: firebase.default.User | null;
  authSubscription?: Subscription;
  routerSubscription?: Subscription;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.isLoggedIn().subscribe((user) => {
      this.user = user;
      if (user) {
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    });

    this.routerSubscription = this.router.events.subscribe((event) => {
      this.sidenav?.close();
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  logOut(): void {
    this.authService.logOut();
    localStorage.removeItem('user');
  }
}
