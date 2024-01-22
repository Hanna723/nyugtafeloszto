import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  @ViewChild('sidenav') sidenav?: MatSidenav;
  user?: firebase.default.User | null;
  
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe((user) => {
      this.user = user;
      if (user) {
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    })

    this.router.events.subscribe((event) => {
      this.sidenav?.close();
    });
  }

  logOut(): void {
    this.authService.logOut();
    localStorage.removeItem('user');
  }
}
