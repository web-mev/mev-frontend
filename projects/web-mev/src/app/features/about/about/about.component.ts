import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { ROUTE_ANIMATIONS_ELEMENTS } from '../../../core/core.module';
import { Router, NavigationEnd } from '@angular/router';

//Used to load Google Client Library
import { SocialAuthService } from 'angularx-social-login';

/**
 * About component
 * Used for the start WebMEV page
 */
@Component({
  selector: 'mev-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;
  private twitter: any;
  showResult = true;

  constructor(
    private _router: Router,
    private socialAuthService: SocialAuthService,
  ) { }

  /**
   * Initialize twitter widget
   */
  ngOnInit() {
    this.initTwitterWidget();
  }

  /**
   * Initialize twitter widget
   */
  initTwitterWidget() {
    this.twitter = this._router.events.subscribe(val => {
      if (val instanceof NavigationEnd) {
        (<any>window).twttr = (function (d, s, id) {
          let js: any,
            fjs = d.getElementsByTagName(s)[0],
            t = (<any>window).twttr || {};
          if (d.getElementById(id)) return t;
          js = d.createElement(s);
          js.id = id;
          js.src = 'https://platform.twitter.com/widgets.js';
          fjs.parentNode.insertBefore(js, fjs);

          t._e = [];
          t.ready = function (f: any) {
            t._e.push(f);
          };

          return t;
        })(document, 'script', 'twitter-wjs');

        if ((<any>window).twttr.ready()) (<any>window).twttr.widgets.load();
      }
    });
  }
}
