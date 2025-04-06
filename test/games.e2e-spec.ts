import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { QuestionsTestManager } from './helpers/questions-test-manager';
import { UsersTestManager } from './helpers/users-test-manager';
import { initSettings } from './helpers/init-settings';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/features/user-accounts/constants/auth-tokens.inject-constants';
import { JwtConfig } from '../src/features/user-accounts/config/jwt.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { GameStatus } from '../src/features/quiz-game/games/enums/game-status';
import { GamesTestManager } from './helpers/games-test-manager';
import { AnswerStatus } from '../src/features/quiz-game/answers/enums/answer-status';

describe('games', () => {
  let app: INestApplication;
  let questionsTestManager: QuestionsTestManager;
  let usersTestManager: UsersTestManager;
  let gamesTestManager: GamesTestManager;

  jest.setTimeout(15000);

  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) => {
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (jwtConfig: JwtConfig) => {
            return new JwtService({
              secret: jwtConfig.jwtSecret,
              signOptions: { expiresIn: '15s' },
            });
          },
          inject: [JwtConfig],
        });
    });

    app = result.app;
    questionsTestManager = result.questionsTestManager;
    usersTestManager = result.usersTestManager;
    gamesTestManager = result.gamesTestManager;
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

  it('should create new pair', async () => {
    await usersTestManager.createUser();

    const { accessToken } = await usersTestManager.login(
      usersTestManager.userData.login,
      usersTestManager.userData.password,
    );

    const gamePair = await gamesTestManager.connectUserToPair(accessToken);

    expect(gamePair).toEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: usersTestManager.userData.login,
        },
        score: 0,
      },
      secondPlayerProgress: null,
      questions: null,
      status: GameStatus.PendingSecondPlayer,
      pairCreatedDate: expect.any(String),
      startGameDate: null,
      finishGameDate: null,
    });
  });

  it('should connect to pending pair', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(2);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    await gamesTestManager.connectUserToPair(accessTokens[0].accessToken);

    const gamePair = await gamesTestManager.connectUserToPair(
      accessTokens[1].accessToken,
    );

    expect(gamePair).toEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      questions: expect.arrayContaining([
        { id: expect.any(String), body: expect.any(String) },
      ]),
      status: GameStatus.Active,
      pairCreatedDate: expect.any(String),
      startGameDate: expect.any(String),
      finishGameDate: null,
    });
  });

  it('should return status 403 if user is already in the game', async () => {
    await usersTestManager.createUser();

    const { accessToken } = await usersTestManager.login(
      usersTestManager.userData.login,
      usersTestManager.userData.password,
    );

    await gamesTestManager.connectUserToPair(accessToken);
    await gamesTestManager.connectUserToPair(accessToken, HttpStatus.FORBIDDEN);
  });

  it('should return current game for user', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(3);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    await gamesTestManager.connectUserToPair(accessTokens[0].accessToken);

    const { body: pendingGame } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current`)
      .auth(accessTokens[0].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(pendingGame).toEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      secondPlayerProgress: null,
      questions: null,
      status: GameStatus.PendingSecondPlayer,
      pairCreatedDate: expect.any(String),
      startGameDate: null,
      finishGameDate: null,
    });

    const activeGame = await gamesTestManager.connectUserToPair(
      accessTokens[1].accessToken,
    );

    expect(activeGame).toEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      questions: expect.arrayContaining([
        { id: expect.any(String), body: expect.any(String) },
      ]),
      status: GameStatus.Active,
      pairCreatedDate: expect.any(String),
      startGameDate: expect.any(String),
      finishGameDate: null,
    });

    const { body: currentGameForFirstUser } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current`)
      .auth(accessTokens[0].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(currentGameForFirstUser).toEqual(activeGame);
  });

  it(`should return 404 status if the user doesn't have an active game`, async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(3);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current`)
      .auth(accessTokens[2].accessToken, { type: 'bearer' })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should return game by id', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(10);
    const users = await usersTestManager.createSeveralUsers(4);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    const game1 = await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    const game2 = await gamesTestManager.startGame(
      accessTokens[2].accessToken,
      accessTokens[3].accessToken,
    );

    expect(game1.id).not.toBe(game2.id);

    const { body: firstGame } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/${game1.id}`)
      .auth(accessTokens[0].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    const { body: secondGame } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/${game2.id}`)
      .auth(accessTokens[2].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(firstGame).toEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      questions: expect.arrayContaining([
        { id: expect.any(String), body: expect.any(String) },
      ]),
      status: GameStatus.Active,
      pairCreatedDate: expect.any(String),
      startGameDate: expect.any(String),
      finishGameDate: null,
    });

    expect(secondGame).toEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: expect.any(String),
          login: expect.any(String),
        },
        score: 0,
      },
      questions: expect.arrayContaining([
        { id: expect.any(String), body: expect.any(String) },
      ]),
      status: GameStatus.Active,
      pairCreatedDate: expect.any(String),
      startGameDate: expect.any(String),
      finishGameDate: null,
    });
  });

  it('should return the questions in the same order for each player in the game', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(2);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    const { body: firstUserGame } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current`)
      .auth(accessTokens[0].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    const { body: secondUserGame } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current`)
      .auth(accessTokens[1].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    for (let i = 0; i < 5; i++) {
      expect(firstUserGame.questions[i]).toEqual(secondUserGame.questions[i]);
    }
  });

  it('should send an answer to question from user', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(2);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    const answerResponse = await gamesTestManager.sendAnswer(
      'answer',
      accessTokens[0].accessToken,
    );

    expect(answerResponse).toEqual({
      questionId: expect.any(String),
      answerStatus: expect.stringMatching(/^(Correct|Incorrect)$/),
      addedAt: expect.any(String),
    });
  });

  it('should return 403 if user is not inside active game', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(3);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    await gamesTestManager.sendAnswer(
      'answer',
      accessTokens[2].accessToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should return 403 if user has already answered to all questions', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(3);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    for (let i = 0; i < 5; i++) {
      const answerResponse = await gamesTestManager.sendAnswer(
        'answer ' + i,
        accessTokens[0].accessToken,
      );

      expect(answerResponse).toEqual({
        questionId: expect.any(String),
        answerStatus: expect.stringMatching(/^(Correct|Incorrect)$/),
        addedAt: expect.any(String),
      });
    }

    await gamesTestManager.sendAnswer(
      'answer',
      accessTokens[0].accessToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should increase player score if user answer is correct', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(3);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    const answerResponse = await gamesTestManager.sendAnswer(
      'correctAnswer',
      accessTokens[0].accessToken,
    );

    expect(answerResponse).toEqual({
      questionId: expect.any(String),
      answerStatus: AnswerStatus.Correct,
      addedAt: expect.any(String),
    });

    const { body: firstUserGame } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current`)
      .auth(accessTokens[0].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(firstUserGame.firstPlayerProgress.score).toBe(1);
    expect(firstUserGame.secondPlayerProgress.score).toBe(0);

    const wrongAnswerResponse = await gamesTestManager.sendAnswer(
      'wrongAnswer',
      accessTokens[0].accessToken,
    );

    expect(wrongAnswerResponse).toEqual({
      questionId: expect.any(String),
      answerStatus: AnswerStatus.Incorrect,
      addedAt: expect.any(String),
    });

    const { body: firstUserGame1 } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current`)
      .auth(accessTokens[0].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(firstUserGame1.firstPlayerProgress.score).toBe(1);
    expect(firstUserGame1.secondPlayerProgress.score).toBe(0);
  });

  it('should finish the game if players have answered all questions', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(2);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    const startedGame = await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    for (let i = 0; i < 5; i++) {
      await gamesTestManager.sendAnswer('answer', accessTokens[0].accessToken);
      await gamesTestManager.sendAnswer('answer', accessTokens[1].accessToken);
    }

    const { body: finishedGame } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/${startedGame.id}`)
      .auth(accessTokens[0].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(finishedGame.status).toBe(GameStatus.Finished);
  });

  it('if players have the same number of scores, the player with the bonus point should win', async () => {
    await questionsTestManager.createSeveralPublishedQuestions(7);
    const users = await usersTestManager.createSeveralUsers(2);

    const accessTokens = await Promise.all(
      users.map((user) => usersTestManager.login(user.login, '123456789')),
    );

    const startedGame = await gamesTestManager.startGame(
      accessTokens[0].accessToken,
      accessTokens[1].accessToken,
    );

    // Отвечаем правильно на 3 вопроса
    for (let i = 0; i < 3; i++) {
      await gamesTestManager.sendAnswer(
        'correctAnswer',
        accessTokens[0].accessToken,
      );
      await gamesTestManager.sendAnswer(
        'correctAnswer',
        accessTokens[1].accessToken,
      );
    }

    // Отвечаем неправильно на 2 вопроса
    for (let i = 0; i < 2; i++) {
      await gamesTestManager.sendAnswer(
        'wrongAnswer',
        accessTokens[0].accessToken,
      );
      await gamesTestManager.sendAnswer(
        'wrongAnswer',
        accessTokens[1].accessToken,
      );
    }

    const { body: finishedGame } = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/${startedGame.id}`)
      .auth(accessTokens[0].accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    // У первого игрока должно быть больше очков, потому что он ответил быстрее
    expect(finishedGame.status).toBe(GameStatus.Finished);
    expect(finishedGame.firstPlayerProgress.score).toBe(4);
    expect(finishedGame.secondPlayerProgress.score).toBe(3);
  });
});
