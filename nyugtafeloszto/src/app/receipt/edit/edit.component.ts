import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { Currency } from 'src/app/shared/models/Currency';
import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { CurrencyService } from 'src/app/shared/services/currency.service';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteActivatedEvent } from '@angular/material/autocomplete';
import { Receipt } from 'src/app/shared/models/Receipt';
import { Product } from 'src/app/shared/models/Product';
import { ReceiptService } from 'src/app/shared/services/receipt.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit, OnDestroy {
  @ViewChild('currencyInput') currencyInput!: ElementRef<HTMLInputElement>;
  @ViewChild('memberInput') memberInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('payerInput') payerInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  id?: string;
  uid?: string;
  receiptForm: FormGroup = new FormGroup({
    store: new FormControl(''),
    date: new FormControl(''),
    currency: new FormControl(''),
    members: this.formBuilder.array([]),
    products: this.formBuilder.array([]),
  });

  currencies?: Array<Currency>;
  filteredCurrencies?: Array<Currency>;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  membersAndGroups: Array<Member | Group> = [];
  filteredMembersAndGroups: Array<Member | Group> = [];
  fetchedMembers?: Array<Member>;
  filteredMembers?: Array<Member>;
  fetchedGroups?: Array<Group>;

  currencySubscription?: Subscription;
  memberSubscription?: Subscription;
  groupSubscription?: Subscription;
  receiptSubscription?: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private currencyService: CurrencyService,
    private memberService: MemberService,
    private groupService: GroupService,
    private receiptService: ReceiptService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    if (!user) {
      return;
    }
    this.uid = JSON.parse(user).uid;
    this.id = this.route.snapshot.params['id'];

    this.currencySubscription = this.currencyService
      .getAll()
      .subscribe((data) => {
        this.currencies = [...data];
        this.filteredCurrencies = [...data];
      });

    if (this.uid) {
      this.memberSubscription = this.memberService
        .getAllForOneUser(this.uid)
        .subscribe((data) => {
          if (this.uid) {
            this.groupSubscription = this.groupService
              .getAllForOneUser(this.uid)
              .subscribe((groupData) => {
                this.fetchedMembers = [...data];
                this.filteredMembers = [...data];
                this.fetchedGroups = [...groupData];
              });
          }
        });
    }

    if (this.id) {
      this.setExistingReceiptData();
    }
  }

  ngOnDestroy(): void {
    this.currencySubscription?.unsubscribe();
    this.memberSubscription?.unsubscribe();
    this.groupSubscription?.unsubscribe();
    this.receiptSubscription?.unsubscribe();
  }

  setExistingReceiptData(): void {
    if (!this.id || !this.uid) {
      return;
    }
    this.receiptSubscription = this.receiptService
      .getById(this.id, this.uid)
      .subscribe((data) => {
        this.receiptForm.controls['store'].setValue(data?.store);
        this.receiptForm.controls['date'].setValue(data?.date.toDate());
        if (data?.members) {
          const members = this.receiptForm.controls['members'] as FormArray;
          data.members.forEach((member) => {
            members.push(new FormControl(member));
          });
        }
        if (data?.currency && this.currencies) {
          const currency = this.currencies.find(
            (el) => el.id === (data.currency as unknown as string)
          );
          this.receiptForm.controls['currency'].setValue(currency);
        }

        const products = <FormArray>this.receiptForm.controls['products'];
        data?.products.forEach((product) => {
          products.push(
            this.formBuilder.group({
              name: new FormControl(product.name),
              piece: new FormControl(product.piece),
              price: new FormControl(product.price),
              pays: this.formBuilder.array(product.pays),
            })
          );
        });
        this.filterMembersAndGroups();
      });
  }

  filter(): void {
    const filterValue = this.currencyInput.nativeElement.value.toLowerCase();
    this.filteredCurrencies = this.currencies?.filter(
      (currency) =>
        currency.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        currency.symbol.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  trackOption(index: number, option: Currency) {
    return option.name;
  }

  displayCurrency(currency: Currency): string {
    if (!currency) {
      return '';
    }
    return `${currency.name} (${currency.symbol})`;
  }

  getProducts() {
    return (this.receiptForm.get('products') as FormArray).controls;
  }

  addProduct(): void {
    const products = this.receiptForm.get('products') as FormArray;
    products.push(
      this.formBuilder.group({
        name: new FormControl(''),
        piece: new FormControl(''),
        price: new FormControl(''),
        pays: this.formBuilder.array([]),
      })
    );
  }

  removeProduct(i: number): void {
    const products = this.receiptForm.get('products') as FormArray;
    products.removeAt(i);
  }

  getPayersFormArray(i: number): FormArray | null {
    const products = this.receiptForm.get('products') as FormArray;
    const product = products.at(i) as FormGroup;
    const productArray = product.get('pays') as FormArray;

    productArray.controls.forEach((control) => {
      if (typeof control.value === 'string' && this.fetchedMembers) {
        const member = this.fetchedMembers.find(
          (el) => el.id === control.value
        );
        control.setValue(member);
      }
    });

    return productArray;
  }

  addPayer(event: MatChipInputEvent, i: number): void {
    const value = (event.value || '').trim();

    if (value) {
      const selected = this.filteredMembersAndGroups.at(0);

      if (selected) {
        let control = new FormControl<Member | Group>(selected);
        this.getPayersFormArray(i)?.push(control);
        this.filteredMembersAndGroups = this.membersAndGroups;
      }
    }

    event.chipInput!.clear();
  }

  removePayer(i: number, j: number): void {
    const payers = this.getPayersFormArray(i);

    if (payers && j >= 0 && j < payers?.length) {
      payers.removeAt(j);
    }
  }

  selectedPayer(event: MatAutocompleteActivatedEvent, i: number): void {
    let control = new FormControl<Member | Group>(event.option?.value);
    this.getPayersFormArray(i)?.push(control);
    this.payerInputs.toArray()[i].nativeElement.value = '';
  }

  filterPayer(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();

    this.filteredMembersAndGroups = this.membersAndGroups.filter((el) =>
      el.name.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  trackPayer(index: number, option: Member | Group) {
    return option.name;
  }

  getMembersFormArray(): FormArray {
    const members = this.receiptForm.get('members') as FormArray;

    members.controls.forEach((control) => {
      if (typeof control.value === 'string' && this.fetchedMembers) {
        const member = this.fetchedMembers.find(
          (el) => el.id === control.value
        );
        control.setValue(member);
        this.filterMembersAndGroups();
      }
    });

    return members;
  }

  addMember(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      const selected = this.filteredMembers?.at(0);

      if (selected) {
        let control = new FormControl<Member>(selected);
        this.getMembersFormArray()?.push(control);
        this.filteredMembers = this.fetchedMembers;
      }
    }

    event.chipInput!.clear();
    this.filterMembersAndGroups();
  }

  removeMember(i: number): void {
    const members = this.getMembersFormArray();

    if (members && i >= 0 && i < members?.length) {
      members.removeAt(i);
    }
    this.filterMembersAndGroups();
  }

  selectedMember(event: MatAutocompleteActivatedEvent): void {
    let control = new FormControl<Member>(event.option?.value);
    this.getMembersFormArray()?.push(control);
    this.memberInput.nativeElement.value = '';
    this.filterMembersAndGroups();
  }

  filterMember(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();

    this.filteredMembers = this.fetchedMembers?.filter((el) =>
      el.name.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  filterMembersAndGroups(): void {
    let members: Set<string> = new Set();

    const memberArray = this.receiptForm.controls['members'] as FormArray;

    memberArray.controls.forEach((memberControl) => {
      members.add(memberControl.value.id);
    });

    if (members.size === 0) {
      this.membersAndGroups = [];
      this.filteredMembersAndGroups = this.membersAndGroups;
      return;
    }

    if (this.fetchedMembers && this.fetchedGroups) {
      this.membersAndGroups = [...this.fetchedMembers, ...this.fetchedGroups];
    }
    this.membersAndGroups = this.membersAndGroups.filter((el) => {
      if ('members' in el) {
        let hasMember = false;
        el.members.forEach((member) => {
          if (members.has(member)) {
            hasMember = true;
          }
        });
        return hasMember;
      }
      if (el.id) {
        return members.has(el.id);
      }
      return false;
    });

    this.membersAndGroups.unshift({
      id: '1',
      user: this.uid || '',
      name: 'Mindenki',
      members: Array.from(members),
    });

    this.filteredMembersAndGroups = this.membersAndGroups;
  }

  onSubmit() {
    const user = localStorage.getItem('user');
    if (!user) {
      return;
    }
    const uid = JSON.parse(user).uid;

    let sum = 0;
    let products: Product[] = [];
    let members: Set<string> = new Set();

    const memberArray = this.receiptForm.controls['members'] as FormArray;

    memberArray.controls.forEach((memberControl) => {
      members.add(memberControl.value.id);
    });

    const productArray = this.receiptForm.controls['products'] as FormArray;

    productArray.controls.forEach((productControl) => {
      let productGroup = productControl as FormGroup;
      let pays: Set<string> = new Set();

      productGroup.controls['pays'].value.forEach((el: Member | Group) => {
        if (el.id) {
          if ('members' in el) {
            el.members.forEach((member) => {
              if (members.has(member)) {
                pays.add(member);
              }
            });
          } else {
            pays.add(el.id);
          }
        }
      });

      const product: Product = {
        name: productGroup.controls['name'].value,
        piece: productGroup.controls['piece'].value,
        price: productGroup.controls['price'].value,
        pays: Array.from(pays),
      };

      products.push(product);
      sum += product.price;
    });

    const receipt: Receipt = {
      user: uid,
      store: this.receiptForm.controls['store'].value,
      date: this.receiptForm.controls['date'].value,
      currency: this.receiptForm.controls['currency'].value.id,
      sum: sum,
      products: products,
      members: Array.from(members),
    };

    if (this.id) {
      receipt.id = this.id;
      this.receiptService.update(receipt);
    } else {
      this.id = this.receiptService.create(receipt);
    }
    this.router.navigateByUrl(`/receipt/${this.id}`);
  }
}
