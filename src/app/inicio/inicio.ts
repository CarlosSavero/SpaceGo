import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {
  readonly auth = inject(AuthService);

  faqAbierta: number | null = null;

  alternarFaq(indice: number): void {
    this.faqAbierta =
      this.faqAbierta === indice ? null : indice;
  }
}