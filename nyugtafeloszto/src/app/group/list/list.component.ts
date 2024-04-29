import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { Group } from 'src/app/shared/models/Group';
import { GroupService } from 'src/app/shared/services/group.service';
import { EditComponent } from '../edit/edit.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('search') search!: ElementRef;

  progressBar: boolean = false;
  tableData: MatTableDataSource<Group> = new MatTableDataSource();
  filteredTableData: MatTableDataSource<Group> = new MatTableDataSource();
  columnsToDisplay = ['name'];
  user?: string | null;
  groupSubscription?: Subscription;
  editSubscription?: Subscription;

  constructor(
    private groupService: GroupService,
    private router: Router,
    public edit: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');

    if (!this.user) {
      return;
    }

    this.progressBar = true;
    this.groupSubscription = this.groupService
      .getAllForOneUser(JSON.parse(this.user))
      .subscribe((data) => {
        this.tableData = new MatTableDataSource(data);
        this.filteredTableData = new MatTableDataSource(data);
        this.filteredTableData.sort = this.sort;
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.sort) {
        this.sort.sort({ id: 'name', start: 'asc', disableClear: false });
      }
      this.progressBar = false;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.groupSubscription?.unsubscribe();
    this.editSubscription?.unsubscribe();
  }

  navigateToPreview(group: Group): void {
    this.router.navigateByUrl(`/group/${group.id}`);
  }

  openEdit(): void {
    const dialogRef = this.edit.open(EditComponent, { disableClose: true });
    const tableDataLength = this.tableData.data.length;

    this.editSubscription = dialogRef.afterClosed().subscribe(() => {
      this.search.nativeElement.value = '';

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

      this.sortData();
    });
  }

  sortData(): void {
    this.filteredTableData.sort = this.sort;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.value) {
      this.filteredTableData.data = [...this.tableData.data];
      return;
    }

    this.filteredTableData.data = this.tableData.data.filter((el) =>
      el.name.toLowerCase().includes(input.value.toLowerCase())
    );
  }
}
