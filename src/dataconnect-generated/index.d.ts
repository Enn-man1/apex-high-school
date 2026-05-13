import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Assignment_Key {
  id: UUIDString;
  __typename?: 'Assignment_Key';
}

export interface Class_Key {
  id: UUIDString;
  __typename?: 'Class_Key';
}

export interface Course_Key {
  id: UUIDString;
  __typename?: 'Course_Key';
}

export interface Enrollment_Key {
  studentId: UUIDString;
  classId: UUIDString;
  __typename?: 'Enrollment_Key';
}

export interface GetUserClassesData {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    classes_via_Enrollment: ({
      name: string;
      semester: string;
      year: number;
      course: {
        name: string;
        code: string;
      };
    })[];
  };
}

export interface GetUserClassesVariables {
  userId: UUIDString;
}

export interface Grade_Key {
  studentId: UUIDString;
  assignmentId: UUIDString;
  __typename?: 'Grade_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface GetUserClassesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserClassesVariables): QueryRef<GetUserClassesData, GetUserClassesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserClassesVariables): QueryRef<GetUserClassesData, GetUserClassesVariables>;
  operationName: string;
}
export const getUserClassesRef: GetUserClassesRef;

export function getUserClasses(vars: GetUserClassesVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserClassesData, GetUserClassesVariables>;
export function getUserClasses(dc: DataConnect, vars: GetUserClassesVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserClassesData, GetUserClassesVariables>;

