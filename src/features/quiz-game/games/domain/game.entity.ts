import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Player } from '../../players/domain/player.entity';
import { BaseEntity } from '../../../../core/entities/base.entity';
import { GameStatus } from '../enums/game-status';
import { CreateGameDomainDto } from './dto/create-game.domain.dto';
import { StartGameDomainDto } from './dto/start-game.domain.dto';
import { GameQuestion } from './game-questions.entity';
import { AnswerStatus } from '../../answers/enums/answer-status';
import { GameResultStatus } from '../enums/game-result-status';
import { CreateAnswersDto } from '../../answers/dto/create-answer.dto';

@Entity()
export class Game extends BaseEntity {
  @Column({ type: 'integer' })
  firstPlayerId: number;

  @Column({ type: 'integer', nullable: true })
  secondPlayerId: number | null;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.PendingSecondPlayer,
  })
  gameStatus: GameStatus;

  @Column({ type: 'timestamp', nullable: true })
  gameStartedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  gameFinishedAt: Date | null;

  @OneToOne(() => Player, { cascade: true })
  @JoinColumn({ name: 'firstPlayerId' })
  firstPlayer: Player;

  @OneToOne(() => Player, { cascade: true })
  @JoinColumn({ name: 'secondPlayerId' })
  secondPlayer: Player | null;

  @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game)
  questions: GameQuestion[] | null;

  static createInstance(dto: CreateGameDomainDto): Game {
    const game = new Game();

    game.firstPlayerId = +dto.firstPlayerId;

    return game;
  }

  startGame(dto: StartGameDomainDto) {
    this.secondPlayerId = +dto.secondPlayerId;
    this.questions = dto.questions;
    this.gameStatus = GameStatus.Active;
    this.gameStartedAt = new Date();
  }

  finishGame() {
    this.gameStatus = GameStatus.Finished;
    this.gameFinishedAt = new Date();
  }

  addBonusScoreToPlayer(): void {
    if (!this.secondPlayer) return;

    const firstAnsweredAll =
      this.firstPlayer.answers.length === this.questions?.length;

    const secondAnsweredAll =
      this.secondPlayer.answers.length === this.questions?.length;

    const firstHasCorrect = this.firstPlayer.answers.some(
      (a) => a.status === AnswerStatus.Correct,
    );
    const secondHasCorrect = this.secondPlayer.answers.some(
      (a) => a.status === AnswerStatus.Correct,
    );

    const firstAnsweredFaster =
      this.getLastAnswerTime(this.firstPlayer) <
      this.getLastAnswerTime(this.secondPlayer);
    const secondAnsweredFaster = !firstAnsweredFaster;

    if (firstAnsweredAll && firstHasCorrect && firstAnsweredFaster) {
      this.firstPlayer.addScore();
    }

    if (secondAnsweredAll && secondHasCorrect && secondAnsweredFaster) {
      this.secondPlayer.addScore();
    }
  }

  private getLastAnswerTime(player: Player): number {
    if (!player.answers.length) return Infinity;

    const lastAnswer = player.answers.reduce((latest, a) =>
      latest.createdAt > a.createdAt ? latest : a,
    );

    return lastAnswer.createdAt.getTime();
  }

  updatePlayersStatuses(): void {
    if (!this.secondPlayer) return;

    const firstScore = this.firstPlayer.score;
    const secondScore = this.secondPlayer.score;

    if (firstScore > secondScore) {
      this.firstPlayer.updateStatus(GameResultStatus.Win);
      this.secondPlayer.updateStatus(GameResultStatus.Lose);
    } else if (firstScore < secondScore) {
      this.firstPlayer.updateStatus(GameResultStatus.Lose);
      this.secondPlayer.updateStatus(GameResultStatus.Win);
    } else {
      this.firstPlayer.updateStatus(GameResultStatus.Draw);
      this.secondPlayer.updateStatus(GameResultStatus.Draw);
    }
  }

  addScoreToPlayer(userId: string) {
    const player =
      this.firstPlayer.userId === +userId
        ? this.firstPlayer
        : this.secondPlayer;

    if (!player) return;

    player.addScore();
  }
}
