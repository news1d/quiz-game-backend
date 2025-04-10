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

    dto.sumScore = Number(raw.sumScore) || 0;
    dto.avgScores = parseFloat(raw.avgScores || 0);
    dto.gamesCount = Number(raw.gamesCount) || 0;
    dto.winsCount = Number(raw.winsCount) || 0;
    dto.lossesCount = Number(raw.lossesCount) || 0;
    dto.drawsCount = Number(raw.drawsCount) || 0;
    dto.player = {
      id: raw.userId.toString(),
      login: raw.login,
    };

    return dto;
  }
}
