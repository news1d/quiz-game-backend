import { HttpStatus, INestApplication } from '@nestjs/common';
import { GamePairViewDto } from '../../src/features/quiz-game/games/api/view-dto/game-pair.view-dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { GameStatus } from '../../src/features/quiz-game/games/enums/game-status';
import { AnswerViewDto } from '../../src/features/quiz-game/answers/api/view-dto/answer.view-dto';
import { MyStatisticViewDto } from '../../src/features/quiz-game/players/api/view-dto/my-statistic.view-dto';

export class GamesTestManager {
  constructor(private app: INestApplication) {}

  async connectUserToPair(
    accessToken: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<GamePairViewDto> {
    const { body: responseBody } = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/connection`)
      .auth(accessToken, { type: 'bearer' })
      .expect(statusCode);

    return responseBody;
  }

  async startGame(
    accessToken1: string,
    accessToken2: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<GamePairViewDto> {
    const pendingGamePair = await this.connectUserToPair(
      accessToken1,
      statusCode,
    );

    expect(pendingGamePair.status).toBe(GameStatus.PendingSecondPlayer);

    const activeGame = await this.connectUserToPair(accessToken2, statusCode);
    expect(activeGame.status).toBe(GameStatus.Active);

    expect(pendingGamePair.id).toBe(activeGame.id);

    return activeGame;
  }

  async sendAnswer(
    answer: string,
    accessToken: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<AnswerViewDto> {
    const { body: responseBody } = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current/answers`)
      .auth(accessToken, { type: 'bearer' })
      .send({ answer })
      .expect(statusCode);

    return responseBody;
  }

  async getUserScoreStatistic(
    accessToken: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<MyStatisticViewDto> {
    const { body: response } = (await request(this.app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/users/my-statistic`)
      .auth(accessToken, { type: 'bearer' })
      .expect(statusCode)) as { body: MyStatisticViewDto };

    return response;
  }
}
