import { QuestionsSortBy } from './questions-sort-by';
import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetQuestionsQueryParams extends BaseSortablePaginationParams<QuestionsSortBy> {
  sortBy: QuestionsSortBy = QuestionsSortBy.CreatedAt;
  bodySearchTerm: string | null = null;
  publishedStatus: string = 'all';
}
