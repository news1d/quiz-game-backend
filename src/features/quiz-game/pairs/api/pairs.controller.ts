import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { ConnectUserToPairCommand } from '../application/usecases/connect-user-to-pair.usecase';
import { GamesQueryRepository } from '../../games/infrastructure/query/games.query-repository';
import { NumberIdValidationPipe } from '../../../../core/pipes/number-id-validation-pipe.service';
import { GamePairViewDto } from './view-dto/game-pair.view-dto';
import { AnswerViewDto } from '../../answers/api/view-dto/answer.view-dto';
import { CreateAnswerInputDto } from '../../answers/api/input-dto/answer.input-dto';
import { SendAnswerCommand } from '../application/usecases/send-answer.usecase';
import { AnswersQueryRepository } from '../../answers/infrastructure/query/answers.query-repository';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pair-game-quiz/pairs')
export class PairsController {
  constructor(
    private commandBus: CommandBus,
    private gamesQueryRepository: GamesQueryRepository,
    private answersQueryRepository: AnswersQueryRepository,
  ) {}

  @Get('my-current')
  async getMyCurrentGame(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    return this.gamesQueryRepository.getCurrentGameByUserIdOrNotFoundFail(
      user.id,
    );
  }

  @ApiParam({ name: 'id' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getGameById(
    @Param('id', NumberIdValidationPipe) gameId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    return this.gamesQueryRepository.getGameByIdOrFails(gameId, user.id);
  }

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  async connectUserToPair(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    const gameId = await this.commandBus.execute(
      new ConnectUserToPairCommand(user.id),
    );

    return this.gamesQueryRepository.getGameByIdOrNotFoundFail(gameId);
  }

  @Post('my-current/answers')
  @HttpCode(HttpStatus.OK)
  async sendAnswer(
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() body: CreateAnswerInputDto,
  ): Promise<AnswerViewDto> {
    const answerId = await this.commandBus.execute(
      new SendAnswerCommand(body.answer, user.id),
    );

    return this.answersQueryRepository.getAnswerByIdOrNotFoundFail(answerId);
  }
}
