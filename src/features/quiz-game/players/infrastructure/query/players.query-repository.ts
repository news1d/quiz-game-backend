import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../../domain/player.entity';
import { Repository } from 'typeorm';
import { MyStatisticViewDto } from '../../api/view-dto/my-statistic.view-dto';
import { Game } from '../../../games/domain/game.entity';
import { GameStatus } from '../../../games/enums/game-status';
import { GameResultStatus } from '../../../games/enums/game-result-status';
import { GetUsersTopQueryParams } from '../../api/input-dto/get-top-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { UsersTopViewDto } from '../../api/view-dto/users-top.view-dto';
import { User } from '../../../../user-accounts/domain/user.entity';

@Injectable()
export class PlayersQueryRepository {
  constructor(
    @InjectRepository(Player) private playersRepository: Repository<Player>,
  ) {}

  async getStatisticsByUserId(userId: string): Promise<MyStatisticViewDto> {
    const raw = await this.playersRepository
      .createQueryBuilder('player')
      .select(
        `SUM(player.score) AS "sumScore",
        ROUND(AVG(player.score)::numeric, 2)::float AS "avgScores",
        COUNT(player.id) AS "gamesCount",
        SUM(CASE WHEN player.status = :win THEN 1 ELSE 0 END) AS "winsCount",
        SUM(CASE WHEN player.status = :lose THEN 1 ELSE 0 END) AS "lossesCount",
        SUM(CASE WHEN player.status = :draw THEN 1 ELSE 0 END) AS "drawsCount"`,
      )
      .innerJoin(
        Game,
        'game',
        'player.id = game.firstPlayerId OR player.id = game.secondPlayerId',
      )
      .where('player.userId = :userId', { userId })
      .andWhere('game.status = :status', { status: GameStatus.Finished })
      .setParameters({
        win: GameResultStatus.Win,
        lose: GameResultStatus.Lose,
        draw: GameResultStatus.Draw,
      })
      .getRawOne();

    return MyStatisticViewDto.mapToView(raw);
  }

  async getUsersTop(
    query: GetUsersTopQueryParams,
  ): Promise<PaginatedViewDto<UsersTopViewDto[]>> {
    const orderBy: Record<string, 'ASC' | 'DESC'> = {};

    for (const sortItem of query.sortItems) {
      orderBy[sortItem.field] = sortItem.direction.toUpperCase() as
        | 'ASC'
        | 'DESC';
    }

    const queryBuilder = this.playersRepository
      .createQueryBuilder('player')
      .select([
        'player.userId AS id',
        'user.login AS login',
        'SUM(player.score) AS sumScore',
        'ROUND(AVG(player.score)::numeric, 2)::float AS avgScores',
        'COUNT(player.id) AS gamesCount',
        'SUM(CASE WHEN player.status = :win THEN 1 ELSE 0 END) AS winsCount',
        'SUM(CASE WHEN player.status = :lose THEN 1 ELSE 0 END) AS lossesCount',
        'SUM(CASE WHEN player.status = :draw THEN 1 ELSE 0 END) AS drawsCount',
      ])
      .leftJoin(User, 'user', 'user.id = player.userId')
      .groupBy('player.userId')
      .addGroupBy('user.login')
      .orderBy(orderBy)
      .setParameters({
        win: GameResultStatus.Win,
        lose: GameResultStatus.Lose,
        draw: GameResultStatus.Draw,
      })
      .skip(query.calculateSkip())
      .take(query.pageSize);

    // Получение списка пользователей и их статистики
    const users = await queryBuilder.getRawMany();

    // Получение общего количества пользователей
    const totalCount = (
      await this.playersRepository
        .createQueryBuilder('player')
        .select('player.userId')
        .leftJoin(User, 'user', 'user.id = player.userId')
        .groupBy('player.userId')
        .getRawMany()
    ).length;

    const items = users.map(UsersTopViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
