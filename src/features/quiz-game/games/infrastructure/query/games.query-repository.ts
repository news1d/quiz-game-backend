import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../../domain/game.entity';
import { Not, Repository } from 'typeorm';
import { GamePairViewDto } from '../../../pairs/api/view-dto/game-pair.view-dto';
import { GameStatus } from '../../enums/game-status';

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game) private gamesQueryRepository: Repository<Game>,
  ) {}

  async getGameByIdOrNotFoundFail(gameId: string): Promise<GamePairViewDto> {
    const game = await this.gamesQueryRepository.findOne({
      where: { id: +gameId },
      relations: {
        firstPlayer: { user: true, answers: true },
        secondPlayer: { user: true, answers: true },
        questions: { question: true },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return GamePairViewDto.mapToView(game);
  }

  async getCurrentGameByUserIdOrNotFoundFail(
    userId: string,
  ): Promise<GamePairViewDto> {
    const game = await this.gamesQueryRepository.findOne({
      where: [
        {
          firstPlayer: { userId: +userId },
          gameStatus: Not(GameStatus.Finished),
        },
        {
          secondPlayer: { userId: +userId },
          gameStatus: Not(GameStatus.Finished),
        },
      ],
      relations: {
        firstPlayer: { user: true, answers: true },
        secondPlayer: { user: true, answers: true },
        questions: { question: true },
      },
    });

    if (!game) {
      throw new NotFoundException('No active game');
    }

    return GamePairViewDto.mapToView(game);
  }

  async getGameByIdOrFails(
    gameId: string,
    userId: string,
  ): Promise<GamePairViewDto> {
    const game = await this.gamesQueryRepository.findOne({
      where: { id: +gameId },
      relations: {
        firstPlayer: { user: true, answers: true },
        secondPlayer: { user: true, answers: true },
        questions: { question: true },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (
      game.firstPlayer.userId !== +userId &&
      game.secondPlayer?.userId !== +userId
    ) {
      throw new ForbiddenException("Trying to get another user's device");
    }

    return GamePairViewDto.mapToView(game);
  }
}
