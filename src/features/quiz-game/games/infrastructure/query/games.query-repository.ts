import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../../domain/game.entity';
import { Not, Repository } from 'typeorm';
import { GamePairViewDto } from '../../api/view-dto/game-pair.view-dto';
import { GameStatus } from '../../enums/game-status';
import { GetGamesQueryParams } from '../../api/input-dto/get-games-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game) private gamesRepository: Repository<Game>,
  ) {}

  async getAllUserGames(
    query: GetGamesQueryParams,
    userId: string,
  ): Promise<PaginatedViewDto<GamePairViewDto[]>> {
    const sortBy = `game.${query.sortBy}`;
    const sortDirection = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';

    const [games, totalCount] = await this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
      .leftJoinAndSelect('firstPlayer.user', 'firstUser')
      .leftJoinAndSelect('firstPlayer.answers', 'firstAnswers')
      .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
      .leftJoinAndSelect('secondPlayer.user', 'secondUser')
      .leftJoinAndSelect('secondPlayer.answers', 'secondAnswers')
      .leftJoinAndSelect('game.questions', 'gameQuestions')
      .leftJoinAndSelect('gameQuestions.question', 'question')
      .where('firstPlayer.userId = :userId OR secondPlayer.userId = :userId', {
        userId: +userId,
      })
      .orderBy(sortBy, sortDirection)
      .skip(query.calculateSkip())
      .take(query.pageSize)
      .getManyAndCount();

    const items = games.map(GamePairViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getGameByIdOrNotFoundFail(gameId: string): Promise<GamePairViewDto> {
    const game = await this.gamesRepository.findOne({
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
    const game = await this.gamesRepository.findOne({
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
    const game = await this.gamesRepository.findOne({
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
