import {
  PaginationParams,
  SortDirection,
} from '../../../../../core/dto/base.query-params.input-dto';
import { UsersTopSortBy } from './users-top-sort-by';
import { Transform } from 'class-transformer';

export type UserTopSortItem = {
  field: UsersTopSortBy;
  direction: SortDirection;
};

export class GetUsersTopQueryParams extends PaginationParams {
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  sort?: string[];

  get sortItems(): UserTopSortItem[] {
    if (!this.sort || this.sort.length === 0) {
      return [
        { field: UsersTopSortBy.avgScores, direction: SortDirection.Desc },
        { field: UsersTopSortBy.sumScore, direction: SortDirection.Desc },
      ];
    }

    return this.sort
      .map((item) => {
        const [fieldRaw, directionRaw] = item.trim().split(/\s+/);
        const field = fieldRaw as UsersTopSortBy;
        const direction =
          directionRaw?.toLowerCase() === SortDirection.Asc
            ? SortDirection.Asc
            : SortDirection.Desc;

        return { field, direction };
      })
      .filter((item): item is UserTopSortItem =>
        Object.values(UsersTopSortBy).includes(item.field),
      );
  }
}
