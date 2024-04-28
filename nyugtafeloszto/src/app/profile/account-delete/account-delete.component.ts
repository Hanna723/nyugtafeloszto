import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';

import { AuthService } from 'src/app/shared/services/auth.service';
import { GroupService } from 'src/app/shared/services/group.service';
import { ImageService } from 'src/app/shared/services/image.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { ReceiptService } from 'src/app/shared/services/receipt.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-account-delete',
  templateUrl: './account-delete.component.html',
  styleUrls: ['./account-delete.component.scss'],
})
export class AccountDeleteComponent implements OnInit {
  @Output() progressEvent = new EventEmitter();
  hide: boolean = true;
  user?: firebase.User;
  deleteForm: FormGroup = new FormGroup({
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { hasProfilePicture: boolean },
    private router: Router,
    private userService: UserService,
    private imageService: ImageService,
    private authService: AuthService,
    private receiptService: ReceiptService,
    private groupService: GroupService,
    private memberService: MemberService,
    public dialogRef: MatDialogRef<AccountDeleteComponent>
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe((user) => {
      if (user) {
        this.user = user;
      }
    });
  }

  onSubmit() {
    if (!this.user) {
      return;
    }

    const credentials = firebase.auth.EmailAuthProvider.credential(
      this.user?.email || '',
      this.deleteForm.controls['password'].value
    );

    this.user.reauthenticateWithCredential(credentials).then(
      (success) => {
        if (!this.user) {
          return;
        }

        this.progressEvent.emit(true);

        this.receiptService
          .getAllForOneUser(this.user.uid)
          .subscribe((data) => {
            data.forEach((receipt) => {
              if (receipt.id) {
                this.receiptService.delete(receipt?.id);
              }
            });
          });

        this.groupService.getAllForOneUser(this.user.uid).subscribe((data) => {
          data.forEach((group) => {
            if (group.id) {
              this.groupService.delete(group?.id);
            }
          });
        });

        this.memberService.getAllForOneUser(this.user.uid).subscribe((data) => {
          data.forEach((member) => {
            if (member.id) {
              this.memberService.delete(member?.id);
            }
          });
        });

        if (this.data.hasProfilePicture) {
          this.imageService.deleteImage(`/profile/${this.user?.uid}.png`);
        }
        this.userService.delete(this.user.uid).then(() => {
          this.authService.delete().then(() => {
            this.authService.logOut().then(() => {
              localStorage.removeItem('user');
              localStorage.removeItem('profilePicture');
              this.close();
              this.progressEvent.emit(false);
              this.router.navigateByUrl('/auth/login');
            });
          });
        });
      },
      (error) => {
        if (error.code === 'auth/invalid-login-credentials') {
          this.progressEvent.emit(false);
          this.deleteForm.controls['password'].setErrors({
            incorrect: 'true',
          });
        }
      }
    );
  }

  close(): void {
    this.dialogRef.close();
  }
}
