import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { Member } from '../../shared/models/Member';
import { MemberService } from 'src/app/shared/services/member.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('search') search!: ElementRef;
  tableData: MatTableDataSource<Member> = new MatTableDataSource();
  filteredTableData: MatTableDataSource<Member> = new MatTableDataSource();
  columnsToDisplay = ['name'];
  memberForm: FormGroup = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
      Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/),
      this.existenceValidator(),
    ]),
  });
  user?: string | null;
  memberSubscription?: Subscription;

  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');

    if (this.user) {
      this.memberSubscription = this.memberService
        .getAllForOneUser(JSON.parse(this.user).uid)
        .subscribe((data) => {
          this.tableData = new MatTableDataSource(data);
          this.filteredTableData = new MatTableDataSource(data);
          this.filteredTableData.sort = this.sort;
        });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.sort.sort({ id: 'name', start: 'asc', disableClear: false });
    }, 1000);
  }

  ngOnDestroy(): void {
    this.memberSubscription?.unsubscribe();
  }

  onSubmit() {
    const user = localStorage.getItem('user');

    if (!user) {
      return;
    }

    const name: string = this.memberForm.controls['name'].value;

    const member: Member = {
      user: JSON.parse(user).uid,
      name: name.trim(),
    };
    this.memberService.create(member);
    this.memberForm.controls['name'].setValue('');
    this.memberForm.controls['name'].setErrors(null);

    this.search.nativeElement.value = '';
    this.sortData();
  }

  sortData() {
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

  existenceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value.trim();

      if (!value) {
        return null;
      }

      let exists = false;
      this.tableData?.data.forEach((member) => {
        if (member.name === value) {
          exists = true;
        }
      });

      return exists ? { exists: true } : null;
    };
  }
}
