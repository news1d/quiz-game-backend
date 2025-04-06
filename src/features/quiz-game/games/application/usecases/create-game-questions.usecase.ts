import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../../questions/infrastructure/questions.repository';
import { GameQuestionsRepository } from '../../infrastructure/game-questions.repository';
import { GameQuestion } from '../../domain/game-questions.entity';

export class CreateGameQuestionsCommand {
  constructor(public gameId: string) {}
}

@CommandHandler(CreateGameQuestionsCommand)
export class CreateGameQuestionsUseCase
  implements ICommandHandler<CreateGameQuestionsCommand>
{
  constructor(
    private questionsRepository: QuestionsRepository,
    private gameQuestionsRepository: GameQuestionsRepository,
  ) {}

  async execute({
    gameId,
  }: CreateGameQuestionsCommand): Promise<GameQuestion[]> {
    const questions = await this.questionsRepository.getFiveRandomQuestions();

    const gameQuestions = questions.map((question, index) =>
      GameQuestion.createInstance({
        gameId: gameId,
        questionId: question.id.toString(),
        order: index + 1,
      }),
    );

    await this.gameQuestionsRepository.save(gameQuestions);

    return gameQuestions;
  }
}
