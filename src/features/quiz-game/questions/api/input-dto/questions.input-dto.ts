import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class CreateQuestionInputDto {
  @Trim()
  @IsNotEmpty()
  @IsString()
  @Length(10, 500)
  body: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsString({ each: true })
  correctAnswers: string[];
}
