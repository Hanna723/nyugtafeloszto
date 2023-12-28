import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { Member } from '../../shared/models/Member';
import { MemberService } from 'src/app/shared/services/member.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  tableData?: Array<Member>;
  columnsToDisplay = ['name'];
  memberForm: FormGroup = new FormGroup({
    name: new FormControl(''),
  });

  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');

    if (user) {
      this.memberService
        .getAllForOneUser(JSON.parse(user).uid)
        .subscribe((data) => {
          this.tableData = [];
          data.forEach((el) => {
            this.tableData?.push(el);
          });
        });
    }
  }

  onSubmit() {
    const user = localStorage.getItem('user');

    if (!user) {
      return;
    }
    const member: Member = {
      user: JSON.parse(user).uid,
      name: this.memberForm.controls['name'].value
    }
    this.memberService.create(member);
    this.memberForm.controls['name'].setValue('');
  }
}
