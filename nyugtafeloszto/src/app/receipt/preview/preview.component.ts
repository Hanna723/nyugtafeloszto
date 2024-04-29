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
import { PaidComponent } from '../paid/paid.component';

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
  paidSum: number = 0;
  symbol: string = '';
  paid: string = '';

  receiptSubscription?: Subscription;
  currencySubscription?: Subscription;
  memberSubscription?: Subscription;
  submitSubscription?: Subscription;
  dialogSubscription?: Subscription;

  constructor(
    private receiptService: ReceiptService,
    private memberService: MemberService,
    private currencyService: CurrencyService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');
    const id = this.route.snapshot.params['id'];

    if (this.user && id) {
      this.progressBar = true;
      this.columnsToDisplay.push('paid', 'edit');

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
                this.symbol = currency.symbol;
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

      this.currencySubscription = this.currencyService
        .getById(this.receipt?.currency as unknown as string)
        .subscribe((currency) => {
          if (currency && this.receipt) {
            this.receipt.currency = currency;
            this.symbol = currency.symbol;
          }
        });

      if (this.receipt.date) {
        let date = new Date(this.receipt.date as unknown as string);
        this.receipt.formattedDate = this.datePipe.transform(
          date,
          'yyyy. MM. dd.'
        );
      }

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
        }
        this.progressBar = false;
      });
    }, 900);
  }

  ngOnDestroy(): void {
    this.receiptSubscription?.unsubscribe();
    this.currencySubscription?.unsubscribe();
    this.memberSubscription?.unsubscribe();
    this.submitSubscription?.unsubscribe();
    this.dialogSubscription?.unsubscribe();
  }

  sortData(): void {
    this.tableData.sort = this.sort;
  }

  getMembersFromReceipt(): void {
    if (!this.user && this.receipt?.members) {
      this.receipt.members.forEach((memberData: string | Member) => {
        if (typeof memberData === 'string') {
          return;
        }

        if (memberData.name) {
          memberData.pays = Math.round(
            this.needToPay.get(memberData.name) || 0
          );
          this.members.push(memberData);
        }
      });

      this.paid = this.receipt.paid;
      return;
    }

    this.receipt?.members.forEach((memberData: string | Member) => {
      if (typeof memberData === 'string') {
        return;
      }
      if (this.user && memberData.id) {
        this.memberSubscription = this.memberService
          .getById(memberData.id, this.user)
          .subscribe((member) => {
            this.paidSum += memberData.paid || 0;

            if (member && member.id) {
              console.log(member);
              member.pays = Math.round(this.needToPay.get(member.id) || 0);
              member.paid = memberData.paid;
              this.members.push(member);
            } else if (!member && memberData.id) {
              member = {
                id: memberData.id,
                name: '*Törölt résztvevő*',
                pays: Math.round(this.needToPay.get(memberData.id) || 0),
                paid: memberData.paid,
              };

              this.members.push(member);
            }

            if (memberData.id === this.receipt?.paid && this.receipt) {
              this.paid = member?.name || '*Törölt résztvevő*';
            }
          });
      }
    });
  }

  calculatePrices(): void {
    this.receipt?.members.forEach((member: string | Member) => {
      if (typeof member === 'string') {
        this.needToPay.set(member, 0);
      } else if (member.id) {
        this.needToPay.set(member.id, 0);
      }
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

  deleteReceipt(): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      disableClose: true,
      data: {
        title: 'Figyelem! A nyugta véglegesen törlődik.',
        button: 'Mégsem',
        submitButton: 'Ok',
      },
    });

    this.submitSubscription = dialogRef.componentInstance.submitEvent.subscribe(
      () => {
        if (this.receipt?.id) {
          this.receiptService.delete(this.receipt.id);
          this.router.navigateByUrl('/receipt/list');
        }
      }
    );
  }

  editReceipt(): void {
    if (this.receipt?.id) {
      this.router.navigateByUrl(`/receipt/edit/${this.receipt.id}`);
    }
  }

  downloadReceipt(type: string): void {
    let members: Object[] = [];
    this.tableData.data.forEach((data) => {
      if (typeof data !== 'string') {
        members.push({
          név: data.name,
          fizet: data.pays,
          fizetett: data.paid,
        });
      }
    });

    let downloadData = {
      bolt: this.receipt?.store,
      dátum: this.receipt?.formattedDate,
      pénznem:
        typeof this.receipt?.currency === 'string'
          ? ''
          : this.receipt?.currency?.symbol,
      végösszeg: this.receipt?.sum,
      fizetett: this.receipt?.paid,
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

  createCsv(data: Object): string {
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

  payForMember(member: Member): void {
    if (!this.receipt) {
      return;
    }

    this.receipt?.members.forEach((receiptMember) => {
      if (
        typeof receiptMember !== 'string' &&
        receiptMember.id &&
        member.id === receiptMember.id
      ) {
        receiptMember.paid = Math.round(
          this.needToPay.get(receiptMember.id) || 0
        );
      }
    });

    const receipt = this.transformReceipt();

    if (!receipt) {
      return;
    }

    this.paidSum = 0;
    this.receiptService.update(receipt);
    this.members.forEach((tableMember) => {
      if (
        typeof tableMember !== 'string' &&
        tableMember.id &&
        member.id === tableMember.id
      ) {
        tableMember.paid = Math.round(this.needToPay.get(tableMember.id) || 0);
        this.paidSum += tableMember.paid;
      } else if (typeof tableMember !== 'string') {
        this.paidSum += tableMember.paid || 0;
      }
    });
  }

  transformReceipt(): Receipt | undefined {
    if (!this.receipt) {
      return;
    }

    let receipt = { ...this.receipt };
    if (typeof this.receipt.currency !== 'string') {
      receipt.currency = this.receipt.currency?.id;
    }

    delete receipt.formattedDate;

    receipt.members.forEach((member) => {
      if (typeof member !== 'string') {
        delete member.name;
        delete member.user;
        delete member.pays;
      }
    });

    return receipt;
  }

  openPaidDialog(): void {
    const dialogRef = this.dialog.open(PaidComponent, {
      disableClose: true,
      data: {
        members: this.members,
        symbol: this.symbol,
      },
    });

    this.dialogSubscription = dialogRef.componentInstance.submitEvent.subscribe(
      (members: Member[]) => {
        this.paidSum = 0;
        this.receipt?.members.forEach((receiptMember) => {
          if (typeof receiptMember !== 'string') {
            receiptMember.paid =
              members.find((el: Member) => el.id === receiptMember.id)?.paid ||
              0;

            this.paidSum += receiptMember.paid;
          }
        });
        const receipt = this.transformReceipt();

        if (!receipt) {
          return;
        }

        this.receiptService.update(receipt);
        this.members = members;
      }
    );
  }

  navigateToMemberPreview(member: Member): void {
    if (member.name !== '*Törölt résztvevő*' && this.user) {
      this.router.navigateByUrl(`/member/${member.id}`);
    }
  }
}
