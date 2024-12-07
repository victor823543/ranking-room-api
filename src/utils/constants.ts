export enum ErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NO_RESULT = 404,
  CONFLICT = 409,
  PRECONDITION_REQUIRED = 428,
  SERVER_ERROR = 500,
}

export enum SuccessCode {
  OK = 200,
  NO_CONTENT = 204,
  CREATED = 201,
}

export const defaultTierListNames: { name: string; points: number }[] = [
  { name: "S", points: 6 },
  { name: "A", points: 5 },
  { name: "B", points: 4 },
  { name: "C", points: 3 },
  { name: "D", points: 2 },
  { name: "E", points: 1 },
];
