import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { Member } from '../../shared/models/Member';
import { MemberService } from 'src/app/shared/services/member.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, OnDestroy {
  tableData?: Array<Member>;
  columnsToDisplay = ['name'];
  memberForm: FormGroup = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
      Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/),
      this.existenceValidator(),
    ]),
  });
  user?: string | null;
  memberSubscription?: Subscription;

  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');

    if (this.user) {
      this.memberSubscription = this.memberService
        .getAllForOneUser(JSON.parse(this.user).uid)
        .subscribe((data) => {
          this.tableData = [...data];
        });
    }
  }

  ngOnDestroy(): void {
    this.memberSubscription?.unsubscribe();
  }

  onSubmit() {
    const user = localStorage.getItem('user');

    if (!user) {
      return;
    }

    const name: string = this.memberForm.controls['name'].value;

    const member: Member = {
      user: JSON.parse(user).uid,
      name: name.trim(),
    };
    this.memberService.create(member);
    this.memberForm.controls['name'].setValue('');
    this.memberForm.controls['name'].setErrors(null);
  }

  existenceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value.trim();

      if (!value) {
        return null;
      }

      let exists = false;
      this.tableData?.forEach((member) => {
        if (member.name === value) {
          exists = true;
        }
      });

      return exists ? { exists: true } : null;
    };
  }
}
