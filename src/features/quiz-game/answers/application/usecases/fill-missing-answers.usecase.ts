import { Game } from '../../../games/domain/game.entity';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAnswerCommand } from './create-answer.usecase';
import { AnswerStatus } from '../../enums/answer-status';

export class FillMissingAnswersCommand {
  constructor(public game: Game) {}
}

@CommandHandler(FillMissingAnswersCommand)
export class FillMissingAnswersUseCase
  implements ICommandHandler<FillMissingAnswersCommand>
{
  constructor(private commandBus: CommandBus) {}

  async execute({ game }: FillMissingAnswersCommand) {
    for (const player of [game.firstPlayer, game.secondPlayer!]) {
      const answeredIds = player.answers.map((a) => a.questionId);
      const unanswered = game.questions!.filter(
        (q) => !answeredIds.includes(q.question.id),
      );

      for (const q of unanswered) {
        await this.commandBus.execute(
          new CreateAnswerCommand({
            body: 'incorrect',
            questionId: q.question.id.toString(),
            playerId: player.id.toString(),
            status: AnswerStatus.Incorrect,
          }),
        );
      }
    }
  }
}
