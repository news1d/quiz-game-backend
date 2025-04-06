import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from '../../domain/answer.entity';
import { Repository } from 'typeorm';
import { AnswerViewDto } from '../../api/view-dto/answer.view-dto';

@Injectable()
export class AnswersQueryRepository {
  constructor(
    @InjectRepository(Answer) private answersRepository: Repository<Answer>,
  ) {}

  async getAnswerByIdOrNotFoundFail(answerId: string): Promise<AnswerViewDto> {
    const answer = await this.answersRepository.findOneBy({ id: +answerId });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    return AnswerViewDto.mapToView(answer);
  }
}
