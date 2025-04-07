import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';
import { GamesSortBy } from './games-sort-by';

export class GetGamesQueryParams extends BaseSortablePaginationParams<GamesSortBy> {
  sortBy: GamesSortBy = GamesSortBy.pairCreatedDate;
}
