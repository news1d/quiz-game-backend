import { CreateAnswersDto } from '../../dto/create-answer.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnswersRepository } from '../../infrastructure/answers.repository';
import { Answer } from '../../domain/answer.entity';

export class CreateAnswerCommand {
  constructor(public dto: CreateAnswersDto) {}
}

@CommandHandler(CreateAnswerCommand)
export class CreateAnswerUseCase
  implements ICommandHandler<CreateAnswerCommand>
{
  constructor(private answersRepository: AnswersRepository) {}

  async execute({ dto }: CreateAnswerCommand): Promise<string> {
    const answer = Answer.createInstance(dto);

    await this.answersRepository.save(answer);

    return answer.id.toString();
  }
}
