import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Timestamp } from 'firebase/firestore';
import {
  Auth,
  applyActionCode,
  getAuth,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { Subscription } from 'rxjs';
import firebase from 'firebase/compat/app';

import { AuthService } from 'src/app/shared/services/auth.service';
import { UserService } from 'src/app/shared/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { PasswordResetComponent } from '../password-reset/password-reset.component';
import { PasswordChangeComponent } from 'src/app/profile/password-change/password-change.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  hide: boolean = true;
  progressBar: boolean = false;
  mode!: string;
  actionCode!: string;
  auth!: Auth;

  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(),
  });
  userSubscription?: Subscription;
  dialogSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog
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

    if (this.route.snapshot.queryParams['mode']) {
      this.handleUrlParams();
    }
  }

  handleUrlParams(): void {
    this.progressBar = true;
    this.mode = this.route.snapshot.queryParams['mode'];
    this.actionCode = this.route.snapshot.queryParams['oobCode'];
    const apiKey = this.route.snapshot.queryParams['apiKey'];

    this.auth = getAuth(firebase.apps[0]);

    if (this.auth.config.apiKey !== apiKey) {
      this.openErrorDialog();
      return;
    }

    switch (this.mode) {
      case 'resetPassword':
        this.handleResetPassword();
        break;
      case 'verifyEmail':
        this.handleVerifyEmail();
        break;
      default:
        this.openErrorDialog();
    }
  }

  handleResetPassword() {
    verifyPasswordResetCode(this.auth, this.actionCode)
      .then(() => {
        this.progressBar = false;
        const dialogRef = this.dialog.open(PasswordChangeComponent, {
          data: {
            auth: this.auth,
            actionCode: this.actionCode
          },
          disableClose: true,
        });

        dialogRef.componentInstance.progressEvent.subscribe((progress) => {
          this.progressBar = progress;
        });
      })
      .catch((err) => {
        this.openErrorDialog();
      });
  }

  handleVerifyEmail() {
    applyActionCode(this.auth, this.actionCode)
      .then(() => {
        this.progressBar = false;
        const dialogRef = this.dialog.open(DialogComponent, {
          data: {
            title: 'Sikeres e-mail cím visszaigazolás!',
            submitButton: 'Ok',
          },
        });
        this.dialogSubscription =
          dialogRef.componentInstance.submitEvent.subscribe(() => {
            this.router.navigate([]);
          });
      })
      .catch((error) => {
        this.openErrorDialog();
      });
  }

  sendPasswordResetEmail(): void {
    const dialogRef = this.dialog.open(PasswordResetComponent, {
      disableClose: true,
    });

    this.dialogSubscription =
      dialogRef.componentInstance.progressEvent.subscribe((progress) => {
        this.progressBar = progress;
      });
  }

  openErrorDialog(): void {
    this.progressBar = false;
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Hiba történt!',
        submitButton: 'Ok',
      },
    });
    this.dialogSubscription = dialogRef.componentInstance.submitEvent.subscribe(
      () => {
        this.router.navigate([]);
      }
    );
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.dialogSubscription?.unsubscribe();
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
        if (!user.user?.emailVerified) {
          this.progressBar = false;
          this.loginForm.controls['email'].setErrors({ unverified: true });
          this.authService.sendVerificationEmail().then(() => {
            this.authService.logOut();
          });
        } else {
          localStorage.setItem('user', JSON.stringify(user.user.uid));
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
        }
      })
      .catch((err) => {
        this.progressBar = false;
        this.loginForm.controls['password'].setErrors({ wrong: true });
      });
  }
}
