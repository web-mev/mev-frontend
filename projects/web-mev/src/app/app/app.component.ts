import browser from 'browser-detect';
import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { BnNgIdleService } from 'bn-ng-idle';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { User } from '@app/_models/user';
import { MatDialog } from '@angular/material/dialog';
import { ContactComponent } from '@app/features/contact-dialog/contact.component';
import { environment as env } from '../../environments/environment';

import {
  routeAnimations,
  LocalStorageService,
  selectIsAuthenticated,
  selectSettingsStickyHeader,
  selectSettingsLanguage,
  selectEffectiveTheme
} from '../core/core.module';
import {
  actionSettingsChangeAnimationsPageDisabled,
  actionSettingsChangeLanguage
} from '../core/settings/settings.actions';

@Component({
  selector: 'mev-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimations]
})
export class AppComponent implements OnInit {
  currentUser: User;
  socialUser;
  isAuthenticated: boolean;
  isProd = env.production;
  envName = env.envName;
  version = env.versions.app;
  year = new Date().getFullYear();
  logo = new URL('../../assets/logo.png', import.meta.url)
  languages = ['en'];
  sessionTimeout = 60 * 15; // 15 minutes
  navigation = [
    { link: 'about', label: 'mev.menu.main' },
    { link: 'tutorial', label: 'mev.menu.tutorial' },
    { link: 'workarea', label: 'Get Started' }
  ];
  navigationSideMenu = [
    ...this.navigation,
    { link: 'settings', label: 'mev.menu.settings' }
  ];

  isAuthenticated$: Observable<boolean>;
  stickyHeader$: Observable<boolean>;
  language$: Observable<string>;
  theme$: Observable<string>;
  private sessionSubscription$: Subscription;

  constructor(
    private store: Store,
    private storageService: LocalStorageService,
    private router: Router,
    private bnIdle: BnNgIdleService,
    private authenticationService: AuthenticationService,
    public dialog: MatDialog
  ) {
    this.authenticationService.currentUser.subscribe(x => {
      this.isAuthenticated = x !== null;
      this.currentUser = x;
    });
  }

  private static isIEorEdgeOrSafari() {
    return ['ie', 'edge', 'safari'].includes(browser().name);
  }

  onLogoutClick() {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    console.log("nav side menu: ", this.navigationSideMenu)
    this.socialUser = JSON.parse(localStorage.getItem('socialUser'));

    // listen for the user’s idleness
    this.sessionSubscription$ = this.bnIdle
      .startWatching(this.sessionTimeout)
      .subscribe((isTimedOut: boolean) => {
        if (isTimedOut) {
          this.onLogoutClick();
        }
      });

    this.storageService.testLocalStorage();
    if (AppComponent.isIEorEdgeOrSafari()) {
      this.store.dispatch(
        actionSettingsChangeAnimationsPageDisabled({
          pageAnimationsDisabled: true
        })
      );
    }

    this.isAuthenticated$ = this.store.pipe(select(selectIsAuthenticated));
    this.stickyHeader$ = this.store.pipe(select(selectSettingsStickyHeader));
    this.language$ = this.store.pipe(select(selectSettingsLanguage));
    this.theme$ = this.store.pipe(select(selectEffectiveTheme));
  }

  ngOnDestroy(): void {
    if (this.sessionSubscription$) {
      this.sessionSubscription$.unsubscribe();
    }
  }

  onLanguageSelect({ value: language }) {
    this.store.dispatch(actionSettingsChangeLanguage({ language }));
  }

  openDialog() {
    const dialogRef = this.dialog.open(ContactComponent, { width: '600px', autoFocus: false });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}