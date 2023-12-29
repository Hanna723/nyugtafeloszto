import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit {
  group?: Group;
  members?: Array<Member>;
  columnsToDisplay = ['name'];

  constructor(
    private groupService: GroupService,
    private memberService: MemberService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    const id = this.route.snapshot.params['id'];

    if (user && id) {
      this.groupService.getById(id, user).subscribe((data) => {
        if (!data) {
          this.router.navigateByUrl('/group/list');
        }
        this.group = data;
        this.members = [];
        this.group?.members.forEach((memberId) => {
          this.memberService.getById(memberId, user).subscribe((member) => {
            if (member) {
              this.members?.push(member);
            }
          });
        });
      });
    } else {
      this.router.navigateByUrl('/group/list');
    }
  }
}
