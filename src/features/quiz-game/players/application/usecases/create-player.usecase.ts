import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PlayersRepository } from '../../infrastructure/players.repository';
import { Player } from '../../domain/player.entity';

export class CreatePlayerCommand {
  constructor(public userId: string) {}
}

@CommandHandler(CreatePlayerCommand)
export class CreatePlayerUseCase
  implements ICommandHandler<CreatePlayerCommand>
{
  constructor(private playersRepository: PlayersRepository) {}

  async execute({ userId }: CreatePlayerCommand): Promise<string> {
    const player = Player.createInstance({ userId });

    await this.playersRepository.save(player);

    return player.id.toString();
  }
}
