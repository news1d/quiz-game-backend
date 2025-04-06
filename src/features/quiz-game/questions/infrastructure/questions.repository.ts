import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../domain/question.entity';
import { Repository } from 'typeorm';
import { DeletionStatus } from '../../../../core/dto/deletion-status';
import { PublishedStatus } from '../enums/published-status';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async getQuestionByIdOrNotFoundFail(id: string): Promise<Question> {
    const question = await this.questionsRepository.findOneBy({
      id: +id,
      deletionStatus: DeletionStatus.NotDeleted,
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async save(question: Question) {
    return this.questionsRepository.save(question);
  }

  async getFiveRandomQuestions(): Promise<Question[]> {
    return this.questionsRepository
      .createQueryBuilder('question')
      .where('question.deletionStatus = :status', {
        status: DeletionStatus.NotDeleted,
      })
      .andWhere('question.publishedStatus = :publishedStatus', {
        publishedStatus: PublishedStatus.Published,
      })
      .orderBy('RANDOM()')
      .limit(5)
      .getMany();
  }
}
