import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/games.repository';
import { CreateGameQuestionsCommand } from './create-game-questions.usecase';
import { Game } from '../../domain/game.entity';

export class StartGameCommand {
  constructor(
    public pendingPairGame: Game,
    public secondPlayerId: string,
  ) {}
}

@CommandHandler(StartGameCommand)
export class StartGameUseCase implements ICommandHandler<StartGameCommand> {
  constructor(
    private gamesRepository: GamesRepository,
    private commandBus: CommandBus,
  ) {}

  async execute({
    pendingPairGame,
    secondPlayerId,
  }: StartGameCommand): Promise<string> {
    const gameQuestions = await this.commandBus.execute(
      new CreateGameQuestionsCommand(pendingPairGame.id.toString()),
    );

    pendingPairGame.startGame({
      secondPlayerId: secondPlayerId,
      questions: gameQuestions,
    });

    await this.gamesRepository.save(pendingPairGame);

    return pendingPairGame.id.toString();
  }
}
