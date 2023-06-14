import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NumberMask } from './numbermask.pipe';
import { CurrencyMask } from './currencymask.pipe';

const CORE_FUNCTIONS = [
  CurrencyMask,
  NumberMask
]

@NgModule({
  declarations: [...CORE_FUNCTIONS],
  exports: [...CORE_FUNCTIONS],
  imports: [
    CommonModule
  ]
})
export class CoreModule { }
