import { AnswerStatus } from '../enums/answer-status';

export class CreateAnswersDto {
  body: string;
  playerId: string;
  questionId: string;
  status: AnswerStatus;
}
