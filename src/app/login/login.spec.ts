import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the login form by default', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.tab-btn');
    const forms = fixture.nativeElement.querySelectorAll('.auth-form');

    expect(tabs[0].classList).toContain('active');
    expect(tabs[1].classList).not.toContain('active');
    expect(forms[0].classList).toContain('active');
    expect(forms[1].classList).not.toContain('active');
  });

  it('switches to the registration form when its tab is selected', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.tab-btn');
    const forms = fixture.nativeElement.querySelectorAll('.auth-form');

    tabs[1].click();
    fixture.detectChanges();

    expect(tabs[0].classList).not.toContain('active');
    expect(tabs[1].classList).toContain('active');
    expect(forms[0].classList).not.toContain('active');
    expect(forms[1].classList).toContain('active');
  });
});
