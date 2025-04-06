import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBasicAuth, ApiParam } from '@nestjs/swagger';
import { CreateQuestionInputDto } from './input-dto/questions.input-dto';
import { QuestionViewDto } from './view-dto/questions.view-dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/usecases/create-question.usecase';
import { QuestionsQueryRepository } from '../infrastructure/query/questions.query-repository';
import { GetQuestionsQueryParams } from './input-dto/get-questions-query-params.input-dto';
import { DeleteQuestionCommand } from '../application/usecases/delete-question.usecase';
import { UpdateQuestionCommand } from '../application/usecases/update-question.usecase';
import { PublishStatusInputDto } from './input-dto/publish-status.input-dto';
import { UpdatePublishStatusCommand } from '../application/usecases/update-publish-status.usecase';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

@ApiBasicAuth('basicAuth')
@UseGuards(BasicAuthGuard)
@Controller('/sa/quiz/questions')
export class QuizSAController {
  constructor(
    private commandBus: CommandBus,
    private questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  @Get()
  async getAllQuestions(
    @Query() query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    return this.questionsQueryRepository.getAllQuestions(query);
  }

  @Post()
  async createQuestion(
    @Body() body: CreateQuestionInputDto,
  ): Promise<QuestionViewDto> {
    const questionId = await this.commandBus.execute(
      new CreateQuestionCommand(body),
    );

    return this.questionsQueryRepository.getQuestionByIdOrNotFoundFail(
      questionId,
    );
  }

  @ApiParam({ name: 'id' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteQuestionCommand(id));
  }

  @ApiParam({ name: 'id' })
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestion(
    @Param('id') id: string,
    @Body() body: CreateQuestionInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateQuestionCommand(id, body));
  }

  @ApiParam({ name: 'id' })
  @Put(':id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePublishStatus(
    @Param('id') id: string,
    @Body() body: PublishStatusInputDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdatePublishStatusCommand(id, body.published),
    );
  }
}
