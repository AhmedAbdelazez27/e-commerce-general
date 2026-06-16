export interface FndLookupSelect2Item {
  id: number;
  text: string;
  altText?: string | null;
  additional?: string | null;
  encId?: string | null;
}

export interface FndLookupSelect2Result {
  total: number;
  results: FndLookupSelect2Item[];
}
