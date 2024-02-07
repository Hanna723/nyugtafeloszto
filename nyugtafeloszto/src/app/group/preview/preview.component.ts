import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { EditComponent } from '../edit/edit.component';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, OnDestroy {
  group?: Group;
  members: Array<Member> = [];
  columnsToDisplay = ['name'];

  groupSubscription?: Subscription;
  memberSubscriptions: Subscription[] = [];
  submitSubscription?: Subscription;
  editSubscription?: Subscription;

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
      this.groupSubscription = this.groupService
        .getById(id, user)
        .subscribe((data) => {
          if (!data) {
            this.router.navigateByUrl('/group/list');
          }
          this.group = data;

          data?.members.forEach((memberId) => {
            const memberSubscription = this.memberService
              .getById(memberId, user)
              .subscribe((member) => {
                if (member) {
                  this.members?.push(member);
                }
              });
            this.memberSubscriptions.push(memberSubscription);
          });
        });
    } else {
      this.router.navigateByUrl('/group/list');
    }
  }

  ngOnDestroy(): void {
    this.groupSubscription?.unsubscribe();
    this.submitSubscription?.unsubscribe();
    this.editSubscription?.unsubscribe();
    this.memberSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
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

    this.submitSubscription =
      deleteDialogRef.componentInstance.submitEvent.subscribe(() => {
        if (this.group?.id) {
          this.groupService.delete(this.group?.id);
          this.router.navigateByUrl('/group/list');
        }
      });
  }

  editGroup() {
    const dialogRef = this.edit.open(EditComponent, {
      disableClose: true,
      data: { group: this.group },
    });

    this.editSubscription = dialogRef
      .afterClosed()
      .subscribe((updatedValues) => {
        if (updatedValues && updatedValues.group) {
          this.group = updatedValues.group;
          this.members = updatedValues.members;
        }
      });
  }
}
