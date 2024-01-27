import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { EditComponent } from '../edit/edit.component';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit {
  group?: Group;
  members: Array<Member> = [];
  columnsToDisplay = ['name'];

  constructor(
    private groupService: GroupService,
    private memberService: MemberService,
    private route: ActivatedRoute,
    private router: Router,
    public edit: MatDialog,
    public deleteDialog: MatDialog
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    const id = this.route.snapshot.params['id'];

    if (user && id) {
      console.log('asdd');
      this.groupService.getById(id, user).subscribe((data) => {
        console.log(data?.id);
        if (!data) {
          this.router.navigateByUrl('/group/list');
        }
        this.group = data;

        data?.members.forEach((memberId) => {
          // console.log(memberId);
          this.memberService.getById(memberId, user).subscribe((member) => {
            if (member) {
              this.members?.push(member);

              // console.log(this.members);
            }
          });
        });
      });
    } else {
      this.router.navigateByUrl('/group/list');
    }
  }

  deleteGroup() {
    const deleteDialogRef = this.deleteDialog.open(DialogComponent, {
      disableClose: true,
      data: {
        title: 'Figyelem! A csoport véglegesen törlődik.',
        button: 'Mégsem',
        submitButton: 'Ok',
      },
    });

    deleteDialogRef.componentInstance.submitEvent.subscribe(() => {
      if (this.group?.id) {
        this.groupService.delete(this.group?.id);
      }
    });
  }

  editGroup() {
    this.edit.open(EditComponent, {
      disableClose: true,
      data: { group: this.group },
    });
  }
}
