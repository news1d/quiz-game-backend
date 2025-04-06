import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { QuestionViewDto } from '../../api/view-dto/questions.view-dto';
import { Question } from '../../domain/question.entity';
import { GetQuestionsQueryParams } from '../../api/input-dto/get-questions-query-params.input-dto';
import { PublishedStatus } from '../../enums/published-status';
import { DeletionStatus } from '../../../../../core/dto/deletion-status';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

@Injectable()
export class QuestionsQueryRepository {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async getAllQuestions(
    query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    const totalFilter: FindOptionsWhere<Question> = {
      deletionStatus: DeletionStatus.NotDeleted,
    };

    if (query.bodySearchTerm) {
      totalFilter.body = ILike(`%${query.bodySearchTerm}%`);
    }

    if (query.publishedStatus !== 'all') {
      totalFilter.publishedStatus =
        query.publishedStatus === PublishedStatus.Published
          ? PublishedStatus.Published
          : PublishedStatus.NotPublished;
    }

    const [questions, totalCount] = await this.questionsRepository.findAndCount(
      {
        where: totalFilter,
        order: { [query.sortBy]: query.sortDirection },
        skip: query.calculateSkip(),
        take: query.pageSize,
      },
    );

    const items = questions.map(QuestionViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getQuestionByIdOrNotFoundFail(id: string): Promise<QuestionViewDto> {
    const question = await this.questionsRepository.findOneBy({
      id: +id,
      deletionStatus: DeletionStatus.NotDeleted,
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return QuestionViewDto.mapToView(question);
  }
}
