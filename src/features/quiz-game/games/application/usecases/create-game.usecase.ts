import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/games.repository';
import { Game } from '../../domain/game.entity';

export class CreateGameCommand {
  constructor(public firstPlayerId: string) {}
}

@CommandHandler(CreateGameCommand)
export class CreateGameUseCase implements ICommandHandler<CreateGameCommand> {
  constructor(private gamesRepository: GamesRepository) {}

  async execute({ firstPlayerId }: CreateGameCommand): Promise<string> {
    const game = Game.createInstance({
      firstPlayerId: firstPlayerId,
    });

    await this.gamesRepository.save(game);

    return game.id.toString();
  }
}
