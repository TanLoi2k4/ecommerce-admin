import type { CategoryListItem, CategoryResponse } from '../../types/category';

export function toCategoryStatus(active: boolean): string {
  return active ? 'active' : 'inactive';
}

export function toCategoryListItem(category: CategoryResponse): CategoryListItem {
  return {
    id: String(category.id),
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    active: category.active,
    virtualTryOn: Boolean(category.virtualTryOn),
    status: toCategoryStatus(category.active),
  };
}
