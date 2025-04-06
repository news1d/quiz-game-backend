import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from '../domain/answer.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AnswersRepository {
  constructor(
    @InjectRepository(Answer) private answersRepository: Repository<Answer>,
  ) {}

  async save(answer: Answer) {
    return this.answersRepository.save(answer);
  }
}
