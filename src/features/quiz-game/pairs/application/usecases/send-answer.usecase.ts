import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../../games/infrastructure/games.repository';
import { AnswerStatus } from '../../../answers/enums/answer-status';
import { CreateAnswerCommand } from '../../../answers/application/usecases/create-answer.usecase';
import { FinishGameCommand } from '../../../games/application/usecases/finish-game.usecase';

export class SendAnswerCommand {
  constructor(
    public answer: string,
    public userId: string,
  ) {}
}

@CommandHandler(SendAnswerCommand)
export class SendAnswerUseCase implements ICommandHandler<SendAnswerCommand> {
  constructor(
    private gamesRepository: GamesRepository,
    private commandBus: CommandBus,
  ) {}

  async execute({ answer, userId }: SendAnswerCommand): Promise<string> {
    const game =
      await this.gamesRepository.getActiveGameByUserIdOrForbiddenFail(userId);

    const currentPlayer =
      game.firstPlayer.userId === +userId
        ? game.firstPlayer
        : game.secondPlayer;

    const playerAnswers = currentPlayer!.answers;
    const allQuestions = game.questions!;

    // Находим текущий вопрос, на который ещё не был дан ответ
    const unansweredQuestions = allQuestions
      .filter((q) => !playerAnswers.some((a) => a.questionId === q.question.id))
      .sort((a, b) => a.order - b.order); // сортируем по порядку

    const currentQuestion = unansweredQuestions[0].question;

    // Проверка правильности ответа
    const isCorrect = currentQuestion.answers.includes(answer.trim());

    if (isCorrect) {
      game.addScoreToPlayer(userId);
      await this.gamesRepository.save(game);
    }

    // Добавляем ответ игрока
    const answerId = await this.commandBus.execute(
      new CreateAnswerCommand({
        body: answer,
        playerId: currentPlayer!.id.toString(),
        questionId: currentQuestion.id.toString(),
        status: isCorrect ? AnswerStatus.Correct : AnswerStatus.Incorrect,
      }),
    );

    // Повторно получаем игру с обновлёнными ответами
    const updatedGame = await this.gamesRepository.getGameByIdOrNotFoundFail(
      game.id.toString(),
    );

    // Если оба игрока ответили на все вопросы - то игра должна окончиться
    const isGameFinished =
      updatedGame.firstPlayer.answers.length === 5 &&
      updatedGame.secondPlayer!.answers.length === 5;

    if (isGameFinished) {
      await this.commandBus.execute(new FinishGameCommand(updatedGame));
    }

    return answerId;
  }
}
