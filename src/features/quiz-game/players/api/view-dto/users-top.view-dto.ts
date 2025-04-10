import { PlayerViewDto } from './player.view-dto';

export class UsersTopViewDto {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
  player: PlayerViewDto;

  static mapToView(raw: any): UsersTopViewDto {
    const dto = new UsersTopViewDto();

    dto.sumScore = Number(raw.sumscore) || 0;
    dto.avgScores = parseFloat(raw.avgscores || 0);
    dto.gamesCount = Number(raw.gamescount) || 0;
    dto.winsCount = Number(raw.winscount) || 0;
    dto.lossesCount = Number(raw.lossescount) || 0;
    dto.drawsCount = Number(raw.drawscount) || 0;
    dto.player = {
      id: raw.id.toString(),
      login: raw.login,
    };

    return dto;
  }
}
