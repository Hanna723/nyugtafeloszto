import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { User } from 'src/app/shared/models/User';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  user?: User;
  tableData: MatTableDataSource<User> = new MatTableDataSource();
  filteredTableData: MatTableDataSource<User> = new MatTableDataSource();
  columnsToDisplay = ['email', 'formattedLastLogin', 'admin'];
  userSubscription?: Subscription;
  allUserSubscription?: Subscription;

  constructor(private userService: UserService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    const localUser = localStorage.getItem('user');

    if (localUser) {
      this.userService.getById(JSON.parse(localUser).uid).subscribe((user) => {
        this.user = user;
        if (this.user?.admin) {
          this.userService.getAll().subscribe((data) => {
            data.forEach((el) => {
              if (el.lastLogin) {
                let date = el.lastLogin.toDate();
                el.formattedLastLogin = this.datePipe.transform(
                  date,
                  'yyyy. MM. dd. HH:mm'
                );
              } else {
                el.formattedLastLogin = '';
              }
            });

            this.tableData = new MatTableDataSource(data);
            this.filteredTableData = new MatTableDataSource(data);
            this.filteredTableData.sort = this.sort;
          });
        }
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.sort) {
        this.sort.sort({ id: 'email', start: 'asc', disableClear: false });
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.allUserSubscription?.unsubscribe();
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
      el.email.toLowerCase().includes(input.value.toLowerCase())
    );
  }

  changeAdmin(event: Event, user: User) {
    if (user.id === this.user?.id) {
      return;
    }

    const checkbox = event.target as HTMLInputElement;

    user.admin = checkbox.checked;
    this.userService.update(user);
  }
}
