import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { ConnectUserToPairCommand } from '../application/usecases/connect-user-to-pair.usecase';
import { GamesQueryRepository } from '../infrastructure/query/games.query-repository';
import { NumberIdValidationPipe } from '../../../../core/pipes/number-id-validation-pipe.service';
import { GamePairViewDto } from './view-dto/game-pair.view-dto';
import { AnswerViewDto } from '../../answers/api/view-dto/answer.view-dto';
import { CreateAnswerInputDto } from '../../answers/api/input-dto/answer.input-dto';
import { SendAnswerCommand } from '../application/usecases/send-answer.usecase';
import { AnswersQueryRepository } from '../../answers/infrastructure/query/answers.query-repository';
import { MyStatisticViewDto } from '../../players/api/view-dto/my-statistic.view-dto';
import { PlayersQueryRepository } from '../../players/infrastructure/query/players.query-repository';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetGamesQueryParams } from './input-dto/get-games-query-params.input-dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pair-game-quiz')
export class GamesController {
  constructor(
    private commandBus: CommandBus,
    private gamesQueryRepository: GamesQueryRepository,
    private answersQueryRepository: AnswersQueryRepository,
    private playersQueryRepository: PlayersQueryRepository,
  ) {}

  @Get('pairs/my')
  @HttpCode(HttpStatus.OK)
  async getAllUserGames(
    @Query() query: GetGamesQueryParams,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<GamePairViewDto[]>> {
    return this.gamesQueryRepository.getAllUserGames(query, user.id);
  }

  @Get('users/my-statistic')
  async getUserStatistic(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<MyStatisticViewDto> {
    return this.playersQueryRepository.getStatisticsByUserId(user.id);
  }

  @Get('pairs/my-current')
  async getMyCurrentGame(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    return this.gamesQueryRepository.getCurrentGameByUserIdOrNotFoundFail(
      user.id,
    );
  }

  @ApiParam({ name: 'id' })
  @Get('pairs/:id')
  @HttpCode(HttpStatus.OK)
  async getGameById(
    @Param('id', NumberIdValidationPipe) gameId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    return this.gamesQueryRepository.getGameByIdOrFails(gameId, user.id);
  }

  @Post('pairs/connection')
  @HttpCode(HttpStatus.OK)
  async connectUserToPair(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    const gameId = await this.commandBus.execute(
      new ConnectUserToPairCommand(user.id),
    );

    return this.gamesQueryRepository.getGameByIdOrNotFoundFail(gameId);
  }

  @Post('pairs/my-current/answers')
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
