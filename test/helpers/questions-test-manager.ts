import { HttpStatus, INestApplication } from '@nestjs/common';
import { AuthConfig } from '../../src/features/user-accounts/config/auth.config';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { CreateQuestionDto } from '../../src/features/quiz-game/questions/dto/create-question.dto';
import { CreateQuestionInputDto } from '../../src/features/quiz-game/questions/api/input-dto/questions.input-dto';
import { QuestionViewDto } from '../../src/features/quiz-game/questions/api/view-dto/questions.view-dto';

export class QuestionsTestManager {
  constructor(
    private app: INestApplication,
    private authConfig: AuthConfig,
  ) {}

  authUsername = this.authConfig.authUsername;
  authPassword = this.authConfig.authPassword;

  questionData: CreateQuestionDto = {
    body: 'How old are you?',
    correctAnswers: ['ten', '10'],
  };

  async createQuestion(
    createModel: CreateQuestionInputDto = this.questionData,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<QuestionViewDto> {
    const { body: question } = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/sa/quiz/questions`)
      .send(createModel)
      .auth(this.authUsername, this.authPassword)
      .expect(statusCode);

    return question;
  }

  async createSeveralQuestions(count: number): Promise<QuestionViewDto[]> {
    const questionsPromises = [] as Promise<QuestionViewDto>[];
    for (let i = 0; i < count; i++) {
      const question = this.createQuestion({
        body: 'Question ' + i,
        correctAnswers: ['correctAnswer', i.toString()],
      });
      questionsPromises.push(question);
    }
    return Promise.all(questionsPromises);
  }

  async createSeveralPublishedQuestions(
    count: number,
  ): Promise<QuestionViewDto[]> {
    const questions = await this.createSeveralQuestions(count);

    const publishPromises = questions.map((q) =>
      request(this.app.getHttpServer())
        .put(`/${GLOBAL_PREFIX}/sa/quiz/questions/${q.id}/publish`)
        .send({ published: true })
        .auth(this.authUsername, this.authPassword)
        .expect(HttpStatus.NO_CONTENT),
    );

    await Promise.all(publishPromises);

    return questions;
  }
}
