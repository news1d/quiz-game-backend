import { Column, Entity, ManyToOne } from 'typeorm';
import { Player } from '../../players/domain/player.entity';
import { AnswerStatus } from '../enums/answer-status';
import { BaseEntity } from '../../../../core/entities/base.entity';
import { CreateAnswerDomainDto } from './dto/create-answer.domain.dto';

@Entity()
export class Answer extends BaseEntity {
  @Column()
  body: string;

  @Column({ type: 'integer' })
  playerId: number;

  @Column({ type: 'integer' })
  questionId: number;

  @Column({
    type: 'enum',
    enum: AnswerStatus,
  })
  status: AnswerStatus;

  @ManyToOne(() => Player, (player) => player.answers)
  player: Player;

  static createInstance(dto: CreateAnswerDomainDto): Answer {
    const answer = new Answer();

    answer.body = dto.body;
    answer.questionId = +dto.questionId;
    answer.playerId = +dto.playerId;
    answer.status = dto.status;

    return answer;
  }
}
