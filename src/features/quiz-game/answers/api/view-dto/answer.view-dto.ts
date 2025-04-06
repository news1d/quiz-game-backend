import { AnswerStatus } from '../../enums/answer-status';
import { Answer } from '../../domain/answer.entity';

export class AnswerViewDto {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: Date;

  static mapToView(answer: Answer): AnswerViewDto {
    const dto = new AnswerViewDto();

    dto.questionId = answer.questionId.toString();
    dto.answerStatus = answer.status;
    dto.addedAt = answer.createdAt;

    return dto;
  }
}
