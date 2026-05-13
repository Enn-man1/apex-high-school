import { GetUserClassesData, GetUserClassesVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetUserClasses(vars: GetUserClassesVariables, options?: useDataConnectQueryOptions<GetUserClassesData>): UseDataConnectQueryResult<GetUserClassesData, GetUserClassesVariables>;
export function useGetUserClasses(dc: DataConnect, vars: GetUserClassesVariables, options?: useDataConnectQueryOptions<GetUserClassesData>): UseDataConnectQueryResult<GetUserClassesData, GetUserClassesVariables>;
