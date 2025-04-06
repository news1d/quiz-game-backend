import { CreateQuestionDto } from '../../dto/create-question.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/questions.repository';
import { Question } from '../../domain/question.entity';

export class CreateQuestionCommand {
  constructor(public dto: CreateQuestionDto) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(private questionsRepository: QuestionsRepository) {}

  async execute({ dto }: CreateQuestionCommand): Promise<string> {
    const question = Question.createInstance(dto);

    await this.questionsRepository.save(question);

    return question.id.toString();
  }
}
