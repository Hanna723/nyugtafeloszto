import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteActivatedEvent } from '@angular/material/autocomplete';
import { Subscription } from 'rxjs';

import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit, OnDestroy {
  @ViewChild('memberInput') memberInput!: ElementRef<HTMLInputElement>;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  groupForm: FormGroup = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
      Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/),
      this.existenceValidator(),
    ]),
    members: this.formBuilder.array([]),
  });
  memberList?: Array<Member>;
  filteredMembers?: Array<Member>;
  setMembers = false;
  groupList?: Array<Group>;
  memberSubscription?: Subscription;
  groupSubscription?: Subscription;

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
      this.memberSubscription = this.memberService
        .getAllForOneUser(JSON.parse(user).uid)
        .subscribe((data) => {
          this.memberList = [...data];
        });

      this.groupSubscription = this.groupService
        .getAllForOneUser(JSON.parse(user).uid)
        .subscribe((data) => {
          this.groupList = [...data];
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

  ngOnDestroy(): void {
    this.memberSubscription?.unsubscribe();
  }

  getControls() {
    const controls = (this.groupForm.get('members') as FormArray).controls;

    if (this.memberList && !this.setMembers) {
      const members = <FormArray>this.groupForm.controls['members'];
      let existingMembers: Array<Member> = [];

      this.data.group.members.forEach((memberId) => {
        if (typeof memberId === 'string' && memberId !== '') {
          const member = this.memberList?.find((el) => el.id === memberId);
          if (member) {
            existingMembers.push(member);
          }
        }
      });

      if (existingMembers.length !== 0) {
        members.setValue(existingMembers);
      }
      this.setMembers = true;
    }

    return controls;
  }

  onSubmit(): void {
    const user = localStorage.getItem('user');

    if (!user) {
      this.close(null);
      return;
    }

    let memberIds: string[] = [];
    this.groupForm.controls['members'].value.forEach((member: Member) => {
      if (member.id) {
        memberIds.push(member.id);
      }
    });

    let members = new Set(memberIds);
    members.delete('');
    memberIds = Array.from(members.values());

    const group: Group = {
      user: JSON.parse(user).uid,
      name: this.groupForm.controls['name'].value,
      members: memberIds,
    };

    if (this.data) {
      group.id = this.data.group.id;
      this.groupService.update(group);
    } else {
      this.groupService.create(group);
    }

    this.close(group);
  }

  getMembersFormArray(): FormArray {
    const members = this.groupForm.get('members') as FormArray;

    members.controls.forEach((control) => {
      if (typeof control.value === 'string' && this.memberList) {
        const member = this.memberList.find((el) => el.id === control.value);
        control.setValue(member);
      }
    });
    return members;
  }

  addMember(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      const selected = this.filteredMembers?.at(0);

      if (selected) {
        let control = new FormControl<Member>(selected);
        this.getMembersFormArray()?.push(control);
        this.filteredMembers = this.memberList;
      }
    }

    event.chipInput!.clear();
  }

  selectedMember(event: MatAutocompleteActivatedEvent): void {
    let control = new FormControl<Member>(event.option?.value);
    this.getMembersFormArray()?.push(control);
    this.memberInput.nativeElement.value = '';
  }

  removeMember(i: number): void {
    const members = this.groupForm.get('members') as FormArray;
    members.removeAt(i);
  }

  filter(event: Event): void {
    const filterValue = this.memberInput.nativeElement.value.toLowerCase();
    this.filteredMembers = this.memberList?.filter((member) =>
      member.name.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  trackMember(index: number, option: Member) {
    return option.name;
  }

  close(group: Group | null): void {
    let members = this.groupForm.controls['members'].value;
    members = new Set(members);
    members = Array.from(members);
    const updatedValues = {
      group: group,
      members: members,
    };
    this.dialogRef.close(updatedValues);
  }

  existenceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value.trim();

      if (!value) {
        return null;
      }

      let exists = false;
      this.groupList?.forEach((group) => {
        if (group.name === value && group.name !== this.data.group.name) {
          exists = true;
        }
      });

      return exists ? { exists: true } : null;
    };
  }
}
