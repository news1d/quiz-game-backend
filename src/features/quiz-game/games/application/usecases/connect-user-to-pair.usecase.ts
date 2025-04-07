import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/games.repository';
import { CreatePlayerCommand } from '../../../players/application/usecases/create-player.usecase';
import { CreateGameCommand } from './create-game.usecase';
import { StartGameCommand } from './start-game.usecase';

export class ConnectUserToPairCommand {
  constructor(public userId: string) {}
}

@CommandHandler(ConnectUserToPairCommand)
export class ConnectUserToPairUseCase
  implements ICommandHandler<ConnectUserToPairCommand>
{
  constructor(
    private gamesRepository: GamesRepository,
    private commandBus: CommandBus,
  ) {}

  async execute({ userId }: ConnectUserToPairCommand): Promise<string> {
    await this.gamesRepository.findPendingOrActiveGameByUserIdAndForbiddenFail(
      userId,
    );

    const pendingPairGame = await this.gamesRepository.getPendingPairGame();

    const playerId = await this.commandBus.execute(
      new CreatePlayerCommand(userId),
    );

    if (!pendingPairGame) {
      return await this.commandBus.execute(new CreateGameCommand(playerId));
    }

    return await this.commandBus.execute(
      new StartGameCommand(pendingPairGame, playerId),
    );
  }
}
