import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

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
export class PreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort?: MatSort;
  progressBar: boolean = false;
  group?: Group;
  members: Array<Member> = [];
  tableData: MatTableDataSource<Member> = new MatTableDataSource();
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
      this.progressBar = true;

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
                  this.members.push(member);
                }
              });
            this.memberSubscriptions.push(memberSubscription);
          });
        });
    } else {
      this.router.navigateByUrl('/group/list');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.tableData = new MatTableDataSource(this.members);
      setTimeout(() => {
        if (this.sort) {
          this.sort.sort({ id: 'name', start: 'asc', disableClear: false });
        }
        this.progressBar = false;
      });
    }, 900);
  }

  ngOnDestroy(): void {
    this.groupSubscription?.unsubscribe();
    this.submitSubscription?.unsubscribe();
    this.editSubscription?.unsubscribe();
    this.memberSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  sortData(): void {
    if (this.sort) {
      this.tableData.sort = this.sort;
    }
  }

  deleteGroup(): void {
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

  editGroup(): void {
    const dialogRef = this.edit.open(EditComponent, {
      disableClose: true,
      data: { group: this.group },
    });
    const tableDataLength = this.tableData.data.length;

    this.editSubscription = dialogRef
      .afterClosed()
      .subscribe((updatedValues) => {
        if (updatedValues && updatedValues.group) {
          this.group = updatedValues.group;
          this.members = updatedValues.members;
          this.tableData.data = this.members;

          setTimeout(() => {
            if (
              tableDataLength === 0 &&
              this.tableData.data.length === 1 &&
              this.sort
            ) {
              this.sort.sort({ id: 'name', start: 'asc', disableClear: false });
            }
            this.progressBar = false;
          }, 1000);
        }
      });
  }

  navigateToMemberPreview(member: Member): void {
    this.router.navigateByUrl(`/member/${member.id}`);
  }
}
