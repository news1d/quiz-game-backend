import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameQuestion } from '../domain/game-questions.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GameQuestionsRepository {
  constructor(
    @InjectRepository(GameQuestion)
    private gameQuestionRepository: Repository<GameQuestion>,
  ) {}

  async save(
    gameQuestions: GameQuestion | GameQuestion[],
  ): Promise<GameQuestion | GameQuestion[]> {
    if (Array.isArray(gameQuestions)) {
      return this.gameQuestionRepository.save(gameQuestions);
    }
    return this.gameQuestionRepository
      .save([gameQuestions])
      .then((res) => res[0]);
  }
}
