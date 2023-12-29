import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { Group } from 'src/app/shared/models/Group';
import { GroupService } from 'src/app/shared/services/group.service';
import { EditComponent } from '../edit/edit.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  tableData?: Array<Group>;
  columnsToDisplay = ['name'];

  constructor(
    private groupService: GroupService,
    private router: Router,
    public edit: MatDialog
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');

    if (user) {
      this.groupService
        .getAllForOneUser(JSON.parse(user).uid)
        .subscribe((data) => {
          this.tableData = [];
          data.forEach((el) => {
            this.tableData?.push(el);
          });
        });
    }
  }

  navigateToPreview(id: any): void {
    this.router.navigateByUrl(`/group/${id.id}`);
  }

  openEdit(): void {
    this.edit.open(EditComponent, { disableClose: true });
  }
}
