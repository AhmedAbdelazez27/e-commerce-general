import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { UserProfile } from '../../features/auth/models/login.models';

const PROFILE_KEY = 'user_profile';

@Injectable({ providedIn: 'root' })
export class AuthProfileService {
  private readonly profileSubject = new BehaviorSubject<UserProfile | null>(this.readFromStorage());

  readonly profile$ = this.profileSubject.asObservable();

  get snapshot(): UserProfile | null {
    return this.profileSubject.value;
  }

  setProfile(profile: UserProfile | null): void {
    this.profileSubject.next(profile);
    if (profile) {
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } else {
      sessionStorage.removeItem(PROFILE_KEY);
    }
  }

  private readFromStorage(): UserProfile | null {
    try {
      const raw = sessionStorage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }
}
