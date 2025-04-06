import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Answer } from '../../answers/domain/answer.entity';
import { GameResultStatus } from '../../games/enums/game-result-status';
import { BaseEntity } from '../../../../core/entities/base.entity';
import { User } from '../../../user-accounts/domain/user.entity';
import { CreatePlayerDomainDto } from './dto/create-player.domain.dto';

@Entity()
export class Player extends BaseEntity {
  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'integer', default: 0 })
  score: number;

  @Column({
    type: 'enum',
    enum: GameResultStatus,
    nullable: true,
  })
  status: GameResultStatus | null;

  @ManyToOne(() => User, (user) => user.players)
  user: User;

  @OneToMany(() => Answer, (answer) => answer.player)
  answers: Answer[];

  static createInstance(dto: CreatePlayerDomainDto): Player {
    const player = new Player();

    player.userId = +dto.userId;

    return player;
  }

  addScore() {
    this.score += 1;
  }

  updateStatus(status: GameResultStatus) {
    this.status = status;
  }
}
