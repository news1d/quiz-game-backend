import { IsBoolean, IsNotEmpty } from 'class-validator';

export class PublishStatusInputDto {
  @IsBoolean()
  @IsNotEmpty()
  published: boolean;
}
