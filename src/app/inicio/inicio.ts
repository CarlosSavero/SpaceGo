import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {

  faqAbierta: number | null = null;

  alternarFaq(indice: number): void {
    this.faqAbierta =
      this.faqAbierta === indice ? null : indice;
  }
}