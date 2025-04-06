import { Column, Entity, OneToMany } from 'typeorm';
import { GameQuestion } from '../../games/domain/game-questions.entity';
import { CreateQuestionDomainDto } from './dto/create-question.domain.dto';
import { PublishedStatus } from '../enums/published-status';
import { DeletionStatus } from '../../../../core/dto/deletion-status';
import { BaseEntity } from '../../../../core/entities/base.entity';

@Entity()
export class Question extends BaseEntity {
  @Column()
  body: string;

  @Column('varchar', { array: true })
  answers: string[];

  @Column({
    type: 'enum',
    enum: PublishedStatus,
    default: PublishedStatus.NotPublished,
  })
  publishedStatus: PublishedStatus;

  @Column({
    type: 'enum',
    enum: DeletionStatus,
    default: DeletionStatus.NotDeleted,
  })
  deletionStatus: DeletionStatus;

  @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.question)
  gameQuestions: GameQuestion[];

  static createInstance(dto: CreateQuestionDomainDto): Question {
    const question = new this();

    question.body = dto.body;
    question.answers = dto.correctAnswers;

    return question;
  }

  update(dto: CreateQuestionDomainDto) {
    this.body = dto.body;
    this.answers = dto.correctAnswers;
  }

  updatePublishStatus(publishStatus: boolean) {
    this.publishedStatus = publishStatus
      ? PublishedStatus.Published
      : PublishedStatus.NotPublished;
  }

  makeDeleted() {
    if (this.deletionStatus !== DeletionStatus.NotDeleted) {
      throw new Error('User already deleted');
    }
    this.deletionStatus = DeletionStatus.PermanentDeleted;
  }
}
