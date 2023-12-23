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

      if (type === 'dialog') {
        const dialogs = await dialogService.search({ query, limit, page }, user.id);
        return res.json(dialogs);
      }

      if (type === 'user') {
        const users = await userService.search({ query, limit, page }, user.id);
        return res.json(users);
      }
    } catch (e) {
      next(e);
    }
  }
}

export const searchController = new SearchController();
