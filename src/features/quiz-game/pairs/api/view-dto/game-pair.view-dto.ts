import { GamePlayerProgressViewDto } from '../../../players/api/view-dto/game-player-progress.view-dto';
import { GameStatus } from '../../../games/enums/game-status';
import { Game } from '../../../games/domain/game.entity';

export class GamePairViewDto {
  id: string;
  firstPlayerProgress: GamePlayerProgressViewDto;
  secondPlayerProgress: GamePlayerProgressViewDto | null;
  questions: string[] | null;
  status: GameStatus;
  pairCreatedDate: Date;
  startGameDate: Date | null;
  finishGameDate: Date | null;

  static mapToView(game: Game): GamePairViewDto {
    const dto = new GamePairViewDto();

    dto.id = game.id.toString();

    dto.firstPlayerProgress = {
      answers: game.firstPlayer.answers.map((answer) => ({
        questionId: answer.questionId.toString(),
        answerStatus: answer.status,
        addedAt: answer.createdAt,
      })),
      player: {
        id: game.firstPlayer.id.toString(),
        login: game.firstPlayer.user.login,
      },
      score: game.firstPlayer.score,
    };

    dto.secondPlayerProgress = game.secondPlayer
      ? {
          answers: game.secondPlayer.answers.map((answer) => ({
            questionId: answer.questionId.toString(),
            answerStatus: answer.status,
            addedAt: answer.createdAt,
          })),
          player: {
            id: game.secondPlayer.id.toString(),
            login: game.secondPlayer.user.login,
          },
          score: game.secondPlayer.score,
        }
      : null;

    dto.questions = game.questions?.length
      ? game.questions.map((q) => q.question.body)
      : null;

    dto.status = game.gameStatus;
    dto.pairCreatedDate = game.createdAt;
    dto.startGameDate = game.gameStartedAt;
    dto.finishGameDate = game.gameFinishedAt;

    return dto;
  }
}
