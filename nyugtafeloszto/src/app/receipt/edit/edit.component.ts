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
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteActivatedEvent } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Currency } from 'src/app/shared/models/Currency';
import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { CurrencyService } from 'src/app/shared/services/currency.service';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { Receipt } from 'src/app/shared/models/Receipt';
import { Product } from 'src/app/shared/models/Product';
import { ReceiptService } from 'src/app/shared/services/receipt.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('currencyInput') currencyInput!: ElementRef<HTMLInputElement>;
  @ViewChild('memberInput') memberInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('payerInput') payerInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  progressBar: boolean = false;
  id?: string;
  uid?: string;
  paid: Map<string, number> = new Map();
  receiptForm: FormGroup = new FormGroup({
    store: new FormControl('', [Validators.maxLength(100)]),
    date: new FormControl(''),
    currency: new FormControl('', [Validators.required]),
    paid: new FormControl('', [Validators.required, this.noMemberValidator()]),
    members: this.formBuilder.array([], [Validators.required]),
    products: this.formBuilder.array([]),
  });

  currencies?: Array<Currency>;
  filteredCurrencies?: Array<Currency>;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  membersAndGroups: Array<Member | Group> = [];
  filteredMembersAndGroups: Array<Member | Group> = [];
  filteredMembersWithoutUser: Array<string> = [];
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
    this.currencySubscription = this.currencyService
      .getAll()
      .subscribe((data) => {
        this.currencies = [...data];
        this.filteredCurrencies = [...data];
      });

    const user = localStorage.getItem('user');
    if (!user) {
      return;
    }
    this.uid = JSON.parse(user);
    this.id = this.route.snapshot.params['id'];
    let url = this.router.url;

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
      this.progressBar = true;
      this.setExistingReceiptData();
    }

    if (url === '/receipt/upload') {
      this.progressBar = true;
      this.setUploadedReceiptData();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.progressBar = false;
    }, 1000);
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

        if (data?.date) {
          this.receiptForm.controls['date'].setValue(data.date.toDate());
        }

        if (data?.members) {
          const members = this.receiptForm.controls['members'] as FormArray;
          data.members.forEach((member: any) => {
            members.push(new FormControl(member.id));

            this.paid?.set(member.id, member.paid);
          });
        }

        this.receiptForm.controls['paid'].setValue(data?.paid);

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
              name: new FormControl(product.name, [Validators.maxLength(100)]),
              piece: new FormControl(product.piece, [
                Validators.min(1),
                Validators.pattern('^[0-9]*$'),
              ]),
              price: new FormControl(product.price, []),
              pays: this.formBuilder.array(product.pays),
            })
          );
        });
        this.filterMembersAndGroups();
      });
  }

  setUploadedReceiptData() {
    let receipt = localStorage.getItem('receipt');
    localStorage.removeItem('receipt');
    if (receipt) {
      const data: Receipt = JSON.parse(receipt);

      this.receiptForm.controls['store'].setValue(data.store);
      if (data.date) {
        this.receiptForm.controls['date'].setValue(
          new Date(data.date.seconds * 1000)
        );
      }
      if (data.currency) {
        this.receiptForm.controls['currency'].setValue(data.currency);
      }

      const products = <FormArray>this.receiptForm.controls['products'];
      data.products.forEach((product) => {
        products.push(
          this.formBuilder.group({
            name: new FormControl(product.name, [Validators.maxLength(100)]),
            piece: new FormControl(product.piece, [
              Validators.min(1),
              Validators.pattern('^[0-9]*$'),
            ]),
            price: new FormControl(product.price, []),
            pays: this.formBuilder.array(product.pays),
          })
        );
      });
      this.filterMembersAndGroups();
    }
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

  getProductAt(i: number) {
    return (this.receiptForm.get('products') as FormArray).controls.at(
      i
    ) as FormGroup;
  }

  addProduct(): void {
    const products = this.receiptForm.get('products') as FormArray;
    products.push(
      this.formBuilder.group({
        name: new FormControl('', [Validators.maxLength(100)]),
        piece: new FormControl('', [
          Validators.min(1),
          Validators.pattern('^[0-9]*$'),
        ]),
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

    if (!this.uid) {
      return productArray;
    }

    productArray.controls.forEach((control) => {
      if (typeof control.value === 'string' && this.fetchedMembers) {
        let member = this.fetchedMembers.find((el) => el.id === control.value);
        if (!member && this.uid) {
          member = {
            id: control.value,
            user: this.uid,
            name: '*Törölt résztvevő*',
          };
        }
        control.setValue(member);
      }
    });

    return productArray;
  }

  addPayer(event: MatChipInputEvent, i: number): void {
    const value = (event.value || '').trim();

    if (value) {
      let selected;

      if (!this.uid) {
        selected = this.filteredMembersWithoutUser.at(0);

        if (selected) {
          let control = new FormControl<string>(selected);
          this.getPayersFormArray(i)?.push(control);
          this.filteredMembersWithoutUser = this.getMembersFormArray().value;
        }
      } else {
        selected = this.filteredMembersAndGroups.at(0);

        if (selected) {
          let control = new FormControl<Member | Group>(selected);
          this.getPayersFormArray(i)?.push(control);
          this.filteredMembersAndGroups = this.membersAndGroups;
        }
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
    let control;

    if (!this.uid) {
      control = new FormControl<string>(event.option?.value);
    } else {
      control = new FormControl<Member | Group>(event.option?.value);
    }

    this.getPayersFormArray(i)?.push(control);
    this.payerInputs.toArray()[i].nativeElement.value = '';
  }

  filterPayer(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();

    if (!this.uid) {
      this.filteredMembersWithoutUser = this.getMembersFormArray().value.filter(
        (el: string) => el.toLowerCase().includes(filterValue.toLowerCase())
      );
    } else {
      this.filteredMembersAndGroups = this.membersAndGroups.filter((el) =>
        el.name?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
  }

  trackPayer(index: number, option: Member | Group) {
    if (!this.uid) {
      return option;
    }
    return option.name;
  }

  trackPayerWithoutUser(index: number, option: string) {
    return option;
  }

  noMemberValidator(): ValidatorFn {
    return (): ValidationErrors | null => {
      if (!this.receiptForm) {
        return null;
      }

      return this.receiptForm.controls['members'].value.length === 0
        ? { 'no-members': true }
        : null;
    };
  }

  getMembersFormArray(): FormArray {
    const members = this.receiptForm.get('members') as FormArray;

    if (!this.uid) {
      return members;
    }

    members.controls.forEach((control) => {
      if (typeof control.value === 'string' && this.fetchedMembers) {
        let member = this.fetchedMembers.find((el) => el.id === control.value);
        if (!member && this.uid) {
          member = {
            id: control.value,
            user: this.uid,
            name: '*Törölt résztvevő*',
          };
        }
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

        if (
          this.receiptForm.controls['paid'].errors &&
          this.receiptForm.controls['paid'].hasError('no-members')
        ) {
          delete this.receiptForm.controls['paid'].errors['no-members'];
          this.receiptForm.controls['paid'].updateValueAndValidity();
        }
      }
    }

    event.chipInput!.clear();
    this.filterMembersAndGroups();
  }

  removeMember(i: number): void {
    const members = this.getMembersFormArray();
    let removedMember: string;

    if (members && i >= 0 && i < members?.length) {
      removedMember = this.uid ? members.at(i).value.id : members.at(i).value;
      members.removeAt(i);
    }

    if (this.uid) {
      this.filterMembersAndGroups();
    }

    const products = this.receiptForm.get('products') as FormArray;
    products.controls.forEach((productControl) => {
      const product = productControl as FormGroup;
      const pays = product.get('pays') as FormArray;

      let controlsToDelete = [];

      for (let i = 0; i < pays.controls.length; i++) {
        if (this.uid && pays.controls.at(i)?.value.id === removedMember) {
          controlsToDelete.push(i);
        } else if (!this.uid && pays.controls.at(i)?.value === removedMember) {
          controlsToDelete.push(i - controlsToDelete.length);
        }
      }

      controlsToDelete.forEach((i) => {
        pays.removeAt(i);
      });
    });
  }

  selectedMember(event: MatAutocompleteActivatedEvent): void {
    let control = new FormControl<Member>(event.option?.value);
    this.getMembersFormArray()?.push(control);
    this.memberInput.nativeElement.value = '';
    this.filterMembersAndGroups();

    if (
      this.receiptForm.controls['paid'].errors &&
      this.receiptForm.controls['paid'].hasError('no-members')
    ) {
      delete this.receiptForm.controls['paid'].errors['no-members'];
    }
  }

  memberFocusOut() {
    this.receiptForm.controls['members'].setErrors({
      ...(this.receiptForm.controls['members'].errors || {}),
      touched: true,
    });
  }

  filterMember(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();

    this.filteredMembers = this.fetchedMembers?.filter((el) =>
      el.name?.toLowerCase().includes(filterValue.toLowerCase())
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

  addMemberWithoutUser(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      let control = new FormControl<string>(value);
      this.getMembersFormArray()?.push(control);
    }

    event.chipInput!.clear();
  }

  onSubmit() {
    let sum = 0;
    let products: Product[] = [];
    let members: Set<string> = new Set();

    const memberArray = this.receiptForm.controls['members'] as FormArray;

    memberArray.controls.forEach((memberControl) => {
      if (!this.uid) {
        members.add(memberControl.value);
      } else {
        members.add(memberControl.value.id);
      }
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
        } else {
          pays.add(el as unknown as string);
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

    const memberIds = Array.from(members);
    let receiptMembers: Member[] = [];

    memberIds.forEach((id) => {
      receiptMembers.push({
        id: id,
        name: this.uid ? '' : id,
        paid: this.paid?.get(id) || 0,
        user: this.uid || '',
      });
    });

    const receipt: Receipt = {
      user: this.uid || '',
      store: this.receiptForm.controls['store'].value,
      date: this.receiptForm.controls['date'].value || null,
      currency: this.receiptForm.controls['currency'].value.id,
      sum: sum,
      paid: this.receiptForm.controls['paid'].value,
      products: products,
      members: receiptMembers,
    };

    if (!this.uid) {
      localStorage.setItem('receipt', JSON.stringify(receipt));
      this.router.navigateByUrl(`/receipt/guest`);
      return;
    }

    if (this.id) {
      receipt.id = this.id;
      this.receiptService.update(receipt);
    } else {
      this.id = this.receiptService.create(receipt);
    }
    this.router.navigateByUrl(`/receipt/${this.id}`);
  }
}
