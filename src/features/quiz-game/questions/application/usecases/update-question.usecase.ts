import { CreateQuestionDto } from '../../dto/create-question.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class UpdateQuestionCommand {
  constructor(
    public id: string,
    public dto: CreateQuestionDto,
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private questionsRepository: QuestionsRepository) {}

  async execute({ id, dto }: UpdateQuestionCommand): Promise<void> {
    const question =
      await this.questionsRepository.getQuestionByIdOrNotFoundFail(id);

    question.update(dto);

    await this.questionsRepository.save(question);
  }
}
