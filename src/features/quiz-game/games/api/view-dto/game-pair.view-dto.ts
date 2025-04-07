import { GamePlayerProgressViewDto } from '../../../players/api/view-dto/game-player-progress.view-dto';
import { GameStatus } from '../../enums/game-status';
import { Game } from '../../domain/game.entity';
import { QuestionsInGamePairViewDtoViewDto } from '../../../questions/api/view-dto/quiestions-in-game-pair.view-dto';

export class GamePairViewDto {
  id: string;
  firstPlayerProgress: GamePlayerProgressViewDto;
  secondPlayerProgress: GamePlayerProgressViewDto | null;
  questions: QuestionsInGamePairViewDtoViewDto[] | null;
  status: GameStatus;
  pairCreatedDate: Date;
  startGameDate: Date | null;
  finishGameDate: Date | null;

  static mapToView(game: Game): GamePairViewDto {
    const dto = new GamePairViewDto();

    dto.id = game.id.toString();

    dto.firstPlayerProgress = {
      answers: game.firstPlayer.answers
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((answer) => ({
          questionId: answer.questionId.toString(),
          answerStatus: answer.status,
          addedAt: answer.createdAt,
        })),
      player: {
        id: game.firstPlayer.user.id.toString(),
        login: game.firstPlayer.user.login,
      },
      score: game.firstPlayer.score,
    };

    dto.secondPlayerProgress = game.secondPlayer
      ? {
          answers: game.secondPlayer.answers
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((answer) => ({
              questionId: answer.questionId.toString(),
              answerStatus: answer.status,
              addedAt: answer.createdAt,
            })),
          player: {
            id: game.secondPlayer.user.id.toString(),
            login: game.secondPlayer.user.login,
          },
          score: game.secondPlayer.score,
        }
      : null;

    dto.questions = game.questions?.length
      ? game.questions.map((q) => ({
          id: q.question.id.toString(),
          body: q.question.body,
        }))
      : null;

    dto.status = game.status;
    dto.pairCreatedDate = game.createdAt;
    dto.startGameDate = game.startGameDate;
    dto.finishGameDate = game.finishGameDate;

    return dto;
  }
}
