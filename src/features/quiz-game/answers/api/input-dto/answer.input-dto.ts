import { Trim } from '../../../../../core/decorators/transform/trim';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAnswerInputDto {
  @Trim()
  @IsNotEmpty()
  @IsString()
  answer: string;
}
