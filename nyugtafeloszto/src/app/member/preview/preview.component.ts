import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Member } from 'src/app/shared/models/Member';
import { Receipt } from 'src/app/shared/models/Receipt';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { ReceiptService } from 'src/app/shared/services/receipt.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  progressBar: boolean = false;
  user!: string;
  member?: Member;
  receipts: Array<Receipt> = [];
  subscriptions: Subscription[] = [];

  constructor(
    private memberService: MemberService,
    private groupService: GroupService,
    private receiptService: ReceiptService,
    private route: ActivatedRoute,
    private router: Router
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
          console.log(data);
        });

      const receiptSubscription = this.receiptService
        .getAllForOneUser(this.user)
        .subscribe((data) => {
          console.log(data);
        });

      this.subscriptions.push(memberSubscription, receiptSubscription);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      setTimeout(() => {
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
    if (!this.member?.id) {
      return;
    }

    this.memberService.delete(this.member.id);

    this.groupService
      .getByMember(this.user, this.member.id)
      .subscribe((data) => {
        data.forEach((group) => {
          group.members = group.members.filter((el) => el !== this.member?.id);
          this.groupService.update(group);
        });
      });
  }
}
