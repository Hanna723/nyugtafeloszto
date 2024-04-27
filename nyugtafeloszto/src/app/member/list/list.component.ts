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
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { Member } from '../../shared/models/Member';
import { MemberService } from 'src/app/shared/services/member.service';
import { GroupService } from 'src/app/shared/services/group.service';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('search') search!: ElementRef;

  progressBar: boolean = false;
  tableData: MatTableDataSource<Member> = new MatTableDataSource();
  filteredTableData: MatTableDataSource<Member> = new MatTableDataSource();
  columnsToDisplay = ['name', 'delete'];
  memberForm: FormGroup = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
      Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/),
      this.invalidNameValidator(),
      this.existenceValidator(),
    ]),
  });
  user?: string | null;
  subscriptions: Subscription[] = [];

  constructor(
    private memberService: MemberService,
    private groupService: GroupService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');

    if (!this.user) {
      return;
    }

    this.progressBar = true;
    const memberSubscription = this.memberService
      .getAllForOneUser(JSON.parse(this.user))
      .subscribe((data) => {
        this.tableData = new MatTableDataSource(data);
        this.filteredTableData = new MatTableDataSource(data);
        this.filteredTableData.sort = this.sort;
      });

    this.subscriptions.push(memberSubscription);
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
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  onSubmit() {
    const user = localStorage.getItem('user');

    if (!user) {
      return;
    }

    const name: string = this.memberForm.controls['name'].value;

    const member: Member = {
      user: JSON.parse(user),
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
      el.name?.toLowerCase().includes(input.value.toLowerCase())
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

  invalidNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value.trim();

      if (!value) {
        return null;
      }

      return value === '*Törölt résztvevő*' || value === 'Mindenki'
        ? { invalid: true }
        : null;
    };
  }

  deleteMember(member: Member) {
    const deleteDialogRef = this.dialog.open(DialogComponent, {
      disableClose: true,
      data: {
        title: 'Figyelem! A résztvevő véglegesen törlődik.',
        button: 'Mégsem',
        submitButton: 'Ok',
      },
    });

    const deleteDialogSubscripton =
      deleteDialogRef.componentInstance.submitEvent.subscribe(() => {
        if (member.id && this.user) {
          this.memberService.delete(member.id);

          this.groupService
            .getByMember(JSON.parse(this.user), member.id)
            .subscribe((data) => {
              data.forEach((group) => {
                group.members = group.members.filter((el) => el !== member.id);
                this.groupService.update(group);
              });
            });
        }
      });
  }

  navigateToPreview(member: Member) {
    this.router.navigateByUrl(`/member/${member.id}`);
  }
}
