import { ApiError } from '../exceptions';
import { dialogService, userService } from '../services';
import { isSearchType } from '../utils/helpers';

class SearchController {
  async search(req: Ex.Request, res: Ex.Response, next: Ex.NextFunction) {
    try {
      const user = req.user!;
      const { query, limit, page, type } = req.query;

      if (
        !isSearchType(type) ||
        (query && typeof query !== 'string') ||
        (limit && typeof limit !== 'string') ||
        (page && typeof page !== 'string')
      ) {
        throw ApiError.BadRequest('Unexpected query types');
      }

      let response;
      if (type === 'dialog') {
        response = await dialogService.search({ userId: user.id, search: { query, limit, page } });
      } else if (type === 'user') {
        response = await userService.search({ userId: user.id, search: { query, limit, page } });
      }
      return res.json(response);
    } catch (e) {
      next(e);
    }
  }
}

export const searchController = new SearchController();
