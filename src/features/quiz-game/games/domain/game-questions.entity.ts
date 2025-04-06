import { Column, Entity, ManyToOne } from 'typeorm';
import { Game } from './game.entity';
import { Question } from '../../questions/domain/question.entity';
import { BaseEntity } from '../../../../core/entities/base.entity';
import { CreateGameQuestionDomainDto } from './dto/create-game-question.domain.dto';

@Entity()
export class GameQuestion extends BaseEntity {
  @Column({ type: 'integer' })
  gameId: number;

  @Column({ type: 'integer' })
  questionId: number;

  @Column()
  order: number; // Порядковый номер вопроса в игре

  @ManyToOne(() => Question, (question) => question.gameQuestions)
  question: Question;

  @ManyToOne(() => Game, (game) => game.questions)
  game: Game;

  static createInstance(dto: CreateGameQuestionDomainDto): GameQuestion {
    const gameQuestion = new GameQuestion();

    gameQuestion.gameId = +dto.gameId;
    gameQuestion.questionId = +dto.questionId;
    gameQuestion.order = dto.order;

    return gameQuestion;
  }
}
