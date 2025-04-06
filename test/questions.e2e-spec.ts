import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initSettings } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { JwtService } from '@nestjs/jwt';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { PaginatedViewDto } from '../src/core/dto/base.paginated.view-dto';
import { JwtConfig } from '../src/features/user-accounts/config/jwt.config';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/features/user-accounts/constants/auth-tokens.inject-constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { QuestionsTestManager } from './helpers/questions-test-manager';
import { CreateQuestionDto } from '../src/features/quiz-game/questions/dto/create-question.dto';
import { QuestionViewDto } from '../src/features/quiz-game/questions/api/view-dto/questions.view-dto';

describe('questions', () => {
  let app: INestApplication;
  let questionsTestManager: QuestionsTestManager;

  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) => {
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (jwtConfig: JwtConfig) => {
            return new JwtService({
              secret: jwtConfig.jwtSecret,
              signOptions: { expiresIn: '2s' },
            });
          },
          inject: [JwtConfig],
        });
    });

    app = result.app;
    questionsTestManager = result.questionsTestManager;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
    jest
      .spyOn(ThrottlerGuard.prototype, 'canActivate')
      .mockImplementation(async (context: ExecutionContext) => true);
  });

  it('should create question', async () => {
    const body: CreateQuestionDto = {
      body: 'First Question?',
      correctAnswers: ['first', '1', 'one'],
    };

    const response = await questionsTestManager.createQuestion(body);

    expect(response).toEqual({
      id: expect.any(String),
      body: body.body,
      correctAnswers: body.correctAnswers,
      published: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('should get questions with paging', async () => {
    const questions = await questionsTestManager.createSeveralQuestions(9);
    const { body: responseBody } = (await request(app.getHttpServer())
      .get(
        `/${GLOBAL_PREFIX}/sa/quiz/questions?pageSize=5&pageNumber=2&sortDirection=asc&sortBy=body`,
      )
      .auth(
        questionsTestManager.authUsername,
        questionsTestManager.authPassword,
      )
      .expect(HttpStatus.OK)) as { body: PaginatedViewDto<QuestionViewDto> };

    expect(responseBody.totalCount).toBe(9);
    expect(responseBody.items).toHaveLength(4);
    expect(responseBody.pagesCount).toBe(2);
    //asc sorting
    expect(responseBody.items[3]).toEqual(questions[questions.length - 1]);
  });

  it('unauthorized user shouldn`t get/create/delete question', async () => {
    await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/sa/quiz/questions`)
      .expect(HttpStatus.UNAUTHORIZED);

    await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/sa/quiz/questions`)
      .expect(HttpStatus.UNAUTHORIZED);

    await request(app.getHttpServer())
      .delete(`/${GLOBAL_PREFIX}/sa/quiz/questions/1`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should delete a question', async () => {
    const question = await questionsTestManager.createQuestion();

    await request(app.getHttpServer())
      .delete(`/${GLOBAL_PREFIX}/sa/quiz/questions/${question.id}`)
      .auth(
        questionsTestManager.authUsername,
        questionsTestManager.authPassword,
      )
      .expect(HttpStatus.NO_CONTENT);
  });

  it('should update question', async () => {
    const newQuestionData = {
      body: 'New Question?',
      correctAnswers: ['new first', '1'],
    };

    const question = await questionsTestManager.createQuestion();

    await request(app.getHttpServer())
      .put(`/${GLOBAL_PREFIX}/sa/quiz/questions/${question.id}`)
      .send(newQuestionData)
      .auth(
        questionsTestManager.authUsername,
        questionsTestManager.authPassword,
      )
      .expect(HttpStatus.NO_CONTENT);
  });

  it('should update publish status', async () => {
    const question = await questionsTestManager.createQuestion();

    await request(app.getHttpServer())
      .put(`/${GLOBAL_PREFIX}/sa/quiz/questions/${question.id}/publish`)
      .send({ published: true })
      .auth(
        questionsTestManager.authUsername,
        questionsTestManager.authPassword,
      )
      .expect(HttpStatus.NO_CONTENT);
  });
});
