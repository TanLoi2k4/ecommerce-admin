export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  virtualTryOn: boolean;
}

export interface CategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  active?: boolean;
  virtualTryOn?: boolean;
}

export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  active: boolean;
  virtualTryOn: boolean;
}
