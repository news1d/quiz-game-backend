import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../domain/player.entity';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class PlayersRepository {
  constructor(
    @InjectRepository(Player) private playersRepository: Repository<Player>,
  ) {}

  async getPlayerByIdOrNotFoundFail(playerId: string): Promise<Player> {
    const player = await this.playersRepository.findOne({
      where: { id: +playerId },
      relations: { answers: true },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return player;
  }

  async save(player: Player): Promise<Player> {
    return this.playersRepository.save(player);
  }
}
