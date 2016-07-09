import {Component, ViewEncapsulation} from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'md-menu',
  host: {
    '(click)': 'toggle()',
    '[class.show-menu]': 'visible'
  },
  templateUrl: 'menu.html',
  styleUrls: ['menu.css'],
  encapsulation: ViewEncapsulation.None
})
export class MdMenu {
  visible: boolean = false;
  toggle() {
    this.visible = !this.visible;
  }
}

@Component({
  moduleId: module.id,
  selector: 'md-menu-content',
  template: '<ng-content></ng-content>',
  styleUrls: ['menu.css'],
  encapsulation: ViewEncapsulation.None
})
export class MdMenuContent  {

}

export const MD_MENU_DIRECTIVES = [MdMenu,MdMenuContent];

