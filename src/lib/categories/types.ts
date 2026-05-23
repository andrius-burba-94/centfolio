export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  created: string;
  updated: string;
};

export type CategoryWithDisplay = Category & {
  displayName: string;
};
