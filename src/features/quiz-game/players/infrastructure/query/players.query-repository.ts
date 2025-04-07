import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../../domain/player.entity';
import { Repository } from 'typeorm';
import { MyStatisticViewDto } from '../../api/view-dto/my-statistic.view-dto';
import { Game } from '../../../games/domain/game.entity';
import { GameStatus } from '../../../games/enums/game-status';
import { GameResultStatus } from '../../../games/enums/game-result-status';

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
      .andWhere('game.gameStatus = :status', { status: GameStatus.Finished })
      .setParameters({
        win: GameResultStatus.Win,
        lose: GameResultStatus.Lose,
        draw: GameResultStatus.Draw,
      })
      .getRawOne();

    return MyStatisticViewDto.mapToView(raw);
  }
}
