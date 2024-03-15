import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';

import { Member } from 'src/app/shared/models/Member';
import { Receipt } from 'src/app/shared/models/Receipt';
import { CurrencyService } from 'src/app/shared/services/currency.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { ReceiptService } from 'src/app/shared/services/receipt.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('download') download!: ElementRef<HTMLAnchorElement>;

  progressBar: boolean = false;
  user?: string | null;
  receipt?: Receipt;
  needToPay: Map<string, number> = new Map();
  members: Array<Member> = [];
  tableData: MatTableDataSource<Member> = new MatTableDataSource();
  columnsToDisplay = ['name', 'pays'];
  downloadHref?: SafeUrl;

  receiptSubscription?: Subscription;
  currencySubscription?: Subscription;
  memberSubscription?: Subscription;
  submitSubscription?: Subscription;

  constructor(
    private receiptService: ReceiptService,
    private memberService: MemberService,
    private currencyService: CurrencyService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router,
    public deleteDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');
    const id = this.route.snapshot.params['id'];

    if (this.user && id) {
      this.progressBar = true;
      this.receiptSubscription = this.receiptService
        .getById(id, this.user)
        .subscribe((data) => {
          if (!data) {
            this.router.navigateByUrl('/receipt/list');
          }
          this.receipt = data;
          this.currencySubscription = this.currencyService
            .getById(data?.currency as unknown as string)
            .subscribe((currency) => {
              if (data?.date) {
                let date = data.date.toDate();
                data.formattedDate = this.datePipe.transform(
                  date,
                  'yyyy. MM. dd.'
                );
              }
              if (currency && data) {
                data.currency = currency;
              }
            });
          this.calculatePrices();
          this.getMembersFromReceipt();
        });
    } else if (!this.user && id === 'guest') {
      let receipt = localStorage.getItem('receipt');

      if (!receipt) {
        this.router.navigateByUrl('/receipt/new');
        return;
      }

      receipt = JSON.parse(receipt);
      this.receipt = receipt as unknown as Receipt;
      this.calculatePrices();
      this.getMembersFromReceipt();
    } else {
      this.router.navigateByUrl('/receipt/new');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.tableData = new MatTableDataSource(this.members);
      setTimeout(() => {
        if (this.sort) {
          this.sort.sort({ id: 'pays', start: 'asc', disableClear: false });
          this.progressBar = false;
        }
      });
    }, 900);
  }

  ngOnDestroy(): void {
    this.receiptSubscription?.unsubscribe();
    this.currencySubscription?.unsubscribe();
    this.memberSubscription?.unsubscribe();
    this.submitSubscription?.unsubscribe();
  }

  sortData() {
    this.tableData.sort = this.sort;
  }

  getMembersFromReceipt() {
    if (!this.user && this.receipt?.members) {
      this.receipt.members.forEach((memberName) => {
        const member: Member = {
          id: '',
          user: '',
          name: memberName,
          pays: this.needToPay.get(memberName) || 0,
        };
        this.members.push(member);
      });
      return;
    }

    this.receipt?.members.forEach((memberId) => {
      if (this.user) {
        this.memberSubscription = this.memberService
          .getById(memberId, this.user)
          .subscribe((member) => {
            if (member && member.id) {
              member.pays = this.needToPay.get(member.id) || 0;
              this.members.push(member);
            } else if (this.user) {
              let deletedMember: Member = {
                id: memberId,
                user: this.user,
                name: '*Törölt résztvevő*',
                pays: this.needToPay.get(memberId) || 0,
              };
              this.members.push(deletedMember);
            }
          });
      }
    });
  }

  calculatePrices() {
    this.receipt?.members.forEach((member) => {
      this.needToPay.set(member, 0);
    });

    this.receipt?.products.forEach((product) => {
      product.pays.forEach((member) => {
        const priceSoFar = this.needToPay.get(member) || 0;
        this.needToPay.set(
          member,
          priceSoFar + product.price / product.pays.length
        );
      });
    });
  }

  deleteReceipt() {
    const deleteDialogRef = this.deleteDialog.open(DialogComponent, {
      disableClose: true,
      data: {
        title: 'Figyelem! A nyugta véglegesen törlődik.',
        button: 'Mégsem',
        submitButton: 'Ok',
      },
    });

    this.submitSubscription =
      deleteDialogRef.componentInstance.submitEvent.subscribe(() => {
        if (this.receipt?.id) {
          this.receiptService.delete(this.receipt.id);
          this.router.navigateByUrl('/receipt/list');
        }
      });
  }

  editReceipt() {
    if (this.receipt?.id) {
      this.router.navigateByUrl(`/receipt/edit/${this.receipt.id}`);
    }
  }

  downloadReceipt(type: string) {
    let members: Object[] = [];
    this.tableData.data.forEach((data) => {
      if (typeof data !== 'string') {
        members.push({
          név: data.name,
          fizet: data.pays,
        });
      }
    });

    let downloadData = {
      bolt: this.receipt?.store,
      dátum: this.receipt?.formattedDate,
      pénznem: this.receipt?.currency?.symbol,
      végösszeg: this.receipt?.sum,
      tagok: members,
    };

    let url;

    if (type === 'csv') {
      url =
        'data:text/csv;charset=UTF-8,%EF%BB%BF' +
        encodeURIComponent(this.createCsv(downloadData));
    } else {
      const json = JSON.stringify(downloadData);
      url = 'data:application/json;charset=UTF-8,' + encodeURIComponent(json);
    }

    this.download.nativeElement.href = url;
    this.download.nativeElement.download = `${downloadData.bolt}_${downloadData.dátum}.${type}`;
    this.download?.nativeElement.click();
  }

  createCsv(data: Object) {
    let rows = [];

    const headers = Object.keys(data).map(
      (el) => el.charAt(0).toUpperCase() + el.slice(1)
    );
    rows.push(headers.slice(0, -1).join(';'));

    const values = Object.values(data).slice(0, -1).join(';');
    rows.push(values);
    rows.push('');

    const members = Object.values(data).at(-1);
    const memberHeaders = Object.keys(members[0]).map(
      (el) => el.charAt(0).toUpperCase() + el.slice(1)
    );
    rows.push(memberHeaders.join(';'));

    Object.values(members).forEach((el) => {
      const memberValues = Object.values(el as Object).join(';');
      rows.push(memberValues);
    });
    return rows.join('\n');
  }
}
