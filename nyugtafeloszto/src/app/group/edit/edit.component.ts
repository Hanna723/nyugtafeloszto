import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit {
  groupForm: FormGroup = new FormGroup({
    name: new FormControl(''),
    members: this.formBuilder.array([]),
  });
  memberList?: Array<Member>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { group: Group },
    public dialogRef: MatDialogRef<EditComponent>,
    private formBuilder: FormBuilder,
    private groupService: GroupService,
    private memberService: MemberService
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');

    if (user) {
      this.memberService
        .getAllForOneUser(JSON.parse(user).uid)
        .subscribe((data) => {
          this.memberList = [...data];
        });
    }

    if (this.data) {
      this.groupForm.controls['name'].setValue(this.data.group.name);

      const members = <FormArray>this.groupForm.controls['members'];
      this.data.group.members.forEach((member) => {
        members.push(new FormControl(''));
      });
      members.setValue(this.data.group.members);
    }
  }

  getControls() {
    return (this.groupForm.get('members') as FormArray).controls;
  }

  onSubmit(): void {
    const user = localStorage.getItem('user');

    if (!user) {
      this.close();
      return;
    }

    let members = this.groupForm.controls['members'].value;
    members = new Set(members);
    members.delete('');
    members = Array.from(members.values());

    const group: Group = {
      user: JSON.parse(user).uid,
      name: this.groupForm.controls['name'].value,
      members: members,
    };

    if (this.data) {
      group.id = this.data.group.id;
      this.groupService.update(group);
    } else {
      this.groupService.create(group);
    }

    this.close();
  }

  addMember(): void {
    const members = <FormArray>this.groupForm.controls['members'];
    members.push(new FormControl(''));
  }

  removeMember(i: number): void {
    const members = <FormArray>this.groupForm.controls['members'];
    members.removeAt(i);
  }

  close(): void {
    this.dialogRef.close();
  }
}
