export type Transaction = {
  id: string;
  amount: number;
  date: string;
  merchantName: string;
  description: string;
  notes: string;
  categoryId: string | null;
  tagIds: string[];
  userId: string;
  created: string;
  updated: string;
};

export type TransactionFilters = {
  q?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  tagIds?: string[];
  page?: number;
};

export type TransactionListResult = {
  items: Transaction[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export const TRANSACTIONS_PER_PAGE = 50;
