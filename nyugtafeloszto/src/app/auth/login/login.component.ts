import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AuthService } from 'src/app/shared/services/auth.service';
import { UserService } from 'src/app/shared/services/user.service';
import { Subscription } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  hide: boolean = true;
  progressBar: boolean = false;
  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(),
  });
  userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    if (user) {
      this.router.navigateByUrl('/home');
    }

    let rememberedEmail: string | null = localStorage.getItem('email');

    if (rememberedEmail) {
      this.loginForm.controls['email'].setValue(rememberedEmail);
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  onSubmit(): void {
    this.progressBar = true;

    if (this.loginForm.controls['rememberMe'].value) {
      localStorage.setItem('email', this.loginForm.controls['email'].value);
    }

    this.authService
      .login(
        this.loginForm.controls['email'].value,
        this.loginForm.controls['password'].value
      )
      .then((user) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('receipt');
        if (user.user) {
          this.userSubscription = this.userService
            .getById(user.user?.uid)
            .subscribe((loggedInUser) => {
              if (loggedInUser) {
                loggedInUser.lastLogin = Timestamp.fromDate(new Date());
                this.userService.update(loggedInUser);
                this.progressBar = false;
                this.router.navigateByUrl('/home');
              }
            });
        }
      })
      .catch((err) => {
        this.progressBar = false;
        this.loginForm.controls['password'].setErrors({ wrong: true });
      });
  }
}
