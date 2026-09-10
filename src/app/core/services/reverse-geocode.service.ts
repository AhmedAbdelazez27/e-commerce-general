import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export type ResolvedAddressFields = {
  city: string;
  area: string;
  street: string;
  building: string;
  latitude: number;
  longitude: number;
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  suburb?: string;
  neighbourhood?: string;
  neighborhood?: string;
  city_district?: string;
  district?: string;
  quarter?: string;
  road?: string;
  pedestrian?: string;
  residential?: string;
  house_number?: string;
  house_name?: string;
  building?: string;
};

type NominatimResponse = {
  name?: string;
  address?: NominatimAddress;
};

type BigDataCloudResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  local?: string;
  neighbourhood?: string;
  street?: string;
  streetName?: string;
  streetNumber?: string;
  building?: string;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const BIG_DATA_CLOUD_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

@Injectable({ providedIn: 'root' })
export class ReverseGeocodeService {
  getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('unsupported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('denied'));
            return;
          }
          reject(new Error('failed'));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60_000,
        },
      );
    });
  }

  reverseGeocode(
    latitude: number,
    longitude: number,
    lang: string,
  ): Observable<ResolvedAddressFields> {
    return from(this.reverseGeocodeAsync(latitude, longitude, lang));
  }

  private async reverseGeocodeAsync(
    latitude: number,
    longitude: number,
    lang: string,
  ): Promise<ResolvedAddressFields> {
    try {
      return await this.fromNominatim(latitude, longitude, lang);
    } catch {
      return await this.fromBigDataCloud(latitude, longitude, lang);
    }
  }

  private async fromNominatim(
    latitude: number,
    longitude: number,
    lang: string,
  ): Promise<ResolvedAddressFields> {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', normalizeLang(lang));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('nominatim-failed');
    }

    const payload = (await response.json()) as NominatimResponse;
    const address = payload.address;
    if (!address) {
      throw new Error('nominatim-empty');
    }

    return {
      city: firstNonEmpty(
        address.city,
        address.town,
        address.village,
        address.municipality,
        address.county,
      ),
      area: firstNonEmpty(
        address.suburb,
        address.neighbourhood,
        address.neighborhood,
        address.city_district,
        address.district,
        address.quarter,
        address.county,
        address.state,
      ),
      street: firstNonEmpty(
        address.road,
        address.pedestrian,
        address.residential,
        payload.name,
      ),
      building: firstNonEmpty(address.house_number, address.house_name, address.building),
      latitude,
      longitude,
    };
  }

  private async fromBigDataCloud(
    latitude: number,
    longitude: number,
    lang: string,
  ): Promise<ResolvedAddressFields> {
    const url = new URL(BIG_DATA_CLOUD_URL);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('localityLanguage', normalizeLang(lang).split('-')[0] || 'en');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('bigdatacloud-failed');
    }

    const payload = (await response.json()) as BigDataCloudResponse;

    return {
      city: firstNonEmpty(payload.city, payload.locality, payload.principalSubdivision),
      area: firstNonEmpty(payload.locality, payload.neighbourhood, payload.local),
      street: firstNonEmpty(payload.streetName, payload.street),
      building: firstNonEmpty(payload.streetNumber, payload.building),
      latitude,
      longitude,
    };
  }
}

function normalizeLang(lang: string): string {
  const trimmed = lang.trim();
  return trimmed || 'en';
}

function firstNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}
