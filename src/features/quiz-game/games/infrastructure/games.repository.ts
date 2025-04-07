import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Game } from '../domain/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GameStatus } from '../enums/game-status';

@Injectable()
export class GamesRepository {
  constructor(
    @InjectRepository(Game) private gamesRepository: Repository<Game>,
  ) {}

  async getPendingPairGame(): Promise<Game | null> {
    return await this.gamesRepository.findOneBy({
      status: GameStatus.PendingSecondPlayer,
    });
  }

  async getGameByIdOrNotFoundFail(gameId: string): Promise<Game> {
    const game = await this.gamesRepository.findOne({
      where: { id: +gameId },
      relations: {
        questions: true,
        firstPlayer: {
          answers: true,
        },
        secondPlayer: {
          answers: true,
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  async getActiveGameByUserIdOrForbiddenFail(userId: string): Promise<Game> {
    const game = await this.gamesRepository.findOne({
      where: [
        {
          status: GameStatus.Active,
          firstPlayer: { userId: +userId },
        },
        {
          status: GameStatus.Active,
          secondPlayer: { userId: +userId },
        },
      ],
      relations: {
        questions: {
          question: true,
        },
        firstPlayer: {
          answers: true,
        },
        secondPlayer: {
          answers: true,
        },
      },
    });

    if (!game) {
      throw new ForbiddenException('User is not in active pair');
    }

    const currentPlayer =
      game.firstPlayer.userId === +userId
        ? game.firstPlayer
        : game.secondPlayer;

    const playerAnswers = currentPlayer!.answers.length;
    const totalQuestions = game.questions!.length;

    if (playerAnswers >= totalQuestions) {
      throw new ForbiddenException('User has already answered all questions');
    }

    return game;
  }

  async findPendingOrActiveGameByUserIdAndForbiddenFail(userId: string) {
    const game = await this.gamesRepository.findOne({
      where: [
        {
          status: In([GameStatus.Active, GameStatus.PendingSecondPlayer]),
          firstPlayer: { userId: +userId },
        },
        {
          status: In([GameStatus.Active, GameStatus.PendingSecondPlayer]),
          secondPlayer: { userId: +userId },
        },
      ],
      relations: {
        firstPlayer: true,
        secondPlayer: true,
      },
    });

    if (game) {
      throw new ForbiddenException(
        'User is already participating in active pair',
      );
    }
  }

  async save(game: Game): Promise<Game> {
    return this.gamesRepository.save(game);
  }
}
