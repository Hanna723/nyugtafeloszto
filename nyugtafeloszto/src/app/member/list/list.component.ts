import { Component, OnInit } from '@angular/core';

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
}
