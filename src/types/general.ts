// Indefinitus - Possibly undefined
export type Indef<T> = T | undefined;

// Expolitus - Refined object
export type Politus<T> = Omit<T, "_id"> & {
  id: string;
};
