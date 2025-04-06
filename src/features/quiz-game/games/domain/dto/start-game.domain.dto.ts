import { GameQuestion } from '../game-questions.entity';

export class StartGameDomainDto {
  secondPlayerId: string;
  questions: GameQuestion[];
}
