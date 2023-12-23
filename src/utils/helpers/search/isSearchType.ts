import { SEARCH_TYPES } from '../../../utils/constants';

export const isSearchType = (searchType: unknown): searchType is SearchType =>
  !!SEARCH_TYPES.find((SEARCH_TYPE) => SEARCH_TYPE === searchType);
