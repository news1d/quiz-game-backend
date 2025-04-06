import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class UpdatePublishStatusCommand {
  constructor(
    public id: string,
    public publishedStatus: boolean,
  ) {}
}

@CommandHandler(UpdatePublishStatusCommand)
export class UpdatePublishStatusUseCase
  implements ICommandHandler<UpdatePublishStatusCommand>
{
  constructor(private questionsRepository: QuestionsRepository) {}

  async execute({
    id,
    publishedStatus,
  }: UpdatePublishStatusCommand): Promise<void> {
    const question =
      await this.questionsRepository.getQuestionByIdOrNotFoundFail(id);

    question.updatePublishStatus(publishedStatus);

    await this.questionsRepository.save(question);
  }
}
