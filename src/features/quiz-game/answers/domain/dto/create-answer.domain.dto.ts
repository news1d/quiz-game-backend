import { AnswerStatus } from '../../enums/answer-status';

export class CreateAnswerDomainDto {
  body: string;
  playerId: string;
  questionId: string;
  status: AnswerStatus;
}
