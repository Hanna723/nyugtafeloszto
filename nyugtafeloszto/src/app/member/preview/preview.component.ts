import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { Product } from 'src/app/shared/models/Product';
import { Receipt } from 'src/app/shared/models/Receipt';
import { CurrencyService } from 'src/app/shared/services/currency.service';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { ReceiptService } from 'src/app/shared/services/receipt.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('groupTable') groupSort!: MatSort;
  @ViewChild('receiptTable') receiptSort!: MatSort;

  progressBar: boolean = false;
  user!: string;
  member?: Member;
  subscriptions: Subscription[] = [];

  groupTableData: MatTableDataSource<Group> = new MatTableDataSource();
  receiptTableData: MatTableDataSource<object> = new MatTableDataSource();
  groupColumnsToDisplay = ['name'];
  receiptColumnsToDisplay = ['for', 'pays', 'paidSum', 'edit'];

  constructor(
    private memberService: MemberService,
    private groupService: GroupService,
    private receiptService: ReceiptService,
    private currencyService: CurrencyService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    const id = this.route.snapshot.params['id'];

    if (user && id) {
      this.user = JSON.parse(user);
      this.progressBar = true;

      const memberSubscription = this.memberService
        .getById(id, this.user)
        .subscribe((data) => {
          if (!data) {
            this.router.navigateByUrl('/member/list');
          }
          this.member = data;
        });

      const groupSubscription = this.groupService
        .getByMember(this.user, id)
        .subscribe((data) => {
          this.groupTableData = new MatTableDataSource(data);
          this.groupTableData.sort = this.groupSort;
        });

      const receiptSubscription = this.receiptService
        .getAllForOneUser(this.user)
        .subscribe((data) => {
          this.receiptTableData.sort = this.receiptSort;

          data.forEach((el) => {
            this.addReceiptToTableData(el, id);
          });
        });

      this.subscriptions.push(
        memberSubscription,
        groupSubscription,
        receiptSubscription
      );
    }
  }

  addReceiptToTableData(receipt: Receipt, id: string) {
    const currencySubscription = this.currencyService
      .getById(receipt.currency as unknown as string)
      .subscribe((currency) => {
        const memberSubscription = this.memberService
          .getById(receipt.paid, this.user)
          .subscribe((member) => {
            let formattedDate: string | null = '';
            let paid = 0;
            let inReceipt = false;

            receipt.members.forEach((member) => {
              if (typeof member === 'object' && member.id === id) {
                paid = member.paid || 0;
                inReceipt = true;
              }
            });

            if (!inReceipt) {
              return;
            }

            if (receipt.date) {
              let date = receipt.date.toDate();
              formattedDate = this.datePipe.transform(date, 'yyyy. MM. dd.');
            }

            const tableRow = {
              id: receipt.id,
              currency: receipt.currency,
              date: receipt.date,
              formattedDate: formattedDate,
              store: receipt.store,
              user: this.user,
              products: receipt.products,
              sum: receipt.sum,
              paid: member?.name || '*Törölt résztvevő*',
              members: receipt.members,
              symbol: currency?.symbol,
              pays: this.calculatePrices(receipt.products, id),
              paidSum: paid,
            };

            this.receiptTableData.data.push(tableRow);
          });
        this.subscriptions.push(memberSubscription);
      });
    this.subscriptions.push(currencySubscription);
  }

  calculatePrices(products: Product[], id: string) {
    let needToPay = 0;

    products.forEach((product) => {
      if (product.pays.includes(id)) {
        needToPay += product.price / product.pays.length;
      }
    });

    return needToPay;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      setTimeout(() => {
        if (this.groupSort) {
          this.groupSort.sort({
            id: 'name',
            start: 'asc',
            disableClear: false,
          });
        }
        if (this.receiptSort) {
          this.receiptSort.sort({
            id: 'date',
            start: 'desc',
            disableClear: false,
          });
        }
        this.progressBar = false;
      });
    }, 900);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  deleteMember() {
    const deleteDialogRef = this.dialog.open(DialogComponent, {
      disableClose: true,
      data: {
        title: 'Figyelem! A résztvevő véglegesen törlődik.',
        button: 'Mégsem',
        submitButton: 'Ok',
      },
    });

    const deleteDialogSubscription =
      deleteDialogRef.componentInstance.submitEvent.subscribe(() => {
        if (!this.member?.id) {
          return;
        }

        this.progressBar = true;
        this.memberService.delete(this.member.id);

        this.groupService
          .getByMember(this.user, this.member.id)
          .subscribe((data) => {
            data.forEach((group) => {
              group.members = group.members.filter(
                (el) => el !== this.member?.id
              );
              this.groupService.update(group);
            });
          });

        this.progressBar = false;
        this.router.navigateByUrl('member/list');
      });

    this.subscriptions.push(deleteDialogSubscription);
  }

  payReceipt(receipt: any) {
    receipt.members.forEach((receiptMember: Member) => {
      if (receiptMember.id === this.member?.id) {
        receiptMember.paid = receipt.pays;
      }
    });

    this.receiptService.update(this.transformReceipt(receipt));

    this.receiptTableData.data.forEach((row) => {
      if ('id' in row && row.id === receipt.id && 'paidSum' in row) {
        row.paidSum = receipt.pays;
      }
    });
  }

  transformReceipt(tableRow: any): Receipt {
    let receipt: Receipt = {
      id: tableRow.id,
      currency: tableRow.currency,
      date: tableRow.date,
      store: tableRow.store,
      user: tableRow.user,
      products: tableRow.products,
      sum: tableRow.sum,
      members: tableRow.members,
      paid: tableRow.paid,
    };

    return receipt;
  }

  sortGroupData() {
    this.groupTableData.sort = this.groupSort;
  }

  sortReceiptData() {
    this.receiptTableData.sort = this.receiptSort;
  }

  navigateToGroupPreview(group: Group) {
    this.router.navigateByUrl(`group/${group.id}`);
  }

  navigateToReceiptPreview(receipt: Receipt) {
    this.router.navigateByUrl(`receipt/${receipt.id}`);
  }
}
