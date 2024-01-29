import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { Group } from 'src/app/shared/models/Group';
import { GroupService } from 'src/app/shared/services/group.service';
import { EditComponent } from '../edit/edit.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, OnDestroy {
  tableData?: Array<Group>;
  columnsToDisplay = ['name'];
  user?: string | null;
  groupSubscription?: Subscription;

  constructor(
    private groupService: GroupService,
    private router: Router,
    public edit: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');

    if (this.user) {
      this.groupSubscription = this.groupService
        .getAllForOneUser(JSON.parse(this.user).uid)
        .subscribe((data) => {
          this.tableData = [...data];
        });
    }
  }

  ngOnDestroy(): void {
    this.groupSubscription?.unsubscribe();
  }

  navigateToPreview(group: Group): void {
    this.router.navigateByUrl(`/group/${group.id}`);
  }

  openEdit(): void {
    this.edit.open(EditComponent, { disableClose: true });
  }
}
