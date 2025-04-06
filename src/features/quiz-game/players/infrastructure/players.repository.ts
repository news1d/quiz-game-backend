import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../domain/player.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlayersRepository {
  constructor(
    @InjectRepository(Player) private playersRepository: Repository<Player>,
  ) {}

  async save(player: Player): Promise<Player> {
    return this.playersRepository.save(player);
  }
}
