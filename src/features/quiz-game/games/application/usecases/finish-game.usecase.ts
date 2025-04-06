import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Game } from '../../domain/game.entity';
import { GamesRepository } from '../../infrastructure/games.repository';

export class FinishGameCommand {
  constructor(public game: Game) {}
}

@CommandHandler(FinishGameCommand)
export class FinishGameUseCase implements ICommandHandler<FinishGameCommand> {
  constructor(private gamesRepository: GamesRepository) {}

  async execute({ game }: FinishGameCommand): Promise<string> {
    game.addBonusScoreToPlayer();
    game.updatePlayersStatuses();
    game.finishGame();

    await this.gamesRepository.save(game);

    return game.id.toString();
  }
}
