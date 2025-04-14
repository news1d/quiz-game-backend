import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { Game } from '../domain/game.entity';
import { GameStatus } from '../enums/game-status';
import { AnswerStatus } from '../../answers/enums/answer-status';
import { Answer } from '../../answers/domain/answer.entity';

@Injectable()
export class GameTimeoutCronService {
  constructor(private dataSource: DataSource) {}

  @Cron('*/1 * * * * *')
  async handleGameTimeouts() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();

      // Получаем только id активных игр
      const gameIds = await queryRunner.manager
        .getRepository(Game)
        .createQueryBuilder('game')
        .setLock('pessimistic_write')
        .useTransaction(true)
        .where('game.status = :status', { status: GameStatus.Active })
        .select(['game.id'])
        .getMany();

      // Загружаем игры со всеми зависимостями уже без setLock
      for (const { id } of gameIds) {
        const game = await queryRunner.manager.getRepository(Game).findOne({
          where: { id },
          relations: {
            questions: {
              question: true,
            },
            firstPlayer: {
              answers: true,
            },
            secondPlayer: {
              answers: true,
            },
          },
        });

        if (!game) continue;

        const questionsCount = game.questions?.length ?? 0;
        const isFirstPlayerDone =
          game.firstPlayer.answers.length === questionsCount;
        const isSecondPlayerDone =
          game.secondPlayer?.answers.length === questionsCount;

        // Оба игрока не завершили
        if (!isFirstPlayerDone && !isSecondPlayerDone) continue;
        // Оба игрока завершили
        if (isFirstPlayerDone && isSecondPlayerDone) continue;

        const playerFinishedAt =
          game.firstPlayerCompletedAt || game.secondPlayerCompletedAt;
        if (!playerFinishedAt) continue;

        const timeSinceFinished = now.getTime() - playerFinishedAt.getTime();

        if (timeSinceFinished < 9_500) continue;

        for (const player of [game.firstPlayer, game.secondPlayer!]) {
          const answeredIds = player.answers.map((a) => a.questionId);
          const unanswered = game.questions!.filter(
            (q) => !answeredIds.includes(q.question.id),
          );

          for (const q of unanswered) {
            const answer = new Answer();

            answer.body = 'incorrect';
            answer.questionId = q.question.id;
            answer.playerId = player.id;
            answer.status = AnswerStatus.Incorrect;

            await queryRunner.manager.getRepository(Answer).save(answer);
          }
        }

        const updatedGame = await queryRunner.manager
          .getRepository(Game)
          .findOne({
            where: { id: game.id },
            relations: {
              questions: {
                question: true,
              },
              firstPlayer: {
                answers: true,
              },
              secondPlayer: {
                answers: true,
              },
            },
          });

        if (!updatedGame) continue;

        updatedGame.addBonusScoreToPlayer();
        updatedGame.updatePlayersStatuses();
        updatedGame.finishGame();

        await queryRunner.manager.getRepository(Game).save(updatedGame);
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Ошибка в транзакции обработки тайм-аута игры:', err);
    } finally {
      await queryRunner.release();
    }
  }
}
