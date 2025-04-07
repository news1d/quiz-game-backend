export class MyStatisticViewDto {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;

  static mapToView(raw: any): MyStatisticViewDto {
    const dto = new MyStatisticViewDto();

    dto.sumScore = Number(raw.sumScore) || 0;
    dto.avgScores = parseFloat(raw.avgScores || 0);
    dto.gamesCount = Number(raw.gamesCount) || 0;
    dto.winsCount = Number(raw.winsCount) || 0;
    dto.lossesCount = Number(raw.lossesCount) || 0;
    dto.drawsCount = Number(raw.drawsCount) || 0;

    return dto;
  }
}
